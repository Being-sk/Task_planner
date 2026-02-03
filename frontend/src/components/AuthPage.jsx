import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-layout">
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: 'clamp(24px, 10vw, 56px)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '24px',
            padding: '12px 24px',
            background: 'var(--bg-tertiary)',
            borderRadius: '100px',
            border: '1px solid var(--border-light)'
          }}>
            <Sparkles size={20} strokeWidth={2} />
            <span style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.1em' }}>ZENITH</span>
          </div>
          
          <h1 style={{ 
            fontSize: '36px', 
            marginBottom: '12px', 
            color: 'var(--text-primary)',
            fontWeight: '600',
            letterSpacing: '-0.02em'
          }}>
            {isLogin ? 'Welcome back' : 'Get started'}
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '15px',
            lineHeight: '1.6',
            maxWidth: '320px',
            margin: '0 auto'
          }}>
            {isLogin ? 'Sign in to continue managing your tasks' : 'Create your account and start planning'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ 
              position: 'absolute', 
              left: '20px', 
              top: '18px', 
              color: 'var(--text-tertiary)',
              strokeWidth: 2
            }} />
            <input 
              type="email" 
              placeholder="Email address" 
              className="glass-input" 
              style={{ paddingLeft: '52px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ 
              position: 'absolute', 
              left: '20px', 
              top: '18px', 
              color: 'var(--text-tertiary)',
              strokeWidth: 2
            }} />
            <input 
              type="password" 
              placeholder="Password" 
              className="glass-input" 
              style={{ paddingLeft: '52px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading} 
            style={{ width: '100%', height: '52px', marginTop: '8px' }}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isLogin ? 'Sign in' : 'Create account'}</span>
                <ArrowRight size={18} strokeWidth={2} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ margin: '32px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
        </div>

        {/* Google Sign In */}
        <button 
          onClick={handleGoogleSignIn}
          type="button"
          style={{ 
            width: '100%',
            padding: '16px 24px',
            background: 'var(--bg-secondary)', 
            border: '1.5px solid var(--border-light)',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: '500',
            marginBottom: '32px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '-0.01em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Toggle */}
        <p style={{ 
          textAlign: 'center', 
          color: 'var(--text-secondary)', 
          fontSize: '14px',
          fontWeight: '400'
        }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"} {' '}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ 
              color: 'var(--text-primary)', 
              cursor: 'pointer', 
              fontWeight: '600',
              textDecoration: 'underline',
              textUnderlineOffset: '3px'
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
