import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import PeriodFilter from './PeriodFilter';

const AnalyticsPage = ({ 
  trades = [], 
  capital = 100000, 
  period = 'all', 
  onPeriodChange, 
  customRange, 
  onCustomRangeChange 
}) => {
  const [activeTab, setActiveTab] = useState('intraday');
  const [pnlView, setPnlView] = useState('daily');

  // Filter trades by tab (Intraday → Swing → Positional)
  const filteredTrades = useMemo(() => {
    if (activeTab === 'intraday') {
      return trades.filter(t => ['scalp', 'intraday'].includes(t.tradeType));
    } else if (activeTab === 'swing') {
      return trades.filter(t => ['swing', 'btst'].includes(t.tradeType));
    } else {
      return trades.filter(t => ['positional', 'delivery', 'investment'].includes(t.tradeType));
    }
  }, [trades, activeTab]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed');
    const open = filteredTrades.filter(t => t.status === 'open');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const losses = closed.filter(t => Number(t.pnl) < 0);
    
    const totalPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const totalCharges = closed.reduce((s, t) => s + (Number(t.charges) || 0), 0);
    const netPnL = totalPnL - totalCharges;
    
    const winRate = closed.length > 0 ? (wins.length / closed.length * 100) : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + Number(t.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0) / losses.length) : 0;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    const grossProfit = wins.reduce((s, t) => s + Number(t.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    const biggestWin = wins.length > 0 ? Math.max(...wins.map(t => Number(t.pnl))) : 0;
    const biggestLoss = losses.length > 0 ? Math.min(...losses.map(t => Number(t.pnl))) : 0;
    
    let peak = capital, maxDD = 0, running = capital;
    closed.forEach(t => {
      running += (Number(t.pnl) || 0) - (Number(t.charges) || 0);
      if (running > peak) peak = running;
      const dd = ((peak - running) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    });
    
    const holdingDays = closed
      .filter(t => t.entryDate && t.exitDate)
      .map(t => differenceInDays(parseISO(t.exitDate), parseISO(t.entryDate)));
    const avgHolding = holdingDays.length > 0 ? holdingDays.reduce((a, b) => a + b, 0) / holdingDays.length : 0;
    
    const roi = capital > 0 ? (netPnL / capital) * 100 : 0;
    
    const avgProfitPct = wins.length > 0 
      ? wins.reduce((s, t) => s + ((Number(t.pnl) / (Number(t.entryPrice) * Number(t.quantity))) * 100), 0) / wins.length 
      : 0;
    const avgLossPct = losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + ((Number(t.pnl) / (Number(t.entryPrice) * Number(t.quantity))) * 100), 0) / losses.length)
      : 0;
    
    const sthpPct = biggestWin > 0 && capital > 0 ? (biggestWin / capital) * 100 : 0;
    const sthlPct = biggestLoss < 0 && capital > 0 ? Math.abs((biggestLoss / capital) * 100) : 0;
    
    return {
      capital, openPositions: open.length, totalTrades: filteredTrades.length,
      winningTrades: wins.length, losingTrades: losses.length,
      winRate, winLossRatio, biggestWin, biggestLoss, avgWin, avgLoss,
      cagr: '—', avgHolding, avgProfitPct, avgLossPct,
      idealAvgProfit: 700, idealAvgLoss: 350, idealStLose: 350,
      totalGain: grossProfit, totalLoss: grossLoss, pnlSum: netPnL,
      profitFactor, maxDD, netPnL, totalCharges, roi, sthpPct, sthlPct,
    };
  }, [filteredTrades, capital]);

  const pnlChartData = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed' && t.exitDate);
    const map = {};
    
    closed.forEach(t => {
      let key;
      const date = parseISO(t.exitDate);
      if (pnlView === 'daily') {
        key = format(date, 'dd MMM');
      } else if (pnlView === 'weekly') {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        key = format(weekStart, 'dd MMM');
      } else {
        key = format(date, 'MMM yyyy');
      }
      
      if (!map[key]) map[key] = 0;
      map[key] += Number(t.pnl) || 0;
    });
    
    return Object.entries(map)
      .slice(-15)
      .map(([label, pnl]) => ({
        label, pnl: Math.round(pnl),
        fill: pnl >= 0 ? '#10B981' : '#EF4444',
      }));
  }, [filteredTrades, pnlView]);

  const winLossData = useMemo(() => {
    return [
      { name: 'Wins', value: metrics.winningTrades, color: '#10B981' },
      { name: 'Losses', value: metrics.losingTrades, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [metrics]);

  const TABS = [
    { id: 'intraday', label: 'Intraday', icon: '⚡' },
    { id: 'swing', label: 'Swing', icon: '🌊' },
    { id: 'positional', label: 'Positional', icon: '📈' },
  ];

  const closedCount = filteredTrades.filter(t => t.status === 'closed').length;

  const fmt = (val) => Math.round(val || 0).toLocaleString('en-IN');
  const fmtPct = (val) => (val || 0).toFixed(2) + '%';

  return (
    <div>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
          }}>
            Analytics
          </h2>
          <p style={{
            margin: '4px 0 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            In-depth performance analysis of your trading activity
          </p>
        </div>

        {/* PERIOD FILTER - NEW! */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <PeriodFilter 
            selectedPeriod={period}
            onPeriodChange={onPeriodChange}
            customRange={customRange}
            onCustomRangeChange={onCustomRangeChange}
          />
          <div style={{
            padding: '8px 14px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-blue)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-bold)',
          }}>
            {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              background: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              border: '1px solid ' + (activeTab === tab.id ? 'var(--accent-blue)' : 'var(--border-subtle)'),
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <span style={{
          marginLeft: 'auto',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
        }}>
          {closedCount} closed trades
        </span>
      </div>

      {/* TOP 4 CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)',
      }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)' }}>Win Rate</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-green-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏆</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>{metrics.winRate.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4, fontWeight: 600 }}>▼ {metrics.winningTrades}W / {metrics.losingTrades}L</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)' }}>Risk : Reward</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎯</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>1 : {metrics.winLossRatio.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Avg win / avg loss</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)' }}>Profit Factor</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-violet-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📈</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>{metrics.profitFactor > 900 ? '∞' : metrics.profitFactor.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Gross profit / loss</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 'var(--font-semibold)' }}>Max Drawdown</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-amber-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚠️</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>{metrics.maxDD.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4, fontWeight: 600 }}>▼ Lowest equity dip</div>
        </div>
      </div>

      {/* PERFORMANCE METRICS TABLE */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-xl)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>Performance Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>REALISED %</span>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: metrics.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {metrics.roi >= 0 ? '+' : ''}{fmtPct(metrics.roi)}
            </span>
          </div>
        </div>

        <div style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm) var(--space-2xl)' }}>
            <MetricRow label="Capital" value={`₹${fmt(metrics.capital)}`} />
            <MetricRow label="Open Positions" value={metrics.openPositions} />
            <MetricRow label="Total Number of Trades" value={metrics.totalTrades} />
            
            <MetricRow label="Winning Trades" value={metrics.winningTrades} />
            <MetricRow label="Losing Trades" value={metrics.losingTrades} />
            <MetricRow label="Trade Win Rate | Batting Avg" value={fmtPct(metrics.winRate)} />
            
            <MetricRow label="Win-to-Loss Ratio" value={metrics.winLossRatio.toFixed(2)} />
            <MetricRow label="STHL (highest loss)" value={`₹${fmt(Math.abs(metrics.biggestLoss))}`} />
            <MetricRow label="Avg Profit / Gain" value={`₹${fmt(metrics.avgWin)}`} />
            
            <MetricRow label="Avg Lose" value={`₹${fmt(metrics.avgLoss)}`} />
            <MetricRow label="STHP (highest profit)" value={`₹${fmt(metrics.biggestWin)}`} />
            <MetricRow label="ROI" value={fmtPct(metrics.roi)} />
            
            <MetricRow label="CAGR" value={metrics.cagr} />
            <MetricRow label="STHP %" value={fmtPct(metrics.sthpPct)} />
            <MetricRow label="STHL %" value={fmtPct(metrics.sthlPct)} />
            
            <MetricRow label="Avg Holding Days" value={metrics.avgHolding.toFixed(1)} />
            <MetricRow label="Average Profit %" value={fmtPct(metrics.avgProfitPct)} />
            <MetricRow label="Average Loss %" value={fmtPct(metrics.avgLossPct)} />
            
            <MetricRow label="Ideal Avg Profit" value={`₹${fmt(metrics.idealAvgProfit)}`} />
            <MetricRow label="Ideal Avg Lose <" value={`₹${fmt(metrics.idealAvgLoss)}`} />
            <MetricRow label="Ideal ST Lose" value={`₹${fmt(metrics.idealStLose)}`} />
            
            <MetricRow label="Total Gain" value={`₹${fmt(metrics.totalGain)}`} highlight="green" />
            <MetricRow label="Total Lose" value={`₹${fmt(metrics.totalLoss)}`} highlight="red" />
            <MetricRow label="P&L SUM" value={`₹${fmt(metrics.pnlSum)}`} highlight={metrics.pnlSum >= 0 ? 'green' : 'red'} />
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                {pnlView === 'daily' ? 'Daily' : pnlView === 'weekly' ? 'Weekly' : 'Monthly'} Realized P&L
              </h3>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                {pnlView === 'daily' ? 'Today: No trades booked' : `Recent ${pnlView} performance`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['daily', 'weekly', 'monthly'].map(v => (
                <button key={v} onClick={() => setPnlView(v)}
                  style={{
                    padding: '6px 12px',
                    background: pnlView === v ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    color: pnlView === v ? '#fff' : 'var(--text-secondary)',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)',
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {pnlChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pnlChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {pnlChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No closed trades in this selection.
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
            Win / Loss Split
          </h3>
          {winLossData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {winLossData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              No closed trades.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, highlight }) => {
  const colorMap = { green: 'var(--accent-green)', red: 'var(--accent-red)' };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: highlight ? colorMap[highlight] : 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
};

export default AnalyticsPage;