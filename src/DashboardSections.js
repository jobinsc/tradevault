import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';

// ============ OVERALL P&L TREND ============
export const OverallPnLTrend = ({ trades = [] }) => {
  const data = useMemo(() => {
    const closed = trades.filter(t => t.status === 'closed' && t.exitDate)
      .sort((a, b) => a.exitDate.localeCompare(b.exitDate));
    
    let intraday = 0, swing = 0, positional = 0, overall = 0;
    const map = {};
    
    closed.forEach(t => {
      const date = format(parseISO(t.exitDate), 'dd MMM');
      const pnl = Number(t.pnl) || 0;
      
      if (['scalp', 'intraday'].includes(t.tradeType)) intraday += pnl;
      else if (['swing', 'btst'].includes(t.tradeType)) swing += pnl;
      else positional += pnl;
      
      overall += pnl;
      map[date] = { date, intraday, swing, positional, overall };
    });
    
    return Object.values(map).slice(-30);
  }, [trades]);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginBottom: 'var(--space-xl)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
            📊 Overall P&L Trend
          </h3>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            Positional + Swing + Intraday Combined
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <LegendDot color="#F59E0B" label="Intraday" />
          <LegendDot color="#10B981" label="Swing" />
          <LegendDot color="#3B82F6" label="Positional" />
          <LegendDot color="#8B5CF6" label="Overall" />
        </div>
      </div>
      
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <Tooltip 
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
            <Line type="monotone" dataKey="intraday" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="swing" stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="positional" stroke="#3B82F6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="overall" stroke="#8B5CF6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No closed trades yet
        </div>
      )}
    </div>
  );
};

