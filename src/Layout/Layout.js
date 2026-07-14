import React from 'react';
import TopNav from './TopNav';
import SideNav from './SideNav';
import './Layout.css';

const Layout = ({ 
  children, currentPage, onPageChange, user, onLogout,
  theme, onThemeToggle, isAdmin = false
}) => {
  return (
    <div className="tv-app-layout">
      <TopNav
        currentPage={currentPage}
        onPageChange={onPageChange}
        user={user}
        onLogout={onLogout}
        theme={theme}
        onThemeToggle={onThemeToggle}
      />
      
      <SideNav
        currentPage={currentPage}
        onPageChange={onPageChange}
        isAdmin={isAdmin}
      />
      
      <main className="tv-main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;