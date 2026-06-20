import React, { useState } from 'react';
import type { WeatherCondition, RoadCondition, ExerciseType } from '../types';
import { isDangerousCondition, isDangerousExercise, ALTERNATIVE_EXERCISES } from '../utils/weatherWarning';
import { useI18n } from '../i18n/useI18n';

interface MenuDay {
  day: string;
  menu: string;
  exerciseType?: ExerciseType;
  intensity: string;
  notes: string;
}

const WEEKLY_MENU: MenuDay[] = [
  { day: '月', menu: '70段ダッシュ × 3本', intensity: '全力', notes: '最速タイム狙い' },
  { day: '火', menu: '70段 × 1〜2本', intensity: '6〜7割', notes: '回復日' },
  { day: '水', menu: '二段飛ばし 70段 × 2本', exerciseType: '二段飛ばし', intensity: '8割', notes: '軽い刺激' },
  { day: '木', menu: '70段ダッシュ × 3本', intensity: '全力', notes: '最速タイム狙い' },
  { day: '金', menu: '70段 × 1本', intensity: '流す程度', notes: '回復日' },
  { day: '土', menu: 'スクワットジャンプ 5回×3セット', intensity: '屋内', notes: '休憩30秒' },
  { day: '日', menu: '完全休養', intensity: '—', notes: 'または公園で軽く' },
];

const WeeklyMenuPage: React.FC = () => {
  const { t } = useI18n();
  const [weather, setWeather] = useState<WeatherCondition>('sunny');
  const [roadCondition, setRoadCondition] = useState<RoadCondition>('dry');

  const todayIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const menuIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  const isConditionDangerous = isDangerousCondition(weather, roadCondition);

  const adjustedMenu = WEEKLY_MENU.map((item) => {
    if (
      isConditionDangerous &&
      item.exerciseType &&
      isDangerousExercise(item.exerciseType)
    ) {
      return {
        ...item,
        menu: '軽め（雨天・路面不良のため自動切替）',
        autoSwitchReason: `雨天または路面不良のため、${item.exerciseType}を軽めメニューへ変更しました`,
      };
    }
    return { ...item, autoSwitchReason: undefined as string | undefined };
  });

  const todayMenu = adjustedMenu[menuIndex];

  return (
    <div className="weekly-menu-page">
      <h2>{t('menu.title')}</h2>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>本日の天気・路面状態</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
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
          <div className="form-group" style={{ margin: 0 }}>
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
        </div>
      </div>

      {isConditionDangerous && (
        <div className="danger-box">
          <p style={{ margin: 0, fontWeight: 700 }}>⚠️ 雨天または路面不良のため、高リスク種目が代替メニューへ自動切替されます</p>
          <p style={{ margin: '4px 0 0 0' }}>代替推奨メニュー: {ALTERNATIVE_EXERCISES.join('、')}</p>
        </div>
      )}

      {isConditionDangerous && todayMenu.exerciseType && isDangerousExercise(todayMenu.exerciseType) && (
        <div className="danger-box">
          <strong>🚨 今日のメニューは危険条件です</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            {todayMenu.exerciseType}は雨天・路面不良時に転倒リスクがあります。
            代わりに{ALTERNATIVE_EXERCISES.slice(0, 3).join('、')}を選んでください。
          </p>
        </div>
      )}

      <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', background: '#fffdf0' }}>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-warning)' }}>今日の推奨メニュー</h3>
        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{todayMenu.menu}</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>強度: {todayMenu.intensity} | 約5分 | {todayMenu.notes}</div>
        {todayMenu.autoSwitchReason && (
          <div className="warning-box" style={{ marginTop: '8px', padding: '6px 10px', fontSize: '0.8rem' }}>
            ⚠️ {todayMenu.autoSwitchReason}
          </div>
        )}
      </div>

      <div className="menu-grid">
        {adjustedMenu.map((item, index) => (
          <div key={index} className={`menu-day-card ${index === menuIndex ? 'today' : ''}`}>
            <div className="menu-day-label">{item.day}曜日</div>
            <div className="menu-day-content">
              <strong>{item.menu}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>強度: {item.intensity}</div>
              <div className="menu-note">約5分 | {item.notes}</div>
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
