import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { getSectorForSymbol, getSectorColor } from './sectorsDatabase';
import { fetchStockPrice, fetchFullStockData } from './priceService';

// TradingView Chart Widget
function TradingViewChart({ symbol, exchange = 'NSE' }) {
  const container = useRef(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `${exchange}:${symbol}`,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'in',
      toolbar_bg: '#1a1f35',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: false,
      studies: ['STD;SMA', 'STD;RSI'],
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
    });
    
    container.current.appendChild(script);
  }, [symbol, exchange]);

  return (
    <div 
      ref={container} 
      style={{ 
        height: 600, 
        width: '100%', 
        background: '#1a1f35',
        borderRadius: 12,
        overflow: 'hidden',
      }} 
    />
  );
}

// Format helpers
const fmt = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const fmtCr = (val) => {
  if (!val) return '-';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${fmt(num)}`;
};

const fmtCurrencyWithSign = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const num = Number(val);
  const sign = num >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// Main Stock Detail Page
function StockDetailPage({ symbol, trades, onBack }) {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState('NSE');

  const sector = getSectorForSymbol(symbol);
  const sectorColor = getSectorColor(sector);

  const stockTrades = useMemo(() => {
    return trades.filter(t => t.symbol?.toUpperCase() === symbol?.toUpperCase());
  }, [trades, symbol]);

  const stockStats = useMemo(() => {
    const closed = stockTrades.filter(t => t.status === 'closed');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const totalPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length * 100) : 0;
    const openCount = stockTrades.filter(t => t.status === 'open').length;
    return {
      total: stockTrades.length,
      closed: closed.length,
      open: openCount,
      wins: wins.length,
      losses: closed.length - wins.length,
      totalPnL,
      winRate,
    };
  }, [stockTrades]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchFullStockData(symbol);
        setPriceData(data);
      } catch (error) {
        console.error('Data fetch error:', error);
      }
      setLoading(false);
    };
    loadData();
    
    const interval = setInterval(async () => {
      const data = await fetchStockPrice(symbol);
      if (data) {
        setPriceData(prev => ({ ...prev, ...data }));
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  const price = priceData?.price;
  const prevClose = priceData?.previousClose;
  const change = price && prevClose ? price - prevClose : 0;
  const changePct = price && prevClose ? ((change / prevClose) * 100) : 0;
  const isProfit = change >= 0;

  return (
    <div style={{ padding: '0 4px' }}>
      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        style={{
          padding: '10px 18px',
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        ← Back
      </button>

      {/* STOCK HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        border: `2px solid ${sectorColor}`,
        boxShadow: `0 0 30px ${sectorColor}22`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>{symbol}</h1>
              <span style={{
                background: sectorColor,
                color: '#fff',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
              }}>
                {sector}
              </span>
              <span style={{
                background: exchange === 'NSE' ? '#10b981' : '#3b82f6',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
              }}>
                {exchange}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              Live data from Yahoo Finance • Chart by TradingView
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
              🔴 LIVE PRICE
            </div>
            {loading ? (
              <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>Loading...</div>
            ) : price ? (
              <>
                <div style={{ fontSize: 36, fontWeight: 800 }}>₹{fmt(price)}</div>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 700,
                  color: isProfit ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {isProfit ? '↑' : '↓'} ₹{Math.abs(change).toFixed(2)} ({isProfit ? '+' : ''}{changePct.toFixed(2)}%)
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Price unavailable</div>
            )}
          </div>
        </div>
      </div>

      {/* CANDLESTICK CHART */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📊 Advanced Candlestick Chart</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Interactive chart • Use toolbar for 5m, 15m, 1H, 1D, 1W, 1M timeframes
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setExchange('NSE')}
              style={{
                padding: '6px 12px',
                background: exchange === 'NSE' ? '#10b981' : 'var(--bg-input)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              NSE
            </button>
            <button
              onClick={() => setExchange('BSE')}
              style={{
                padding: '6px 12px',
                background: exchange === 'BSE' ? '#3b82f6' : 'var(--bg-input)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              BSE
            </button>
          </div>
        </div>
        <TradingViewChart symbol={symbol} exchange={exchange} />
      </div>

      {/* KEY STATS GRID */}
      {priceData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}>
          <StatBox label="Open" value={`₹${fmt(priceData.open)}`} />
          <StatBox label="High" value={`₹${fmt(priceData.high)}`} color="var(--accent-green)" />
          <StatBox label="Low" value={`₹${fmt(priceData.low)}`} color="var(--accent-red)" />
          <StatBox label="Prev Close" value={`₹${fmt(prevClose)}`} />
          <StatBox label="Volume" value={fmt(priceData.volume)} />
          <StatBox label="52W High" value={`₹${fmt(priceData.high52w)}`} color="var(--accent-green)" />
          <StatBox label="52W Low" value={`₹${fmt(priceData.low52w)}`} color="var(--accent-red)" />
          <StatBox label="Market Cap" value={fmtCr(priceData.marketCap)} />
        </div>
      )}

      {/* COMPANY INFO */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🏢 About {symbol}</h3>
        
        {priceData?.description && (
          <div style={{
            padding: 16,
            background: 'var(--bg-input)',
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>📝 Business Overview</strong>
            <p style={{ margin: '8px 0 0 0' }}>{priceData.description}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
          <InfoRow label="Symbol" value={symbol} />
          <InfoRow label="Exchange" value={exchange} />
          <InfoRow label="Sector" value={priceData?.sector || sector} color={sectorColor} />
          {priceData?.industry && <InfoRow label="Industry" value={priceData.industry} />}
          {priceData?.country && <InfoRow label="Country" value={priceData.country} />}
          {priceData?.city && <InfoRow label="Headquarters" value={priceData.city} />}
          {priceData?.employees > 0 && <InfoRow label="Employees" value={fmt(priceData.employees)} />}
        </div>

        {(priceData?.marketCap > 0 || priceData?.pe > 0) && (
          <>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>
              📊 Key Financial Metrics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
              {priceData?.marketCap > 0 && <InfoRow label="Market Cap" value={fmtCr(priceData.marketCap)} />}
              {priceData?.pe > 0 && <InfoRow label="P/E Ratio" value={fmt(priceData.pe)} />}
              {priceData?.eps > 0 && <InfoRow label="EPS" value={`₹${fmt(priceData.eps)}`} />}
              {priceData?.beta > 0 && <InfoRow label="Beta" value={fmt(priceData.beta)} />}
              {priceData?.dividendYield > 0 && <InfoRow label="Dividend Yield" value={`${fmt(priceData.dividendYield)}%`} color="var(--accent-green)" />}
            </div>
          </>
        )}

        <h4 style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>
          🔗 More Information
        </h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ExternalLink url={`https://www.screener.in/company/${symbol}/consolidated/`} label="📊 Screener.in" color="#3b82f6" />
          <ExternalLink url={`https://www.moneycontrol.com/india/stockpricequote/${symbol.toLowerCase()}`} label="💰 MoneyControl" color="#10b981" />
          <ExternalLink url={`https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`} label="🏛️ NSE India" color="#f59e0b" />
          <ExternalLink url={`https://www.tradingview.com/symbols/${exchange}-${symbol}/`} label="📈 TradingView" color="#8b5cf6" />
        </div>
      </div>

      {/* USER'S TRADES */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          📊 Your Trades in {symbol} ({stockStats.total})
        </h3>

        {stockStats.total > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}>
              <StatBox label="Total Trades" value={stockStats.total} />
              <StatBox label="Closed" value={stockStats.closed} />
              <StatBox label="Open" value={stockStats.open} color="var(--accent-blue)" />
              <StatBox label="Win Rate" value={`${stockStats.winRate.toFixed(1)}%`} color="var(--accent-green)" />
              <StatBox 
                label="Total P&L" 
                value={fmtCurrencyWithSign(stockStats.totalPnL)}
                color={stockStats.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
              />
            </div>

            <div style={{ overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Direction</th>
                    <th style={thStyle}>Entry</th>
                    <th style={thStyle}>Exit</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>P&L</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockTrades.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={tdStyle}>{t.entryDate ? format(parseISO(t.entryDate), 'dd MMM yy') : '-'}</td>
                      <td style={tdStyle}>{t.tradeType}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: t.direction === 'long' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                          color: t.direction === 'long' ? '#10b981' : '#ef4444',
                        }}>
                          {t.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td style={tdStyle}>₹{fmt(t.entryPrice)}</td>
                      <td style={tdStyle}>{t.exitPrice ? `₹${fmt(t.exitPrice)}` : '-'}</td>
                      <td style={tdStyle}>{t.quantity}</td>
                      <td style={{ 
                        ...tdStyle,
                        color: Number(t.pnl) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontWeight: 700,
                      }}>
                        {t.status === 'closed' ? fmtCurrencyWithSign(t.pnl) : '-'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: t.status === 'open' ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.2)',
                          color: t.status === 'open' ? '#3b82f6' : '#94a3b8',
                        }}>
                          {t.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p>You haven't traded {symbol} yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatBox({ label, value, color }) {
  return (
    <div style={{
      padding: 14,
      background: 'var(--bg-input)',
      borderRadius: 10,
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function ExternalLink({ url, label, color }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '8px 14px',
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label} ↗
    </a>
  );
}

const thStyle = {
  padding: 12,
  textAlign: 'left',
  fontSize: 11,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontWeight: 700,
  letterSpacing: 1,
};

const tdStyle = {
  padding: 12,
  fontSize: 13,
};

export default StockDetailPage;