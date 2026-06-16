import { createContext } from 'react';
import type { TrainingRecord } from '../types';

export interface TrainingRecordsContextType {
  records: TrainingRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (record: TrainingRecord) => Promise<void>;
}

export const TrainingRecordsContext = createContext<TrainingRecordsContextType | null>(null);
