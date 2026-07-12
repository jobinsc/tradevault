import React, { useMemo } from 'react';
import { format, parseISO, isToday, isYesterday, subDays, startOfDay, differenceInMinutes } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Format helpers
const fmt = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const fmtWithSign = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const num = Number(val);
  const sign = num >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

function IntradayZone({ trades, capital, livePrices, onSymbolClick }) {
  // Filter only intraday trades
  const intradayTrades = useMemo(() => {
    return trades.filter(t => t.tradeType === 'intraday' || t.tradeType === 'scalp');
  }, [trades]);

  // Today's intraday trades
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const todayTrades = useMemo(() => {
    return intradayTrades.filter(t => t.entryDate === todayStr);
  }, [intradayTrades, todayStr]);

  const yesterdayTrades = useMemo(() => {
    return intradayTrades.filter(t => t.entryDate === yesterdayStr);
  }, [intradayTrades, yesterdayStr]);

  const openPositions = useMemo(() => {
    return intradayTrades.filter(t => t.status === 'open');
  }, [intradayTrades]);

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const closed = todayTrades.filter(t => t.status === 'closed');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const totalPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const totalCharges = closed.reduce((s, t) => s + (Number(t.charges) || 0), 0);
    const netPnL = totalPnL - totalCharges;
    const winRate = closed.length > 0 ? (wins.length / closed.length * 100) : 0;
    
    return {
      total: todayTrades.length,
      closed: closed.length,
      open: todayTrades.length - closed.length,
      wins: wins.length,
      losses: closed.length - wins.length,
      pnl: totalPnL,
      netPnL,
      charges: totalCharges,
      winRate,
      avgPnL: closed.length > 0 ? totalPnL / closed.length : 0,
    };
  }, [todayTrades]);

  // Yesterday's stats for comparison
  const yesterdayStats = useMemo(() => {
    const closed = yesterdayTrades.filter(t => t.status === 'closed');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const totalPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length * 100) : 0;
    
    return {
      total: yesterdayTrades.length,
      pnl: totalPnL,
      winRate,
    };
  }, [yesterdayTrades]);

  // Session-wise performance (Morning/Mid-day/Afternoon)
  const sessionData = useMemo(() => {
    const sessions = {
      Morning: { name: 'Morning (9:15-11:00)', pnl: 0, count: 0, wins: 0 },
      Midday: { name: 'Mid-day (11:00-13:30)', pnl: 0, count: 0, wins: 0 },
      Afternoon: { name: 'Afternoon (13:30-15:30)', pnl: 0, count: 0, wins: 0 },
      Unknown: { name: 'Unknown Time', pnl: 0, count: 0, wins: 0 },
    };
    
    const closed = intradayTrades.filter(t => t.status === 'closed' && t.entryTime);
    closed.forEach(t => {
      const time = t.entryTime;
      const hour = parseInt(time.split(':')[0]);
      const minute = parseInt(time.split(':')[1] || 0);
      const totalMinutes = hour * 60 + minute;
      
      let session;
      if (totalMinutes >= 555 && totalMinutes < 660) session = 'Morning'; // 9:15-11:00
      else if (totalMinutes >= 660 && totalMinutes < 810) session = 'Midday'; // 11:00-13:30
      else if (totalMinutes >= 810 && totalMinutes <= 930) session = 'Afternoon'; // 13:30-15:30
      else session = 'Unknown';
      
      sessions[session].pnl += Number(t.pnl) || 0;
      sessions[session].count++;
      if (Number(t.pnl) > 0) sessions[session].wins++;
    });
    
    return Object.values(sessions).map(s => ({
      ...s,
      pnl: Math.round(s.pnl),
      winRate: s.count > 0 ? Math.round(s.wins / s.count * 100) : 0,
    }));
  }, [intradayTrades]);

  // Last 7 days intraday trend
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTrades = intradayTrades.filter(t => 
        t.status === 'closed' && t.exitDate === dateStr
      );
      const pnl = dayTrades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
      days.push({
        date: format(date, 'dd MMM'),
        pnl: Math.round(pnl),
        count: dayTrades.length,
        fill: pnl >= 0 ? '#10b981' : '#ef4444',
      });
    }
    return days;
  }, [intradayTrades]);

  // Symbol frequency (most traded)
  const topSymbols = useMemo(() => {
    const symbolMap = {};
    intradayTrades.filter(t => t.status === 'closed').forEach(t => {
      if (!symbolMap[t.symbol]) {
        symbolMap[t.symbol] = { symbol: t.symbol, count: 0, pnl: 0, wins: 0 };
      }
      symbolMap[t.symbol].count++;
      symbolMap[t.symbol].pnl += Number(t.pnl) || 0;
      if (Number(t.pnl) > 0) symbolMap[t.symbol].wins++;
    });
    return Object.values(symbolMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(s => ({
        ...s,
        winRate: s.count > 0 ? Math.round(s.wins / s.count * 100) : 0,
      }));
  }, [intradayTrades]);

  // Overall intraday stats
  const overallStats = useMemo(() => {
    const closed = intradayTrades.filter(t => t.status === 'closed');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const totalPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const charges = closed.reduce((s, t) => s + (Number(t.charges) || 0), 0);
    const durations = closed
      .filter(t => t.entryTime && t.exitTime)
      .map(t => {
        try {
          const entry = parseISO(`${t.entryDate}T${t.entryTime}`);
          const exit = parseISO(`${t.exitDate || t.entryDate}T${t.exitTime}`);
          return differenceInMinutes(exit, entry);
        } catch { return 0; }
      });
    const avgDuration = durations.length > 0 ? 
      Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : 0;
    
    return {
      total: intradayTrades.length,
      closed: closed.length,
      totalPnL,
      netPnL: totalPnL - charges,
      charges,
      winRate: closed.length > 0 ? (wins.length / closed.length * 100) : 0,
      avgDuration,
    };
  }, [intradayTrades]);

  // Comparison values
  const pnlChange = todayStats.pnl - yesterdayStats.pnl;
  const winRateChange = todayStats.winRate - yesterdayStats.winRate;

  return (
    <div>
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>⚡ INTRADAY ZONE</h1>
            <p style={{ fontSize: 13, margin: '4px 0 0 0', opacity: 0.9 }}>
              Real-time intraday trading dashboard • {format(new Date(), 'EEEE, dd MMMM yyyy')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>Total Intraday Trades</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{overallStats.total}</div>
          </div>
        </div>
      </div>

      {/* NO DATA MESSAGE */}
      {intradayTrades.length === 0 && (
        <div style={{
          padding: 60,
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚡</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No Intraday Trades Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Add trades with Trade Type = "Intraday" or "Scalp" to see analytics here
          </p>
        </div>
      )}

      {intradayTrades.length > 0 && (
        <>
          {/* TODAY'S STATS */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
              📅 TODAY'S PERFORMANCE
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: 12 
            }}>
              <StatCard 
                label="Today's P&L" 
                value={fmtWithSign(todayStats.netPnL)}
                color={todayStats.netPnL >= 0 ? '#10b981' : '#ef4444'}
                icon="💰"
                subtitle={`vs yesterday: ${fmtWithSign(pnlChange)}`}
                subtitleColor={pnlChange >= 0 ? '#10b981' : '#ef4444'}
              />
              <StatCard 
                label="Trades Today" 
                value={todayStats.total}
                color="#3b82f6"
                icon="📊"
                subtitle={`${todayStats.closed} closed, ${todayStats.open} open`}
              />
              <StatCard 
                label="Win Rate" 
                value={`${todayStats.winRate.toFixed(1)}%`}
                color={todayStats.winRate >= 50 ? '#10b981' : '#ef4444'}
                icon="🎯"
                subtitle={`${todayStats.wins}W / ${todayStats.losses}L`}
              />
              <StatCard 
                label="Avg P&L per Trade" 
                value={fmtWithSign(todayStats.avgPnL)}
                color={todayStats.avgPnL >= 0 ? '#10b981' : '#ef4444'}
                icon="📈"
                subtitle={`Charges: ₹${fmt(todayStats.charges)}`}
              />
            </div>
          </div>

          {/* YESTERDAY VS TODAY */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Today vs Yesterday</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ComparisonBox 
                label="Yesterday" 
                pnl={yesterdayStats.pnl}
                trades={yesterdayStats.total}
                winRate={yesterdayStats.winRate}
                isToday={false}
              />
              <ComparisonBox 
                label="Today" 
                pnl={todayStats.netPnL}
                trades={todayStats.total}
                winRate={todayStats.winRate}
                isToday={true}
              />
            </div>
          </div>

          {/* OPEN POSITIONS WITH LIVE P&L */}
          {openPositions.length > 0 && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              border: '2px solid #f59e0b',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                🔴 LIVE Open Positions ({openPositions.length})
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: 12 
              }}>
                {openPositions.map(t => {
                  const currentPrice = livePrices?.[t.symbol?.toUpperCase()]?.price;
                  const livePnL = currentPrice ? 
                    (t.direction === 'long' 
                      ? (currentPrice - Number(t.entryPrice)) * Number(t.quantity)
                      : (Number(t.entryPrice) - currentPrice) * Number(t.quantity)
                    ) : 0;
                  const isProfit = livePnL >= 0;
                  
                  return (
                    <div 
                      key={t.id}
                      onClick={() => onSymbolClick && onSymbolClick(t.symbol)}
                      style={{
                        padding: 14,
                        background: 'var(--bg-input)',
                        borderRadius: 10,
                        border: `1px solid ${isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{t.symbol}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {t.direction} • {t.quantity} qty
                          </div>
                        </div>
                        {currentPrice && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>₹{currentPrice.toFixed(2)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Live</div>
                          </div>
                        )}
                      </div>
                      <div style={{ 
                        padding: 10, 
                        background: isProfit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        borderRadius: 6,
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Live P&L</div>
                        <div style={{ 
                          fontSize: 18, 
                          fontWeight: 800,
                          color: isProfit ? '#10b981' : '#ef4444',
                        }}>
                          {currentPrice ? fmtWithSign(livePnL) : '⏳ Loading...'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SESSION-WISE PERFORMANCE */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              🕐 Session-wise Performance (All Time)
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 12 
            }}>
              {sessionData.map(s => (
                <div key={s.name} style={{
                  padding: 16,
                  background: 'var(--bg-input)',
                  borderRadius: 10,
                  border: `1px solid ${s.pnl >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ 
                    fontSize: 22, 
                    fontWeight: 800,
                    color: s.pnl >= 0 ? '#10b981' : '#ef4444',
                  }}>
                    {fmtWithSign(s.pnl)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {s.count} trades • WR: {s.winRate}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LAST 7 DAYS CHART */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              📈 Last 7 Days Intraday Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }}
                />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {last7Days.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TOP TRADED SYMBOLS */}
          {topSymbols.length > 0 && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              border: '1px solid var(--border-color)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                🏆 Most Traded Symbols (Intraday)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topSymbols.map((s, i) => (
                  <div 
                    key={s.symbol}
                    onClick={() => onSymbolClick && onSymbolClick(s.symbol)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 14,
                      background: 'var(--bg-input)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      border: `1px solid ${s.pnl >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        background: 'var(--accent-blue)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{s.symbol}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {s.count} trades • WR: {s.winRate}%
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 800,
                      color: s.pnl >= 0 ? '#10b981' : '#ef4444',
                    }}>
                      {fmtWithSign(s.pnl)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OVERALL INTRADAY STATS */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
            borderRadius: 16,
            padding: 20,
            border: '1px solid var(--border-color)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              📊 Overall Intraday Statistics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: 12 
            }}>
              <MiniStat label="Total Trades" value={overallStats.total} />
              <MiniStat label="Closed" value={overallStats.closed} />
              <MiniStat 
                label="Net P&L" 
                value={fmtWithSign(overallStats.netPnL)}
                color={overallStats.netPnL >= 0 ? '#10b981' : '#ef4444'}
              />
              <MiniStat 
                label="Win Rate" 
                value={`${overallStats.winRate.toFixed(1)}%`}
                color={overallStats.winRate >= 50 ? '#10b981' : '#ef4444'}
              />
              <MiniStat label="Total Charges" value={`₹${fmt(overallStats.charges)}`} color="#ef4444" />
              <MiniStat 
                label="Avg Duration" 
                value={overallStats.avgDuration > 60 
                  ? `${Math.floor(overallStats.avgDuration/60)}h ${overallStats.avgDuration%60}m` 
                  : `${overallStats.avgDuration}m`
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ label, value, color, icon, subtitle, subtitleColor }) {
  return (
    <div style={{
      padding: 16,
      background: 'var(--bg-card)',
      borderRadius: 12,
      border: '1px solid var(--border-color)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ 
          fontSize: 11, 
          color: subtitleColor || 'var(--text-muted)',
          fontWeight: 600,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ComparisonBox({ label, pnl, trades, winRate, isToday }) {
  return (
    <div style={{
      padding: 16,
      background: isToday ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))' : 'var(--bg-input)',
      borderRadius: 12,
      border: isToday ? '2px solid #f59e0b' : '1px solid var(--border-color)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {isToday && '🔴 '}{label}
      </div>
      <div style={{ 
        fontSize: 24, 
        fontWeight: 800,
        color: pnl >= 0 ? '#10b981' : '#ef4444',
        marginBottom: 8,
      }}>
        {fmtWithSign(pnl)}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{trades} trades</span>
        <span>•</span>
        <span>WR: {winRate.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      padding: 12,
      background: 'var(--bg-input)',
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

export default IntradayZone;