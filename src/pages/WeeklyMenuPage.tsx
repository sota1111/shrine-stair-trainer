import React from 'react';

interface MenuDay {
  day: string;
  menu: string;
  intensity: string;
  notes: string;
}

const WEEKLY_MENU: MenuDay[] = [
  { day: '月', menu: '70段ダッシュ × 3本', intensity: '全力', notes: '最速タイム狙い' },
  { day: '火', menu: '70段 × 1〜2本', intensity: '6〜7割', notes: '回復日' },
  { day: '水', menu: '二段飛ばし 70段 × 2本', intensity: '8割', notes: '軽い刺激' },
  { day: '木', menu: '70段ダッシュ × 3本', intensity: '全力', notes: '最速タイム狙い' },
  { day: '金', menu: '70段 × 1本', intensity: '流す程度', notes: '回復日' },
  { day: '土', menu: 'スクワットジャンプ 5回×3セット', intensity: '屋内', notes: '休憩30秒' },
  { day: '日', menu: '完全休養', intensity: '—', notes: 'または公園で軽く' },
];

const WeeklyMenuPage: React.FC = () => {
  const todayIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  // WEEKLY_MENU is Sun=index 6, Mon=0, ...
  // Wait, my WEEKLY_MENU starts with Mon (index 0). 
  // Date().getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Adjusted index for WEEKLY_MENU:
  const menuIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const todayMenu = WEEKLY_MENU[menuIndex];

  return (
    <div className="weekly-menu-page">
      <h2>📅 週間トレーニングメニュー</h2>

      <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', background: '#fffdf0' }}>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-warning)' }}>今日の推奨メニュー</h3>
        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{todayMenu.menu}</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>強度: {todayMenu.intensity} | {todayMenu.notes}</div>
      </div>

      <div className="menu-grid">
        {WEEKLY_MENU.map((item, index) => (
          <div key={index} className={`menu-day-card ${index === menuIndex ? 'today' : ''}`}>
            <div className="menu-day-label">{item.day}曜日</div>
            <div className="menu-day-content">
              <strong>{item.menu}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>強度: {item.intensity}</div>
              <div className="menu-note">{item.notes}</div>
              {item.day === '水' && (
                <div className="menu-note" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                  ※ 雨天・路面不良時は二段飛ばし禁止 → 一段ずつ軽めに変更
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
