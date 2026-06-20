import { describe, it, expect, beforeEach } from 'vitest';
import { loadGoals, saveGoals, achievementRatio, DEFAULT_GOALS } from './goals';

describe('goals persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadGoals()).toEqual(DEFAULT_GOALS);
  });

  it('round-trips a saved goal', () => {
    saveGoals({ monthlySessionTarget: 12 });
    expect(loadGoals().monthlySessionTarget).toBe(12);
  });

  it('falls back to default for invalid stored values', () => {
    localStorage.setItem('shrine-stair-trainer:goals', JSON.stringify({ monthlySessionTarget: -3 }));
    expect(loadGoals().monthlySessionTarget).toBe(DEFAULT_GOALS.monthlySessionTarget);
  });
});

describe('achievementRatio', () => {
  it('computes a clamped ratio', () => {
    expect(achievementRatio(5, 10)).toBe(0.5);
    expect(achievementRatio(20, 10)).toBe(1);
    expect(achievementRatio(3, 0)).toBe(0);
  });
});
