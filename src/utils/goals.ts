export interface Goals {
  /** Target number of training sessions to log in a calendar month. */
  monthlySessionTarget: number;
}

const STORAGE_KEY = 'shrine-stair-trainer:goals';

export const DEFAULT_GOALS: Goals = { monthlySessionTarget: 20 };

/** Load goals from localStorage, falling back to defaults on any error. */
export function loadGoals(): Goals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GOALS };
    const parsed = JSON.parse(raw) as Partial<Goals>;
    const target = Number(parsed.monthlySessionTarget);
    return {
      monthlySessionTarget:
        Number.isFinite(target) && target > 0
          ? Math.round(target)
          : DEFAULT_GOALS.monthlySessionTarget,
    };
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

/** Persist goals to localStorage, ignoring storage failures (e.g. private mode). */
export function saveGoals(goals: Goals): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // ignore
  }
}

/** Progress toward a target, clamped to [0, 1]. */
export function achievementRatio(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.max(current / target, 0), 1);
}
