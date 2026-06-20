import { useCallback, useState } from 'react';
import { loadGoals, saveGoals, type Goals } from '../utils/goals';

/** Read/update the user's training goals, persisted to localStorage. */
export function useGoals() {
  const [goals, setGoals] = useState<Goals>(() => loadGoals());

  const updateGoals = useCallback((next: Goals) => {
    setGoals(next);
    saveGoals(next);
  }, []);

  return { goals, updateGoals };
}
