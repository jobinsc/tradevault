import React from 'react';
import {
  ScreenerIcon, AIIcon, WatchlistIcon, ImportIcon,
  RulesIcon, ReportsIcon, CalendarIcon
} from './ModernIcons';
import './Layout.css';

const SideNav = ({ currentPage, onPageChange, isAdmin = false }) => {
  
  // ✅ Admin only items
  const adminItems = [
    { id: 'aiAnalysis', label: 'AI Analysis', icon: AIIcon, badge: 'AI' },
    { id: 'screener', label: 'Screener', icon: ScreenerIcon, badge: 'PRO' },
  ];
  
  // ✅ Regular items - matches your existing pages
  const regularItems = [
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
    { id: 'synopsis', label: 'Synopsis', icon: ReportsIcon },
    { id: 'import', label: 'Import CSV', icon: ImportIcon },
    { id: 'rules', label: 'Trading Rules', icon: RulesIcon },
  ];

  return (
    <aside className="tv-sidenav">
      <div className="tv-sidenav-content">
        
        {isAdmin && (
          <>
            <div className="tv-side-section-label">ADMIN TOOLS</div>
            {adminItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  className={`tv-side-item ${isActive ? 'active' : ''}`}
                  onClick={() => onPageChange && onPageChange(item.id)}
                  title={item.label}
                >
                  <span className="tv-side-icon"><Icon size={20} /></span>
                  <span className="tv-side-label">{item.label}</span>
                  {item.badge && <span className="tv-side-badge">{item.badge}</span>}
                </button>
              );
            })}
            <div className="tv-side-divider" />
          </>
        )}
        
        <div className="tv-side-section-label">TOOLS</div>
        {regularItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`tv-side-item ${isActive ? 'active' : ''}`}
              onClick={() => onPageChange && onPageChange(item.id)}
              title={item.label}
            >
              <span className="tv-side-icon"><Icon size={20} /></span>
              <span className="tv-side-label">{item.label}</span>
            </button>
          );
        })}
        
      </div>
    </aside>
  );
};

export default SideNav;