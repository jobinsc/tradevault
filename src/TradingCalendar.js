import React, { useState, useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, getDay, getMonth } from 'date-fns';

const TradingCalendar = ({ trades = [] }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hoveredDay, setHoveredDay] = useState(null);

  const dailyPnL = useMemo(() => {
    const map = {};
    trades.filter(t => t.status === 'closed' && t.exitDate).forEach(t => {
      const date = t.exitDate;
      if (!map[date]) map[date] = { pnl: 0, count: 0 };
      map[date].pnl += Number(t.pnl) || 0;
      map[date].count++;
    });
    return map;
  }, [trades]);

  const yearData = useMemo(() => {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });
    const months = Array.from({ length: 12 }, () => []);
    days.forEach(day => {
      months[getMonth(day)].push(day);
    });
    return months;
  }, [selectedYear]);

  const yearStats = useMemo(() => {
    let totalPnL = 0, tradingDays = 0, winDays = 0, lossDays = 0;
    Object.entries(dailyPnL).forEach(([date, data]) => {
      if (date.startsWith(String(selectedYear))) {
        totalPnL += data.pnl;
        tradingDays++;
        if (data.pnl > 0) winDays++;
        else if (data.pnl < 0) lossDays++;
      }
    });
    return { totalPnL, tradingDays, winDays, lossDays };
  }, [dailyPnL, selectedYear]);

  const getDayStyle = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const data = dailyPnL[dateStr];
    
    // No trade day - visible empty cell
    if (!data || data.count === 0) {
      return {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
      };
    }
    
    const pnl = data.pnl;
    let bg = '#6B7280';
    
    if (pnl > 0) {
      if (pnl > 5000) bg = '#059669';
      else if (pnl > 2000) bg = '#10B981';
      else if (pnl > 500) bg = '#34D399';
      else bg = '#6EE7B7';
    } else if (pnl < 0) {
      if (pnl < -5000) bg = '#DC2626';
      else if (pnl < -2000) bg = '#EF4444';
      else if (pnl < -500) bg = '#F87171';
      else bg = '#FCA5A5';
    }
    
    return {
      background: bg,
      border: '1px solid transparent',
    };
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xl)',
      marginBottom: 'var(--space-xl)',
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span style={{ fontSize: 28 }}>📅</span>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              fontWeight: 700,
              color: 'var(--text-primary)' 
            }}>
              Trading Calendar
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Daily P&L heatmap • {yearStats.tradingDays} trading days
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            ‹
          </button>
          <div style={{
            padding: '8px 20px',
            background: 'var(--accent-blue-glow)',
            border: '1px solid var(--accent-blue)',
            borderRadius: 8,
            color: 'var(--accent-blue)',
            fontWeight: 700,
            fontSize: 14,
          }}>
            {selectedYear}
          </div>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= currentYear}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              color: selectedYear >= currentYear ? '#475569' : 'var(--text-secondary)',
              cursor: selectedYear >= currentYear ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: 'Year P&L', value: `${yearStats.totalPnL >= 0 ? '+' : ''}₹${Math.round(yearStats.totalPnL).toLocaleString('en-IN')}`, color: yearStats.totalPnL >= 0 ? '#10B981' : '#EF4444' },
          { label: 'Trading Days', value: yearStats.tradingDays, color: '#3B82F6' },
          { label: 'Winning Days', value: yearStats.winDays, color: '#10B981' },
          { label: 'Losing Days', value: yearStats.lossDays, color: '#EF4444' },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: 14,
            background: 'var(--bg-tertiary)',
            borderRadius: 8,
            borderLeft: `3px solid ${stat.color}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {yearData.map((monthDays, monthIdx) => {
          const firstDay = monthDays[0];
          const startDayOfWeek = (getDay(firstDay) + 6) % 7;
          const emptyCells = Array(startDayOfWeek).fill(null);

          let monthPnL = 0;
          monthDays.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            if (dailyPnL[dateStr]) monthPnL += dailyPnL[dateStr].pnl;
          });

          return (
            <div key={monthIdx} style={{
              padding: 14,
              background: 'var(--bg-tertiary)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}>
              {/* Month Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {MONTHS[monthIdx]}
                </div>
                {monthPnL !== 0 && (
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: monthPnL >= 0 ? '#10B981' : '#EF4444',
                  }}>
                    {monthPnL >= 0 ? '+' : ''}₹{Math.abs(Math.round(monthPnL)).toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              {/* Day labels */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                marginBottom: 6,
              }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    fontWeight: 700,
                    padding: '2px 0',
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid - FIXED with proper sizing */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
              }}>
                {emptyCells.map((_, i) => (
                  <div 
                    key={`e-${i}`} 
                    style={{ 
                      width: '100%',
                      paddingBottom: '100%',
                      position: 'relative',
                    }} 
                  />
                ))}
                {monthDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const data = dailyPnL[dateStr];
                  const hasData = data && data.count > 0;
                  const isHovered = hoveredDay === dateStr;
                  const dayStyle = getDayStyle(day);

                  return (
                    <div
                      key={dateStr}
                      onMouseEnter={() => setHoveredDay(dateStr)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{
                        width: '100%',
                        paddingBottom: '100%',
                        position: 'relative',
                        cursor: hasData ? 'pointer' : 'default',
                      }}
                      title={hasData 
                        ? `${format(day, 'dd MMM yyyy')}\nP&L: ₹${Math.round(data.pnl).toLocaleString('en-IN')}\nTrades: ${data.count}` 
                        : format(day, 'dd MMM yyyy')}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: dayStyle.background,
                        border: isHovered ? '2px solid #F9FAFB' : dayStyle.border,
                        borderRadius: 3,
                        transition: 'all 0.15s',
                        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                        zIndex: isHovered ? 10 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        color: hasData ? '#fff' : 'var(--text-dim)',
                      }}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEGEND */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
        padding: 12,
        background: 'var(--bg-tertiary)',
        borderRadius: 8,
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          Loss
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {['#DC2626', '#EF4444', '#F87171', '#FCA5A5'].map(c => (
            <div key={c} style={{ width: 14, height: 14, background: c, borderRadius: 2 }} />
          ))}
          <div style={{ width: 14, height: 14, background: 'rgba(148, 163, 184, 0.08)', borderRadius: 2, border: '1px solid rgba(148, 163, 184, 0.15)' }} />
          {['#6EE7B7', '#34D399', '#10B981', '#059669'].map(c => (
            <div key={c} style={{ width: 14, height: 14, background: c, borderRadius: 2 }} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          Profit
        </div>
      </div>
    </div>
  );
};

export default TradingCalendar;