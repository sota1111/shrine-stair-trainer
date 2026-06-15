import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">今日</span>
      </NavLink>
      <NavLink to="/timer" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">⏱️</span>
        <span className="bottom-nav-label">計測</span>
      </NavLink>
      <NavLink to="/record" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📝</span>
        <span className="bottom-nav-label">記録</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📋</span>
        <span className="bottom-nav-label">履歴</span>
      </NavLink>
      <NavLink to="/charts" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📊</span>
        <span className="bottom-nav-label">グラフ</span>
      </NavLink>
      <NavLink to="/menu" className={({ isActive }) => isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}>
        <span className="bottom-nav-icon">📅</span>
        <span className="bottom-nav-label">メニュー</span>
      </NavLink>
    </nav>
  );
}
