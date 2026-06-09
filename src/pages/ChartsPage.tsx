import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import { isDangerousCondition, isDangerousExercise } from '../utils/weatherWarning';

const ChartsPage: React.FC = () => {
  const { records } = useTrainingRecords();

  const dashRecords = useMemo(() => {
    return records
      .filter(r => r.exercises.some(ex => ex.type === '70段ダッシュ'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

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

  // Chart 3 Data: Weekly sets count
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {};
    records.forEach(r => {
      const d = new Date(r.date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      const weekKey = `${monday.getMonth() + 1}/${monday.getDate()}週`;
      
      const setsCount = r.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
      weeks[weekKey] = (weeks[weekKey] || 0) + setsCount;
    });
    return Object.entries(weeks).map(([name, count]) => ({ name, count }));
  }, [records]);

  // Chart 4 Data: Fatigue
  const fatigueData = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: r.date.substring(5),
        fatigue: r.fatigue
      }));
  }, [records]);

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
    
    const getBest = (r: any) => Math.min(...r.exercises.find((ex: any) => ex.type === '70段ダッシュ').sets.map((s: any) => s.timeSeconds));
    
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
    const last7 = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
    const fatigueWarning = last7.filter(r => r.fatigue >= 8).length >= 3;

    // Pain warning
    const last14 = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 14);
    const painCount = last14.filter(r => r.hasPain).length;

    // Rainy danger check
    const dangerousRainy = records.some(r => 
      isDangerousCondition(r.weather, r.roadCondition) && 
      r.exercises.some(ex => isDangerousExercise(ex.type))
    );

    return {
      diff,
      trend,
      fatigueWarning,
      painCount,
      dangerousRainy
    };
  }, [dashRecords, records]);

  return (
    <div className="charts-page">
      <h2>📊 トレーニング分析</h2>

      {analysis && (
        <div className="analysis-card">
          <div className="analysis-title">✨ 分析レポート</div>
          <div className="analysis-item">
            前回比: <strong>{analysis.diff > 0 ? `+${analysis.diff.toFixed(1)}` : analysis.diff.toFixed(1)}秒</strong> 
            ({analysis.diff <= 0 ? '改善' : '悪化'})
          </div>
          <div className="analysis-item">
            4週間トレンド: <strong>{analysis.trend > 0 ? `+${analysis.trend.toFixed(1)}` : analysis.trend.toFixed(1)}秒</strong>
            ({analysis.trend <= 0 ? '向上中' : '停滞気味'})
          </div>
          {analysis.fatigueWarning && (
            <div className="analysis-item" style={{ color: 'var(--color-danger)' }}>
              ⚠️ <strong>疲労警告</strong>: 最近の疲労度が高すぎます。休養を優先してください。
            </div>
          )}
          {analysis.painCount > 0 && (
            <div className="analysis-item" style={{ color: 'var(--color-danger)' }}>
              ⚠️ <strong>痛み警告</strong>: 過去14日間で{analysis.painCount}回の痛みが記録されています。
            </div>
          )}
          {analysis.dangerousRainy && (
            <div className="analysis-item" style={{ color: 'var(--color-warning)' }}>
              ⚠️ <strong>安全警告</strong>: 雨天・路面不良時に強度の高いメニューが実施されています。
            </div>
          )}
        </div>
      )}

      <div className="chart-container card">
        <div className="chart-title">70段最速タイム推移 (秒)</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip />
            <Line type="monotone" dataKey="best" stroke="var(--color-primary)" strokeWidth={2} name="最速" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container card">
        <div className="chart-title">3本平均タイム推移 (秒)</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip />
            <Line type="monotone" dataKey="avg" stroke="var(--color-primary-light)" strokeWidth={2} name="平均" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container card">
        <div className="chart-title">週別本数合計</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" name="本数" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container card">
        <div className="chart-title">疲労感推移 (1-10)</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={fatigueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Line type="monotone" dataKey="fatigue" stroke="var(--color-warning)" name="疲労感" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container card">
        <div className="chart-title">路面状態別平均最速タイム (秒)</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={roadConditionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip />
            <Bar dataKey="avgBest" name="平均最速">
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
