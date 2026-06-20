import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TrainingRecordsProvider } from './context/TrainingRecordsContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import HistoryPage from './pages/HistoryPage';
import ChartsPage from './pages/ChartsPage';
import WeeklyMenuPage from './pages/WeeklyMenuPage';
import LoginPage from './pages/LoginPage';
import BottomNav from './components/BottomNav';
import SyncStatusBanner from './components/SyncStatusBanner';
import './App.css';

function AppLayout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <nav className="app-nav">
              <NavLink to="/home">🏠 ホーム</NavLink>
              <NavLink to="/record">📝 記録・計測</NavLink>
              <NavLink to="/history">📋 履歴</NavLink>
              <NavLink to="/charts">📊 グラフ</NavLink>
              <NavLink to="/menu">📅 メニュー</NavLink>
            </nav>
            <h1>⛩️ 階段トレーニング</h1>
          </div>
          {isAuthenticated && (
            <button className="logout-btn" onClick={logout}>ログアウト</button>
          )}
        </div>
      </header>
      <SyncStatusBanner />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/record" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
          <Route path="/timer" element={<Navigate to="/record" replace />} />
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
