import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { TrainingRecordsContext } from './trainingRecordsContextValue';
import { apiClient } from '../lib/apiClient';
import * as offlineQueue from '../lib/offlineQueue';
import { sampleData } from '../data/sampleData';
import type { TrainingRecord } from '../types';

const STORAGE_KEY = 'shrine-stair-trainer-records';
const MIGRATION_KEY = 'shrine-stair-trainer-migrated';

/**
 * Heuristic: a write failed because of connectivity (so it should be queued for
 * later sync) rather than a genuine server rejection. `fetch` rejects with a
 * TypeError when the network is unreachable; `navigator.onLine` being false is
 * the explicit offline signal.
 */
function isConnectivityError(err: unknown): boolean {
  return !navigator.onLine || err instanceof TypeError;
}

export function TrainingRecordsProvider({ children }: { children: ReactNode }) {
  const { uid } = useAuth();
  const [prevUid, setPrevUid] = useState<string | null>(uid);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(!!uid);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Sync state if uid changes (e.g. login/logout)
  if (uid !== prevUid) {
    setPrevUid(uid);
    setRecords([]);
    setLoading(!!uid);
    setError(null);
  }

  const refreshPendingCount = useCallback(async () => {
    const n = await offlineQueue.count();
    setPendingSyncCount(n);
  }, []);

  const migrateLocalStorage = useCallback(async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    try {
      const localRecords: TrainingRecord[] = JSON.parse(stored);
      const toMigrate = localRecords.filter(r => !r.id.startsWith('sample-'));

      if (toMigrate.length > 0) {
        await apiClient.batchPutRecords(toMigrate);
        // Refresh records after migration
        const fetchedRecords = await apiClient.getRecords();
        setRecords(fetchedRecords);
      }

      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Migration error:', err);
    }
  }, []);

  /**
   * Replay queued offline writes to the server. Idempotent: each record is
   * PUT by its id and removed from the queue only on success. Stops on the
   * first connectivity error so the remaining records stay queued for a later
   * retry.
   */
  const flushQueue = useCallback(async () => {
    if (!navigator.onLine || !uid) return;
    let pending: TrainingRecord[];
    try {
      pending = await offlineQueue.getAll();
    } catch {
      return;
    }
    if (pending.length === 0) return;

    let synced = false;
    for (const record of pending) {
      try {
        await apiClient.putRecord(record);
        await offlineQueue.remove(record.id);
        synced = true;
      } catch (err) {
        if (isConnectivityError(err)) break; // still offline — retry later
        // Genuine server rejection: drop it from the queue so it does not
        // block the rest, but surface the problem.
        console.error('Failed to sync queued record:', err);
        await offlineQueue.remove(record.id);
      }
    }

    await refreshPendingCount();
    if (synced) {
      // Reconcile local state with the server after a successful sync.
      try {
        setRecords(await apiClient.getRecords());
        setError(null);
      } catch {
        // Ignore — local optimistic state already reflects the records.
      }
    }
  }, [uid, refreshPendingCount]);

  const fetchRecords = useCallback(async () => {
    if (!uid) return;
    try {
      const fetchedRecords = await apiClient.getRecords();
      setRecords(fetchedRecords);
      setError(null);

      // Check for migration if Firestore is empty and not already migrated
      if (fetchedRecords.length === 0 && !localStorage.getItem(MIGRATION_KEY)) {
        await migrateLocalStorage();
      }
    } catch (err) {
      console.error('Error fetching training records:', err);
      if (!navigator.onLine) {
        // Offline: keep whatever we already have; not a hard error.
        setError(null);
      } else {
        setError('記録の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [uid, migrateLocalStorage]);

  useEffect(() => {
    if (uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRecords();
      refreshPendingCount();
      flushQueue();
    }
  }, [uid, fetchRecords, refreshPendingCount, flushQueue]);

  // Track connectivity and flush the offline queue when coming back online.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  const addRecord = async (record: TrainingRecord) => {
    if (!uid) return;

    // Optimistic update so the record shows immediately, online or offline.
    setRecords(prev => [record, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

    try {
      await apiClient.putRecord(record);
    } catch (err) {
      if (isConnectivityError(err)) {
        // Offline: persist to the queue and sync on reconnect.
        await offlineQueue.enqueue(record);
        await refreshPendingCount();
        return;
      }
      console.error('Error adding record:', err);
      setError('記録の保存に失敗しました');
      throw err;
    }
  };

  const updateRecord = async (record: TrainingRecord) => {
    if (!uid) return;

    // Optimistic update: replace the matching record and keep the list sorted.
    setRecords(prev =>
      prev
        .map(r => (r.id === record.id ? record : r))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );

    try {
      await apiClient.putRecord(record);
    } catch (err) {
      if (isConnectivityError(err)) {
        // Offline: persist the upsert to the queue and sync on reconnect.
        await offlineQueue.enqueue(record);
        await refreshPendingCount();
        return;
      }
      console.error('Error updating record:', err);
      setError('記録の更新に失敗しました');
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    if (!uid) return;

    // Snapshot for rollback — delete is online-only (the offline queue only
    // supports upserts), so revert the optimistic removal if the request fails.
    let snapshot: TrainingRecord[] = [];
    setRecords(prev => {
      snapshot = prev;
      return prev.filter(r => r.id !== id);
    });

    try {
      await apiClient.deleteRecord(id);
    } catch (err) {
      console.error('Error deleting record:', err);
      setRecords(snapshot);
      setError('記録の削除に失敗しました');
      throw err;
    }
  };

  // Surface the May 2026 sample data so the UI can always be evaluated, even
  // after the user has saved some real records. Sample entries are merged in for
  // any date that does not already have a real record, so real data always wins
  // on a collision and is never duplicated. Sample data carries the `sample-`
  // id prefix and is never persisted to the server or the offline queue.
  const displayRecords = useMemo(() => {
    if (!uid || loading) return records;
    const realDates = new Set(records.map(r => r.date));
    const sampleToShow = sampleData.filter(s => !realDates.has(s.date));
    return [...records, ...sampleToShow];
  }, [uid, loading, records]);

  return (
    <TrainingRecordsContext.Provider
      value={{ records: displayRecords, loading, error, addRecord, updateRecord, deleteRecord, isOnline, pendingSyncCount }}
    >
      {children}
    </TrainingRecordsContext.Provider>
  );
}
