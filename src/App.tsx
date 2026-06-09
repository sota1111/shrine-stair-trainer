import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import RecordPage from './pages/RecordPage';
import HistoryPage from './pages/HistoryPage';
import ChartsPage from './pages/ChartsPage';
import WeeklyMenuPage from './pages/WeeklyMenuPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>⛩️ 階段トレーニング</h1>
          <nav className="app-nav">
            <NavLink to="/record">📝 記録</NavLink>
            <NavLink to="/history">📋 履歴</NavLink>
            <NavLink to="/charts">📊 グラフ</NavLink>
            <NavLink to="/menu">📅 メニュー</NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/record" replace />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/menu" element={<WeeklyMenuPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
