import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';

export default function BottomNav() {
  const { t } = useI18n();
  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">{t('bottomNav.today')}</span>
      </NavLink>
      <NavLink to="/record" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📝</span>
        <span className="bottom-nav-label">{t('bottomNav.record')}</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📋</span>
        <span className="bottom-nav-label">{t('bottomNav.history')}</span>
      </NavLink>
      <NavLink to="/charts" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📊</span>
        <span className="bottom-nav-label">{t('bottomNav.charts')}</span>
      </NavLink>
      <NavLink to="/summary" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📈</span>
        <span className="bottom-nav-label">{t('bottomNav.summary')}</span>
      </NavLink>
      <NavLink to="/menu" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📅</span>
        <span className="bottom-nav-label">{t('bottomNav.menu')}</span>
      </NavLink>
    </nav>
  );
}
