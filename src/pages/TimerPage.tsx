import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import type { ExerciseType, WeatherCondition, RoadCondition, TrainingRecord } from '../types';
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

const TimerPage: React.FC = () => {
  const navigate = useNavigate();
  const { addRecord } = useTrainingRecords();

  const [exerciseType, setExerciseType] = useState<ExerciseType>('70段ダッシュ');
  const [weather, setWeather] = useState<WeatherCondition>('sunny');
  const [roadCondition, setRoadCondition] = useState<RoadCondition>('dry');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [recordedSets, setRecordedSets] = useState<{ setNumber: number; timeSeconds: number }[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [perceivedExertion, setPerceivedExertion] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [hasPain, setHasPain] = useState(false);
  const [memo, setMemo] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStart = () => {
    setStartTime(Date.now() - elapsedMs);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    const timeSeconds = Math.round(elapsedMs / 100) / 10; // 0.1秒単位
    const newSet = { setNumber: recordedSets.length + 1, timeSeconds };
    setRecordedSets([...recordedSets, newSet]);
    setElapsedMs(0);
    setStartTime(null);
  };

  const handleReset = () => {
    if (window.confirm('タイムをリセットしますか？')) {
      setIsRunning(false);
      setElapsedMs(0);
      setStartTime(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('全記録を破棄しますか？')) {
      setIsRunning(false);
      setElapsedMs(0);
      setStartTime(null);
      setRecordedSets([]);
      setShowSaveForm(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - (startTime ?? Date.now()));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startTime]);

  const formatTime = (ms: number): string => {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSeconds = Math.floor(totalTenths / 10);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
  };

  const handleSave = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const record: TrainingRecord = {
      id: Date.now().toString(),
      date: dateStr,
      dayOfWeek: days[today.getDay()],
      weather,
      roadCondition,
      exercises: [{ type: exerciseType, sets: recordedSets }],
      perceivedExertion,
      fatigue,
      hasPain,
      memo,
      createdAt: new Date().toISOString(),
    };
    addRecord(record);
    navigate('/history');
  };

  const isConditionDangerous = isDangerousCondition(weather, roadCondition);

  return (
    <div className="timer-page container">
      <h2>⏱️ タイム計測</h2>

      <section className="card" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label>天気</label>
          <div className="quick-select-group">
            {(['sunny', 'cloudy', 'rainy', 'light-rain'] as WeatherCondition[]).map((w) => (
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
            {(['dry', 'wet', 'rainy', 'slippery'] as RoadCondition[]).map((r) => (
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

        <div className="form-group">
          <label>種目</label>
          <div className="quick-select-group" style={{ flexWrap: 'wrap' }}>
            {EXERCISE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`quick-select-btn ${exerciseType === t ? 'active' : ''}`}
                onClick={() => setExerciseType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {isConditionDangerous && isDangerousExercise(exerciseType) && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>
              ⚠️ 危険なコンディションです
            </p>
          )}
        </div>
      </section>

      {isConditionDangerous && (
        <div className="warning-box" style={{ marginBottom: '16px' }}>
          <p>⚠️ 路面不良のため一段飛ばし・二段飛ばしは推奨しません</p>
          <p>代替推奨メニュー: {ALTERNATIVE_EXERCISES.join('、')}</p>
        </div>
      )}

      {isRunning && (
        <p className="timer-set-indicator">第 {recordedSets.length + 1} セット 計測中</p>
      )}
      {!isRunning && elapsedMs === 0 && recordedSets.length > 0 && (
        <p className="timer-set-indicator">第 {recordedSets.length} セット 完了</p>
      )}

      <div className="timer-display">
        {formatTime(elapsedMs)}
      </div>

      <div className="timer-controls">
        {!isRunning ? (
          <button className="timer-btn-start" onClick={handleStart}>
            START
          </button>
        ) : (
          <button className="timer-btn-stop" onClick={handleStop}>
            STOP
          </button>
        )}

        <div className="timer-secondary-row">
          <button className="timer-btn-secondary" onClick={handleReset}>
            リセット
          </button>
          <button className="timer-btn-secondary" onClick={handleDiscard}>
            全破棄
          </button>
        </div>
      </div>

      <div className="timer-sets-list">
        {recordedSets.map((set) => (
          <div key={set.setNumber} className="timer-set-item">
            <span>{set.setNumber}本目</span>
            <span className="timer-set-time">{set.timeSeconds.toFixed(1)}s</span>
          </div>
        ))}
      </div>

      {recordedSets.length > 0 && (
        <div className="timer-best-time">
          ベスト: {Math.min(...recordedSets.map(s => s.timeSeconds)).toFixed(1)}s
          （{recordedSets.length}セット完了）
        </div>
      )}

      {recordedSets.length > 0 && !isRunning && !showSaveForm && (
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', minHeight: '56px', fontSize: '1.2rem', marginBottom: '20px' }}
          onClick={() => setShowSaveForm(true)}
        >
          記録として保存
        </button>
      )}

      {showSaveForm && (
        <section className="card save-form" style={{ marginTop: '20px' }}>
          <h3>📋 保存フォーム</h3>
          
          <div className="form-group">
            <label>主観的強度 (RPE: 1-10)</label>
            <div className="rpe-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`rpe-btn ${perceivedExertion === val ? 'active' : ''}`}
                  onClick={() => setPerceivedExertion(val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>疲労感 (1-10)</label>
            <div className="rpe-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`rpe-btn ${fatigue === val ? 'active' : ''}`}
                  onClick={() => setFatigue(val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>痛みの有無</label>
            <button
              type="button"
              className={`quick-select-btn ${hasPain ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'center' }}
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
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', minHeight: '64px', fontSize: '1.4rem' }}
            onClick={handleSave}
          >
            保存する
          </button>
        </section>
      )}
    </div>
  );
};

export default TimerPage;
