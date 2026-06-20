import type { TrainingRecord } from '../types';

const REST_TYPE = '休養';

/** A record counts as a training day when it has at least one non-rest exercise. */
export function isTrainingRecord(record: TrainingRecord): boolean {
  return record.exercises.some((ex) => ex.type !== REST_TYPE);
}

/** Total number of sets (登攀数) recorded across all exercises of a record. */
export function recordSetCount(record: TrainingRecord): number {
  return record.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
}

/** Fastest positive set time across the given records, or null when none recorded. */
export function bestTimeSeconds(records: TrainingRecord[]): number | null {
  let best = Infinity;
  for (const record of records) {
    for (const ex of record.exercises) {
      for (const set of ex.sets) {
        if (set.timeSeconds > 0 && set.timeSeconds < best) {
          best = set.timeSeconds;
        }
      }
    }
  }
  return best === Infinity ? null : best;
}

/** Format a Date to a local `YYYY-MM-DD` key, matching the stored record.date format. */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Number of consecutive training days ending today (or yesterday, so the streak
 * is still "alive" before today's session is logged). Rest-only days break the streak.
 */
export function calculateStreak(records: TrainingRecord[], today: Date = new Date()): number {
  const trainingDays = new Set(records.filter(isTrainingRecord).map((r) => r.date));
  if (trainingDays.size === 0) return 0;

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  // Allow today to be empty as long as yesterday was a training day.
  if (!trainingDays.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!trainingDays.has(toDateKey(cursor))) return 0;
  }

  let streak = 0;
  while (trainingDays.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function recordYear(record: TrainingRecord): number {
  return Number(record.date.slice(0, 4));
}

function recordMonth(record: TrainingRecord): number {
  return Number(record.date.slice(5, 7));
}

export interface MonthlySummary {
  year: number;
  month: number;
  sessions: number;
  trainingDays: number;
  totalSets: number;
  bestTime: number | null;
  avgFatigue: number | null;
  painCount: number;
}

/** Aggregate a single month's records into a summary. */
export function getMonthlySummary(
  records: TrainingRecord[],
  year: number,
  month: number,
): MonthlySummary {
  const monthRecords = records.filter(
    (r) => recordYear(r) === year && recordMonth(r) === month,
  );
  const sessions = monthRecords.length;
  const trainingDays = new Set(
    monthRecords.filter(isTrainingRecord).map((r) => r.date),
  ).size;
  const totalSets = monthRecords.reduce((acc, r) => acc + recordSetCount(r), 0);
  const avgFatigue =
    sessions > 0
      ? monthRecords.reduce((acc, r) => acc + r.fatigue, 0) / sessions
      : null;
  const painCount = monthRecords.filter((r) => r.hasPain).length;

  return {
    year,
    month,
    sessions,
    trainingDays,
    totalSets,
    bestTime: bestTimeSeconds(monthRecords),
    avgFatigue,
    painCount,
  };
}

export interface YearlySummary {
  year: number;
  sessions: number;
  trainingDays: number;
  totalSets: number;
  bestTime: number | null;
  months: MonthlySummary[];
}

/** Aggregate a whole year, including a 12-element per-month breakdown. */
export function getYearlySummary(records: TrainingRecord[], year: number): YearlySummary {
  const months = Array.from({ length: 12 }, (_, i) =>
    getMonthlySummary(records, year, i + 1),
  );
  const yearRecords = records.filter((r) => recordYear(r) === year);

  return {
    year,
    sessions: yearRecords.length,
    trainingDays: new Set(yearRecords.filter(isTrainingRecord).map((r) => r.date)).size,
    totalSets: yearRecords.reduce((acc, r) => acc + recordSetCount(r), 0),
    bestTime: bestTimeSeconds(yearRecords),
    months,
  };
}

export interface MonthlyTrendPoint {
  month: number;
  label: string;
  sessions: number;
  sets: number;
}

/** 12-point per-month trend (sessions and sets) for charting a year. */
export function getMonthlyTrend(records: TrainingRecord[], year: number): MonthlyTrendPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const summary = getMonthlySummary(records, year, i + 1);
    return {
      month: i + 1,
      label: `${i + 1}月`,
      sessions: summary.sessions,
      sets: summary.totalSets,
    };
  });
}

/** Years that have at least one record, newest first. */
export function availableYears(records: TrainingRecord[]): number[] {
  return Array.from(new Set(records.map(recordYear))).sort((a, b) => b - a);
}

/** Months (1-12) within a year that have at least one record, newest first. */
export function availableMonths(records: TrainingRecord[], year: number): number[] {
  return Array.from(
    new Set(records.filter((r) => recordYear(r) === year).map(recordMonth)),
  ).sort((a, b) => b - a);
}
