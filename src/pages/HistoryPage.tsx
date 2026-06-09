import React from 'react';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import { ExerciseEntry } from '../types';

const weatherIcons = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  'light-rain': '🌦️',
};

const HistoryPage: React.FC = () => {
  const { records } = useTrainingRecords();

  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

  return (
    <div className="history-page">
      <h2>📋 記録履歴</h2>
      {sortedRecords.length === 0 ? (
        <p>記録がありません</p>
      ) : (
        sortedRecords.map(record => {
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
