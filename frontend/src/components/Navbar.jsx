import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { logout } from '../store/authSlice';
import { LogOut, Sparkles, User } from 'lucide-react';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
  };

  return (
    <nav style={{ width: '100%', left: 0 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        maxWidth: '1340px',
        margin: '0 auto',
        width: '100%',
        padding: '0 20px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            background: 'var(--accent-black)', 
            padding: '12px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Sparkles color="white" size={22} strokeWidth={2.5} />
          </div>
          <h2 style={{ 
            fontSize: '22px', 
            margin: 0, 
            color: 'var(--text-primary)',
            fontWeight: '700',
            letterSpacing: '-0.04em',
            textTransform: 'lowercase'
          }}>
            Zenith
          </h2>
        </div>

        {/* User Section */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '10px 20px',
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <User size={16} strokeWidth={2.5} color="var(--text-secondary)" />
              <span style={{ 
                fontSize: '14px',
                color: 'var(--text-secondary)',
                fontWeight: '600'
              }}>
                {user.email}
              </span>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '10px 24px', 
                background: 'transparent', 
                border: '2px solid var(--accent-black)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: '700',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-black)';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LogOut size={16} strokeWidth={2.5} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
