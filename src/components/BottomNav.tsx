import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useI18n } from '../i18n/useI18n';
import type { MessageKey } from '../i18n/messages';

// 絵文字アイコンを線画SVGに統一（SOT-1020 / 提案1）。
// すべて currentColor で描画するため、既存の .bottom-nav-item.active の色がそのまま反映される。
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const HomeIcon = () => (
  <svg {...iconProps}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
const RecordIcon = () => (
  <svg {...iconProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
const HistoryIcon = () => (
  <svg {...iconProps}><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
);
const ChartsIcon = () => (
  <svg {...iconProps}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></svg>
);
const SummaryIcon = () => (
  <svg {...iconProps}><path d="M3 3v18h18" /><path d="m6 15 4-5 4 3 5-7" /></svg>
);
const MenuIcon = () => (
  <svg {...iconProps}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18" /><path d="M8 2v4" /><path d="M16 2v4" /></svg>
);

const NAV_ITEMS: { to: string; labelKey: MessageKey; icon: ReactNode }[] = [
  { to: '/home', labelKey: 'bottomNav.today', icon: <HomeIcon /> },
  { to: '/record', labelKey: 'bottomNav.record', icon: <RecordIcon /> },
  { to: '/history', labelKey: 'bottomNav.history', icon: <HistoryIcon /> },
  { to: '/charts', labelKey: 'bottomNav.charts', icon: <ChartsIcon /> },
  { to: '/summary', labelKey: 'bottomNav.summary', icon: <SummaryIcon /> },
  { to: '/menu', labelKey: 'bottomNav.menu', icon: <MenuIcon /> },
];

export default function BottomNav() {
  const { t } = useI18n();
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? 'bottom-nav-item active' : 'bottom-nav-item')}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
