import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { TrainingRecordsContext } from './trainingRecordsContextValue';
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

  const migrateLocalStorage = useCallback(async (userUid: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    try {
      const localRecords: TrainingRecord[] = JSON.parse(stored);
      const toMigrate = localRecords.filter(r => !r.id.startsWith('sample-'));

      if (toMigrate.length > 0) {
        // Double check Firestore is still empty before migrating
        const recordsRef = collection(db, 'users', userUid, 'records');
        const q = query(recordsRef, limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          const batch = writeBatch(db);
          toMigrate.forEach(record => {
            const docRef = doc(db, 'users', userUid, 'records', record.id);
            batch.set(docRef, record);
          });
          await batch.commit();
        }
      }
      
      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Migration error:', err);
    }
  }, []);

  useEffect(() => {
    if (!uid) return;

    const recordsRef = collection(db, 'users', uid, 'records');
    const q = query(recordsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedRecords = snapshot.docs.map(doc => doc.data() as TrainingRecord);
        setRecords(fetchedRecords);
        setLoading(false);

        // Check for migration if this is the first load and Firestore is empty
        if (fetchedRecords.length === 0 && !localStorage.getItem(MIGRATION_KEY)) {
          migrateLocalStorage(uid);
        }
      },
      (err) => {
        console.error('Error fetching training records:', err);
        setError('記録の読み込みに失敗しました');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, migrateLocalStorage]);

  const addRecord = async (record: TrainingRecord) => {
    if (!uid) return;

    try {
      await setDoc(doc(db, 'users', uid, 'records', record.id), record);
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