// ============ TRADING SECTION ============
export const TradingSection = ({ 
  title, icon, color, trades = [], capital = 100000, categoryTypes = []
}) => {
  const [expanded, setExpanded] = useState(true);
  
  const filteredTrades = useMemo(() => 
    trades.filter(t => categoryTypes.includes(t.tradeType)),
    [trades, categoryTypes]
  );

  const stats = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed');
    const open = filteredTrades.filter(t => t.status === 'open');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const losses = closed.filter(t => Number(t.pnl) < 0);
    
    const realizedPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const capitalDeployed = open.reduce((s, t) => s + (Number(t.entryPrice) * Number(t.quantity) || 0), 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + Number(t.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0) / losses.length) : 0;
    const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const roi = capital > 0 ? (realizedPnL / capital) * 100 : 0;
    const aum = capitalDeployed;
    
    const avgProfitPct = wins.length > 0 
      ? wins.reduce((s, t) => s + ((Number(t.pnl) / (Number(t.entryPrice) * Number(t.quantity))) * 100), 0) / wins.length 
      : 0;
    const avgLossPct = losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + ((Number(t.pnl) / (Number(t.entryPrice) * Number(t.quantity))) * 100), 0) / losses.length)
      : 0;
    
    return {
      closedCount: closed.length, openCount: open.length,
      winsCount: wins.length, lossesCount: losses.length,
      capitalDeployed, realizedPnL, winRate, rrRatio, aum, roi,
      avgProfitPct, avgLossPct,
    };
  }, [filteredTrades, capital]);

  const yearlyData = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed' && t.exitDate);
    const map = {};
    closed.forEach(t => {
      const year = t.exitDate.substring(0, 4);
      if (!map[year]) map[year] = 0;
      map[year] += Number(t.pnl) || 0;
    });
    return Object.entries(map).map(([year, pnl]) => ({
      year, pnl: Math.round(pnl),
      fill: pnl >= 0 ? color : '#EF4444',
    }));
  }, [filteredTrades, color]);

  const bestWorstTrades = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed');
    const sorted = [...closed].sort((a, b) => Number(b.pnl) - Number(a.pnl));
    return { best: sorted.slice(0, 3), worst: sorted.slice(-3).reverse() };
  }, [filteredTrades]);

  const fmt = (v) => Math.round(v || 0).toLocaleString('en-IN');

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${color}30`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginBottom: 'var(--space-xl)',
    }}>
      <div 
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: expanded ? 'var(--space-lg)' : 0, cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color }}>
            {title}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ padding: '4px 10px', background: `${color}20`, color, borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 'var(--font-bold)' }}>
            {stats.closedCount} Closed
          </span>
          <span style={{ padding: '4px 10px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 'var(--font-bold)' }}>
            {stats.openCount} Open
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {expanded && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
          }}>
            <MiniCard label="Capital Deployed" value={`₹${fmt(stats.capitalDeployed)}`} subtitle={`Incl. gains: ₹${fmt(stats.capitalDeployed + stats.realizedPnL)}`} color={color} />
            <MiniCard label="Realized P&L" value={`${stats.realizedPnL >= 0 ? '+' : ''}₹${fmt(stats.realizedPnL)}`} subtitle={`▲ ROI ${stats.roi.toFixed(2)}%`} color={stats.realizedPnL >= 0 ? '#10B981' : '#EF4444'} />
            <MiniCard label="ROI %" value={`${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(2)}%`} subtitle="Return on capital" color={stats.roi >= 0 ? '#10B981' : '#EF4444'} />
            <MiniCard label="AUM" value={`₹${fmt(stats.aum)}`} subtitle="Incl. open P&L" color="#8B5CF6" />
          </div>

          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)', letterSpacing: 1, marginBottom: 'var(--space-sm)' }}>
              PERFORMANCE METRICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
              <MetricBox label="Batting Avg" value={`${stats.winRate.toFixed(2)}%`} />
              <MetricBox label="Win-Loss Ratio" value={stats.rrRatio.toFixed(2)} />
              <MetricBox label="ROI %" value={`${stats.roi.toFixed(2)}%`} />
              <MetricBox label="Avg Profit %" value={`+${stats.avgProfitPct.toFixed(2)}%`} color="#10B981" />
              <MetricBox label="Avg Lose %" value={`${stats.avgLossPct.toFixed(2)}%`} color="#EF4444" />
              <MetricBox label="Total Trades" value={stats.closedCount + stats.openCount} />
            </div>
          </div>

          <div style={{
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, marginBottom: 'var(--space-lg)',
          }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: 'var(--font-semibold)' }}>
              🟢 {stats.winsCount} Wins
            </span>
            <span style={{ color: 'var(--accent-red)', fontWeight: 'var(--font-semibold)' }}>
              🔴 {stats.lossesCount} Losses
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)', letterSpacing: 1, marginBottom: 'var(--space-sm)' }}>
                YEARLY P&L TREND
              </div>
              {yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={yearlyData}>
                    <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', fontSize: 12 }} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {yearlyData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No closed trades yet
                </div>
              )}
            </div>

            <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)', letterSpacing: 1, marginBottom: 'var(--space-sm)' }}>
                BEST & WORST TRADES
              </div>
              {bestWorstTrades.best.length > 0 ? (
                <div style={{ fontSize: 12 }}>
                  <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>🏆 Best: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{bestWorstTrades.best[0]?.symbol}</span>
                    </span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                      +₹{fmt(bestWorstTrades.best[0]?.pnl)}
                    </span>
                  </div>
                  {bestWorstTrades.worst[0] && Number(bestWorstTrades.worst[0].pnl) < 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>💔 Worst: </span>
                        <span style={{ color: 'var(--text-primary)' }}>{bestWorstTrades.worst[0]?.symbol}</span>
                      </span>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>
                        ₹{fmt(bestWorstTrades.worst[0]?.pnl)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No closed trades yet
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============ HELPER COMPONENTS ============
const MiniCard = ({ label, value, subtitle, color }) => (
  <div style={{
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    borderLeft: `3px solid ${color}`,
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)', letterSpacing: 1, marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: 10, color: color, marginTop: 2, fontWeight: 600 }}>
        {subtitle}
      </div>
    )}
  </div>
);

const MetricBox = ({ label, value, color }) => (
  <div style={{
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
      {label}
    </div>
    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: color || 'var(--text-primary)' }}>
      {value}
    </div>
  </div>
);

const LegendDot = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
  </div>
);