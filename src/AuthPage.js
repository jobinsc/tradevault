// src/AuthPage.js
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, ''));
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('✅ Password reset email sent! Check your inbox.');
      setError('');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>📊</div>
        <h1 style={styles.title}>TradeVault</h1>
        <p style={styles.subtitle}>Pro Trading Journal</p>
        
        <div style={styles.tabs}>
          <button 
            style={{...styles.tab, ...(isLogin ? styles.tabActive : {})}}
            onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
          >
            Login
          </button>
          <button 
            style={{...styles.tab, ...(!isLogin ? styles.tabActive : {})}}
            onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            minLength={6}
            required
          />

          {error && <div style={styles.error}>❌ {error}</div>}
          {message && <div style={styles.success}>{message}</div>}

          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? '⏳ Please wait...' : (isLogin ? '🔓 Login' : '✨ Create Account')}
          </button>
        </form>

        {isLogin && (
          <button onClick={handleForgotPassword} style={styles.forgotBtn}>
            Forgot Password?
          </button>
        )}

        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        <button onClick={handleGoogleLogin} style={styles.googleBtn} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>

        <p style={styles.footer}>
          🔒 Your data is private and secure
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: 20,
  },
  card: {
    background: '#1a1f35',
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 420,
    border: '1px solid #2a3150',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  logo: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    margin: 0,
  },
  subtitle: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 13,
  },
  tabs: {
    display: 'flex',
    background: '#0f172a',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: '10px',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 8,
    fontSize: 14,
  },
  tabActive: {
    background: '#3b82f6',
    color: '#fff',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    marginBottom: 12,
    background: '#0f172a',
    border: '1px solid #2a3150',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: 12,
    cursor: 'pointer',
    marginTop: 10,
    width: '100%',
    textAlign: 'center',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    color: '#64748b',
  },
  dividerText: {
    padding: '0 12px',
    fontSize: 11,
    color: '#64748b',
    margin: '0 auto',
    background: '#1a1f35',
    position: 'relative',
  },
  googleBtn: {
    width: '100%',
    padding: '12px',
    background: '#fff',
    color: '#333',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  error: {
    padding: 10,
    background: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  success: {
    padding: 10,
    background: 'rgba(16,185,129,0.1)',
    color: '#10b981',
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
    marginTop: 20,
  },
};

export default AuthPage;