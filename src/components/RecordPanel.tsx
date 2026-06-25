import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import type { ExerciseType, WeatherCondition, RoadCondition, TrainingRecord, ExerciseEntry } from '../types';
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

interface RecordPanelProps {
  weather: WeatherCondition;
  setWeather: (w: WeatherCondition) => void;
  roadCondition: RoadCondition;
  setRoadCondition: (r: RoadCondition) => void;
}

const RecordPanel: React.FC<RecordPanelProps> = ({ weather, setWeather, roadCondition, setRoadCondition }) => {
  const navigate = useNavigate();
  const { addRecord } = useTrainingRecords();
  const { t, lang } = useI18n();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
    <div className="record-panel">
      <form onSubmit={handleSubmit}>
        <section className="card">
          <h3>{t('record.basicInfo')}</h3>
          <div className="form-group">
            <label>{t('record.date')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              {t('record.dayOfWeek')}: {calculateDayOfWeek(date)}
            </span>
          </div>

          <div className="form-group">
            <label>{t('cond.weather')}</label>
            <div className="quick-select-group">
              {(['sunny', 'cloudy', 'rainy', 'light-rain'] as WeatherCondition[]).map(w => (
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
              {(['dry', 'wet', 'rainy', 'slippery'] as RoadCondition[]).map(r => (
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
        </section>

        <div className="exercises-section" style={{ marginTop: '20px' }}>
          <h3>{t('record.exercises')}</h3>
          {exercises.map((ex, exIdx) => (
            <div key={exIdx} className="exercise-entry card" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>{t('record.exerciseName')}</label>
                <div className="quick-select-group" style={{ flexWrap: 'wrap' }}>
                  {EXERCISE_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`quick-select-btn ${ex.type === type ? 'active' : ''}`}
                      onClick={() => handleExerciseTypeChange(exIdx, type)}
                    >
                      {exerciseLabel(type, lang)}
                    </button>
                  ))}
                </div>
                {isConditionDangerous && isDangerousExercise(ex.type) && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                    {t('cond.dangerExercise')}
                  </p>
                )}
              </div>

              <div className="sets-list">
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <label style={{ margin: 0, minWidth: '50px' }}>{t('record.setN').replace('{n}', String(set.setNumber))}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={set.timeSeconds}
                      onChange={(e) => handleSetTimeChange(exIdx, setIdx, parseFloat(e.target.value))}
                      style={{ flex: 1, padding: '10px', fontSize: '1rem' }}
                    />
                    <span style={{ fontSize: '1rem' }}>{t('record.unitSec')}</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ minHeight: '44px' }}
                      onClick={() => handleRemoveSet(exIdx, setIdx)}
                    >
                      {t('record.deleteSet')}
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" style={{ width: '100%', minHeight: '44px' }} onClick={() => handleAddSet(exIdx)}>
                  {t('record.addSet')}
                </button>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button type="button" className="btn btn-danger btn-sm" style={{ minHeight: '44px' }} onClick={() => handleRemoveExercise(exIdx)}>
                  {t('record.removeExercise')}
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={handleAddExercise} style={{ width: '100%', minHeight: '56px' }}>
            {t('record.addExercise')}
          </button>
        </div>

        <section className="card" style={{ marginTop: '20px' }}>
          <h3>{t('record.feelMemo')}</h3>
          <div className="form-group">
            <label>{t('record.rpe')}</label>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary)' }}>{perceivedExertion}</div>
            <input
              type="range" min="1" max="10"
              value={perceivedExertion}
              onChange={(e) => setPerceivedExertion(parseInt(e.target.value))}
              style={{ height: '32px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>{t('record.fatigue')}</label>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary)' }}>{fatigue}</div>
            <input
              type="range" min="1" max="10"
              value={fatigue}
              onChange={(e) => setFatigue(parseInt(e.target.value))}
              style={{ height: '32px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>{t('record.pain')}</label>
            <button
              type="button"
              className={`quick-select-btn ${hasPain ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'center', minHeight: '56px' }}
              onClick={() => setHasPain(!hasPain)}
            >
              {hasPain ? t('record.painYes') : t('record.painNo')}
            </button>
          </div>

          <div className="form-group">
            <label>{t('record.memo')}</label>
            <textarea
              data-testid="record-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder={t('record.memoPlaceholder')}
              style={{ padding: '12px', fontSize: '1rem' }}
            />
          </div>

          {showValidation && !isValid() && (
            <div className="validation-error">
              {t('record.validation')}: {!date ? t('record.validationNoDate') : exercises.length === 0 ? t('record.validationNoExercise') : ''}
            </div>
          )}

          <button data-testid="record-save" type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', minHeight: '64px' }}>
            {t('record.save')}
          </button>
        </section>
      </form>
    </div>
  );
};

export default RecordPanel;
