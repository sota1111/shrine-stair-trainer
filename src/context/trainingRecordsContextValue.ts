import { createContext } from 'react';
import type { TrainingRecord } from '../types';

export interface TrainingRecordsContextType {
  records: TrainingRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (record: TrainingRecord) => Promise<void>;
  /** Whether the browser currently has network connectivity. */
  isOnline: boolean;
  /** Number of records saved offline that are still waiting to sync. */
  pendingSyncCount: number;
}

export const TrainingRecordsContext = createContext<TrainingRecordsContextType | null>(null);
