import { createContext } from 'react';
import type { TrainingRecord } from '../types';

export interface TrainingRecordsContextType {
  records: TrainingRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (record: TrainingRecord) => Promise<void>;
  /** Update an existing record in place (preserves id/createdAt). */
  updateRecord: (record: TrainingRecord) => Promise<void>;
  /** Delete an existing record (online-only). */
  deleteRecord: (id: string) => Promise<void>;
  /** Whether the browser currently has network connectivity. */
  isOnline: boolean;
  /** Number of records saved offline that are still waiting to sync. */
  pendingSyncCount: number;
}

export const TrainingRecordsContext = createContext<TrainingRecordsContextType | null>(null);
