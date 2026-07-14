import React, { useState, useRef, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';

const PeriodFilter = ({ selectedPeriod = 'all', onPeriodChange, customRange, onCustomRangeChange }) => {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(customRange?.start || '');
  const [customEnd, setCustomEnd] = useState(customRange?.end || '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentFY = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Financial year in India: April to March
    if (month >= 3) return { start: year, end: year + 1 };
    return { start: year - 1, end: year };
  };

  const currentFY = getCurrentFY();
  const prevFY = { start: currentFY.start - 1, end: currentFY.end - 1 };

  const periods = [
    { id: 'all', label: 'All time' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
    { id: 'ytd', label: 'This year (YTD)' },
    { id: `fy-${currentFY.start}-${String(currentFY.end).slice(-2)}`, label: `FY ${currentFY.start}-${String(currentFY.end).slice(-2)}` },
    { id: `fy-${prevFY.start}-${String(prevFY.end).slice(-2)}`, label: `FY ${prevFY.start}-${String(prevFY.end).slice(-2)}` },
  ];

  const getLabel = () => {
    if (selectedPeriod === 'custom') return 'Custom';
    const p = periods.find(x => x.id === selectedPeriod);
    return p ? p.label : 'All time';
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onCustomRangeChange && onCustomRangeChange({ start: customStart, end: customEnd });
      onPeriodChange && onPeriodChange('custom');
      setOpen(false);
    } else {
      alert('Please select both start and end dates');
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '8px 14px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        📅 {getLabel()}
        <span style={{ 
          fontSize: 10, 
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: 260,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--space-sm)',
          zIndex: 1000,
        }}>
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => {
                onPeriodChange && onPeriodChange(p.id);
                setOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: selectedPeriod === p.id ? 'var(--accent-blue-glow)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: selectedPeriod === p.id ? 'var(--accent-blue)' : 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: selectedPeriod === p.id ? 'var(--font-bold)' : 'var(--font-medium)',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {selectedPeriod === p.id && <span style={{ fontSize: 10 }}>●</span>}
              {p.label}
            </button>
          ))}

          {/* Custom Range */}
          <div style={{
            marginTop: 'var(--space-sm)',
            paddingTop: 'var(--space-sm)',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 8,
              padding: '0 6px',
            }}>
              Custom range
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 6px', marginBottom: 8 }}>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
              />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
              />
            </div>

            <button
              onClick={handleApplyCustom}
              style={{
                width: 'calc(100% - 12px)',
                margin: '0 6px',
                padding: '8px',
                background: 'var(--accent-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                fontWeight: 'var(--font-bold)',
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to filter trades by period
export const filterTradesByPeriod = (trades, period, customRange) => {
  if (!period || period === 'all') return trades;
  
  const now = new Date();
  
  return trades.filter(t => {
    const dateStr = t.exitDate || t.entryDate;
    if (!dateStr) return false;
    const d = parseISO(dateStr);
    
    if (period === 'week') {
      const ws = startOfWeek(now, { weekStartsOn: 1 });
      const we = endOfWeek(now, { weekStartsOn: 1 });
      return isWithinInterval(d, { start: ws, end: we });
    } 
    else if (period === 'month') {
      return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
    } 
    else if (period === 'ytd') {
      return isWithinInterval(d, { start: startOfYear(now), end: endOfYear(now) });
    } 
    else if (period.startsWith('fy-')) {
      // fy-2025-26 format
      const parts = period.split('-');
      const startYear = parseInt(parts[1]);
      const fyStart = new Date(startYear, 3, 1); // April 1
      const fyEnd = new Date(startYear + 1, 2, 31); // March 31
      return isWithinInterval(d, { start: fyStart, end: fyEnd });
    }
    else if (period === 'custom' && customRange?.start && customRange?.end) {
      const start = parseISO(customRange.start);
      const end = parseISO(customRange.end);
      return isWithinInterval(d, { start, end });
    }
    
    return true;
  });
};

export default PeriodFilter;