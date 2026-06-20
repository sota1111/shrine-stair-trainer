import { describe, it, expect } from 'vitest';
import {
  isTrainingRecord,
  recordSetCount,
  bestTimeSeconds,
  calculateStreak,
  getMonthlySummary,
  getYearlySummary,
  getMonthlyTrend,
  availableYears,
  availableMonths,
} from './stats';
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

describe('isTrainingRecord', () => {
  it('is true when a non-rest exercise exists', () => {
    expect(isTrainingRecord(makeRecord('2026-06-01'))).toBe(true);
  });

  it('is false for a rest-only record', () => {
    expect(isTrainingRecord(restRecord('2026-06-01'))).toBe(false);
  });
});

describe('recordSetCount', () => {
  it('counts all sets across exercises', () => {
    expect(recordSetCount(makeRecord('2026-06-01'))).toBe(3);
    expect(recordSetCount(restRecord('2026-06-01'))).toBe(0);
  });
});

describe('bestTimeSeconds', () => {
  it('returns the fastest positive set time', () => {
    expect(bestTimeSeconds([makeRecord('2026-06-01')])).toBe(28);
  });

  it('returns null when no positive times exist', () => {
    expect(bestTimeSeconds([restRecord('2026-06-01')])).toBeNull();
    expect(bestTimeSeconds([])).toBeNull();
  });
});

describe('calculateStreak', () => {
  const today = new Date('2026-06-10T12:00:00');

  it('counts consecutive training days ending today', () => {
    const records = [
      makeRecord('2026-06-10'),
      makeRecord('2026-06-09'),
      makeRecord('2026-06-08'),
    ];
    expect(calculateStreak(records, today)).toBe(3);
  });

  it('keeps the streak alive when only yesterday has a record', () => {
    const records = [makeRecord('2026-06-09'), makeRecord('2026-06-08')];
    expect(calculateStreak(records, today)).toBe(2);
  });

  it('breaks the streak on a gap', () => {
    const records = [makeRecord('2026-06-10'), makeRecord('2026-06-08')];
    expect(calculateStreak(records, today)).toBe(1);
  });

  it('treats rest-only days as breaking the streak', () => {
    const records = [makeRecord('2026-06-10'), restRecord('2026-06-09'), makeRecord('2026-06-08')];
    expect(calculateStreak(records, today)).toBe(1);
  });

  it('returns 0 when the most recent training day is older than yesterday', () => {
    const records = [makeRecord('2026-06-07'), makeRecord('2026-06-06')];
    expect(calculateStreak(records, today)).toBe(0);
  });

  it('returns 0 with no records', () => {
    expect(calculateStreak([], today)).toBe(0);
  });
});

describe('getMonthlySummary', () => {
  const records = [
    makeRecord('2026-06-01', { fatigue: 2, hasPain: true }),
    makeRecord('2026-06-02', { fatigue: 6 }),
    restRecord('2026-06-03'),
    makeRecord('2026-05-30', { fatigue: 9 }),
  ];

  it('aggregates only the requested month', () => {
    const s = getMonthlySummary(records, 2026, 6);
    expect(s.sessions).toBe(3); // 2 training + 1 rest in June
    expect(s.trainingDays).toBe(2);
    expect(s.totalSets).toBe(6); // two dash records * 3 sets
    expect(s.bestTime).toBe(28);
    expect(s.avgFatigue).toBeCloseTo((2 + 6 + 4) / 3); // rest record has default fatigue 4
    expect(s.painCount).toBe(1);
  });

  it('returns null aggregates for an empty month', () => {
    const s = getMonthlySummary(records, 2026, 1);
    expect(s.sessions).toBe(0);
    expect(s.bestTime).toBeNull();
    expect(s.avgFatigue).toBeNull();
  });
});

describe('getYearlySummary', () => {
  const records = [
    makeRecord('2026-06-01'),
    makeRecord('2026-05-30'),
    makeRecord('2025-12-31'),
  ];

  it('aggregates the whole year and exposes 12 months', () => {
    const s = getYearlySummary(records, 2026);
    expect(s.sessions).toBe(2);
    expect(s.months).toHaveLength(12);
    expect(s.months[5].sessions).toBe(1); // June (index 5)
    expect(s.totalSets).toBe(6);
  });
});

describe('getMonthlyTrend', () => {
  it('produces 12 labelled points', () => {
    const trend = getMonthlyTrend([makeRecord('2026-06-01')], 2026);
    expect(trend).toHaveLength(12);
    expect(trend[5]).toMatchObject({ month: 6, label: '6月', sessions: 1, sets: 3 });
    expect(trend[0].sessions).toBe(0);
  });
});

describe('availableYears / availableMonths', () => {
  const records = [makeRecord('2026-06-01'), makeRecord('2025-01-15'), makeRecord('2026-03-10')];

  it('lists distinct years newest first', () => {
    expect(availableYears(records)).toEqual([2026, 2025]);
  });

  it('lists distinct months for a year newest first', () => {
    expect(availableMonths(records, 2026)).toEqual([6, 3]);
  });
});
