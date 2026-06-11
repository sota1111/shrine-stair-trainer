import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import RecordPage from './pages/RecordPage';
import HistoryPage from './pages/HistoryPage';
import ChartsPage from './pages/ChartsPage';
import WeeklyMenuPage from './pages/WeeklyMenuPage';
import LoginPage from './pages/LoginPage';
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
              <NavLink to="/record">📝 記録</NavLink>
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
          <Route path="/" element={<Navigate to="/record" replace />} />
          <Route path="/record" element={<ProtectedRoute><RecordPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/charts" element={<ProtectedRoute><ChartsPage /></ProtectedRoute>} />
          <Route path="/menu" element={<ProtectedRoute><WeeklyMenuPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
