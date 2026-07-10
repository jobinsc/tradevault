import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  isToday, getDay, startOfWeek, endOfWeek, addMonths, subMonths,
  differenceInDays, differenceInMonths, differenceInYears
} from 'date-fns';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AuthPage from './AuthPage';

// ============ ICONS ============
const Icons = {
  Dashboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Trade: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>,
  Portfolio: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Analytics: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Calendar: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Rules: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Import: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Edit: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Delete: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Eye: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  ChevronLeft: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>,
  Close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Copy: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
};
// ============ ANALYTICS HELPERS ============
const calculateAdvancedMetrics = (trades, capital) => {
  const closed = trades.filter(t => t.status === 'closed');
  if (closed.length === 0) return null;

  const returns = closed.map(t => Number(t.pnl) || 0);
  const wins = returns.filter(r => r > 0);
  const losses = returns.filter(r => r < 0);
  const totalPnL = returns.reduce((s, r) => s + r, 0);
  
  // Expectancy
  const winRate = wins.length / closed.length;
  const lossRate = losses.length / closed.length;
  const avgWin = wins.length > 0 ? wins.reduce((s, r) => s + r, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, r) => s + r, 0) / losses.length) : 0;
  const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
  
  // Standard deviation
  const mean = totalPnL / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Sharpe Ratio (simplified - assumes 0 risk-free rate)
  const sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;
  
  // Sortino Ratio (only downside deviation)
  const downsideReturns = returns.filter(r => r < 0);
  const downsideVariance = downsideReturns.length > 0 ? 
    downsideReturns.reduce((s, r) => s + Math.pow(r, 2), 0) / downsideReturns.length : 0;
  const downsideDev = Math.sqrt(downsideVariance);
  const sortinoRatio = downsideDev > 0 ? (mean / downsideDev) * Math.sqrt(252) : 0;

  // Consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0;
  let currentWins = 0, currentLosses = 0;
  closed.forEach(t => {
    if (Number(t.pnl) > 0) {
      currentWins++;
      currentLosses = 0;
      if (currentWins > maxConsecWins) maxConsecWins = currentWins;
    } else if (Number(t.pnl) < 0) {
      currentLosses++;
      currentWins = 0;
      if (currentLosses > maxConsecLosses) maxConsecLosses = currentLosses;
    }
  });

  // R-multiple (using stop loss if available)
  const rMultiples = closed
    .filter(t => t.stopLoss && t.entryPrice)
    .map(t => {
      const risk = Math.abs(Number(t.entryPrice) - Number(t.stopLoss)) * Number(t.quantity);
      return risk > 0 ? Number(t.pnl) / risk : 0;
    });
  const avgR = rMultiples.length > 0 ? rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length : 0;

  return {
    expectancy, stdDev, sharpeRatio, sortinoRatio,
    maxConsecWins, maxConsecLosses, avgR,
    totalReturn: totalPnL,
    returnPct: (totalPnL / capital) * 100,
  };
};

const getMonthlyPerformance = (trades) => {
  const closed = trades.filter(t => t.status === 'closed' && t.exitDate);
  const monthlyMap = {};
  closed.forEach(t => {
    const month = t.exitDate.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { pnl: 0, count: 0, wins: 0 };
    monthlyMap[month].pnl += Number(t.pnl) || 0;
    monthlyMap[month].count++;
    if (Number(t.pnl) > 0) monthlyMap[month].wins++;
  });
  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: format(parseISO(month + '-01'), 'MMM yy'),
      monthKey: month,
      pnl: Math.round(data.pnl),
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100),
    }));
};

const getDayOfWeekPerformance = (trades) => {
  const closed = trades.filter(t => t.status === 'closed' && t.exitDate);
  const dayMap = { 'Mon': { pnl: 0, count: 0, wins: 0 }, 'Tue': { pnl: 0, count: 0, wins: 0 }, 
                   'Wed': { pnl: 0, count: 0, wins: 0 }, 'Thu': { pnl: 0, count: 0, wins: 0 }, 
                   'Fri': { pnl: 0, count: 0, wins: 0 } };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  closed.forEach(t => {
    const dayIdx = getDay(parseISO(t.exitDate));
    const dayName = dayNames[dayIdx];
    if (dayMap[dayName]) {
      dayMap[dayName].pnl += Number(t.pnl) || 0;
      dayMap[dayName].count++;
      if (Number(t.pnl) > 0) dayMap[dayName].wins++;
    }
  });
  return Object.entries(dayMap).map(([day, data]) => ({
    day,
    pnl: Math.round(data.pnl),
    count: data.count,
    winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
  }));
};

const getSymbolPerformance = (trades) => {
  const closed = trades.filter(t => t.status === 'closed');
  const symbolMap = {};
  closed.forEach(t => {
    const s = t.symbol;
    if (!symbolMap[s]) symbolMap[s] = { pnl: 0, count: 0, wins: 0 };
    symbolMap[s].pnl += Number(t.pnl) || 0;
    symbolMap[s].count++;
    if (Number(t.pnl) > 0) symbolMap[s].wins++;
  });
  return Object.entries(symbolMap)
    .map(([symbol, data]) => ({
      symbol,
      pnl: Math.round(data.pnl),
      count: data.count,
      winRate: Math.round((data.wins / data.count) * 100),
      avgPnL: Math.round(data.pnl / data.count),
    }))
    .sort((a, b) => b.pnl - a.pnl);
};

const getDrawdownData = (trades, capital) => {
  const closed = trades.filter(t => t.status === 'closed' && t.exitDate)
    .sort((a, b) => a.exitDate.localeCompare(b.exitDate));
  let running = capital;
  let peak = capital;
  const data = [];
  closed.forEach(t => {
    running += (Number(t.pnl) || 0) - (Number(t.charges) || 0);
    if (running > peak) peak = running;
    const drawdown = ((peak - running) / peak) * 100;
    data.push({
      date: format(parseISO(t.exitDate), 'dd MMM'),
      capital: Math.round(running),
      drawdown: Math.round(drawdown * 100) / 100,
    });
  });
  return data;
};
// ============ CONSTANTS ============
const TRADE_TYPES = [
  { value: 'scalp', label: '⚡ Scalping' },
  { value: 'intraday', label: '📊 Intraday (MIS)' },
  { value: 'btst', label: '🌙 BTST/STBT' },
  { value: 'swing', label: '🌊 Swing' },
  { value: 'positional', label: '📈 Positional' },
  { value: 'delivery', label: '💎 Delivery/Long-term' },
  { value: 'investment', label: '🏦 Investment (SIP)' },
];

const SEGMENTS = [
  'Equity - Cash', 'Equity - Delivery (CNC)', 'F&O - Futures', 'F&O - Options',
  'Commodity', 'Currency', 'Crypto', 'Mutual Funds', 'ETF', 'Bonds'
];

const STRATEGIES = [
  'Breakout', 'Breakdown', 'Support Bounce', 'Resistance Rejection',
  'Moving Average', 'VWAP', 'Supply/Demand', 'Price Action',
  'Trend Following', 'Mean Reversion', 'Gap Trading', 'Momentum',
  'Value Investing', 'Growth Investing', 'Dividend Investing',
  'Fundamental Analysis', 'Technical Analysis', 'News Based', 'Other'
];

