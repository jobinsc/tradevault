import React, { useState, useEffect, useRef } from 'react';
import {
  DashboardIcon, AnalyticsIcon, PositionsIcon, TrackIcon,
  CalculatorIcon, SettingsIcon, SunIcon, MoonIcon, ClockIcon,
  LogoutIcon, ChevronDownIcon
} from './ModernIcons';
import './Layout.css';

const TopNav = ({ 
  currentPage = 'dashboard',
  onPageChange,
  user,
  onLogout,
  theme = 'dark',
  onThemeToggle
}) => {
  const [time, setTime] = useState(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  };

  // ✅ YOUR MENU - matches your existing pages
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'analytics', label: 'Analysis', icon: AnalyticsIcon },
    { id: 'portfolio', label: 'Portfolio', icon: PositionsIcon },
    { id: 'trades', label: 'Trades', icon: TrackIcon },
    { id: 'intradayZone', label: 'Intraday', icon: CalculatorIcon }
  ];

  const getUserInitial = () => {
    if (!user) return 'U';
    return (user.displayName || user.email || 'U').charAt(0).toUpperCase();
  };

  const getUserName = () => {
    if (!user) return 'Guest';
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  return (
    <nav className="tv-topnav">
      <div className="tv-topnav-left">
        <div className="tv-logo">
          <div className="tv-logo-icon-original">
            📊
          </div>
          <div className="tv-logo-text-container">
            <div className="tv-logo-text">TradeVault</div>
            <div className="tv-logo-subtitle">Pro Journal</div>
          </div>
        </div>
      </div>

      <div className="tv-topnav-center">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`tv-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onPageChange && onPageChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
        
        <button
          className={`tv-nav-icon-btn ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => onPageChange && onPageChange('settings')}
          title="Settings"
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      <div className="tv-topnav-right">
        <div className="tv-clock">
          <ClockIcon size={14} />
          <span>{formatTime(time)}</span>
        </div>

        <button className="tv-theme-toggle" onClick={onThemeToggle}>
          {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <div className="tv-user-menu" ref={userMenuRef}>
          <button className="tv-user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="tv-user-avatar">{getUserInitial()}</div>
            <span className="tv-user-name">{getUserName()}</span>
            <ChevronDownIcon size={14} className={`tv-chevron ${userMenuOpen ? 'open' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="tv-user-dropdown animate-slide-down">
              <div className="tv-dropdown-header">
                <div className="tv-user-avatar large">{getUserInitial()}</div>
                <div className="tv-dropdown-userinfo">
                  <div className="tv-dropdown-name">{getUserName()}</div>
                  <div className="tv-dropdown-email">{user?.email}</div>
                </div>
              </div>
              
              <div className="tv-dropdown-divider" />
              <div className="tv-dropdown-label">SIGNED IN AS</div>
              <div className="tv-dropdown-email-full">{user?.email}</div>
              <div className="tv-dropdown-divider" />
              
              <button 
                className="tv-dropdown-item tv-dropdown-danger"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout && onLogout();
                }}
              >
                <LogoutIcon size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;