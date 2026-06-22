import { describe, it, expect } from 'vitest';
import {
  calculateBestStreak,
  calculateMetrics,
  getAchievements,
  STEPS_PER_REP,
} from './achievements';
import type { ExerciseEntry, TrainingRecord } from '../types';

function makeRecord(date: string, overrides: Partial<TrainingRecord> = {}): TrainingRecord {
  const dashExercise: ExerciseEntry = {
    type: '70段ダッシュ',
    sets: [
      { setNumber: 1, timeSeconds: 30 },
      { setNumber: 2, timeSeconds: 28 },
      { setNumber: 3, timeSeconds: 29 },
    ],
  };
  return {
    id: `r-${date}`,
    date,
    dayOfWeek: '月',
    weather: 'sunny',
    roadCondition: 'dry',
    exercises: [dashExercise],
    perceivedExertion: 5,
    fatigue: 4,
    hasPain: false,
    memo: '',
    createdAt: `${date}T00:00:00.000Z`,
    ...overrides,
  };
}

const restRecord = (date: string): TrainingRecord =>
  makeRecord(date, { exercises: [{ type: '休養', sets: [] }] });

describe('calculateBestStreak', () => {
  it('is 0 when there are no training days', () => {
    expect(calculateBestStreak([])).toBe(0);
    expect(calculateBestStreak([restRecord('2026-06-01')])).toBe(0);
  });

  it('finds the longest consecutive-day run', () => {
    const records = [
      makeRecord('2026-06-01'),
      makeRecord('2026-06-02'),
      makeRecord('2026-06-03'), // run of 3
      // gap
      makeRecord('2026-06-06'),
      makeRecord('2026-06-07'), // run of 2
    ];
    expect(calculateBestStreak(records)).toBe(3);
  });

  it('breaks the run on a rest-only day', () => {
    const records = [
      makeRecord('2026-06-01'),
      restRecord('2026-06-02'),
      makeRecord('2026-06-03'),
      makeRecord('2026-06-04'),
    ];
    expect(calculateBestStreak(records)).toBe(2);
  });
});

describe('calculateMetrics', () => {
  it('totals sessions and steps, ignoring rest-only records', () => {
    const records = [
      makeRecord('2026-06-01'), // 3 sets
      makeRecord('2026-06-02'), // 3 sets
      restRecord('2026-06-03'), // ignored
    ];
    const metrics = calculateMetrics(records);
    expect(metrics.totalSessions).toBe(2);
    expect(metrics.totalSteps).toBe(6 * STEPS_PER_REP);
    expect(metrics.bestStreak).toBe(2);
  });

  it('is all-zero for no records', () => {
    expect(calculateMetrics([])).toEqual({ totalSessions: 0, bestStreak: 0, totalSteps: 0 });
  });
});

describe('getAchievements', () => {
  it('unlocks badges at or above their threshold', () => {
    // 12 training days, each 3 sets → 12 sessions, 36 reps → 2520 steps, best streak depends on dates.
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord(`2026-06-${String(i + 1).padStart(2, '0')}`),
    );
    const badges = getAchievements(records);

    const sessions10 = badges.find((b) => b.id === 'sessions-10');
    expect(sessions10?.unlocked).toBe(true);

    const sessions30 = badges.find((b) => b.id === 'sessions-30');
    expect(sessions30?.unlocked).toBe(false);
    expect(sessions30?.current).toBe(12);
    // progress toward 30 = 12/30
    expect(sessions30?.progress).toBeCloseTo(12 / 30);

    const steps700 = badges.find((b) => b.id === 'steps-700');
    expect(steps700?.unlocked).toBe(true); // 2520 >= 700
  });

  it('locks every badge when there is no training', () => {
    const badges = getAchievements([]);
    expect(badges.every((b) => !b.unlocked)).toBe(true);
    expect(badges.every((b) => b.progress === 0)).toBe(true);
  });
});
