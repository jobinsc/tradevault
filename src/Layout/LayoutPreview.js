import React, { useState } from 'react';
import Layout from './Layout';
import '../styles/designSystem.css';

const LayoutPreview = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  
  const mockUser = {
    email: 'jobinsc@gmail.com',
    displayName: 'Jobin SC',
    photoURL: null
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    console.log('Page changed to:', page);
  };
  
  const handleLogout = () => {
    alert('Sign out clicked! (Just a test)');
  };
  
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  return (
    <Layout
      currentPage={currentPage}
      onPageChange={handlePageChange}
      user={mockUser}
      onLogout={handleLogout}
      theme={theme}
      onThemeToggle={handleThemeToggle}
      isAdmin={true}
    >
      <div style={{ padding: '20px' }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: 'var(--text-4xl)', 
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            🎉 New UI Preview!
          </h1>
          
          <p style={{ 
            fontSize: 'var(--text-md)', 
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            Current page: <strong style={{ color: 'var(--accent-blue)' }}>{currentPage}</strong>
          </p>
          
          <div style={{
            padding: '20px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px'
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>✨ Try These:</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <li>👆 Click menu items in <strong>TOP NAV</strong></li>
              <li>🖱️ <strong>Hover LEFT SIDEBAR</strong> - watch it expand!</li>
              <li>🌓 Click <strong>Light/Dark toggle</strong></li>
              <li>👤 Click your <strong>user avatar</strong></li>
              <li>🕐 Watch <strong>live clock</strong></li>
            </ul>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {[
              { label: 'Intraday', color: 'var(--cat-intraday)', icon: '⚡' },
              { label: 'Swing', color: 'var(--cat-swing)', icon: '📊' },
              { label: 'Positional', color: 'var(--cat-positional)', icon: '📈' },
              { label: 'ETF', color: 'var(--cat-etf)', icon: '💼' },
              { label: 'Mutual Fund', color: 'var(--cat-mutual)', icon: '🎯' },
            ].map(cat => (
              <div key={cat.label} style={{
                padding: '20px',
                background: 'var(--bg-tertiary)',
                border: `1px solid ${cat.color}33`,
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${cat.color}`
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{cat.icon}</div>
                <div style={{ 
                  fontSize: 'var(--text-sm)', 
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}>
                  {cat.label}
                </div>
                <div style={{ 
                  fontSize: 'var(--text-xl)', 
                  fontWeight: 'var(--font-bold)',
                  color: cat.color 
                }}>
                  Coming Soon
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LayoutPreview;