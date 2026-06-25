import { useNavigate, NavLink } from 'react-router-dom';
import { useTrainingRecords } from '../hooks/useTrainingRecords';
import { calculateStreak } from '../utils/stats';
import { useI18n } from '../i18n/useI18n';

export default function HomePage() {
  const { records } = useTrainingRecords();
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  // Helper to format timeSeconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper to get start of week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = getStartOfWeek(today);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Filter records
  const recordsWithDate = records.map(r => ({ ...r, dateObj: new Date(r.date) }));

  const weekRecords = recordsWithDate.filter(r => r.dateObj >= startOfWeek);
  const monthRecords = recordsWithDate.filter(r => r.dateObj >= startOfMonth);

  const last30Records = recordsWithDate.slice(0, 30);
  const last7Records = recordsWithDate.slice(0, 7);

  // 今週の実施回数
  const weekCount = weekRecords.length;

  // 今月の実施回数
  const monthCount = monthRecords.length;

  // 直近ベストタイム (last 30 records)
  let bestTimeSeconds = Infinity;
  last30Records.forEach(r => {
    r.exercises.forEach(e => {
      e.sets.forEach(s => {
        if (s.timeSeconds > 0 && s.timeSeconds < bestTimeSeconds) {
          bestTimeSeconds = s.timeSeconds;
        }
      });
    });
  });
  const bestTimeStr = bestTimeSeconds === Infinity ? null : formatTime(bestTimeSeconds);

  // 前回タイム (best time from the most recent record that has sets with timeSeconds > 0)
  let lastTimeStr = null;
  const recentRecordWithTime = records.find(r => 
    r.exercises.some(e => e.sets.some(s => s.timeSeconds > 0))
  );
  if (recentRecordWithTime) {
    let bestInLast = Infinity;
    recentRecordWithTime.exercises.forEach(e => {
      e.sets.forEach(s => {
        if (s.timeSeconds > 0 && s.timeSeconds < bestInLast) {
          bestInLast = s.timeSeconds;
        }
      });
    });
    if (bestInLast !== Infinity) {
      lastTimeStr = formatTime(bestInLast);
    }
  }

  // 疲労感平均 (last 7 records)
  const avgFatigue = last7Records.length > 0 
    ? last7Records.reduce((acc, r) => acc + r.fatigue, 0) / last7Records.length 
    : null;

  // 痛みあり記録数 (last 30 records)
  const painCount = last30Records.filter(r => r.hasPain).length;

  // 継続日数
  const streakDays = calculateStreak(records);

  const dateStr = today.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="home-page">
      {/* Today's Status Section */}
      <div className="card home-today-card">
        <h2>{t('home.todayStatus')}</h2>
        <p className="home-today-date">{dateStr}</p>

        {/* Quick action buttons */}
        <div className="home-quick-actions">
          <button data-testid="home-start-timer" onClick={() => navigate('/timer')} className="btn btn-primary btn-lg home-action-btn">{t('home.startTimer')}</button>
          <button onClick={() => navigate('/record')} className="btn btn-secondary btn-lg home-action-btn">{t('home.recordInput')}</button>
          <button onClick={() => navigate('/history')} className="btn btn-secondary btn-lg home-action-btn">{t('home.viewHistory')}</button>
        </div>

        {/* Today's recommended menu link */}
        <p className="home-menu-hint">
          📅 <NavLink to="/menu">{t('home.checkTodayMenu')}</NavLink>
        </p>
      </div>

      {/* Dashboard Summary */}
      <div className="card">
        <h2>{t('home.summary')}</h2>
        <div className="summary-grid">
          {/* 2-column grid of summary cards */}
          <div className="summary-card">
            <div className="summary-label">{t('home.weekCount')}</div>
            <div className="summary-value">{weekCount}{t('unit.times')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('home.monthCount')}</div>
            <div className="summary-value">{monthCount}{t('unit.times')}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('home.recentBest')}</div>
            <div className="summary-value">{bestTimeStr || '-'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('home.lastTime')}</div>
            <div className="summary-value">{lastTimeStr || '-'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('home.avgFatigue7')}</div>
            <div className="summary-value">{avgFatigue !== null ? avgFatigue.toFixed(1) : '-'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{t('home.painCount30')}</div>
            <div className="summary-value">{painCount}{t('unit.times')}</div>
          </div>
        </div>
        {streakDays > 0 && (
          <p className="summary-streak">{t('home.streak').replace('{n}', String(streakDays))}</p>
        )}
      </div>
    </div>
  );
}
