import type { TrainingRecord } from '../types';
import { isTrainingRecord, recordSetCount } from './stats';

/**
 * One "本" on the shrine stairs is a full 70-step climb (the 70段ダッシュ menu is
 * the dominant exercise). We approximate cumulative climbed steps (累計段数) as the
 * total number of recorded sets across training days × 70. Non-stair menus (軽め /
 * 屋内ジャンプ) are folded into the same estimate to keep the metric simple and
 * monotonic — it is a motivational milestone, not an exact step counter.
 */
export const STEPS_PER_REP = 70;

export type AchievementCategory = 'sessions' | 'streak' | 'steps';

export interface AchievementMetrics {
  /** Total training sessions logged (rest-only days excluded). */
  totalSessions: number;
  /** Longest run of consecutive training days ever recorded. */
  bestStreak: number;
  /** Estimated cumulative climbed steps (累計段数). */
  totalSteps: number;
}

export interface AchievementBadge {
  id: string;
  category: AchievementCategory;
  threshold: number;
  /** Current value of the badge's underlying metric. */
  current: number;
  unlocked: boolean;
  /** Progress toward the threshold, clamped to 0..1. */
  progress: number;
}

/** Thresholds per category, ascending. */
export const ACHIEVEMENT_THRESHOLDS: Record<AchievementCategory, number[]> = {
  sessions: [1, 10, 30, 50, 100],
  streak: [3, 7, 14, 30],
  steps: [700, 3500, 7000, 35000, 70000],
};

/** Format a Date to a local `YYYY-MM-DD` key, matching the stored record.date format. */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Longest run of consecutive training days ever recorded. Rest-only days are not
 * training days and break the run. `today` is unused for the historical best but
 * kept for signature symmetry with `calculateStreak`.
 */
export function calculateBestStreak(records: TrainingRecord[]): number {
  const dayKeys = Array.from(
    new Set(records.filter(isTrainingRecord).map((r) => r.date)),
  ).sort();
  if (dayKeys.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < dayKeys.length; i++) {
    const prev = new Date(dayKeys[i - 1]);
    prev.setHours(0, 0, 0, 0);
    prev.setDate(prev.getDate() + 1);
    if (toDateKey(prev) === dayKeys[i]) {
      run++;
    } else {
      run = 1;
    }
    if (run > best) best = run;
  }
  return best;
}

/** Derive the motivational metrics from the full record set. */
export function calculateMetrics(records: TrainingRecord[]): AchievementMetrics {
  const trainingRecords = records.filter(isTrainingRecord);
  const totalSteps = trainingRecords.reduce(
    (acc, r) => acc + recordSetCount(r) * STEPS_PER_REP,
    0,
  );
  return {
    totalSessions: trainingRecords.length,
    bestStreak: calculateBestStreak(records),
    totalSteps,
  };
}

function metricFor(category: AchievementCategory, metrics: AchievementMetrics): number {
  switch (category) {
    case 'sessions':
      return metrics.totalSessions;
    case 'streak':
      return metrics.bestStreak;
    case 'steps':
      return metrics.totalSteps;
  }
}

/**
 * Build the full badge list (every threshold in every category), each annotated
 * with whether it is unlocked and the progress toward it.
 */
export function getAchievements(records: TrainingRecord[]): AchievementBadge[] {
  const metrics = calculateMetrics(records);
  const badges: AchievementBadge[] = [];

  (Object.keys(ACHIEVEMENT_THRESHOLDS) as AchievementCategory[]).forEach((category) => {
    const current = metricFor(category, metrics);
    ACHIEVEMENT_THRESHOLDS[category].forEach((threshold) => {
      const progress = threshold > 0 ? Math.min(1, current / threshold) : 1;
      badges.push({
        id: `${category}-${threshold}`,
        category,
        threshold,
        current,
        unlocked: current >= threshold,
        progress,
      });
    });
  });

  return badges;
}
