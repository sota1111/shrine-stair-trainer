import React, { useState } from 'react';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import type { ExerciseType, WeatherCondition, RoadCondition, TrainingRecord, ExerciseEntry } from '../types';
import { useI18n } from '../i18n/useI18n';
import { exerciseLabel, weatherLabel, roadLabel } from '../i18n/exerciseLabels';
import { dayOfWeekOf } from '../utils/datetime';

const EXERCISE_TYPES: ExerciseType[] = [
  '70段ダッシュ',
  '一段ずつ',
  '一段飛ばし',
  '二段飛ばし',
  '軽め',
  '屋内ジャンプ',
  '休養',
];

interface EditRecordModalProps {
  record: TrainingRecord;
  onClose: () => void;
}

const calculateDayOfWeek = (dateStr: string) => dayOfWeekOf(dateStr);

const EditRecordModal: React.FC<EditRecordModalProps> = ({ record, onClose }) => {
  const { updateRecord } = useTrainingRecords();
  const { t, lang } = useI18n();

  const [date, setDate] = useState(record.date);
  const [weather, setWeather] = useState<WeatherCondition>(record.weather);
  const [roadCondition, setRoadCondition] = useState<RoadCondition>(record.roadCondition);
  const [exercises, setExercises] = useState<ExerciseEntry[]>(
    record.exercises.map(ex => ({ type: ex.type, sets: ex.sets.map(s => ({ ...s })) })),
  );
  const [perceivedExertion, setPerceivedExertion] = useState(record.perceivedExertion);
  const [fatigue, setFatigue] = useState(record.fatigue);
  const [hasPain, setHasPain] = useState(record.hasPain);
  const [memo, setMemo] = useState(record.memo);
  const [showValidation, setShowValidation] = useState(false);
  const [saving, setSaving] = useState(false);

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
    newExercises[index] = { ...newExercises[index], type };
    setExercises(newExercises);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newExercises = exercises.map((ex, i) =>
      i === exerciseIndex
        ? { ...ex, sets: [...ex.sets, { setNumber: ex.sets.length + 1, timeSeconds: 30 }] }
        : ex,
    );
    setExercises(newExercises);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = exercises.map((ex, i) =>
      i === exerciseIndex
        ? {
            ...ex,
            sets: ex.sets
              .filter((_, si) => si !== setIndex)
              .map((s, si) => ({ ...s, setNumber: si + 1 })),
          }
        : ex,
    );
    setExercises(newExercises);
  };

  const handleSetTimeChange = (exerciseIndex: number, setIndex: number, time: number) => {
    const newExercises = exercises.map((ex, i) =>
      i === exerciseIndex
        ? {
            ...ex,
            sets: ex.sets.map((s, si) => (si === setIndex ? { ...s, timeSeconds: time } : s)),
          }
        : ex,
    );
    setExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    if (!isValid() || saving) return;

    const updated: TrainingRecord = {
      ...record,
      id: record.id,
      createdAt: record.createdAt,
      date,
      dayOfWeek: calculateDayOfWeek(date),
      weather,
      roadCondition,
      exercises,
      perceivedExertion,
      fatigue,
      hasPain,
      memo,
    };

    setSaving(true);
    try {
      await updateRecord(updated);
      onClose();
    } catch {
      // Error is surfaced via context error state; keep the modal open for retry.
      setSaving(false);
    }
  };

  return (
    <div
      className="edit-record-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '560px', margin: '24px 0' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>{t('history.editTitle')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('record.date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
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

          <div className="exercises-section" style={{ marginTop: '16px' }}>
            <h4>{t('record.exercises')}</h4>
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
                </div>

                <div className="sets-list">
                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="form-group"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
                    >
                      <label style={{ margin: 0, minWidth: '50px' }}>
                        {t('record.setN').replace('{n}', String(set.setNumber))}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={set.timeSeconds}
                        onChange={e => handleSetTimeChange(exIdx, setIdx, parseFloat(e.target.value))}
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
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', minHeight: '44px' }}
                    onClick={() => handleAddSet(exIdx)}
                  >
                    {t('record.addSet')}
                  </button>
                </div>
                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ minHeight: '44px' }}
                    onClick={() => handleRemoveExercise(exIdx)}
                  >
                    {t('record.removeExercise')}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddExercise}
              style={{ width: '100%', minHeight: '56px' }}
            >
              {t('record.addExercise')}
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>{t('record.rpe')}</label>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary)' }}>
              {perceivedExertion}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={perceivedExertion}
              onChange={e => setPerceivedExertion(parseInt(e.target.value))}
              style={{ height: '32px', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>{t('record.fatigue')}</label>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary)' }}>
              {fatigue}
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={fatigue}
              onChange={e => setFatigue(parseInt(e.target.value))}
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
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              placeholder={t('record.memoPlaceholder')}
              style={{ padding: '12px', fontSize: '1rem' }}
            />
          </div>

          {showValidation && !isValid() && (
            <div className="validation-error">
              {t('record.validation')}:{' '}
              {!date ? t('record.validationNoDate') : exercises.length === 0 ? t('record.validationNoExercise') : ''}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '56px' }}
              onClick={onClose}
            >
              {t('history.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, minHeight: '56px' }}
              disabled={saving}
            >
              {t('history.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecordModal;
