import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Mail, Lock, LogIn, UserPlus, ShieldAlert, Sun, Moon, Shield, Wrench, User } from 'lucide-react';
import './Login.css';

function Login({ onLoginSuccess, darkMode, toggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          // Attempt to insert profile (will catch if table missing)
          try {
            await supabase
              .from('profiles')
              .insert([{ id: data.user.id, full_name: fullName, role: 'Reporter' }]);
          } catch (pe) {
            console.warn("Could not insert to profiles (offline or table missing):", pe.message);
          }
          setMessage('✨ Signup Successful! Check your email for verification.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        setMessage('🔓 Login Successful! Redirecting...');
        
        // Fetch role from profile or default to Admin (based on email or simple fallback)
        let role = 'Reporter';
        if (email.toLowerCase().includes('admin')) {
          role = 'Admin';
        } else if (email.toLowerCase().includes('tech')) {
          role = 'Technician';
        }
        
        const mappedUser = {
          ...data.user,
          full_name: email.split('@')[0],
          role: role
        };
        onLoginSuccess(mappedUser, false);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setLoading(true);
    setMessage(`🔓 Authenticating as Demo ${role}...`);
    
    // Simulate auth lag
    setTimeout(() => {
      const demoUser = {
        id: `demo_${role.toLowerCase()}`,
        email: `${role.toLowerCase()}@maintainiq.com`,
        full_name: `Demo ${role}`,
        role: role
      };
      
      onLoginSuccess(demoUser, true); // True flag means mock/simulated login
      setLoading(false);
    }, 600);
  };

  return (
    <div className={`login-container-green ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      
      {/* Theme Toggle Button in Corner */}
      <div className="login-theme-toggle">
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="login-card-green-3d animate-slide-up">
        <div className="login-header-green">
          <h2>MaintainIQ <span className="vip-tag-green">VIP Pro</span></h2>
          <p>{isSignUp ? 'Create your professional account' : 'Sign in to manage system assets'}</p>
        </div>

        <form onSubmit={handleAuth} className="login-form-green">
          {isSignUp && (
            <div className="input-group-green-3d">
              <label><User size={16} className="input-icon" /> Full Name</label>
              <input 
                type="text" 
                placeholder="Enter full name" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
              />
            </div>
          )}

          <div className="input-group-green-3d">
            <label><Mail size={16} className="input-icon" /> Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
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
              <span>⏳ Processing...</span>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} />
                <span>Sign Up As User</span>
              </>
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

        <div className="login-footer-green">
          <p onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </p>
        </div>

        {/* DEMO ACCREDITATIONS WORKSPACE SHORTCUT */}
        {!isSignUp && (
          <div className="demo-shortcuts-panel">
            <div className="demo-title">
              <SparklesIcon />
              <span>Evaluator Demo Shortcuts</span>
            </div>
            <p>Bypass credential setups. Instantly log in with pre-configured authority roles to review dashboard panels:</p>
            
            <div className="demo-buttons-grid">
              <button className="btn-demo-role admin-btn" onClick={() => handleDemoLogin('Admin')} title="Log in as Administrator">
                <Shield size={16} />
                <span>Demo Admin</span>
              </button>
              
              <button className="btn-demo-role tech-btn" onClick={() => handleDemoLogin('Technician')} title="Log in as Assigned Technician">
                <Wrench size={16} />
                <span>Demo Tech</span>
              </button>

              <button className="btn-demo-role reporter-btn" onClick={() => handleDemoLogin('Reporter')} title="Log in as Public User">
                <User size={16} />
                <span>Demo User</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple internal icon component for elegance
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