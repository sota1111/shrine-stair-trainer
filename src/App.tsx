import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TrainingRecordsProvider } from './context/TrainingRecordsContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import RecordPage from './pages/RecordPage';
import TimerPage from './pages/TimerPage';
import HistoryPage from './pages/HistoryPage';
import ChartsPage from './pages/ChartsPage';
import WeeklyMenuPage from './pages/WeeklyMenuPage';
import LoginPage from './pages/LoginPage';
import BottomNav from './components/BottomNav';
import './App.css';

function AppLayout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <h1>⛩️ 階段トレーニング</h1>
            <nav className="app-nav">
              <NavLink to="/home">🏠 ホーム</NavLink>
              <NavLink to="/record">📝 記録</NavLink>
              <NavLink to="/timer">⏱️ 計測</NavLink>
              <NavLink to="/history">📋 履歴</NavLink>
              <NavLink to="/charts">📊 グラフ</NavLink>
              <NavLink to="/menu">📅 メニュー</NavLink>
            </nav>
          </div>
          {isAuthenticated && (
            <button className="logout-btn" onClick={logout}>ログアウト</button>
          )}
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/record" element={<ProtectedRoute><RecordPage /></ProtectedRoute>} />
          <Route path="/timer" element={<ProtectedRoute><TimerPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/charts" element={<ProtectedRoute><ChartsPage /></ProtectedRoute>} />
          <Route path="/menu" element={<ProtectedRoute><WeeklyMenuPage /></ProtectedRoute>} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TrainingRecordsProvider>
          <AppLayout />
        </TrainingRecordsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
