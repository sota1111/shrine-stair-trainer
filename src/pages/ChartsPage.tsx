import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import { useI18n } from '../i18n/useI18n';
import { exerciseLabel } from '../i18n/exerciseLabels';
import type { Lang } from '../i18n/messages';
import { isDangerousCondition, isDangerousExercise } from '../utils/weatherWarning';
import type { TrainingRecord, ExerciseType } from '../types';

const formatMonthLabel = (ym: string, lang: Lang): string => {
  const [y, m] = ym.split('-');
  return lang === 'ja' ? `${y}年${Number(m)}月` : `${Number(m)}/${y}`;
};

// Stable, distinguishable color per training menu for the multi-line time chart.
const MENU_COLORS: Record<ExerciseType, string> = {
  '70段ダッシュ': 'var(--color-primary)',
  '一段ずつ': '#3498db',
  '一段飛ばし': '#9b59b6',
  '二段飛ばし': '#e67e22',
  '軽め': '#2ecc71',
  '屋内ジャンプ': '#e74c3c',
  '休養': '#95a5a6',
};
const FALLBACK_COLORS = ['#1abc9c', '#f1c40f', '#34495e', '#e84393', '#00b894'];

const ChartsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { records } = useTrainingRecords();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const weekUnit = t('unit.week');

  // Months (YYYY-MM) that actually have records, newest first.
  const availableMonths = useMemo(() => {
    const set = new Set(records.map(r => r.date.substring(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Default to the most recent month with data until the user picks one.
  const activeMonth = selectedMonth || availableMonths[0] || '';

  // All charts/analysis below operate on the selected month only.
  const records_ = useMemo(
    () => records.filter(r => r.date.substring(0, 7) === activeMonth),
    [records, activeMonth],
  );

  const dashRecords = useMemo(() => {
    return records_
      .filter(r => r.exercises.some(ex => ex.type === '70段ダッシュ'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records_]);

  // Chart 1 & 2 Data
  const timeData = useMemo(() => {
    return dashRecords.map(r => {
      const dashEx = r.exercises.find(ex => ex.type === '70段ダッシュ')!;
      const times = dashEx.sets.map(s => s.timeSeconds);
      const best = Math.min(...times);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        date: r.date.substring(5), // MM-DD
        best: parseFloat(best.toFixed(1)),
        avg: parseFloat(avg.toFixed(1)),
      };
    });
  }, [dashRecords]);

  // Chart 1 (multi-menu): per-date best time for every menu that has timed sets this month.
  const menuTimeData = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    const menuSet = new Set<ExerciseType>();
    [...records_]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(r => {
        const key = r.date.substring(5); // MM-DD
        r.exercises.forEach(ex => {
          const times = ex.sets.map(s => s.timeSeconds).filter(t => t > 0);
          if (times.length === 0) return;
          const best = Math.min(...times);
          if (!byDate[key]) byDate[key] = {};
          byDate[key][ex.type] =
            byDate[key][ex.type] !== undefined
              ? Math.min(byDate[key][ex.type], best)
              : best;
          menuSet.add(ex.type);
        });
      });
    const rows = Object.entries(byDate).map(([date, menus]) => {
      const row: Record<string, number | string> = { date };
      Object.entries(menus).forEach(([m, v]) => {
        row[m] = parseFloat(v.toFixed(1));
      });
      return row;
    });
    return { rows, menus: Array.from(menuSet) };
  }, [records_]);

  // Chart 3 Data: Weekly sets count
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {};
    records_.forEach(r => {
      const d = new Date(r.date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      const weekKey = `${monday.getMonth() + 1}/${monday.getDate()}${weekUnit}`;

      const setsCount = r.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
      weeks[weekKey] = (weeks[weekKey] || 0) + setsCount;
    });
    return Object.entries(weeks).map(([name, count]) => ({ name, count }));
  }, [records_, weekUnit]);

  // Chart 4 Data: Fatigue
  const fatigueData = useMemo(() => {
    return [...records_]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: r.date.substring(5),
        fatigue: r.fatigue
      }));
  }, [records_]);

  // Chart 5 Data: Road condition vs Avg Best Time
  const roadConditionData = useMemo(() => {
    const conditions = ['dry', 'wet', 'rainy', 'slippery'];
    return conditions.map(cond => {
      const condRecords = dashRecords.filter(r => r.roadCondition === cond);
      if (condRecords.length === 0) return { name: cond, avgBest: 0 };
      
      const bests = condRecords.map(r => {
        const dashEx = r.exercises.find(ex => ex.type === '70段ダッシュ')!;
        return Math.min(...dashEx.sets.map(s => s.timeSeconds));
      });
      const avgBest = bests.reduce((a, b) => a + b, 0) / bests.length;
      return { name: cond, avgBest: parseFloat(avgBest.toFixed(1)) };
    });
  }, [dashRecords]);

  // Analysis Logic
  const analysis = useMemo(() => {
    if (dashRecords.length < 2) return null;

    const latest = dashRecords[dashRecords.length - 1];
    const prev = dashRecords[dashRecords.length - 2];
    
    const getBest = (r: TrainingRecord) => Math.min(...r.exercises.find((ex) => ex.type === '70段ダッシュ')!.sets.map((s) => s.timeSeconds));
    
    const latestBest = getBest(latest);
    const prevBest = getBest(prev);
    const diff = latestBest - prevBest;

    // 4 weeks trend
    const midPoint = Math.floor(dashRecords.length / 2);
    const firstHalf = dashRecords.slice(0, midPoint);
    const secondHalf = dashRecords.slice(midPoint);
    const firstAvg = firstHalf.reduce((acc, r) => acc + getBest(r), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, r) => acc + getBest(r), 0) / secondHalf.length;
    const trend = secondAvg - firstAvg;

    // Fatigue warning
    const last7 = [...records_].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
    const fatigueWarning = last7.filter(r => r.fatigue >= 8).length >= 3;

    // Pain warning
    const last14 = [...records_].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 14);
    const painCount = last14.filter(r => r.hasPain).length;

    // Rainy danger check
    const dangerousRainy = records_.some(r =>
      isDangerousCondition(r.weather, r.roadCondition) && 
      r.exercises.some(ex => isDangerousExercise(ex.type))
    );

    // Recent best update (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDash = dashRecords.filter(r => new Date(r.date) >= sevenDaysAgo);
    
    let recentBestImproved = false;
    if (recentDash.length > 0) {
      const bestBefore = dashRecords
        .filter(r => new Date(r.date) < sevenDaysAgo)
        .map(r => Math.min(...r.exercises.find(ex => ex.type === '70段ダッシュ')!.sets.map(s => s.timeSeconds)));
      
      const absoluteBestBefore = bestBefore.length > 0 ? Math.min(...bestBefore) : Infinity;
      
      recentBestImproved = recentDash.some(r => {
        const best = Math.min(...r.exercises.find(ex => ex.type === '70段ダッシュ')!.sets.map(s => s.timeSeconds));
        return best < absoluteBestBefore;
      });
    }

    return {
      diff,
      trend,
      fatigueWarning,
      painCount,
      dangerousRainy,
      recentBestImproved
    };
  }, [dashRecords, records_]);

  return (
    <div className="charts-page">
      <h2>{t('charts.title')}</h2>

      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label htmlFor="month-select">{t('charts.targetMonth')}</label>
        {availableMonths.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>{t('charts.noRecords')}</p>
        ) : (
          <select
            id="month-select"
            className="filter-select"
            value={activeMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m, lang)}</option>
            ))}
          </select>
        )}
      </div>

      {analysis && (
        <div className="analysis-card">
          <div className="analysis-title">{t('charts.analysisTitle')}</div>
          <div className="analysis-item">
            {t('charts.vsPrev')}: <strong>{analysis.diff > 0 ? `+${analysis.diff.toFixed(1)}` : analysis.diff.toFixed(1)}{t('unit.sec')}</strong>
            ({analysis.diff <= 0 ? t('charts.improved') : t('charts.worsened')})
          </div>
          <div className="analysis-item">
            {t('charts.trend4w')}: <strong>{analysis.trend > 0 ? `+${analysis.trend.toFixed(1)}` : analysis.trend.toFixed(1)}{t('unit.sec')}</strong>
            ({analysis.trend <= 0 ? t('charts.trendUp') : t('charts.trendFlat')})
          </div>
          {analysis.fatigueWarning && (
            <div className="analysis-item" style={{ color: 'var(--color-danger)' }}>
              ⚠️ <strong>{t('charts.fatigueWarnLabel')}</strong>: {t('charts.fatigueWarnBody')}
            </div>
          )}
          {analysis.painCount > 0 && (
            <div className="analysis-item" style={{ color: 'var(--color-danger)' }}>
              ⚠️ <strong>{t('charts.painWarnLabel')}</strong>: {t('charts.painWarnBody').replace('{n}', String(analysis.painCount))}
            </div>
          )}
          {analysis.dangerousRainy && (
            <div className="analysis-item" style={{ color: 'var(--color-warning)' }}>
              ⚠️ <strong>{t('charts.safetyWarnLabel')}</strong>: {t('charts.safetyWarnBody')}
            </div>
          )}
        </div>
      )}

      <div className="chart-container card">
        <div className="chart-title">{t('charts.menuBestTime')}</div>
        {menuTimeData.menus.length === 0 ? (
          <p className="chart-summary">{t('charts.noTimeRecords')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={menuTimeData.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip />
              <Legend />
              {menuTimeData.menus.map((m, i) => (
                <Line
                  key={m}
                  type="monotone"
                  dataKey={m}
                  name={exerciseLabel(m, lang)}
                  stroke={MENU_COLORS[m] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        {dashRecords.length > 0 && (
          <p className="chart-summary">
            {analysis?.recentBestImproved ? t('charts.bestUpdatedYes') : t('charts.bestUpdatedNo')}
          </p>
        )}
      </div>

      <div className="chart-container card">
        <div className="chart-title">{t('charts.avg3Time')}</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip />
            <Line type="monotone" dataKey="avg" stroke="var(--color-primary-light)" strokeWidth={2} name={t('charts.legendAvg')} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container card">
        <div className="chart-title">{t('charts.weeklyTotal')}</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" name={t('charts.legendReps')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container card">
        <div className="chart-title">{t('charts.fatigueTrend')}</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={fatigueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Line type="monotone" dataKey="fatigue" stroke="var(--color-warning)" name={t('charts.legendFatigue')} />
          </LineChart>
        </ResponsiveContainer>
        {fatigueData.length > 0 && (
          <p className="chart-summary">
            {(fatigueData.slice(-7).reduce((sum, d) => sum + d.fatigue, 0) / Math.min(fatigueData.slice(-7).length, 7)) > 7
              ? t('charts.fatigueHigh')
              : t('charts.fatigueStable')}
          </p>
        )}
      </div>


      <div className="chart-container card">
        <div className="chart-title">{t('charts.roadAvgBest')}</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={roadConditionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip />
            <Bar dataKey="avgBest" name={t('charts.legendAvgBest')}>
              {roadConditionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry.name === 'dry' ? 'var(--color-success)' :
                  entry.name === 'wet' ? '#3498db' :
                  entry.name === 'rainy' ? '#9b59b6' : '#e67e22'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsPage;
