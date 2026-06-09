import { useState } from 'react';
import { TrainingRecord } from '../types';
import { sampleData } from '../data/sampleData';

const STORAGE_KEY = 'shrine-stair-trainer-records';

export function useTrainingRecords() {
  const [records, setRecords] = useState<TrainingRecord[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return sampleData;
      }
    }
    // If no data, initialize with sample data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    return sampleData;
  });

  const addRecord = (record: TrainingRecord) => {
    const updated = [record, ...records];
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { records, addRecord };
}
