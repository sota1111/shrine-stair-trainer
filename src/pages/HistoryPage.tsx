import React, { useState } from 'react';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import type { ExerciseEntry } from '../types';

const weatherIcons = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  'light-rain': '🌦️',
};

type FilterType = 'all' | 'pain' | 'rainy';

const HistoryPage: React.FC = () => {
  const { records } = useTrainingRecords();
  const [filter, setFilter] = useState<FilterType>('all');
  const [exerciseFilter, setExerciseFilter] = useState<string>('all');

  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredRecords = sortedRecords.filter(r => {
    if (filter === 'pain' && !r.hasPain) return false;
    if (filter === 'rainy' && r.weather !== 'rainy' && r.weather !== 'light-rain') return false;
    if (exerciseFilter !== 'all' && !r.exercises.some(ex => ex.type === exerciseFilter)) return false;
    return true;
  });

  const getBestTime = (exercises: ExerciseEntry[]) => {
    const dashExercises = exercises.filter(ex => ex.type === '70段ダッシュ');
    if (dashExercises.length === 0) return null;
    
    let best = Infinity;
    dashExercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.timeSeconds < best) best = set.timeSeconds;
      });
    });
    
    return best === Infinity ? null : best;
  };

  const getScoreColor = (score: number) => {
    if (score < 5) return 'var(--color-success)';
    if (score <= 7) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const exportCSV = () => {
    const header = 'date,dayOfWeek,weather,roadCondition,exerciseType,setNumber,timeSeconds,perceivedExertion,fatigue,hasPain,memo';
    const rows: string[] = [];
    sortedRecords.forEach(record => {
      if (record.exercises.length === 0) {
        rows.push([
          record.date,
          record.dayOfWeek,
          record.weather,
          record.roadCondition,
          '',
          '',
          '',
          record.perceivedExertion,
          record.fatigue,
          record.hasPain ? '1' : '0',
          `"${(record.memo || '').replace(/"/g, '""')}"`,
        ].join(','));
      } else {
        record.exercises.forEach(ex => {
          ex.sets.forEach(set => {
            rows.push([
              record.date,
              record.dayOfWeek,
              record.weather,
              record.roadCondition,
              ex.type,
              set.setNumber,
              set.timeSeconds,
              record.perceivedExertion,
              record.fatigue,
              record.hasPain ? '1' : '0',
              `"${(record.memo || '').replace(/"/g, '""')}"`,
            ].join(','));
          });
        });
      }
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shrine-stair-training-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="history-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>📋 記録履歴</h2>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
          📥 CSVエクスポート
        </button>
      </div>

      <div className="history-filters">
        <div className="filter-group">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>すべて</button>
          <button className={`filter-btn ${filter === 'pain' ? 'active' : ''}`} onClick={() => setFilter('pain')}>痛みあり</button>
          <button className={`filter-btn ${filter === 'rainy' ? 'active' : ''}`} onClick={() => setFilter('rainy')}>雨天のみ</button>
        </div>
        <div className="filter-group" style={{ marginTop: '8px' }}>
          <select 
            value={exerciseFilter}
            onChange={(e) => setExerciseFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">全種目</option>
            <option value="70段ダッシュ">70段ダッシュ</option>
            <option value="一段ずつ">一段ずつ</option>
            <option value="一段飛ばし">一段飛ばし</option>
            <option value="二段飛ばし">二段飛ばし</option>
            <option value="軽め">軽め</option>
            <option value="屋内ジャンプ">屋内ジャンプ</option>
            <option value="休養">休養</option>
          </select>
        </div>
        <p className="filter-result-count">{filteredRecords.length}件</p>
      </div>

      {filteredRecords.length === 0 ? (
        <p>記録がありません</p>
      ) : (
        filteredRecords.map(record => {
          const bestTime = getBestTime(record.exercises);
          return (
            <div key={record.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {record.date} ({record.dayOfWeek})
                  </span>
                  <span style={{ marginLeft: '8px', fontSize: '1.2rem' }}>
                    {weatherIcons[record.weather]}
                  </span>
                  <span className={`badge badge-${record.roadCondition}`} style={{ marginLeft: '8px' }}>
                    {record.roadCondition}
                  </span>
                  {record.hasPain && <span className="badge-pain">🤕 痛みあり</span>}
                  {(record.weather === 'rainy' || record.weather === 'light-rain') && (
                    <span className="badge-rainy-day">🌧️ 雨天実施</span>
                  )}
                </div>
                {bestTime && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>最速タイム</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {bestTime}s
                    </div>
                  </div>
                )}
              </div>

              <div className="exercises-list" style={{ marginBottom: '12px' }}>
                {record.exercises.map((ex, idx) => (
                  <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                    <strong>{ex.type}</strong>: {ex.sets.map(s => `${s.timeSeconds}s`).join(', ')}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', marginBottom: '8px' }}>
                <div>
                  強度: <span style={{ fontWeight: 700, color: getScoreColor(record.perceivedExertion) }}>
                    {record.perceivedExertion}
                  </span>
                </div>
                <div>
                  疲労: <span style={{ fontWeight: 700, color: getScoreColor(record.fatigue) }}>
                    {record.fatigue}
                  </span>
                </div>
                {record.hasPain && (
                  <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                    ⚠️ 痛みあり
                  </div>
                )}
              </div>

              {record.memo && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--color-muted)', 
                  borderTop: '1px solid #eee', 
                  paddingTop: '8px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {record.memo}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default HistoryPage;

