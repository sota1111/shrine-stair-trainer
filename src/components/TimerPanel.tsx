import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import type { ExerciseType, WeatherCondition, RoadCondition, TrainingRecord } from '../types';
import { isDangerousCondition, isDangerousExercise } from '../utils/weatherWarning';
import { useI18n } from '../i18n/useI18n';
import { exerciseLabel, weatherLabel, roadLabel } from '../i18n/exerciseLabels';

const EXERCISE_TYPES: ExerciseType[] = [
  '70段ダッシュ',
  '一段ずつ',
  '一段飛ばし',
  '二段飛ばし',
  '軽め',
  '屋内ジャンプ',
  '休養',
];

const conditionChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: '16px',
  background: 'var(--color-primary)',
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 600,
};

interface TimerPanelProps {
  weather: WeatherCondition;
  setWeather: (w: WeatherCondition) => void;
  roadCondition: RoadCondition;
  setRoadCondition: (r: RoadCondition) => void;
}

const TimerPanel: React.FC<TimerPanelProps> = ({ weather, setWeather, roadCondition, setRoadCondition }) => {
  const navigate = useNavigate();
  const { addRecord } = useTrainingRecords();
  const { t, lang } = useI18n();

  const [exerciseType, setExerciseType] = useState<ExerciseType>('70段ダッシュ');
  const [confirmed, setConfirmed] = useState(false);
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
    if (window.confirm(t('timer.confirmReset'))) {
      setIsRunning(false);
      setElapsedMs(0);
      setStartTime(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const handleReselect = () => {
    // Re-open the selectors without discarding recorded sets / save form.
    // Stop the timer if it is mid-count so the elapsed value is preserved as-is.
    setIsRunning(false);
    setConfirmed(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleDiscard = () => {
    if (window.confirm(t('timer.confirmDiscard'))) {
      setIsRunning(false);
      setElapsedMs(0);
      setStartTime(null);
      setRecordedSets([]);
      setShowSaveForm(false);
      setConfirmed(false);
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
  // The user first chooses weather / road / exercise, then presses 決定 (confirm).
  // Once confirmed, the selectors collapse to a compact read-only summary so only
  // the chosen values are shown and the timer is revealed. They become editable
  // again after a full discard (全破棄).

  return (
    <div className="timer-panel">
      <section className="card" style={{ marginBottom: '16px' }}>
        {confirmed ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={conditionChipStyle}>{weatherLabel(weather, lang)}</span>
            <span style={conditionChipStyle}>{roadLabel(roadCondition, lang)}</span>
            <span style={conditionChipStyle}>{exerciseLabel(exerciseType, lang)}</span>
            <button
              type="button"
              className="quick-select-btn"
              style={{ marginLeft: 'auto' }}
              onClick={handleReselect}
            >
              {t('timer.reselect')}
            </button>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>{t('cond.weather')}</label>
              <div className="quick-select-group">
                {(['sunny', 'cloudy', 'rainy', 'light-rain'] as WeatherCondition[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`quick-select-btn ${weather === w ? 'active' : ''}`}
                    onClick={() => setWeather(w)}
                  >
                    {weatherLabel(w, lang)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>{t('cond.road')}</label>
              <div className="quick-select-group">
                {(['dry', 'wet', 'rainy', 'slippery'] as RoadCondition[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`quick-select-btn ${roadCondition === r ? 'active' : ''}`}
                    onClick={() => setRoadCondition(r)}
                  >
                    {roadLabel(r, lang)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>{t('timer.exercise')}</label>
              <div className="quick-select-group" style={{ flexWrap: 'wrap' }}>
                {EXERCISE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`quick-select-btn ${exerciseType === type ? 'active' : ''}`}
                    onClick={() => setExerciseType(type)}
                  >
                    {exerciseLabel(type, lang)}
                  </button>
                ))}
              </div>
              {isConditionDangerous && isDangerousExercise(exerciseType) && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {t('cond.dangerExercise')}
                </p>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '56px', fontSize: '1.2rem', marginTop: '8px' }}
              onClick={() => setConfirmed(true)}
            >
              {t('timer.confirm')}
            </button>
          </>
        )}
      </section>

      {confirmed && (
        <>
          {isRunning && (
            <p className="timer-set-indicator">{t('timer.setCounting').replace('{n}', String(recordedSets.length + 1))}</p>
          )}
          {!isRunning && elapsedMs === 0 && recordedSets.length > 0 && (
            <p className="timer-set-indicator">{t('timer.setDone').replace('{n}', String(recordedSets.length))}</p>
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
                {t('timer.reset')}
              </button>
              <button className="timer-btn-secondary" onClick={handleDiscard}>
                {t('timer.discardAll')}
              </button>
            </div>
          </div>

          <div className="timer-sets-list">
            {recordedSets.map((set) => (
              <div key={set.setNumber} className="timer-set-item">
                <span>{t('record.setN').replace('{n}', String(set.setNumber))}</span>
                <span className="timer-set-time">{set.timeSeconds.toFixed(1)}s</span>
              </div>
            ))}
          </div>

          {recordedSets.length > 0 && (
            <div className="timer-best-time">
              {t('timer.best')}: {Math.min(...recordedSets.map(s => s.timeSeconds)).toFixed(1)}s
              （{t('timer.setsDone').replace('{n}', String(recordedSets.length))}）
            </div>
          )}

          {recordedSets.length > 0 && !isRunning && !showSaveForm && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '56px', fontSize: '1.2rem', marginBottom: '20px' }}
              onClick={() => setShowSaveForm(true)}
            >
              {t('timer.saveAsRecord')}
            </button>
          )}

          {showSaveForm && (
            <section className="card save-form" style={{ marginTop: '20px' }}>
              <h3>{t('timer.saveForm')}</h3>

              <div className="form-group">
                <label>{t('timer.rpe')}</label>
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
                <label>{t('record.fatigue')}</label>
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
                <label>{t('record.pain')}</label>
                <button
                  type="button"
                  className={`quick-select-btn ${hasPain ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setHasPain(!hasPain)}
                >
                  {hasPain ? t('record.painYes') : t('record.painNo')}
                </button>
              </div>

              <div className="form-group">
                <label>{t('record.memo')}</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  placeholder={t('record.memoPlaceholder')}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '64px', fontSize: '1.4rem' }}
                onClick={handleSave}
              >
                {t('timer.save')}
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TimerPanel;
