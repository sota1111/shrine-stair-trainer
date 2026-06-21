import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import { useGoals } from '../hooks/useGoals';
import {
  calculateStreak,
  getMonthlySummary,
  getYearlySummary,
  getMonthlyTrend,
  availableYears,
} from '../utils/stats';
import { achievementRatio } from '../utils/goals';
import { useI18n } from '../i18n/useI18n';

const formatTime = (seconds: number | null, secUnit: string): string =>
  seconds === null ? '-' : `${seconds.toFixed(1)}${secUnit}`;

const SummaryPage: React.FC = () => {
  const { t, lang } = useI18n();
  const secUnit = t('unit.sec');
  const monthOptionLabel = (m: number) => (lang === 'ja' ? `${m}月` : String(m));
  const yearOptionLabel = (y: number) => (lang === 'ja' ? `${y}年` : String(y));
  const { records } = useTrainingRecords();
  const { goals, updateGoals } = useGoals();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const years = useMemo(() => {
    const ys = availableYears(records);
    return ys.length > 0 ? ys : [currentYear];
  }, [records, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const activeYear = years.includes(selectedYear) ? selectedYear : years[0];

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const streak = useMemo(() => calculateStreak(records), [records]);

  const monthly = useMemo(
    () => getMonthlySummary(records, activeYear, selectedMonth),
    [records, activeYear, selectedMonth],
  );
  const yearly = useMemo(() => getYearlySummary(records, activeYear), [records, activeYear]);
  const trend = useMemo(
    () => getMonthlyTrend(records, activeYear).map((p) => ({
      ...p,
      label: lang === 'ja' ? `${p.month}月` : String(p.month),
    })),
    [records, activeYear, lang],
  );

  // Goal progress is always measured against the current calendar month.
  const currentMonthSessions = useMemo(
    () => getMonthlySummary(records, currentYear, currentMonth).sessions,
    [records, currentYear, currentMonth],
  );
  const target = goals.monthlySessionTarget;
  const ratio = achievementRatio(currentMonthSessions, target);
  const achieved = target > 0 && currentMonthSessions >= target;

  const handleTargetChange = (value: string) => {
    const n = Math.round(Number(value));
    if (Number.isFinite(n) && n > 0) {
      updateGoals({ ...goals, monthlySessionTarget: n });
    }
  };

  return (
    <div className="summary-page">
      <h2>{t('summary.title')}</h2>

      {/* Streak */}
      <div className="card">
        <h2>{t('summary.streakTitle')}</h2>
        <p className="summary-streak" style={{ fontSize: '1.5rem' }}>
          {streak > 0 ? t('summary.streakDays').replace('{n}', String(streak)) : t('summary.noStreak')}
        </p>
      </div>

      {/* Goal setting + achievement */}
      <div className="card">
        <h2>{t('summary.goalTitle')}</h2>
        <div className="form-group">
          <label htmlFor="monthly-target">{t('summary.monthlyTarget')}</label>
          <input
            id="monthly-target"
            className="filter-select"
            type="number"
            min={1}
            value={target}
            onChange={(e) => handleTargetChange(e.target.value)}
          />
        </div>
        <p>
          {t('summary.thisMonthDone')}: <strong>{currentMonthSessions}</strong> / {target}{t('unit.times')}
          {achieved && <span style={{ color: 'var(--color-success)' }}> {t('summary.achieved')}</span>}
        </p>
        <div
          aria-label={t('summary.achievementStatus')}
          style={{
            background: 'var(--color-border, #e0e0e0)',
            borderRadius: '6px',
            height: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.round(ratio * 100)}%`,
              height: '100%',
              background: achieved ? 'var(--color-success)' : 'var(--color-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Monthly summary */}
      <div className="card">
        <h2>{t('summary.monthlyTitle')}</h2>
        <div className="form-group">
          <label htmlFor="summary-month">{t('summary.targetMonth')}</label>
          <select
            id="summary-month"
            className="filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{monthOptionLabel(m)}</option>
            ))}
          </select>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">{t('summary.sessions')}</div>
            <div className="summary-value">{monthly.sessions}{t('unit.times')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.trainingDays')}</div>
            <div className="summary-value">{monthly.trainingDays}{t('unit.days')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.totalReps')}</div>
            <div className="summary-value">{monthly.totalSets}{t('unit.reps')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.bestTime')}</div>
            <div className="summary-value">{formatTime(monthly.bestTime, secUnit)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.avgFatigue')}</div>
            <div className="summary-value">
              {monthly.avgFatigue !== null ? monthly.avgFatigue.toFixed(1) : '-'}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.painCount')}</div>
            <div className="summary-value">{monthly.painCount}{t('unit.times')}</div>
          </div>
        </div>
      </div>

      {/* Yearly summary + trend chart */}
      <div className="card">
        <h2>{t('summary.yearlyTitle')}</h2>
        <div className="form-group">
          <label htmlFor="summary-year">{t('summary.targetYear')}</label>
          <select
            id="summary-year"
            className="filter-select"
            value={activeYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{yearOptionLabel(y)}</option>
            ))}
          </select>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">{t('summary.sessions')}</div>
            <div className="summary-value">{yearly.sessions}{t('unit.times')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.trainingDays')}</div>
            <div className="summary-value">{yearly.trainingDays}{t('unit.days')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.totalReps')}</div>
            <div className="summary-value">{yearly.totalSets}{t('unit.reps')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('summary.yearlyBest')}</div>
            <div className="summary-value">{formatTime(yearly.bestTime, secUnit)}</div>
          </div>
        </div>

        <div className="chart-container" style={{ marginTop: '12px' }}>
          <div className="chart-title">{t('summary.monthlyTrend')}</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill="var(--color-primary)" name={t('summary.legendSessions')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
