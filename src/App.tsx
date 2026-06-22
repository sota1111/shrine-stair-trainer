import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { TrainingRecordsProvider } from './context/TrainingRecordsContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import HistoryPage from './pages/HistoryPage';
import ChartsPage from './pages/ChartsPage';
import SummaryPage from './pages/SummaryPage';
import WeeklyMenuPage from './pages/WeeklyMenuPage';
import LoginPage from './pages/LoginPage';
import BottomNav from './components/BottomNav';
import SyncStatusBanner from './components/SyncStatusBanner';
import LanguageToggle from './components/LanguageToggle';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from './i18n/useI18n';
import './App.css';

function AppLayout() {
  const { isAuthenticated, logout } = useAuth();
  const { t } = useI18n();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <h1>{t('app.title')}</h1>
            <nav className="app-nav">
              <NavLink to="/home">{t('nav.home')}</NavLink>
              <NavLink to="/record">{t('nav.record')}</NavLink>
              <NavLink to="/history">{t('nav.history')}</NavLink>
              <NavLink to="/charts">{t('nav.charts')}</NavLink>
              <NavLink to="/summary">{t('nav.summary')}</NavLink>
              <NavLink to="/menu">{t('nav.menu')}</NavLink>
            </nav>
          </div>
          <div className="app-header-actions">
            <LanguageToggle />
            {isAuthenticated && (
              <button className="logout-btn" onClick={logout} aria-label={t('nav.logout')} title={t('nav.logout')}>
                <LogOut size={18} aria-hidden="true" />
              </button>
            )}
          </div>
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
          <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
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
      <I18nProvider>
        <AuthProvider>
          <TrainingRecordsProvider>
            <AppLayout />
          </TrainingRecordsProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
