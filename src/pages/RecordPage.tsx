import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import type { ExerciseType, WeatherCondition, RoadCondition, TrainingRecord, ExerciseEntry } from '../types';
import { isDangerousCondition, isDangerousExercise, ALTERNATIVE_EXERCISES } from '../utils/weatherWarning';

const EXERCISE_TYPES: ExerciseType[] = [
  '70段ダッシュ',
  '一段ずつ',
  '一段飛ばし',
  '二段飛ばし',
  '軽め',
  '屋内ジャンプ',
  '休養',
];

const RecordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addRecord } = useTrainingRecords();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState<WeatherCondition>('sunny');
  const [roadCondition, setRoadCondition] = useState<RoadCondition>('dry');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { type: '70段ダッシュ', sets: [{ setNumber: 1, timeSeconds: 30 }] },
  ]);
  const [perceivedExertion, setPerceivedExertion] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [hasPain, setHasPain] = useState(false);
  const [memo, setMemo] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const calculateDayOfWeek = (dateStr: string) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr).getDay()];
  };

  const isValid = (): boolean => {
    if (!date) return false;
    if (exercises.length === 0) return false;
    return true;
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { type: '70段ダッシュ', sets: [{ setNumber: 1, timeSeconds: 30 }] }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseTypeChange = (index: number, type: ExerciseType) => {
    const newExercises = [...exercises];
    newExercises[index].type = type;
    setExercises(newExercises);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const sets = newExercises[exerciseIndex].sets;
    sets.push({ setNumber: sets.length + 1, timeSeconds: 30 });
    setExercises(newExercises);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    // Renumber sets
    newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
    setExercises(newExercises);
  };

  const handleSetTimeChange = (exerciseIndex: number, setIndex: number, time: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex].timeSeconds = time;
    setExercises(newExercises);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    if (!isValid()) return;
    
    const newRecord: TrainingRecord = {
      id: Date.now().toString(),
      date,
      dayOfWeek: calculateDayOfWeek(date),
      weather,
      roadCondition,
      exercises,
      perceivedExertion,
      fatigue,
      hasPain,
      memo,
      createdAt: new Date().toISOString(),
    };
    addRecord(newRecord);
    navigate('/history');
  };

  const isConditionDangerous = isDangerousCondition(weather, roadCondition);

  return (
    <div className="record-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>📝 トレーニング記録</h2>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button type="button" className="btn btn-secondary btn-lg" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => navigate('/timer')}>
          ⏱️ タイム計測して記録する
        </button>
      </div>

      {isConditionDangerous && (
        <div className="warning-box">
          <p>⚠️ 路面不良のため一段飛ばし・二段飛ばしは推奨しません</p>
          <p>代替推奨メニュー: {ALTERNATIVE_EXERCISES.join('、')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section className="card">
          <h3>📅 基本情報</h3>
          <div className="form-group">
            <label>実施日</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              曜日: {calculateDayOfWeek(date)}
            </span>
          </div>

          <div className="form-group">
            <label>天気</label>
            <div className="quick-select-group">
              {(['sunny', 'cloudy', 'rainy', 'light-rain'] as WeatherCondition[]).map(w => (
                <button
                  key={w}
                  type="button"
                  className={`quick-select-btn ${weather === w ? 'active' : ''}`}
                  onClick={() => setWeather(w)}
                >
                  {w === 'sunny' ? '☀️ 晴' : w === 'cloudy' ? '☁️ 曇' : w === 'rainy' ? '🌧️ 雨' : '🌦️ 小雨'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>路面状態</label>
            <div className="quick-select-group">
              {(['dry', 'wet', 'rainy', 'slippery'] as RoadCondition[]).map(r => (
                <button
                  key={r}
                  type="button"
                  className={`quick-select-btn ${roadCondition === r ? 'active' : ''}`}
                  onClick={() => setRoadCondition(r)}
                >
                  {r === 'dry' ? '🟢 乾燥' : r === 'wet' ? '🔵 湿潤' : r === 'rainy' ? '💧 雨' : '⚠️ 滑る'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="exercises-section" style={{ marginTop: '20px' }}>
          <h3>種目</h3>
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="exercise-entry card" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>種目名</label>
                <div className="quick-select-group" style={{ flexWrap: 'wrap' }}>
                  {EXERCISE_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`quick-select-btn ${ex.type === t ? 'active' : ''}`}
                      onClick={() => handleExerciseTypeChange(exIdx, t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {isConditionDangerous && isDangerousExercise(ex.type) && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                    ⚠️ 危険なコンディションです
                  </p>
                )}
              </div>

              <div className="sets-list">
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <label style={{ margin: 0, minWidth: '50px' }}>{set.setNumber}本目</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={set.timeSeconds} 
                      onChange={(e) => handleSetTimeChange(exIdx, setIdx, parseFloat(e.target.value))}
                      style={{ flex: 1, padding: '10px', fontSize: '1rem' }}
                    />
                    <span style={{ fontSize: '1rem' }}>秒</span>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm" 
                      style={{ minHeight: '44px' }}
                      onClick={() => handleRemoveSet(exIdx, setIdx)}
                    >
                      削除
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" style={{ width: '100%', minHeight: '44px' }} onClick={() => handleAddSet(exIdx)}>
                  ➕ 本追加
                </button>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button type="button" className="btn btn-danger btn-sm" style={{ minHeight: '44px' }} onClick={() => handleRemoveExercise(exIdx)}>
                  🗑️ 種目削除
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={handleAddExercise} style={{ width: '100%', minHeight: '56px' }}>
            ➕ 新しい種目を追加
          </button>
        </div>

        <section className="card" style={{ marginTop: '20px' }}>
          <h3>💪 体感・メモ</h3>
          <div className="form-group">
            <label>主観的強度 (1-10)</label>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary)' }}>{perceivedExertion}</div>
            <input 
              type="range" min="1" max="10" 
              value={perceivedExertion} 
              onChange={(e) => setPerceivedExertion(parseInt(e.target.value))} 
              style={{ height: '32px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>疲労感 (1-10)</label>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary)' }}>{fatigue}</div>
            <input 
              type="range" min="1" max="10" 
              value={fatigue} 
              onChange={(e) => setFatigue(parseInt(e.target.value))} 
              style={{ height: '32px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>痛みの有無</label>
            <button
              type="button"
              className={`quick-select-btn ${hasPain ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'center', minHeight: '56px' }}
              onClick={() => setHasPain(!hasPain)}
            >
              {hasPain ? '🤕 痛みあり' : '✅ 痛みなし'}
            </button>
          </div>

          <div className="form-group">
            <label>メモ</label>
            <textarea 
              value={memo} 
              onChange={(e) => setMemo(e.target.value)} 
              rows={3}
              placeholder="気づいたことなど"
              style={{ padding: '12px', fontSize: '1rem' }}
            />
          </div>

          {showValidation && !isValid() && (
            <div className="validation-error">
              ⚠️ 入力内容を確認してください: {!date ? '日付が未入力' : exercises.length === 0 ? '種目が必要です' : ''}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', minHeight: '64px' }}>
            記録を保存する
          </button>
        </section>
      </form>
    </div>
  );
};

export default RecordPage;
