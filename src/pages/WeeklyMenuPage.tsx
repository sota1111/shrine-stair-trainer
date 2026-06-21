import React, { useState } from 'react';
import type { WeatherCondition, RoadCondition, ExerciseType } from '../types';
import { isDangerousCondition, isDangerousExercise, ALTERNATIVE_EXERCISES } from '../utils/weatherWarning';
import { useI18n } from '../i18n/useI18n';
import type { MessageKey } from '../i18n/messages';
import {
  exerciseLabel,
  weatherLabel,
  roadLabel,
  weekdayLong,
  joinExercises,
} from '../i18n/exerciseLabels';

// Stable definition: the weekday is stored as a JP single-char code and the
// menu / intensity / notes are message keys, so the displayed text follows the
// selected language while the danger logic (exerciseType) stays untouched.
interface MenuDay {
  dayCode: string;
  menuKey: MessageKey;
  exerciseType?: ExerciseType;
  intensityKey: MessageKey;
  notesKey: MessageKey;
}

const WEEKLY_MENU: MenuDay[] = [
  { dayCode: '月', menuKey: 'weekly.mon.menu', intensityKey: 'weekly.mon.intensity', notesKey: 'weekly.mon.notes' },
  { dayCode: '火', menuKey: 'weekly.tue.menu', intensityKey: 'weekly.tue.intensity', notesKey: 'weekly.tue.notes' },
  { dayCode: '水', menuKey: 'weekly.wed.menu', exerciseType: '二段飛ばし', intensityKey: 'weekly.wed.intensity', notesKey: 'weekly.wed.notes' },
  { dayCode: '木', menuKey: 'weekly.thu.menu', intensityKey: 'weekly.thu.intensity', notesKey: 'weekly.thu.notes' },
  { dayCode: '金', menuKey: 'weekly.fri.menu', intensityKey: 'weekly.fri.intensity', notesKey: 'weekly.fri.notes' },
  { dayCode: '土', menuKey: 'weekly.sat.menu', intensityKey: 'weekly.sat.intensity', notesKey: 'weekly.sat.notes' },
  { dayCode: '日', menuKey: 'weekly.sun.menu', intensityKey: 'weekly.sun.intensity', notesKey: 'weekly.sun.notes' },
];

const WeeklyMenuPage: React.FC = () => {
  const { t, lang } = useI18n();
  const [weather, setWeather] = useState<WeatherCondition>('sunny');
  const [roadCondition, setRoadCondition] = useState<RoadCondition>('dry');

  const todayIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const menuIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  const isConditionDangerous = isDangerousCondition(weather, roadCondition);

  const adjustedMenu = WEEKLY_MENU.map((item) => {
    const day = weekdayLong(item.dayCode, lang);
    const intensity = t(item.intensityKey);
    const notes = t(item.notesKey);
    if (
      isConditionDangerous &&
      item.exerciseType &&
      isDangerousExercise(item.exerciseType)
    ) {
      return {
        day,
        intensity,
        notes,
        exerciseType: item.exerciseType,
        menu: t('menu.autoSwitchedMenu'),
        autoSwitchReason: t('menu.autoSwitchReason').replace('{type}', exerciseLabel(item.exerciseType, lang)),
      };
    }
    return {
      day,
      intensity,
      notes,
      exerciseType: item.exerciseType,
      menu: t(item.menuKey),
      autoSwitchReason: undefined as string | undefined,
    };
  });

  const todayMenu = adjustedMenu[menuIndex];

  return (
    <div className="weekly-menu-page">
      <h2>{t('menu.title')}</h2>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{t('menu.todayCondition')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
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
          <div className="form-group" style={{ margin: 0 }}>
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
        </div>
      </div>

      {isConditionDangerous && (
        <div className="danger-box">
          <p style={{ margin: 0, fontWeight: 700 }}>{t('menu.autoSwitchNotice')}</p>
          <p style={{ margin: '4px 0 0 0' }}>{t('menu.altMenu')}: {joinExercises(ALTERNATIVE_EXERCISES, lang)}</p>
        </div>
      )}

      {isConditionDangerous && todayMenu.exerciseType && isDangerousExercise(todayMenu.exerciseType) && (
        <div className="danger-box">
          <strong>{t('menu.dangerTitle')}</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {t('menu.dangerBody')
              .replace('{type}', exerciseLabel(todayMenu.exerciseType, lang))
              .replace('{alts}', joinExercises(ALTERNATIVE_EXERCISES.slice(0, 3), lang))}
          </p>
        </div>
      )}

      <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', background: '#fffdf0' }}>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-warning)' }}>{t('menu.todayRecommended')}</h3>
        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{todayMenu.menu}</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>{t('menu.intensity')}: {todayMenu.intensity} | {t('menu.about5min')} | {todayMenu.notes}</div>
        {todayMenu.autoSwitchReason && (
          <div className="warning-box" style={{ marginTop: '8px', padding: '6px 10px', fontSize: '0.8rem' }}>
            ⚠️ {todayMenu.autoSwitchReason}
          </div>
        )}
      </div>

      <div className="menu-grid">
        {adjustedMenu.map((item, index) => (
          <div key={index} className={`menu-day-card ${index === menuIndex ? 'today' : ''}`}>
            <div className="menu-day-label">{item.day}</div>
            <div className="menu-day-content">
              <strong>{item.menu}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{t('menu.intensity')}: {item.intensity}</div>
              <div className="menu-note">{t('menu.about5min')} | {item.notes}</div>
              {item.autoSwitchReason && (
                <div className="warning-box" style={{ marginTop: '8px', padding: '6px 10px', fontSize: '0.8rem' }}>
                  ⚠️ {item.autoSwitchReason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default WeeklyMenuPage;
