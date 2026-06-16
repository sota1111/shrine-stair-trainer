import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { TrainingRecordsContext } from './trainingRecordsContextValue';
import { apiClient } from '../lib/apiClient';
import type { TrainingRecord } from '../types';

const STORAGE_KEY = 'shrine-stair-trainer-records';
const MIGRATION_KEY = 'shrine-stair-trainer-migrated';

export function TrainingRecordsProvider({ children }: { children: ReactNode }) {
  const { uid } = useAuth();
  const [prevUid, setPrevUid] = useState<string | null>(uid);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(!!uid);
  const [error, setError] = useState<string | null>(null);

  // Sync state if uid changes (e.g. login/logout)
  if (uid !== prevUid) {
    setPrevUid(uid);
    setRecords([]);
    setLoading(!!uid);
    setError(null);
  }

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
      setError('記録の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [uid, migrateLocalStorage]);

  useEffect(() => {
    if (uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRecords();
    }
  }, [uid, fetchRecords]);

  const addRecord = async (record: TrainingRecord) => {
    if (!uid) return;

    try {
      await apiClient.putRecord(record);
      // Optimistic update or refetch
      setRecords(prev => [record, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      console.error('Error adding record:', err);
      setError('記録の保存に失敗しました');
      throw err;
    }
  };

  return (
    <TrainingRecordsContext.Provider value={{ records, loading, error, addRecord }}>
      {children}
    </TrainingRecordsContext.Provider>
  );
}
