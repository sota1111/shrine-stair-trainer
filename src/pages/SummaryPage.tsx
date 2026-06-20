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

const formatTime = (seconds: number | null): string =>
  seconds === null ? '-' : `${seconds.toFixed(1)}秒`;

const SummaryPage: React.FC = () => {
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
  const trend = useMemo(() => getMonthlyTrend(records, activeYear), [records, activeYear]);

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
      <h2>📈 サマリ・目標</h2>

      {/* Streak */}
      <div className="card">
        <h2>🔥 継続日数</h2>
        <p className="summary-streak" style={{ fontSize: '1.5rem' }}>
          {streak > 0 ? `${streak} 日連続` : 'まだ連続記録はありません'}
        </p>
      </div>

      {/* Goal setting + achievement */}
      <div className="card">
        <h2>🎯 目標設定</h2>
        <div className="form-group">
          <label htmlFor="monthly-target">今月の目標トレーニング回数</label>
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
          今月の実施: <strong>{currentMonthSessions}</strong> / {target} 回
          {achieved && <span style={{ color: 'var(--color-success)' }}> ✅ 達成</span>}
        </p>
        <div
          aria-label="達成状況"
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
        <h2>🗓️ 月間サマリ</h2>
        <div className="form-group">
          <label htmlFor="summary-month">対象月</label>
          <select
            id="summary-month"
            className="filter-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">実施回数</div>
            <div className="summary-value">{monthly.sessions}回</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">トレーニング日数</div>
            <div className="summary-value">{monthly.trainingDays}日</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">合計本数</div>
            <div className="summary-value">{monthly.totalSets}本</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">ベストタイム</div>
            <div className="summary-value">{formatTime(monthly.bestTime)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">疲労感平均</div>
            <div className="summary-value">
              {monthly.avgFatigue !== null ? monthly.avgFatigue.toFixed(1) : '-'}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">痛みあり</div>
            <div className="summary-value">{monthly.painCount}回</div>
          </div>
        </div>
      </div>

      {/* Yearly summary + trend chart */}
      <div className="card">
        <h2>📅 年間サマリ</h2>
        <div className="form-group">
          <label htmlFor="summary-year">対象年</label>
          <select
            id="summary-year"
            className="filter-select"
            value={activeYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">実施回数</div>
            <div className="summary-value">{yearly.sessions}回</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">トレーニング日数</div>
            <div className="summary-value">{yearly.trainingDays}日</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">合計本数</div>
            <div className="summary-value">{yearly.totalSets}本</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">年間ベスト</div>
            <div className="summary-value">{formatTime(yearly.bestTime)}</div>
          </div>
        </div>

        <div className="chart-container" style={{ marginTop: '12px' }}>
          <div className="chart-title">月別実施回数の推移</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" fill="var(--color-primary)" name="実施回数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
