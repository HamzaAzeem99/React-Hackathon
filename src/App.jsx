import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabase';
import { getUserRole, canAccessDashboard, hasPermission, PERMISSIONS } from './utils/permissions';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterAsset from './pages/RegisterAsset';
import PublicAsset from './pages/PublicAsset';
import ReportIssue from './pages/ReportIssue';
import TrackIssue from './pages/TrackIssue';

function TopLoadingBar({ active }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setWidth(20);
      const interval = setInterval(() => {
        setWidth(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setWidth(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '4px',
        width: `${width}%`,
        background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #34d399 100%)',
        boxShadow: '0 0 8px rgba(16, 185, 129, 0.7)',
        zIndex: 9999,
        transition: 'width 0.4s ease-out, opacity 0.5s ease'
      }}
    />
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [mockSession, setMockSession] = useState(() => {
    const saved = localStorage.getItem('maintainiq_mock_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('maintainiq_dark_mode') === 'true';
  });

  const toggleTheme = () => {
    setDarkMode(prev => {
      localStorage.setItem('maintainiq_dark_mode', !prev);
      return !prev;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  useEffect(() => {
    if (mockSession) {
      setSession({ user: mockSession });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      }
      setLoading(false);
    }).catch(err => {
      console.warn("Supabase auth check failed:", err.message);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!localStorage.getItem('maintainiq_mock_session')) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [mockSession]);

  const handleLogout = async () => {
    setGlobalLoading(true);
    setTimeout(async () => {
      localStorage.removeItem('maintainiq_mock_session');
      setMockSession(null);
      setSession(null);
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase logout warning:", err.message);
      }
      setGlobalLoading(false);
    }, 800);
  };

  const handleLoginSuccess = (user, isMock = false) => {
    setGlobalLoading(true);
    setTimeout(() => {
      if (isMock) {
        localStorage.setItem('maintainiq_mock_session', JSON.stringify(user));
        setMockSession(user);
      }
      setSession({ user });
      setGlobalLoading(false);
    }, 800);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: darkMode ? '#022c22' : '#f0fdf4',
        color: darkMode ? '#f0fdf4' : '#022c22',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #10b981',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <span style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.5px' }}>
          Initializing MaintainIQ System VIP...
        </span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const userRole = session ? getUserRole(session.user) : null;
  const hasDashboardAccess = canAccessDashboard(userRole);

  return (
    <Router>
      <TopLoadingBar active={globalLoading} />
      <Routes>
        <Route
          path="/login"
          element={!hasDashboardAccess ? (
            <Login onLoginSuccess={handleLoginSuccess} darkMode={darkMode} toggleTheme={toggleTheme} setGlobalLoading={setGlobalLoading} />
          ) : (
            <Navigate to="/" />
          )}
        />

        <Route
          path="/"
          element={hasDashboardAccess ? (
            <Home session={session} handleLogout={handleLogout} darkMode={darkMode} toggleTheme={toggleTheme} setGlobalLoading={setGlobalLoading} />
          ) : (
            <Navigate to="/login" />
          )}
        />

        <Route path="/asset/:assetCode" element={<PublicAsset darkMode={darkMode} toggleTheme={toggleTheme} setGlobalLoading={setGlobalLoading} />} />
        <Route path="/report-issue/:assetId" element={<ReportIssue darkMode={darkMode} toggleTheme={toggleTheme} setGlobalLoading={setGlobalLoading} />} />
        <Route path="/track-issue" element={<TrackIssue darkMode={darkMode} toggleTheme={toggleTheme} />} />
        <Route path="/track-issue/:ticketNumber" element={<TrackIssue darkMode={darkMode} toggleTheme={toggleTheme} />} />

        <Route
          path="/register-asset"
          element={
            hasDashboardAccess && hasPermission(userRole, PERMISSIONS.CREATE_ASSETS) ? (
              <RegisterAsset session={session} darkMode={darkMode} toggleTheme={toggleTheme} setGlobalLoading={setGlobalLoading} />
            ) : (
              <Navigate to={hasDashboardAccess ? '/' : '/login'} />
            )
          }
        />

        <Route path="*" element={<Navigate to={hasDashboardAccess ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
