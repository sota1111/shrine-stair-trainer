import { describe, it, expect } from 'vitest';
import { jstDateString, jstTimeString, dayOfWeekOf } from './datetime';

describe('jstDateString', () => {
  it('rolls a late-UTC instant forward to the next JST calendar day (the 6/30 vs 7/1 bug)', () => {
    // 2026-06-30 23:30 UTC === 2026-07-01 08:30 JST
    expect(jstDateString(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01');
  });

  it('returns the same day when the instant is mid-day UTC', () => {
    expect(jstDateString(new Date('2026-07-01T03:00:00Z'))).toBe('2026-07-01');
  });
});

describe('jstTimeString', () => {
  it('formats the JST time-of-day as HH:MM', () => {
    expect(jstTimeString(new Date('2026-06-30T23:30:00Z'))).toBe('08:30');
    expect(jstTimeString(new Date('2026-07-01T00:00:00Z'))).toBe('09:00');
  });
});

describe('dayOfWeekOf', () => {
  it('returns the timezone-independent weekday char for a YYYY-MM-DD string', () => {
    expect(dayOfWeekOf('2026-07-01')).toBe('水'); // Wednesday
    expect(dayOfWeekOf('2026-06-30')).toBe('火'); // Tuesday
  });
});
