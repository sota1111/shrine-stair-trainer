import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import { ExerciseType, WeatherCondition, RoadCondition, TrainingRecord, ExerciseEntry } from '../types';
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

  const calculateDayOfWeek = (dateStr: string) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr).getDay()];
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
    <div className="record-page">
      <h2>📝 トレーニング記録</h2>

      {isConditionDangerous && (
        <div className="warning-box">
          <p>⚠️ 路面不良のため一段飛ばし・二段飛ばしは推奨しません</p>
          <p>代替推奨メニュー: {ALTERNATIVE_EXERCISES.join('、')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>実施日</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            曜日: {calculateDayOfWeek(date)}
          </span>
        </div>

        <div className="form-group">
          <label>天気</label>
          <select value={weather} onChange={(e) => setWeather(e.target.value as WeatherCondition)}>
            <option value="sunny">sunny ☀️</option>
            <option value="cloudy">cloudy ☁️</option>
            <option value="rainy">rainy 🌧️</option>
            <option value="light-rain">light-rain 🌦️</option>
          </select>
        </div>

        <div className="form-group">
          <label>路面状態</label>
          <select value={roadCondition} onChange={(e) => setRoadCondition(e.target.value as RoadCondition)}>
            <option value="dry">dry</option>
            <option value="wet">wet</option>
            <option value="rainy">rainy</option>
            <option value="slippery">slippery</option>
          </select>
        </div>

        <div className="exercises-section">
          <h3>種目</h3>
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="exercise-entry card" style={{ border: '1px solid #eee', marginBottom: '10px' }}>
              <div className="form-group">
                <label>種目名</label>
                <select 
                  value={ex.type} 
                  onChange={(e) => handleExerciseTypeChange(exIdx, e.target.value as ExerciseType)}
                >
                  {EXERCISE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {isConditionDangerous && isDangerousExercise(ex.type) && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                    ⚠️ 危険なコンディションです
                  </p>
                )}
              </div>

              <div className="sets-list">
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ margin: 0, minWidth: '40px' }}>{set.setNumber}本目</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={set.timeSeconds} 
                      onChange={(e) => handleSetTimeChange(exIdx, setIdx, parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>秒</span>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleRemoveSet(exIdx, setIdx)}
                    >
                      削除
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddSet(exIdx)}>
                  本追加
                </button>
              </div>
              <div style={{ marginTop: '10px', textAlign: 'right' }}>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveExercise(exIdx)}>
                  種目削除
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={handleAddExercise} style={{ width: '100%' }}>
            ➕ 種目追加
          </button>
        </div>

        <hr style={{ margin: '20px 0' }} />

        <div className="form-group">
          <label>主観的強度 (1-10)</label>
          <input 
            type="range" min="1" max="10" 
            value={perceivedExertion} 
            onChange={(e) => setPerceivedExertion(parseInt(e.target.value))} 
          />
          <div style={{ textAlign: 'center' }}>{perceivedExertion}</div>
        </div>

        <div className="form-group">
          <label>疲労感 (1-10)</label>
          <input 
            type="range" min="1" max="10" 
            value={fatigue} 
            onChange={(e) => setFatigue(parseInt(e.target.value))} 
          />
          <div style={{ textAlign: 'center' }}>{fatigue}</div>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={hasPain} 
              onChange={(e) => setHasPain(e.target.checked)} 
              style={{ width: 'auto' }}
            />
            痛みの有無
          </label>
        </div>

        <div className="form-group">
          <label>メモ</label>
          <textarea 
            value={memo} 
            onChange={(e) => setMemo(e.target.value)} 
            rows={3}
            placeholder="気づいたことなど"
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
          記録を保存する
        </button>
      </form>
    </div>
  );
};

export default RecordPage;