const EMOTIONS = [
  '😎 Confident', '🎯 Focused', '😐 Neutral', '🤔 Uncertain',
  '😰 Fearful', '😨 Anxious', '🤑 Greedy', '😤 Revenge', '🤯 FOMO'
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

// ============ HELPERS ============
const fmtCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const num = Number(val);
  return `₹${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const fmtCurrencyWithSign = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const num = Number(val);
  const sign = num >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const fmtNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN');
};

const getStored = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
};

const setStored = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
};

const getHoldingDuration = (entryDate, exitDate) => {
  if (!entryDate) return '';
  const end = exitDate ? parseISO(exitDate) : new Date();
  const start = parseISO(entryDate);
  const days = differenceInDays(end, start);
  if (days < 1) return 'Same Day';
  if (days === 1) return '1 Day';
  if (days < 30) return `${days} Days`;
  const months = differenceInMonths(end, start);
  if (months < 12) return `${months} Month${months > 1 ? 's' : ''}`;
  const years = differenceInYears(end, start);
  const remainingMonths = months - (years * 12);
  return remainingMonths > 0 ? `${years}Y ${remainingMonths}M` : `${years} Year${years > 1 ? 's' : ''}`;
};

const getTaxCategory = (entryDate, exitDate, segment) => {
  if (!entryDate || !exitDate) return '';
  const days = differenceInDays(parseISO(exitDate), parseISO(entryDate));
  const isEquity = segment?.includes('Equity');
  if (isEquity) {
    return days >= 365 ? 'LTCG (10%)' : 'STCG (15%)';
  }
  return days >= 1095 ? 'LTCG' : 'STCG';
};

// SMART: Calculate P&L automatically
const calculatePnL = (trade) => {
  if (!trade.entryPrice || !trade.exitPrice || !trade.quantity) return 0;
  const e = Number(trade.entryPrice);
  const x = Number(trade.exitPrice);
  const q = Number(trade.quantity);
  return trade.direction === 'long' ? (x - e) * q : (e - x) * q;
};

// SMART: Auto-match buy/sell trades from CSV (Zerodha style)
const autoMatchTrades = (rawTrades) => {
  // Group by symbol
  const grouped = {};
  rawTrades.forEach(t => {
    const key = t.symbol.toUpperCase();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const matched = [];
  
  Object.keys(grouped).forEach(symbol => {
    const trades = grouped[symbol];
    // Sort by date/time
    trades.sort((a, b) => {
      const dateA = a.entryDate + (a.entryTime || '00:00');
      const dateB = b.entryDate + (b.entryTime || '00:00');
      return dateA.localeCompare(dateB);
    });

    const buys = trades.filter(t => t.direction === 'long');
    const sells = trades.filter(t => t.direction === 'short');

    // Try to match buys with sells (FIFO - First In First Out)
    let buyIdx = 0, sellIdx = 0;
    
    while (buyIdx < buys.length && sellIdx < sells.length) {
      const buy = buys[buyIdx];
      const sell = sells[sellIdx];
      const buyQty = Number(buy.quantity);
      const sellQty = Number(sell.quantity);
      
      if (buyQty === sellQty) {
        // Perfect match - create ONE closed trade
        const pnl = (Number(sell.entryPrice) - Number(buy.entryPrice)) * buyQty;
        matched.push({
          ...buy,
          id: uuidv4(),
          exitDate: sell.entryDate,
          exitTime: sell.entryTime,
          exitPrice: sell.entryPrice,
          status: 'closed',
          pnl: Math.round(pnl * 100) / 100,
          direction: 'long',
        });
        buyIdx++;
        sellIdx++;
      } else if (buyQty < sellQty) {
        // Partial: buy is fully closed, sell has remaining
        const pnl = (Number(sell.entryPrice) - Number(buy.entryPrice)) * buyQty;
        matched.push({
          ...buy,
          id: uuidv4(),
          exitDate: sell.entryDate,
          exitTime: sell.entryTime,
          exitPrice: sell.entryPrice,
          status: 'closed',
          pnl: Math.round(pnl * 100) / 100,
          direction: 'long',
        });
        sell.quantity = sellQty - buyQty;
        buyIdx++;
      } else {
        // Partial: sell fully closed, buy has remaining
        const pnl = (Number(sell.entryPrice) - Number(buy.entryPrice)) * sellQty;
        matched.push({
          ...buy,
          id: uuidv4(),
          quantity: sellQty,
          exitDate: sell.entryDate,
          exitTime: sell.entryTime,
          exitPrice: sell.entryPrice,
          status: 'closed',
          pnl: Math.round(pnl * 100) / 100,
          direction: 'long',
        });
        buy.quantity = buyQty - sellQty;
        sellIdx++;
      }
    }

    // Remaining unmatched trades stay OPEN
    while (buyIdx < buys.length) {
      matched.push({ ...buys[buyIdx], id: uuidv4(), status: 'open', pnl: 0 });
      buyIdx++;
    }
    while (sellIdx < sells.length) {
      matched.push({ ...sells[sellIdx], id: uuidv4(), status: 'open', pnl: 0 });
      sellIdx++;
    }
  });

  return matched;
};

// ============ MAIN APP ============
function App() {
  const [trades, setTrades] = useState(() => getStored('tv_trades', []));
  const [capital, setCapital] = useState(() => getStored('tv_capital', 100000));
    // ============ FIREBASE AUTH ============
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await signOut(auth);
    }
  };
  const [rules, setRules] = useState(() => getStored('tv_rules', [
    { id: '1', text: 'Always use stop loss', checked: false },
    { id: '2', text: 'Risk max 2% per trade', checked: false },
    { id: '3', text: 'No revenge trading', checked: false },
    { id: '4', text: 'Follow the trading plan', checked: false },
    { id: '5', text: 'Wait for clear setup', checked: false },
  ]));
  const [page, setPage] = useState('dashboard');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editTrade, setEditTrade] = useState(null);
  const [viewTrade, setViewTrade] = useState(null);
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [calMonth, setCalMonth] = useState(new Date());
  const [msg, setMsg] = useState('');
  const [selectedTrades, setSelectedTrades] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreview, setImportPreview] = useState([]);

  useEffect(() => setStored('tv_trades', trades), [trades]);
  useEffect(() => setStored('tv_capital', capital), [capital]);
  useEffect(() => setStored('tv_rules', rules), [rules]);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  // ============ SMART CALCULATIONS ============
  const stats = useMemo(() => {
    const closed = trades.filter(t => t.status === 'closed');
    const open = trades.filter(t => t.status === 'open');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const losses = closed.filter(t => Number(t.pnl) < 0);
    const totalPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const totalCharges = closed.reduce((s, t) => s + (Number(t.charges) || 0), 0);
    const netPnL = totalPnL - totalCharges;
    const winRate = closed.length > 0 ? (wins.length / closed.length * 100) : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + Number(t.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0) / losses.length) : 0;
    const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
    const biggestWin = wins.length > 0 ? Math.max(...wins.map(t => Number(t.pnl))) : 0;
    const biggestLoss = losses.length > 0 ? Math.min(...losses.map(t => Number(t.pnl))) : 0;
    const currentCap = capital + netPnL;
    const returnPct = capital > 0 ? (netPnL / capital * 100) : 0;
    const grossProfit = wins.reduce((s, t) => s + Number(t.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    let streak = 0, streakType = 'none';
    for (let i = closed.length - 1; i >= 0; i--) {
      const pnl = Number(closed[i].pnl);
      if (i === closed.length - 1) {
        streakType = pnl >= 0 ? 'winning' : 'losing';
        streak = 1;
      } else {
        if ((streakType === 'winning' && pnl >= 0) || (streakType === 'losing' && pnl < 0)) streak++;
        else break;
      }
    }

    let peak = capital, maxDD = 0, running = capital;
    closed.forEach(t => {
      running += (Number(t.pnl) || 0) - (Number(t.charges) || 0);
      if (running > peak) peak = running;
      const dd = ((peak - running) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    });

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayT = closed.filter(t => t.exitDate === today);
    const todayPnL = todayT.reduce((s, t) => s + (Number(t.pnl) || 0), 0);

    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    const we = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weekT = closed.filter(t => {
      if (!t.exitDate) return false;
      const d = parseISO(t.exitDate);
      return d >= ws && d <= we;
    });
    const weekPnL = weekT.reduce((s, t) => s + (Number(t.pnl) || 0), 0);

    const monthKey = format(new Date(), 'yyyy-MM');
    const monthT = closed.filter(t => t.exitDate && t.exitDate.startsWith(monthKey));
    const monthPnL = monthT.reduce((s, t) => s + (Number(t.pnl) || 0), 0);

    const investmentTrades = trades.filter(t => ['delivery', 'investment', 'positional'].includes(t.tradeType));
    const investmentOpen = investmentTrades.filter(t => t.status === 'open');
    const investmentValue = investmentOpen.reduce((s, t) =>
      s + ((Number(t.entryPrice) || 0) * (Number(t.quantity) || 0)), 0);

    return {
      total: trades.length, closed: closed.length, open: open.length,
      wins: wins.length, losses: losses.length,
      totalPnL, netPnL, winRate, avgWin, avgLoss, rr,
      biggestWin, biggestLoss, totalCharges, currentCap, returnPct,
      profitFactor, streak, streakType, maxDD,
      todayPnL, todayT: todayT.length, weekPnL, monthPnL,
      investmentValue, investmentCount: investmentOpen.length,
    };
  }, [trades, capital]);

  const equityData = useMemo(() => {
    const closed = trades.filter(t => t.status === 'closed' && t.exitDate)
      .sort((a, b) => a.exitDate.localeCompare(b.exitDate));
    let running = capital;
    const data = [{ date: 'Start', capital }];
    closed.forEach(t => {
      running += (Number(t.pnl) || 0) - (Number(t.charges) || 0);
      data.push({
        date: format(parseISO(t.exitDate), 'dd MMM'),
        capital: Math.round(running),
      });
    });
    return data;
  }, [trades, capital]);

  const dailyData = useMemo(() => {
    const closed = trades.filter(t => t.status === 'closed' && t.exitDate);
    const map = {};
    closed.forEach(t => {
      const d = t.exitDate;
      if (!map[d]) map[d] = 0;
      map[d] += Number(t.pnl) || 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-20)
      .map(([date, pnl]) => ({
        date: format(parseISO(date), 'dd MMM'),
        pnl: Math.round(pnl),
        fill: pnl >= 0 ? '#10b981' : '#ef4444',
      }));
  }, [trades]);

  const typeData = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      const key = t.tradeType || 'other';
      if (!map[key]) map[key] = { name: TRADE_TYPES.find(x => x.value === key)?.label || key, value: 0 };
      map[key].value++;
    });
    return Object.values(map);
  }, [trades]);

  const strategyData = useMemo(() => {
    const closed = trades.filter(t => t.status === 'closed');
    const map = {};
    closed.forEach(t => {
      const s = t.strategy || 'Unknown';
      if (!map[s]) map[s] = { name: s, pnl: 0, count: 0, wins: 0 };
      map[s].pnl += Number(t.pnl) || 0;
      map[s].count++;
      if (Number(t.pnl) > 0) map[s].wins++;
    });
    return Object.values(map).map(s => ({
      ...s,
      pnl: Math.round(s.pnl),
      winRate: s.count > 0 ? Math.round(s.wins / s.count * 100) : 0,
    })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const portfolio = useMemo(() => {
    return trades.filter(t => t.status === 'open' &&
      ['delivery', 'investment', 'positional'].includes(t.tradeType))
      .map(t => ({
        ...t,
        invested: (Number(t.entryPrice) || 0) * (Number(t.quantity) || 0),
        duration: getHoldingDuration(t.entryDate),
      }));
  }, [trades]);

  // ============ HANDLERS ============
  const saveTrade = (data) => {
    // Auto-calculate P&L
    if (data.exitPrice && data.entryPrice && data.quantity) {
      data.pnl = calculatePnL(data);
      data.status = 'closed';
    } else if (!data.exitPrice) {
      data.status = 'open';
      data.pnl = 0;
    }

    if (editTrade) {
      setTrades(prev => prev.map(t => t.id === editTrade.id ? { ...data, id: editTrade.id } : t));
      showMsg('✅ Trade updated & analytics refreshed!');
    } else {
      setTrades(prev => [...prev, { ...data, id: uuidv4(), createdAt: new Date().toISOString() }]);
      showMsg('🎉 Trade added & analytics updated!');
    }
    setShowTradeModal(false);
    setEditTrade(null);
  };

  const deleteTrade = (id) => {
    if (window.confirm('Delete this trade? This action cannot be undone.')) {
      setTrades(prev => prev.filter(t => t.id !== id));
      showMsg('🗑️ Trade deleted successfully!');
    }
  };

  const deleteMultipleTrades = () => {
    if (selectedTrades.length === 0) {
      alert('Please select trades to delete');
      return;
    }
    if (window.confirm(`Delete ${selectedTrades.length} selected trade(s)? This cannot be undone.`)) {
      setTrades(prev => prev.filter(t => !selectedTrades.includes(t.id)));
      setSelectedTrades([]);
      showMsg(`🗑️ ${selectedTrades.length} trades deleted!`);
    }
  };

  const deleteAllTrades = () => {
    if (trades.length === 0) {
      alert('No trades to delete');
      return;
    }
    if (window.confirm(`⚠️ DELETE ALL ${trades.length} TRADES? This action cannot be undone!\n\nMake sure you've exported a backup first!`)) {
      if (window.confirm('Are you REALLY sure? This will delete everything permanently!')) {
        setTrades([]);
        setSelectedTrades([]);
        showMsg('🗑️ All trades deleted!');
      }
    }
  };

  const duplicateTrade = (t) => {
    setTrades(prev => [...prev, { ...t, id: uuidv4(), createdAt: new Date().toISOString() }]);
    showMsg('📋 Trade duplicated!');
  };

  const toggleTradeSelection = (id) => {
    setSelectedTrades(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllTrades = () => {
    if (selectedTrades.length === filtered.length) {
      setSelectedTrades([]);
    } else {
      setSelectedTrades(filtered.map(t => t.id));
    }
  };

  const filtered = useMemo(() => {
    let r = [...trades];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(t =>
        t.symbol?.toLowerCase().includes(q) ||
        t.strategy?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (filter !== 'all') {
      if (filter === 'open') r = r.filter(t => t.status === 'open');
      else if (filter === 'closed') r = r.filter(t => t.status === 'closed');
      else if (filter === 'winners') r = r.filter(t => Number(t.pnl) > 0 && t.status === 'closed');
      else if (filter === 'losers') r = r.filter(t => Number(t.pnl) < 0 && t.status === 'closed');
      else r = r.filter(t => t.tradeType === filter);
    }
    r.sort((a, b) => (b.entryDate || '').localeCompare(a.entryDate || ''));
    return r;
  }, [trades, search, filter]);

  const exportJSON = () => {
    const data = { trades, capital, rules, exportDate: new Date().toISOString(), version: '2.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradevault-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg('📥 Backup downloaded!');
  };

  const exportCSV = () => {
    const headers = ['Symbol','Direction','Trade Type','Segment','Strategy','Entry Date','Exit Date','Entry Price','Exit Price','Quantity','P&L','Charges','Status','Duration','Notes'];
    const rows = trades.map(t => [
      t.symbol, t.direction, t.tradeType, t.segment, t.strategy,
      t.entryDate, t.exitDate, t.entryPrice, t.exitPrice, t.quantity,
      t.pnl, t.charges, t.status, getHoldingDuration(t.entryDate, t.exitDate),
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg('📊 CSV exported!');
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.trades) setTrades(data.trades);
        if (data.capital) setCapital(data.capital);
        if (data.rules) setRules(data.rules);
        showMsg('🎉 Data restored & all analytics refreshed!');
      } catch { alert('Invalid file'); }
    };
    reader.readAsText(file);
  };

  // ============ SMART BROKER CSV IMPORT WITH AUTO-MATCH ============
  const importBrokerCSV = (file, broker) => {
    const ext = file.name.split('.').pop().toLowerCase();

    const processData = (data) => {
      let rawTrades = [];

      if (broker === 'zerodha') {
        data.forEach(row => {
          if (!row.symbol && !row.Symbol) return;
          const symbol = row.symbol || row.Symbol || '';
          const tradeType = (row.trade_type || row['Trade Type'] || '').toLowerCase();
          const isBuy = tradeType === 'buy' || tradeType === 'b';
          const qty = Math.abs(Number(row.quantity || row.Quantity || 0));
          const price = Number(row.price || row.Price || 0);
          const date = row.trade_date || row['Trade Date'] || row.date || format(new Date(), 'yyyy-MM-dd');
          const time = row.order_execution_time || row['Order Execution Time'] || '';
          
          if (symbol && qty && price) {
            rawTrades.push({
              symbol: symbol.toUpperCase(),
              direction: isBuy ? 'long' : 'short',
              tradeType: 'intraday',
              segment: 'Equity - Cash',
              entryDate: (date.split('T')[0] || date.split(' ')[0]),
              entryTime: time,
              entryPrice: price,
              quantity: qty,
              charges: 0,
              tags: ['zerodha-import'],
              notes: 'Auto-imported from Zerodha',
              createdAt: new Date().toISOString(),
            });
          }
        });
      } else if (broker === 'upstox') {
        data.forEach(row => {
          const symbol = row.Symbol || row.symbol || row.Instrument || '';
          const side = (row.Side || row.side || row['Buy/Sell'] || row['Transaction Type'] || '').toLowerCase();
          const isBuy = side.includes('buy') || side === 'b';
          const qty = Math.abs(Number(row.Quantity || row.quantity || 0));
          const price = Number(row.Price || row.price || row['Avg. price'] || row['Trade Price'] || 0);
          const date = row.Date || row.date || row['Trade Date'] || format(new Date(), 'yyyy-MM-dd');

          if (symbol && qty && price) {
            rawTrades.push({
              symbol: symbol.toUpperCase(),
              direction: isBuy ? 'long' : 'short',
              tradeType: 'intraday',
              segment: 'Equity - Cash',
              entryDate: date.split('T')[0].split(' ')[0],
              entryPrice: price,
              quantity: qty,
              charges: 0,
              tags: ['upstox-import'],
              notes: 'Auto-imported from Upstox',
              createdAt: new Date().toISOString(),
            });
          }
        });
      } else {
        data.forEach(row => {
          const symbol = row.symbol || row.Symbol || row.SYMBOL || row.instrument || '';
          const dir = (row.direction || row.side || row.type || row['Buy/Sell'] || 'buy').toLowerCase();
          const qty = Math.abs(Number(row.quantity || row.qty || row.Quantity || 0));
          const price = Number(row.price || row.entry_price || row.Price || 0);
          const exit = Number(row.exit_price || row.exit || 0);
          const date = row.date || row.entry_date || format(new Date(), 'yyyy-MM-dd');

          if (symbol && qty && price) {
            const t = {
              symbol: symbol.toUpperCase(),
              direction: dir.includes('sell') || dir === 'short' || dir === 's' ? 'short' : 'long',
              tradeType: row.trade_type || 'intraday',
              segment: row.segment || 'Equity - Cash',
              entryDate: date.split('T')[0].split(' ')[0],
              entryPrice: price,
              quantity: qty,
              charges: Number(row.charges || 0),
              tags: ['csv-import'],
              notes: 'Imported from CSV',
              createdAt: new Date().toISOString(),
            };
            if (exit) {
              t.exitPrice = exit;
              t.exitDate = date.split('T')[0].split(' ')[0];
              t.pnl = calculatePnL(t);
              t.status = 'closed';
            } else {
              t.status = 'open';
              t.pnl = 0;
            }
            rawTrades.push(t);
          }
        });
      }

      if (rawTrades.length === 0) {
        alert('No valid trades found. Please check your file format.');
        return;
      }

      // SMART: Auto-match buy/sell for Zerodha & Upstox
      let finalTrades;
      if (broker === 'zerodha' || broker === 'upstox') {
        finalTrades = autoMatchTrades(rawTrades);
      } else {
        finalTrades = rawTrades.map(t => ({ ...t, id: uuidv4() }));
      }

      // Show preview
      setImportPreview(finalTrades);
      setShowImportPreview(true);
    };

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processData(results.data),
        error: () => alert('Failed to parse CSV file'),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(sheet);
          processData(data);
        } catch { alert('Failed to parse Excel file'); }
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload CSV or Excel file');
    }
  };

  const confirmImport = () => {
    setTrades(prev => [...prev, ...importPreview]);
    const closedCount = importPreview.filter(t => t.status === 'closed').length;
    const openCount = importPreview.filter(t => t.status === 'open').length;
    showMsg(`🎉 Imported ${importPreview.length} trades! (${closedCount} closed, ${openCount} open) Analytics updated!`);
    setShowImportPreview(false);
    setImportPreview([]);
  };

  const pageTitle = {
    dashboard: { t: 'Dashboard', s: 'Trading performance overview' },
    trades: { t: 'Trade Log', s: 'All your trades' },
    portfolio: { t: 'Portfolio', s: 'Long-term & investment holdings' },
    analytics: { t: 'Analytics', s: 'Deep performance insights' },
    reports: { t: 'Detailed Report', s: 'Institutional-grade performance analysis' },
    synopsis: { t: 'Quick Synopsis', s: 'Executive summary at a glance' },
    calendar: { t: 'Calendar', s: 'Daily P&L visualization' },
    rules: { t: 'Trading Rules', s: 'Pre-trade checklist' },
    import: { t: 'Import Trades', s: 'Upload from broker' },
    settings: { t: 'Settings', s: 'Backup & configuration' },
  }[page] || { t: 'Dashboard', s: '' };
  // ============ AUTH GATE ============
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        fontSize: 18,
      }}>
        ⏳ Loading TradeVault...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }
  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">📊</div>
            <div className="logo-text">
              <h1>TradeVault</h1>
              <p>Pro Journal</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>
          {[
            { id: 'dashboard', icon: <Icons.Dashboard />, label: 'Dashboard' },
            { id: 'trades', icon: <Icons.Trade />, label: 'Trade Log' },
            { id: 'portfolio', icon: <Icons.Portfolio />, label: 'Portfolio' },
            { id: 'analytics', icon: <Icons.Analytics />, label: 'Analytics' },
{ id: 'reports', icon: <Icons.Analytics />, label: 'Detailed Report' },
{ id: 'synopsis', icon: <Icons.Analytics />, label: 'Quick Synopsis' },
            { id: 'calendar', icon: <Icons.Calendar />, label: 'Calendar' },
          ].map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); setSidebarOpen(false); setSelectedTrades([]); }}>
              <span>{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
          <div className="nav-section-title">Tools</div>
          {[
            { id: 'import', icon: <Icons.Import />, label: 'Import CSV' },
            { id: 'rules', icon: <Icons.Rules />, label: 'Trading Rules' },
            { id: 'settings', icon: <Icons.Settings />, label: 'Settings' },
          ].map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); setSidebarOpen(false); setSelectedTrades([]); }}>
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="capital-display">
            <div className="capital-label">Current Capital</div>
            <div className="capital-amount">₹{fmtNum(Math.round(stats.currentCap))}</div>
            <button className="capital-edit-btn" onClick={() => setShowCapitalModal(true)}>
              Edit starting capital
            </button>
          </div>
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: 'rgba(239,68,68,0.1)', 
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.3)'
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
              👤 Logged in as
            </div>
            <div style={{ 
              fontSize: 12, 
              color: '#fff', 
              fontWeight: 600, 
              marginBottom: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.email}
            </div>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '8px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}>
              <Icons.Menu />
            </button>
            <div className="top-bar-left">
              <h2>{pageTitle.t}</h2>
              <p>{pageTitle.s}</p>
            </div>
          </div>
          <div className="top-bar-actions">
            <div className="search-input-wrapper">
              <span className="search-icon"><Icons.Search /></span>
              <input placeholder="Search trades..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => { setEditTrade(null); setShowTradeModal(true); }}>
              <Icons.Plus /> New Trade
            </button>
          </div>
        </div>

        <div className="page-content">
          {msg && <div className="success-message">{msg}</div>}

          {/* DASHBOARD */}
          {page === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card green">
                  <div className="stat-card-header">
                    <div className="stat-card-icon green">💰</div>
                    <div className={`stat-card-change ${stats.returnPct >= 0 ? 'positive' : 'negative'}`}>
                      {stats.returnPct >= 0 ? '↑' : '↓'} {Math.abs(stats.returnPct).toFixed(1)}%
                    </div>
                  </div>
                  <div className="stat-card-label">Net P&L</div>
                  <div className={`stat-card-value ${stats.netPnL >= 0 ? 'green' : 'red'}`}>
                    {fmtCurrencyWithSign(stats.netPnL)}
                  </div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-card-header"><div className="stat-card-icon blue">🎯</div></div>
                  <div className="stat-card-label">Win Rate</div>
                  <div className="stat-card-value">{stats.winRate.toFixed(1)}%</div>
                  <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
                    {stats.wins}W / {stats.losses}L
                  </div>
                </div>
                <div className="stat-card purple">
                  <div className="stat-card-header"><div className="stat-card-icon purple">📊</div></div>
                  <div className="stat-card-label">Total Trades</div>
                  <div className="stat-card-value">{stats.total}</div>
                  <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>{stats.open} open</div>
                </div>
                <div className="stat-card gold">
                  <div className="stat-card-header"><div className="stat-card-icon gold">⚖️</div></div>
                  <div className="stat-card-label">Risk : Reward</div>
                  <div className="stat-card-value">{stats.rr.toFixed(2)}</div>
                </div>
                <div className="stat-card cyan">
                  <div className="stat-card-header"><div className="stat-card-icon cyan">📅</div></div>
                  <div className="stat-card-label">Today's P&L</div>
                  <div className={`stat-card-value ${stats.todayPnL >= 0 ? 'green' : 'red'}`}>
                    {fmtCurrencyWithSign(stats.todayPnL)}
                  </div>
                  <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>{stats.todayT} trades</div>
                </div>
                <div className="stat-card red">
                  <div className="stat-card-header"><div className="stat-card-icon red">🔥</div></div>
                  <div className="stat-card-label">Current Streak</div>
                  <div className={`stat-card-value ${stats.streakType === 'winning' ? 'green' : 'red'}`}>
                    {stats.streak} {stats.streakType === 'winning' ? '🏆' : stats.streakType === 'losing' ? '💔' : ''}
                  </div>
                </div>
                <div className="stat-card purple">
                  <div className="stat-card-header"><div className="stat-card-icon purple">💎</div></div>
                  <div className="stat-card-label">Investments Value</div>
                  <div className="stat-card-value">₹{fmtNum(Math.round(stats.investmentValue))}</div>
                  <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>{stats.investmentCount} holdings</div>
                </div>
                <div className="stat-card green">
                  <div className="stat-card-header"><div className="stat-card-icon green">📈</div></div>
                  <div className="stat-card-label">Month's P&L</div>
                  <div className={`stat-card-value ${stats.monthPnL >= 0 ? 'green' : 'red'}`}>
                    {fmtCurrencyWithSign(stats.monthPnL)}
                  </div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <div className="chart-card-title">📈 Equity Curve</div>
                  {equityData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={equityData}>
                        <defs>
                          <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }} />
                        <Area type="monotone" dataKey="capital" stroke="#3b82f6" fillOpacity={1} fill="url(#capGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state"><p>Close trades to see equity curve</p></div>
                  )}
                </div>
                <div className="chart-card">
                  <div className="chart-card-title">🎯 Trade Type Split</div>
                  {typeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={typeData} innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                          {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state"><p>Add trades to see breakdown</p></div>
                  )}
                </div>
              </div>

              {dailyData.length > 0 && (
                <div className="chart-card" style={{ marginBottom: 24 }}>
                  <div className="chart-card-title">📊 Daily P&L (Last 20 days)</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }} />
                      <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {dailyData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="trades-section">
                <div className="trades-header">
                  <h3>📋 Recent Trades</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditTrade(null); setShowTradeModal(true); }}>
                    <Icons.Plus /> Add Trade
                  </button>
                </div>
                {trades.length > 0 ? (
                  <TradeTable trades={trades.slice(0, 5)}
                    onEdit={(t) => { setEditTrade(t); setShowTradeModal(true); }}
                    onDelete={deleteTrade}
                    onView={setViewTrade}
                    onDuplicate={duplicateTrade}
                    selectable={false} />
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📈</div>
                    <h3>Welcome to TradeVault!</h3>
                    <p>Start logging your trades to track performance</p>
                    <button className="btn btn-primary" onClick={() => setShowTradeModal(true)}>
                      <Icons.Plus /> Add Your First Trade
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TRADES PAGE */}
          {page === 'trades' && (
            <div className="trades-section">
              <div className="trades-header">
                <h3>All Trades ({filtered.length})</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {selectedTrades.length > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={deleteMultipleTrades}>
                      <Icons.Delete /> Delete Selected ({selectedTrades.length})
                    </button>
                  )}
                  {trades.length > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={deleteAllTrades} style={{ opacity: 0.85 }}>
                      <Icons.Delete /> Delete All ({trades.length})
                    </button>
                  )}
                </div>
              </div>
              <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="trades-filters">
                  {[
                    { v: 'all', l: 'All' },
                    { v: 'open', l: 'Open' },
                    { v: 'closed', l: 'Closed' },
                    { v: 'winners', l: '🏆 Winners' },
                    { v: 'losers', l: '📉 Losers' },
                    { v: 'scalp', l: '⚡ Scalp' },
                    { v: 'intraday', l: 'Intraday' },
                    { v: 'swing', l: 'Swing' },
                    { v: 'positional', l: 'Positional' },
                    { v: 'delivery', l: '💎 Delivery' },
                    { v: 'investment', l: '🏦 Investment' },
                  ].map(f => (
                    <button key={f.v} className={`filter-btn ${filter === f.v ? 'active' : ''}`}
                      onClick={() => { setFilter(f.v); setSelectedTrades([]); }}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length > 0 ? (
                <TradeTable trades={filtered}
                  onEdit={(t) => { setEditTrade(t); setShowTradeModal(true); }}
                  onDelete={deleteTrade}
                  onView={setViewTrade}
                  onDuplicate={duplicateTrade}
                  selectable={true}
                  selectedTrades={selectedTrades}
                  toggleSelection={toggleTradeSelection}
                  selectAll={selectAllTrades} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3>No trades found</h3>
                  <p>Try changing filters or add a new trade</p>
                </div>
              )}
            </div>
          )}

          {/* PORTFOLIO */}
          {page === 'portfolio' && (
            <>
              <div className="stats-grid">
                <div className="stat-card purple">
                  <div className="stat-card-label">Total Invested</div>
                  <div className="stat-card-value">₹{fmtNum(Math.round(stats.investmentValue))}</div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-card-label">Holdings</div>
                  <div className="stat-card-value">{portfolio.length}</div>
                </div>
                <div className="stat-card gold">
                  <div className="stat-card-label">Unique Stocks</div>
                  <div className="stat-card-value">{new Set(portfolio.map(p => p.symbol)).size}</div>
                </div>
              </div>
              <div className="trades-section">
                <div className="trades-header">
                  <h3>💎 Portfolio Holdings (Long-term)</h3>
                </div>
                {portfolio.length > 0 ? (
                  <div className="trades-table-wrapper">
                    <table className="trades-table">
                      <thead>
                        <tr>
                          <th>Symbol</th><th>Type</th><th>Segment</th><th>Entry Date</th>
                          <th>Entry Price</th><th>Qty</th><th>Invested</th><th>Duration</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.map(t => (
                          <tr key={t.id}>
                            <td><div className="trade-symbol"><span className="trade-symbol-dot long"></span>{t.symbol}</div></td>
                            <td><span className={`badge badge-${t.tradeType}`}>{t.tradeType}</span></td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.segment}</td>
                            <td>{format(parseISO(t.entryDate), 'dd MMM yy')}</td>
                            <td>₹{fmtNum(t.entryPrice)}</td>
                            <td>{t.quantity}</td>
                            <td style={{ fontWeight: 700 }}>₹{fmtNum(Math.round(t.invested))}</td>
                            <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{t.duration}</td>
                            <td>
                              <div className="trade-actions">
                                <button className="trade-action-btn" onClick={() => setViewTrade(t)}><Icons.Eye /></button>
                                <button className="trade-action-btn" onClick={() => { setEditTrade(t); setShowTradeModal(true); }}><Icons.Edit /></button>
                                <button className="trade-action-btn delete" onClick={() => deleteTrade(t.id)}><Icons.Delete /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">💎</div>
                    <h3>No investments yet</h3>
                    <p>Add delivery, positional or investment trades</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ANALYTICS */}
          {page === 'analytics' && (
            <>
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-card-label">Profit Factor</div>
                  <div className="stat-card-value">{stats.profitFactor > 900 ? '∞' : stats.profitFactor.toFixed(2)}</div>
                </div>
                <div className="stat-card green">
                  <div className="stat-card-label">Biggest Win</div>
                  <div className="stat-card-value green">{fmtCurrencyWithSign(stats.biggestWin)}</div>
                </div>
                <div className="stat-card red">
                  <div className="stat-card-label">Biggest Loss</div>
                  <div className="stat-card-value red">{fmtCurrencyWithSign(stats.biggestLoss)}</div>
                </div>
                <div className="stat-card gold">
                  <div className="stat-card-label">Avg Win</div>
                  <div className="stat-card-value green">{fmtCurrency(stats.avgWin)}</div>
                </div>
                <div className="stat-card purple">
                  <div className="stat-card-label">Avg Loss</div>
                  <div className="stat-card-value red">-₹{fmtNum(Math.round(stats.avgLoss))}</div>
                </div>
                <div className="stat-card cyan">
                  <div className="stat-card-label">Max Drawdown</div>
                  <div className="stat-card-value red">{stats.maxDD.toFixed(1)}%</div>
                </div>
                <div className="stat-card green">
                  <div className="stat-card-label">Week's P&L</div>
                  <div className={`stat-card-value ${stats.weekPnL >= 0 ? 'green' : 'red'}`}>
                    {fmtCurrencyWithSign(stats.weekPnL)}
                  </div>
                </div>
                <div className="stat-card red">
                  <div className="stat-card-label">Total Charges</div>
                  <div className="stat-card-value">₹{fmtNum(Math.round(stats.totalCharges))}</div>
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-card-title">🎯 Strategy Performance</div>
                {strategyData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={strategyData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }} />
                        <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                          {strategyData.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 16 }}>
                      {strategyData.map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 12 }}>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {s.count} trades | WR: {s.winRate}% | 
                            <span className={s.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}> {fmtCurrencyWithSign(s.pnl)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-state"><p>Add closed trades to see analytics</p></div>
                )}
              </div>
            </>
          )}

          {/* CALENDAR */}
          {page === 'calendar' && <CalendarView month={calMonth} setMonth={setCalMonth} trades={trades} />}

          {/* RULES */}
          {page === 'rules' && <RulesPage rules={rules} setRules={setRules} />}

          {/* IMPORT */}
          {page === 'import' && <ImportPage onImport={importBrokerCSV} />}

          {/* SETTINGS */}
                    {/* DETAILED REPORT PAGE */}
          {page === 'reports' && <DetailedReport trades={trades} capital={capital} stats={stats} />}

          {/* SYNOPSIS PAGE */}
          {page === 'synopsis' && <SynopsisReport trades={trades} capital={capital} stats={stats} />}
          {page === 'settings' && (
            <>
              <div className="import-export-section">
                <div className="ie-card">
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📤</div>
                  <h3>Export Backup</h3>
                  <p>Download all your data as JSON file</p>
                  <button className="btn btn-primary" onClick={exportJSON}>
                    <Icons.Download /> Export JSON
                  </button>
                  <button className="btn btn-ghost" onClick={exportCSV} style={{ marginTop: 10, marginLeft: 8 }}>
                    <Icons.Download /> Export CSV
                  </button>
                </div>
                <div className="ie-card">
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📥</div>
                  <h3>Restore Backup</h3>
                  <p>Import your previous backup file</p>
                  <label className="btn btn-success" style={{ cursor: 'pointer' }}>
                    <Icons.Upload /> Restore JSON
                    <input type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              <div className="chart-card" style={{ marginTop: 16 }}>
                <div className="chart-card-title">⚠️ Danger Zone</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>
                  Export backup first! These actions can't be undone.
                </p>
                <button className="btn btn-danger" onClick={deleteAllTrades}>
                  <Icons.Delete /> Delete All {trades.length} Trades
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* MODALS */}
      {showTradeModal && (
        <TradeModal trade={editTrade} onSave={saveTrade}
          onClose={() => { setShowTradeModal(false); setEditTrade(null); }} />
      )}
      {viewTrade && (
        <ViewTradeModal trade={viewTrade} onClose={() => setViewTrade(null)}
          onEdit={(t) => { setViewTrade(null); setEditTrade(t); setShowTradeModal(true); }} />
      )}
      {showImportPreview && (
        <ImportPreviewModal trades={importPreview}
          onConfirm={confirmImport}
          onCancel={() => { setShowImportPreview(false); setImportPreview([]); }} />
      )}
      {showCapitalModal && (
        <div className="modal-overlay" onClick={() => setShowCapitalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>💰 Starting Capital</h3>
              <button className="modal-close" onClick={() => setShowCapitalModal(false)}><Icons.Close /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Enter your starting capital (₹)</label>
                <input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCapitalModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowCapitalModal(false); showMsg('💰 Capital updated!'); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ TRADE TABLE WITH CHECKBOXES ============
function TradeTable({ trades, onEdit, onDelete, onView, onDuplicate, selectable, selectedTrades = [], toggleSelection, selectAll }) {
  const allSelected = selectable && trades.length > 0 && trades.every(t => selectedTrades.includes(t.id));
  
  return (
    <div className="trades-table-wrapper">
      <table className="trades-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: 40 }}>
                <div className={`rule-checkbox ${allSelected ? 'checked' : ''}`}
                  onClick={selectAll} style={{ margin: '0 auto', cursor: 'pointer' }} />
              </th>
            )}
            <th>Symbol</th>
            <th>Direction</th>
            <th>Type</th>
            <th>Entry Date</th>
            <th>Entry ₹</th>
            <th>Exit ₹</th>
            <th>Qty</th>
            <th>Duration</th>
            <th>P&L</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(t => (
            <tr key={t.id} style={{ background: selectedTrades.includes(t.id) ? 'rgba(59,130,246,0.05)' : '' }}>
              {selectable && (
                <td>
                  <div className={`rule-checkbox ${selectedTrades.includes(t.id) ? 'checked' : ''}`}
                    onClick={() => toggleSelection(t.id)} style={{ margin: '0 auto', cursor: 'pointer' }} />
                </td>
              )}
              <td><div className="trade-symbol"><span className={`trade-symbol-dot ${t.direction}`}></span>{t.symbol}</div></td>
              <td><span className={`badge badge-${t.direction}`}>{t.direction?.toUpperCase()}</span></td>
              <td><span className={`badge badge-${t.tradeType}`}>{t.tradeType}</span></td>
              <td style={{ color: 'var(--text-secondary)' }}>{t.entryDate ? format(parseISO(t.entryDate), 'dd MMM yy') : '-'}</td>
              <td>₹{fmtNum(t.entryPrice)}</td>
              <td>{t.exitPrice ? `₹${fmtNum(t.exitPrice)}` : '-'}</td>
              <td>{t.quantity}</td>
              <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{getHoldingDuration(t.entryDate, t.exitDate)}</td>
              <td>{t.status === 'closed' ? (
                <span className={Number(t.pnl) >= 0 ? 'pnl-positive' : 'pnl-negative'}>{fmtCurrencyWithSign(t.pnl)}</span>
              ) : '-'}</td>
              <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
              <td>
                <div className="trade-actions">
                  <button className="trade-action-btn" onClick={() => onView(t)} title="View"><Icons.Eye /></button>
                  <button className="trade-action-btn" onClick={() => onEdit(t)} title="Edit"><Icons.Edit /></button>
                  <button className="trade-action-btn" onClick={() => onDuplicate(t)} title="Duplicate"><Icons.Copy /></button>
                  <button className="trade-action-btn delete" onClick={() => onDelete(t.id)} title="Delete"><Icons.Delete /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============ IMPORT PREVIEW MODAL ============
function ImportPreviewModal({ trades, onConfirm, onCancel }) {
  const closedCount = trades.filter(t => t.status === 'closed').length;
  const openCount = trades.filter(t => t.status === 'open').length;
  const totalPnL = trades.filter(t => t.status === 'closed').reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <h3>📊 Import Preview - {trades.length} Trades</h3>
          <button className="modal-close" onClick={onCancel}><Icons.Close /></button>
        </div>
        <div className="modal-body">
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card blue">
              <div className="stat-card-label">Total Trades</div>
              <div className="stat-card-value">{trades.length}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-card-label">Closed (Auto-matched)</div>
              <div className="stat-card-value green">{closedCount}</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-card-label">Open Positions</div>
              <div className="stat-card-value">{openCount}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-card-label">Total P&L</div>
              <div className={`stat-card-value ${totalPnL >= 0 ? 'green' : 'red'}`}>
                {fmtCurrencyWithSign(totalPnL)}
              </div>
            </div>
          </div>
          
          <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
            <table className="trades-table">
              <thead>
                <tr>
                  <th>Symbol</th><th>Type</th><th>Entry</th><th>Exit</th><th>Qty</th><th>P&L</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 50).map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{t.symbol}</td>
                    <td><span className={`badge badge-${t.direction}`}>{t.direction}</span></td>
                    <td>₹{fmtNum(t.entryPrice)}</td>
                    <td>{t.exitPrice ? `₹${fmtNum(t.exitPrice)}` : '-'}</td>
                    <td>{t.quantity}</td>
                    <td>{t.status === 'closed' ? (
                      <span className={Number(t.pnl) >= 0 ? 'pnl-positive' : 'pnl-negative'}>{fmtCurrencyWithSign(t.pnl)}</span>
                    ) : '-'}</td>
                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length > 50 && (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                ...and {trades.length - 50} more trades
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, padding: 14, background: 'rgba(59,130,246,0.1)', borderRadius: 8, fontSize: 13 }}>
            <strong>✨ Auto-Analysis:</strong> After importing, all analytics will be automatically calculated including P&L, win rate, equity curve, and more!
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-success" onClick={onConfirm}>
            <Icons.Check /> Import {trades.length} Trades
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ CALENDAR ============
function CalendarView({ month, setMonth, trades }) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const empties = Array(startDay === 0 ? 6 : startDay - 1).fill(null);
  const pnlMap = {};
  trades.filter(t => t.status === 'closed' && t.exitDate).forEach(t => {
    const d = t.exitDate;
    if (!pnlMap[d]) pnlMap[d] = { pnl: 0, count: 0 };
    pnlMap[d].pnl += Number(t.pnl) || 0;
    pnlMap[d].count++;
  });
  const monthKey = format(month, 'yyyy-MM');
  const monthTrades = trades.filter(t => t.status === 'closed' && t.exitDate?.startsWith(monthKey));
  const mPnL = monthTrades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const mWins = monthTrades.filter(t => Number(t.pnl) > 0).length;

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button className="btn-icon" onClick={() => setMonth(subMonths(month, 1))}><Icons.ChevronLeft /></button>
        <h3 style={{ fontSize: 17, fontWeight: 700 }}>{format(month, 'MMMM yyyy')}</h3>
        <button className="btn-icon" onClick={() => setMonth(addMonths(month, 1))}><Icons.ChevronRight /></button>
      </div>
      <div className="calendar-grid">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
        {empties.map((_, i) => <div key={`e${i}`} className="calendar-day empty"></div>)}
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const d = pnlMap[key];
          let cls = 'calendar-day';
          if (isToday(day)) cls += ' today';
          if (d) { cls += ' has-trades'; cls += d.pnl >= 0 ? ' profit' : ' loss'; }
          return (
            <div key={key} className={cls}>
              <span className="day-number">{format(day, 'd')}</span>
              {d && <span className={`day-pnl ${d.pnl >= 0 ? 'positive' : 'negative'}`}>{d.pnl >= 0 ? '+' : ''}{Math.round(d.pnl)}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div className="detail-item">
          <label>Month P&L</label>
          <div className={`value ${mPnL >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>{fmtCurrencyWithSign(Math.round(mPnL))}</div>
        </div>
        <div className="detail-item"><label>Trades</label><div className="value">{monthTrades.length}</div></div>
        <div className="detail-item"><label>Win Rate</label><div className="value">{monthTrades.length > 0 ? Math.round(mWins / monthTrades.length * 100) : 0}%</div></div>
      </div>
    </div>
  );
}

// ============ RULES ============
function RulesPage({ rules, setRules }) {
  const [newRule, setNewRule] = useState('');
  const add = () => {
    if (!newRule.trim()) return;
    setRules(prev => [...prev, { id: uuidv4(), text: newRule.trim(), checked: false }]);
    setNewRule('');
  };
  const checked = rules.filter(r => r.checked).length;
  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>📋 Pre-Trade Checklist</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{checked}/{rules.length} checked</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setRules(prev => prev.map(r => ({ ...r, checked: false })))}>Reset</button>
      </div>
      <div className="risk-meter" style={{ marginBottom: 18 }}>
        <div className={`risk-meter-fill ${checked/rules.length >= 0.8 ? 'low' : checked/rules.length >= 0.5 ? 'medium' : 'high'}`}
          style={{ width: `${rules.length > 0 ? (checked/rules.length)*100 : 0}%` }} />
      </div>
      <div className="add-rule-form">
        <input value={newRule} onChange={e => setNewRule(e.target.value)}
          placeholder="Add a new trading rule..." onKeyPress={e => e.key === 'Enter' && add()} />
        <button className="btn btn-primary btn-sm" onClick={add}><Icons.Plus /> Add</button>
      </div>
      <div className="rules-list">
        {rules.map(r => (
          <div key={r.id} className="rule-item">
            <div className={`rule-checkbox ${r.checked ? 'checked' : ''}`}
              onClick={() => setRules(prev => prev.map(x => x.id === r.id ? { ...x, checked: !x.checked } : x))} />
            <span className={`rule-text ${r.checked ? 'checked' : ''}`}>{r.text}</span>
            <button className="rule-delete" onClick={() => setRules(prev => prev.filter(x => x.id !== r.id))}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ IMPORT ============
function ImportPage({ onImport }) {
  const [broker, setBroker] = useState('zerodha');
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) onImport(file, broker);
    e.target.value = '';
  };
  return (
    <div className="chart-card">
      <div className="chart-card-title">📥 Smart Import from Broker</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        ✨ Auto-matches buy/sell orders, calculates P&L, and updates all analytics automatically!
      </p>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1, marginBottom: 10, display: 'block' }}>
        Select Your Broker
      </label>
      <div className="broker-selector">
        {[
          { v: 'zerodha', l: '🟠 Zerodha' },
          { v: 'upstox', l: '🟣 Upstox' },
          { v: 'angelone', l: '🔵 Angel One' },
          { v: 'groww', l: '🟢 Groww' },
          { v: 'generic', l: '📄 Generic CSV' },
        ].map(b => (
          <button key={b.v} className={`broker-btn ${broker === b.v ? 'selected' : ''}`} onClick={() => setBroker(b.v)}>
            {b.l}
          </button>
        ))}
      </div>
      <label className="import-drop-zone">
        <div style={{ fontSize: 48, marginBottom: 10 }}>📁</div>
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>Click to Upload File</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Supports .csv, .xlsx, .xls files</p>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-input)', borderRadius: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>📖 How to get your tradebook:</strong>
        <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Zerodha:</strong> Console → Reports → Tradebook → Download CSV</li>
          <li><strong>Upstox:</strong> Reports → Trade Book → Export Excel</li>
          <li><strong>Angel One:</strong> Reports → Trade Book → Download</li>
          <li><strong>Groww:</strong> Investments → Reports → Download</li>
        </ul>
        <p style={{ marginTop: 12, padding: 10, background: 'rgba(16,185,129,0.1)', borderRadius: 6, color: 'var(--accent-green)' }}>
          ✨ <strong>Smart Feature:</strong> Import shows a preview first! Buy/sell orders auto-match to create closed trades with calculated P&L.
        </p>
      </div>
    </div>
  );
}

// ============ TRADE MODAL ============
function TradeModal({ trade, onSave, onClose }) {
  const [form, setForm] = useState({
    symbol: '', direction: 'long', tradeType: 'intraday', segment: 'Equity - Cash',
    strategy: '', entryDate: format(new Date(), 'yyyy-MM-dd'), exitDate: '',
    entryTime: '', exitTime: '',
    entryPrice: '', exitPrice: '', quantity: '', stopLoss: '', target: '',
    charges: '', pnl: '', status: 'open',
    emotion: '', rating: 0, notes: '', setup: '', tags: [],
    timeframe: '', riskAmount: '',
    ...trade
  });
  const [tagInput, setTagInput] = useState('');

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (form.entryPrice && form.exitPrice && form.quantity) {
      const pnl = calculatePnL(form);
      upd('pnl', Math.round(pnl * 100) / 100);
    }
  }, [form.entryPrice, form.exitPrice, form.quantity, form.direction]);

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      upd('tags', [...form.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.symbol || !form.entryPrice || !form.quantity) {
      alert('Please fill Symbol, Entry Price and Quantity');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{trade ? '✏️ Edit Trade' : '➕ New Trade'}</h3>
          <button className="modal-close" onClick={onClose}><Icons.Close /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Symbol *</label>
                <input value={form.symbol} onChange={e => upd('symbol', e.target.value.toUpperCase())} placeholder="RELIANCE, NIFTY" required />
              </div>
              <div className="form-group">
                <label>Direction</label>
                <select value={form.direction} onChange={e => upd('direction', e.target.value)}>
                  <option value="long">🟢 Long (Buy)</option>
                  <option value="short">🔴 Short (Sell)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trade Type *</label>
                <select value={form.tradeType} onChange={e => upd('tradeType', e.target.value)}>
                  {TRADE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Segment</label>
                <select value={form.segment} onChange={e => upd('segment', e.target.value)}>
                  {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Strategy</label>
                <select value={form.strategy} onChange={e => upd('strategy', e.target.value)}>
                  <option value="">Select strategy</option>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Timeframe</label>
                <select value={form.timeframe} onChange={e => upd('timeframe', e.target.value)}>
                  <option value="">Select</option>
                  <option value="1m">1 Min</option><option value="5m">5 Min</option>
                  <option value="15m">15 Min</option><option value="1h">1 Hour</option>
                  <option value="1d">Daily</option><option value="1w">Weekly</option>
                  <option value="1M">Monthly</option>
                </select>
              </div>
              <div className="form-section-title">📅 Date & Time</div>
              <div className="form-group">
                <label>Entry Date *</label>
                <input type="date" value={form.entryDate} onChange={e => upd('entryDate', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Entry Time</label>
                <input type="time" value={form.entryTime} onChange={e => upd('entryTime', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Exit Date</label>
                <input type="date" value={form.exitDate} onChange={e => upd('exitDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Exit Time</label>
                <input type="time" value={form.exitTime} onChange={e => upd('exitTime', e.target.value)} />
              </div>
              <div className="form-section-title">💰 Prices</div>
              <div className="form-group">
                <label>Entry Price *</label>
                <input type="number" step="0.01" value={form.entryPrice} onChange={e => upd('entryPrice', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Exit Price</label>
                <input type="number" step="0.01" value={form.exitPrice} onChange={e => upd('exitPrice', e.target.value)} placeholder="Leave empty for open trade" />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" value={form.quantity} onChange={e => upd('quantity', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Charges/Brokerage</label>
                <input type="number" step="0.01" value={form.charges} onChange={e => upd('charges', e.target.value)} />
              </div>
              <div className="form-section-title">🛡️ Risk Management</div>
              <div className="form-group">
                <label>Stop Loss</label>
                <input type="number" step="0.01" value={form.stopLoss} onChange={e => upd('stopLoss', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Target</label>
                <input type="number" step="0.01" value={form.target} onChange={e => upd('target', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Risk Amount (₹)</label>
                <input type="number" value={form.riskAmount} onChange={e => upd('riskAmount', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status (Auto)</label>
                <input type="text" value={form.exitPrice ? '⚪ Will Close' : '🔵 Will stay Open'} disabled style={{ opacity: 0.7 }} />
              </div>
              <div className="form-section-title">📊 Auto-Calculated P&L</div>
              <div className="form-group full-width">
                <label>P&L (Automatically calculated when you enter Exit Price)</label>
                <input type="number" step="0.01" value={form.pnl} onChange={e => upd('pnl', e.target.value)}
                  style={{ fontWeight: 700, fontSize: 18, color: Number(form.pnl) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }} />
              </div>
              <div className="form-section-title">🧠 Psychology</div>
              <div className="form-group full-width">
                <label>Emotion</label>
                <div className="emotion-selector">
                  {EMOTIONS.map(e => (
                    <button type="button" key={e} className={`emotion-btn ${form.emotion === e ? 'selected' : ''}`}
                      onClick={() => upd('emotion', form.emotion === e ? '' : e)}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="form-group full-width">
                <label>Trade Rating</label>
                <div className="star-rating">
                  {[1,2,3,4,5].map(s => (
                    <button type="button" key={s} className={`star-btn ${s <= form.rating ? 'active' : ''}`}
                      onClick={() => upd('rating', s === form.rating ? 0 : s)}>★</button>
                  ))}
                </div>
              </div>
              <div className="form-group full-width">
                <label>Setup Description</label>
                <textarea value={form.setup} onChange={e => upd('setup', e.target.value)} placeholder="Describe your setup..." rows={2} />
              </div>
              <div className="form-group full-width">
                <label>Notes / Learnings</label>
                <textarea value={form.notes} onChange={e => upd('notes', e.target.value)} placeholder="What did you learn?" rows={3} />
              </div>
              <div className="form-group full-width">
                <label>Tags</label>
                <div className="tags-container">
                  {(form.tags || []).map(tag => (
                    <span key={tag} className="tag">{tag}
                      <span className="tag-remove" onClick={() => upd('tags', form.tags.filter(t => t !== tag))}>×</span>
                    </span>
                  ))}
                </div>
                <div className="tag-input-container">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    placeholder="Add tag..." onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addTag}>Add</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success">
              {trade ? '💾 Update Trade' : '✅ Save & Analyze'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ VIEW TRADE ============
function ViewTradeModal({ trade, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`trade-symbol-dot ${trade.direction}`} style={{ width: 12, height: 12 }}></span>
            <h3>{trade.symbol}</h3>
            <span className={`badge badge-${trade.direction}`}>{trade.direction?.toUpperCase()}</span>
            <span className={`badge badge-${trade.tradeType}`}>{trade.tradeType}</span>
            <span className={`badge badge-${trade.status}`}>{trade.status}</span>
          </div>
          <button className="modal-close" onClick={onClose}><Icons.Close /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div className="detail-grid">
            <div className="detail-item"><label>Entry Date</label><div className="value">{trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM yyyy') : '-'}</div></div>
            <div className="detail-item"><label>Exit Date</label><div className="value">{trade.exitDate ? format(parseISO(trade.exitDate), 'dd MMM yyyy') : '-'}</div></div>
            <div className="detail-item"><label>Duration</label><div className="value">{getHoldingDuration(trade.entryDate, trade.exitDate)}</div></div>
            <div className="detail-item"><label>Entry Price</label><div className="value">₹{fmtNum(trade.entryPrice)}</div></div>
            <div className="detail-item"><label>Exit Price</label><div className="value">{trade.exitPrice ? `₹${fmtNum(trade.exitPrice)}` : '-'}</div></div>
            <div className="detail-item"><label>Quantity</label><div className="value">{trade.quantity}</div></div>
            <div className="detail-item"><label>P&L</label><div className={`value ${Number(trade.pnl) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>{trade.status === 'closed' ? fmtCurrencyWithSign(trade.pnl) : '-'}</div></div>
            <div className="detail-item"><label>Strategy</label><div className="value" style={{ fontSize: 13 }}>{trade.strategy || '-'}</div></div>
            <div className="detail-item"><label>Segment</label><div className="value" style={{ fontSize: 13 }}>{trade.segment || '-'}</div></div>
            <div className="detail-item"><label>Stop Loss</label><div className="value">{trade.stopLoss ? `₹${fmtNum(trade.stopLoss)}` : '-'}</div></div>
            <div className="detail-item"><label>Target</label><div className="value">{trade.target ? `₹${fmtNum(trade.target)}` : '-'}</div></div>
            <div className="detail-item"><label>Tax Category</label><div className="value" style={{ fontSize: 13 }}>{getTaxCategory(trade.entryDate, trade.exitDate, trade.segment) || '-'}</div></div>
            <div className="detail-item"><label>Emotion</label><div className="value" style={{ fontSize: 13 }}>{trade.emotion || '-'}</div></div>
            <div className="detail-item"><label>Rating</label><div className="value">{trade.rating ? '⭐'.repeat(trade.rating) : '-'}</div></div>
          </div>
          {trade.tags?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Tags</label>
              <div className="tags-container" style={{ marginTop: 6 }}>
                {trade.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          )}
          {trade.setup && <div className="notes-section"><h4>Setup</h4><p>{trade.setup}</p></div>}
          {trade.notes && <div className="notes-section"><h4>Notes</h4><p>{trade.notes}</p></div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => onEdit(trade)}><Icons.Edit /> Edit</button>
        </div>
      </div>
    </div>
  );
}
// ============ DETAILED REPORT ============
function DetailedReport({ trades, capital, stats }) {
  const advanced = useMemo(() => calculateAdvancedMetrics(trades, capital), [trades, capital]);
  const monthlyPerf = useMemo(() => getMonthlyPerformance(trades), [trades]);
  const dayPerf = useMemo(() => getDayOfWeekPerformance(trades), [trades]);
  const symbolPerf = useMemo(() => getSymbolPerformance(trades), [trades]);
  const drawdownData = useMemo(() => getDrawdownData(trades, capital), [trades, capital]);

  const closed = trades.filter(t => t.status === 'closed');
  
  if (closed.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>No Data Yet</h3>
        <p>Close some trades to see detailed analytics</p>
      </div>
    );
  }

  const bestTrade = closed.reduce((best, t) => Number(t.pnl) > Number(best.pnl || 0) ? t : best, {});
  const worstTrade = closed.reduce((worst, t) => Number(t.pnl) < Number(worst.pnl || 0) ? t : worst, {});

  return (
    <div>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>📊 Institutional Performance Report</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Generated on {format(new Date(), 'dd MMMM yyyy, HH:mm')} | {closed.length} closed trades analyzed
        </p>
      </div>

      {/* ADVANCED METRICS */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-card-title">🎯 Advanced Performance Metrics</div>
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-card-label">Expectancy per Trade</div>
            <div className={`stat-card-value ${advanced.expectancy >= 0 ? 'green' : 'red'}`}>
              {fmtCurrencyWithSign(Math.round(advanced.expectancy))}
            </div>
            <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
              Expected profit per trade
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-label">Sharpe Ratio</div>
            <div className="stat-card-value">{advanced.sharpeRatio.toFixed(2)}</div>
            <div className="stat-card-change" style={{ color: advanced.sharpeRatio > 1 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {advanced.sharpeRatio > 2 ? '🏆 Excellent' : advanced.sharpeRatio > 1 ? '✅ Good' : advanced.sharpeRatio > 0 ? '⚠️ Average' : '❌ Poor'}
            </div>
          </div>
          <div className="stat-card gold">
            <div className="stat-card-label">Sortino Ratio</div>
            <div className="stat-card-value">{advanced.sortinoRatio.toFixed(2)}</div>
            <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
              Downside risk-adjusted
            </div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-card-label">Standard Deviation</div>
            <div className="stat-card-value">₹{fmtNum(Math.round(advanced.stdDev))}</div>
            <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
              Volatility per trade
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-card-label">Max Consecutive Wins</div>
            <div className="stat-card-value green">{advanced.maxConsecWins} 🔥</div>
          </div>
          <div className="stat-card red">
            <div className="stat-card-label">Max Consecutive Losses</div>
            <div className="stat-card-value red">{advanced.maxConsecLosses} 💔</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-label">Avg R-Multiple</div>
            <div className={`stat-card-value ${advanced.avgR >= 0 ? 'green' : 'red'}`}>{advanced.avgR.toFixed(2)}R</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-card-label">Total Return %</div>
            <div className={`stat-card-value ${advanced.returnPct >= 0 ? 'green' : 'red'}`}>
              {advanced.returnPct >= 0 ? '+' : ''}{advanced.returnPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* DRAWDOWN CHART */}
      {drawdownData.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-card-title">📉 Drawdown Analysis</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: '%', position: 'insideLeft', fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }} />
              <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fillOpacity={1} fill="url(#ddGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MONTHLY PERFORMANCE */}
      {monthlyPerf.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-card-title">📅 Monthly Performance Heatmap</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyPerf.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            {monthlyPerf.map((m, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--bg-input)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{m.month}</div>
                <div className={m.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'} style={{ fontSize: 14, marginTop: 2 }}>
                  {fmtCurrencyWithSign(m.pnl)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {m.count} trades | {m.winRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DAY OF WEEK ANALYSIS */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-card-title">📆 Day of Week Performance</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dayPerf}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3150" />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid #2a3150', borderRadius: 8 }} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {dayPerf.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {dayPerf.map((d, i) => (
            <div key={i} style={{ padding: 10, background: 'var(--bg-input)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{d.day}</div>
              <div className={d.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'} style={{ fontSize: 13, marginTop: 4 }}>
                {fmtCurrencyWithSign(d.pnl)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.count} trades</div>
              <div style={{ fontSize: 10, color: d.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                WR: {d.winRate}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SYMBOL PERFORMANCE */}
      {symbolPerf.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-card-title">💼 Symbol-wise Performance (Top {Math.min(10, symbolPerf.length)})</div>
          <div className="trades-table-wrapper">
            <table className="trades-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Symbol</th>
                  <th>Trades</th>
                  <th>Win Rate</th>
                  <th>Avg P&L</th>
                  <th>Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {symbolPerf.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</td>
                    <td style={{ fontWeight: 700 }}>{s.symbol}</td>
                    <td>{s.count}</td>
                    <td style={{ color: s.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{s.winRate}%</td>
                    <td className={s.avgPnL >= 0 ? 'pnl-positive' : 'pnl-negative'}>{fmtCurrencyWithSign(s.avgPnL)}</td>
                    <td className={s.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'} style={{ fontWeight: 700 }}>{fmtCurrencyWithSign(s.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BEST & WORST TRADES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="chart-card" style={{ borderTop: '3px solid var(--accent-green)' }}>
          <div className="chart-card-title">🏆 Best Trade</div>
          {bestTrade.symbol && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>{bestTrade.symbol}</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }} className="pnl-positive">
                {fmtCurrencyWithSign(bestTrade.pnl)}
              </div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Entry:</span> ₹{fmtNum(bestTrade.entryPrice)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Exit:</span> ₹{fmtNum(bestTrade.exitPrice)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Qty:</span> {bestTrade.quantity}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> {bestTrade.tradeType}</div>
              </div>
            </>
          )}
        </div>
        <div className="chart-card" style={{ borderTop: '3px solid var(--accent-red)' }}>
          <div className="chart-card-title">💔 Worst Trade</div>
          {worstTrade.symbol && (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-red)' }}>{worstTrade.symbol}</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }} className="pnl-negative">
                {fmtCurrencyWithSign(worstTrade.pnl)}
              </div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Entry:</span> ₹{fmtNum(worstTrade.entryPrice)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Exit:</span> ₹{fmtNum(worstTrade.exitPrice)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Qty:</span> {worstTrade.quantity}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> {worstTrade.tradeType}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SUMMARY FOOTER */}
      <div style={{ padding: 20, background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', borderRadius: 12, textAlign: 'center', border: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          📊 This report is generated in real-time based on your trading data
        </p>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

// ============ SYNOPSIS REPORT ============
function SynopsisReport({ trades, capital, stats }) {
  const closed = trades.filter(t => t.status === 'closed');
  const advanced = useMemo(() => calculateAdvancedMetrics(trades, capital), [trades, capital]);
  
  if (closed.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📄</div>
        <h3>No Data Yet</h3>
        <p>Close some trades to see synopsis</p>
      </div>
    );
  }

  const performanceGrade = 
    stats.winRate >= 60 && stats.rr >= 2 ? { grade: 'A+', color: '#10b981', label: 'Excellent' } :
    stats.winRate >= 50 && stats.rr >= 1.5 ? { grade: 'A', color: '#10b981', label: 'Very Good' } :
    stats.winRate >= 40 && stats.rr >= 1 ? { grade: 'B', color: '#3b82f6', label: 'Good' } :
    stats.winRate >= 30 ? { grade: 'C', color: '#f59e0b', label: 'Average' } :
    { grade: 'D', color: '#ef4444', label: 'Needs Improvement' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* REPORT HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 16, padding: 32, marginBottom: 20, border: '2px solid var(--border-color)', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
          TradeVault Pro Journal
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Trading Performance Synopsis</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {format(new Date(), 'dd MMMM yyyy')} • Period: All Time
        </p>
      </div>

      {/* PERFORMANCE GRADE */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, marginBottom: 20, border: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2 }}>
          Overall Performance Grade
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: performanceGrade.color, lineHeight: 1, margin: '10px 0' }}>
          {performanceGrade.grade}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: performanceGrade.color }}>
          {performanceGrade.label}
        </div>
      </div>

      {/* KEY METRICS */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid var(--border-color)' }}>
        <div className="chart-card-title" style={{ marginBottom: 20 }}>📊 Key Performance Indicators</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, borderLeft: '3px solid var(--accent-blue)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total P&L</div>
            <div className={stats.netPnL >= 0 ? 'pnl-positive' : 'pnl-negative'} style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
              {fmtCurrencyWithSign(stats.netPnL)}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, borderLeft: '3px solid var(--accent-green)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Win Rate</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{stats.winRate.toFixed(1)}%</div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, borderLeft: '3px solid var(--accent-purple)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Trades</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{stats.total}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, borderLeft: '3px solid var(--accent-yellow)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Risk:Reward</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{stats.rr.toFixed(2)}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, borderLeft: '3px solid var(--accent-cyan)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Profit Factor</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{stats.profitFactor > 900 ? '∞' : stats.profitFactor.toFixed(2)}</div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, borderLeft: '3px solid var(--accent-red)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Max Drawdown</div>
            <div className="pnl-negative" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{stats.maxDD.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* WIN/LOSS BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 20, border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Winning Trades</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-green)', marginTop: 4 }}>{stats.wins}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Avg Win: <strong style={{ color: 'var(--accent-green)' }}>{fmtCurrency(stats.avgWin)}</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Best: <strong style={{ color: 'var(--accent-green)' }}>{fmtCurrencyWithSign(stats.biggestWin)}</strong>
          </div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 20, border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Losing Trades</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-red)', marginTop: 4 }}>{stats.losses}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Avg Loss: <strong style={{ color: 'var(--accent-red)' }}>-{fmtCurrency(stats.avgLoss)}</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Worst: <strong style={{ color: 'var(--accent-red)' }}>{fmtCurrencyWithSign(stats.biggestLoss)}</strong>
          </div>
        </div>
      </div>

      {/* INSIGHTS */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid var(--border-color)' }}>
        <div className="chart-card-title" style={{ marginBottom: 16 }}>💡 Key Insights</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{stats.winRate >= 50 ? '✅' : '⚠️'}</span>
            <span style={{ fontSize: 13 }}>
              Your win rate is <strong style={{ color: stats.winRate >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{stats.winRate.toFixed(1)}%</strong>
              {stats.winRate >= 50 ? ' - Above average!' : ' - Focus on trade selection'}
            </span>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{stats.rr >= 2 ? '🎯' : stats.rr >= 1 ? '✅' : '⚠️'}</span>
            <span style={{ fontSize: 13 }}>
              Risk-Reward is <strong>{stats.rr.toFixed(2)}</strong>
              {stats.rr >= 2 ? ' - Excellent!' : stats.rr >= 1 ? ' - Good balance' : ' - Aim for 1:2 or higher'}
            </span>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{advanced && advanced.expectancy >= 0 ? '💰' : '📉'}</span>
            <span style={{ fontSize: 13 }}>
              Expected profit per trade: <strong className={advanced && advanced.expectancy >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                {advanced ? fmtCurrencyWithSign(Math.round(advanced.expectancy)) : '-'}
              </strong>
            </span>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{stats.maxDD <= 10 ? '🛡️' : stats.maxDD <= 20 ? '⚠️' : '🚨'}</span>
            <span style={{ fontSize: 13 }}>
              Maximum drawdown was <strong className="pnl-negative">{stats.maxDD.toFixed(1)}%</strong>
              {stats.maxDD <= 10 ? ' - Well controlled' : stats.maxDD <= 20 ? ' - Monitor closely' : ' - High risk!'}
            </span>
          </div>
        </div>
      </div>

      {/* PRINT BUTTON */}
      <div style={{ textAlign: 'center', padding: 20 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          Generated by TradeVault Pro Journal • {format(new Date(), 'dd MMM yyyy HH:mm')}
        </p>
      </div>
    </div>
  );
}
export default App;