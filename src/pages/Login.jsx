import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { canAccessDashboard } from '../utils/permissions';
import { Mail, Lock, LogIn, ShieldAlert, Sun, Moon, Shield, Wrench, QrCode } from 'lucide-react';
import './Login.css';

function Login({ onLoginSuccess, darkMode, toggleTheme }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      let role = 'Reporter';
      if (email.toLowerCase().includes('admin')) {
        role = 'Admin';
      } else if (email.toLowerCase().includes('tech')) {
        role = 'Technician';
      }

      if (!canAccessDashboard(role)) {
        await supabase.auth.signOut();
        setMessage('Public users do not need to log in. Scan a QR code on any asset to report issues.');
        return;
      }

      setMessage('Login successful! Redirecting...');

      const mappedUser = {
        ...data.user,
        full_name: email.split('@')[0],
        role
      };
      onLoginSuccess(mappedUser, false);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setLoading(true);
    setMessage(`Authenticating as Demo ${role}...`);

    setTimeout(() => {
      const demoUser = {
        id: `demo_${role.toLowerCase()}`,
        email: `${role.toLowerCase()}@maintainiq.com`,
        full_name: `Demo ${role}`,
        role
      };

      onLoginSuccess(demoUser, true);
      setLoading(false);
    }, 600);
  };

  return (
    <div className={`login-container-green ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="login-theme-toggle">
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="login-card-green-3d animate-slide-up">
        <div className="login-header-green">
          <h2>MaintainIQ <span className="vip-tag-green">VIP Pro</span></h2>
          <p>Administrator &amp; Technician sign in only</p>
        </div>

        <form onSubmit={handleAuth} className="login-form-green">
          <div className="input-group-green-3d">
            <label><Mail size={16} className="input-icon" /> Email Address</label>
            <input
              type="email"
              placeholder="admin@company.com or tech@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group-green-3d">
            <label><Lock size={16} className="input-icon" /> Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-login-green-3d" disabled={loading}>
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Secure Log In</span>
              </>
            )}
          </button>
        </form>

        {message && (
          <div className="auth-message-green-3d">
            <ShieldAlert size={16} />
            <span>{message}</span>
          </div>
        )}

        <div className="demo-shortcuts-panel">
          <div className="demo-title">
            <SparklesIcon />
            <span>Evaluator Demo Shortcuts</span>
          </div>
          <p>Bypass credential setup. Log in with pre-configured staff roles:</p>

          <div className="demo-buttons-grid">
            <button className="btn-demo-role admin-btn" onClick={() => handleDemoLogin('Admin')} title="Log in as Administrator">
              <Shield size={16} />
              <span>Demo Admin</span>
            </button>

            <button className="btn-demo-role tech-btn" onClick={() => handleDemoLogin('Technician')} title="Log in as Assigned Technician">
              <Wrench size={16} />
              <span>Demo Tech</span>
            </button>

            <button
              className="btn-demo-role reporter-btn"
              onClick={() => navigate('/asset/PROJ-01')}
              title="Public user — no login required"
            >
              <QrCode size={16} />
              <span>Public Portal</span>
            </button>
          </div>

          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.85 }}>
            Public users scan QR codes to report issues — no account needed.
          </p>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', color: '#10b981' }}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"/>
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>
    </svg>
  );
}

export default Login;
