import { useContext } from 'react';
import { TrainingRecordsContext } from '../context/trainingRecordsContextValue';

export function useTrainingRecords() {
  const context = useContext(TrainingRecordsContext);
  
  if (!context) {
    throw new Error('useTrainingRecords must be used within TrainingRecordsProvider');
  }

  return context;
}
