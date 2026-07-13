// src/Watchlist.js
import React, { useState, useEffect, useMemo } from 'react';
import { addToWatchlist, removeFromWatchlist, loadWatchlist } from './watchlistService';
import { fetchStockPrice } from './priceService';
import { auth } from './firebase';
import SymbolSearchBar from './SymbolSearchBar';

function Watchlist({ onStockClick }) {
  const [watchlist, setWatchlist] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(auth.currentUser?.uid || null);
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // NEW - Sort state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await loadWatchlist(userId);
      setWatchlist(list);
      setLoading(false);
      if (list.length > 0) fetchAllPrices(list);
    };
    load();
  }, [userId]);

  const fetchAllPrices = async (list) => {
    setRefreshing(true);
    const newPrices = {};
    await Promise.all(
      list.map(async (symbol) => {
        const data = await fetchStockPrice(symbol);
        if (data) newPrices[symbol] = data;
      })
    );
    setPrices(newPrices);
    setRefreshing(false);
  };

  useEffect(() => {
    if (watchlist.length === 0) return;
    const interval = setInterval(() => {
      fetchAllPrices(watchlist);
    }, 30000);
    return () => clearInterval(interval);
  }, [watchlist]);

  const handleAdd = async (symbol) => {
    if (watchlist.includes(symbol.toUpperCase())) {
      alert(`${symbol} is already in your watchlist!`);
      return;
    }
    await addToWatchlist(userId, symbol);
    const newList = [...watchlist, symbol.toUpperCase()];
    setWatchlist(newList);
    setShowAdd(false);
    const data = await fetchStockPrice(symbol);
    if (data) {
      setPrices(prev => ({ ...prev, [symbol.toUpperCase()]: data }));
    }
  };

  const handleRemove = async (symbol) => {
    if (!window.confirm(`Remove ${symbol} from watchlist?`)) return;
    await removeFromWatchlist(userId, symbol);
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setPrices(prev => {
      const updated = { ...prev };
      delete updated[symbol];
      return updated;
    });
  };

  const fmt = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // NEW - Sort handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: null, direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
  };

  // NEW - Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '⇅';
    if (sortConfig.direction === 'asc') return '↑';
    return '↓';
  };

  // NEW - Sorted watchlist
  const sortedWatchlist = useMemo(() => {
    if (!sortConfig.key) return watchlist;
    
    return [...watchlist].sort((a, b) => {
      const priceA = prices[a];
      const priceB = prices[b];
      
      let valA, valB;
      
      switch (sortConfig.key) {
        case 'symbol':
          valA = a;
          valB = b;
          break;
        case 'price':
          valA = priceA?.price || 0;
          valB = priceB?.price || 0;
          break;
        case 'change':
          valA = priceA ? (priceA.price - priceA.previousClose) : 0;
          valB = priceB ? (priceB.price - priceB.previousClose) : 0;
          break;
        case 'changePct':
          valA = priceA && priceA.previousClose ? ((priceA.price - priceA.previousClose) / priceA.previousClose * 100) : 0;
          valB = priceB && priceB.previousClose ? ((priceB.price - priceB.previousClose) / priceB.previousClose * 100) : 0;
          break;
        case 'high':
          valA = priceA?.high || 0;
          valB = priceB?.high || 0;
          break;
        case 'low':
          valA = priceA?.low || 0;
          valB = priceB?.low || 0;
          break;
        case 'volume':
          valA = priceA?.volume || 0;
          valB = priceB?.volume || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [watchlist, prices, sortConfig]);

  // NEW - Calculate total change in points
  const totalStats = useMemo(() => {
    let totalChange = 0;
    let totalGainers = 0;
    let totalLosers = 0;
    let totalUnchanged = 0;
    let totalValue = 0;
    let totalPreviousValue = 0;

    watchlist.forEach(symbol => {
      const price = prices[symbol];
      if (price) {
        const change = price.price - price.previousClose;
        totalChange += change;
        totalValue += price.price;
        totalPreviousValue += price.previousClose;
        
        if (change > 0) totalGainers++;
        else if (change < 0) totalLosers++;
        else totalUnchanged++;
      }
    });

    const avgChangePct = totalPreviousValue > 0 
      ? ((totalValue - totalPreviousValue) / totalPreviousValue * 100) 
      : 0;

    return {
      totalChange,
      totalGainers,
      totalLosers,
      totalUnchanged,
      avgChangePct,
    };
  }, [watchlist, prices]);

  // Sortable header component
  const SortableHeader = ({ label, sortKey, textAlign = 'left' }) => (
    <th 
      style={{
        ...thStyle,
        textAlign,
        cursor: 'pointer',
        userSelect: 'none',
        background: sortConfig.key === sortKey ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-input)',
      }}
      onClick={() => handleSort(sortKey)}
      title={`Click to sort by ${label}`}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ 
          fontSize: 10, 
          opacity: sortConfig.key === sortKey ? 1 : 0.5,
          color: sortConfig.key === sortKey ? '#3b82f6' : 'inherit',
        }}>
          {getSortIcon(sortKey)}
        </span>
      </span>
    </th>
  );

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 16,
      padding: 20,
      border: '1px solid var(--border-color)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            👁️ My Watchlist
            {watchlist.length > 0 && (
              <span style={{
                background: '#3b82f6',
                color: '#fff',
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: 12,
              }}>
                {watchlist.length}
              </span>
            )}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {refreshing ? '🔄 Updating prices...' : '📊 Live prices update every 30 seconds • Click column headers to sort'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => fetchAllPrices(watchlist)}
            disabled={refreshing || watchlist.length === 0}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: refreshing ? 'wait' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              padding: '8px 16px',
              background: showAdd ? '#ef4444' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {showAdd ? '✕ Cancel' : '+ Add Stock'}
          </button>
        </div>
      </div>

      {/* NEW - Summary Stats Bar */}
      {watchlist.length > 0 && Object.keys(prices).length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 16,
          padding: 12,
          background: 'var(--bg-input)',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
        }}>
          {/* Total Change */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
              Total Change
            </div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 800,
              color: totalStats.totalChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {totalStats.totalChange >= 0 ? '↑' : '↓'} ₹{Math.abs(totalStats.totalChange).toFixed(2)}
            </div>
            <div style={{ 
              fontSize: 10, 
              color: totalStats.totalChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              fontWeight: 600,
            }}>
              points
            </div>
          </div>

          {/* Avg Change % */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
              Avg Change %
            </div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: 800,
              color: totalStats.avgChangePct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {totalStats.avgChangePct >= 0 ? '+' : ''}{totalStats.avgChangePct.toFixed(2)}%
            </div>
          </div>

          {/* Gainers */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
              Gainers 🟢
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-green)' }}>
              {totalStats.totalGainers}
            </div>
          </div>

          {/* Losers */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
              Losers 🔴
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-red)' }}>
              {totalStats.totalLosers}
            </div>
          </div>

          {/* Unchanged */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>
              Unchanged ⚪
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-muted)' }}>
              {totalStats.totalUnchanged}
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Search Bar */}
      {showAdd && (
        <div style={{
          padding: 12,
          background: 'var(--bg-input)',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            🔍 SEARCH & ADD TO WATCHLIST
          </div>
          <SymbolSearchBar 
            currentSymbol=""
            onSymbolChange={handleAdd}
            theme={{
              bg: 'var(--bg-card)',
              cardBg: 'var(--bg-input)',
              text: 'var(--text-muted)',
              textPrimary: 'var(--text-primary)',
              border: 'var(--border-color)',
            }}
          />
        </div>
      )}

      {/* Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Loading watchlist...
        </div>
      ) : watchlist.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          color: 'var(--text-muted)',
          background: 'var(--bg-input)',
          borderRadius: 8,
          border: '2px dashed var(--border-color)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👁️</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Your Watchlist is Empty</div>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            Add stocks to track their live prices and quickly access their charts
          </p>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add Your First Stock
          </button>
        </div>
      ) : (
        <div style={{ 
          border: '1px solid var(--border-color)', 
          borderRadius: 8, 
          overflow: 'hidden',
        }}>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <SortableHeader label="Symbol" sortKey="symbol" />
                  <SortableHeader label="Price" sortKey="price" />
                  <SortableHeader label="Change" sortKey="change" />
                  <SortableHeader label="Day High" sortKey="high" />
                  <SortableHeader label="Day Low" sortKey="low" />
                  <SortableHeader label="Volume" sortKey="volume" />
                  <th style={{...thStyle, textAlign: 'center', background: 'var(--bg-input)'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedWatchlist.map((symbol) => {
                  const price = prices[symbol];
                  const change = price ? (price.price - price.previousClose) : 0;
                  const changePct = price && price.previousClose ? ((change / price.previousClose) * 100) : 0;
                  const isProfit = change >= 0;
                  
                  return (
                    <tr 
                      key={symbol} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td 
                        style={{...tdStyle, fontWeight: 700, color: 'var(--accent-blue)'}} 
                        onClick={() => onStockClick && onStockClick(symbol)}
                      >
                        {symbol}
                      </td>
                      <td style={tdStyle} onClick={() => onStockClick && onStockClick(symbol)}>
                        {price ? `₹${fmt(price.price)}` : '⏳'}
                      </td>
                      <td 
                        style={{
                          ...tdStyle,
                          color: isProfit ? 'var(--accent-green)' : 'var(--accent-red)',
                          fontWeight: 700,
                        }}
                        onClick={() => onStockClick && onStockClick(symbol)}
                      >
                        {price ? (
                          <>
                            {isProfit ? '↑' : '↓'} ₹{Math.abs(change).toFixed(2)}
                            <div style={{ fontSize: 11, opacity: 0.8 }}>
                              ({isProfit ? '+' : ''}{changePct.toFixed(2)}%)
                            </div>
                          </>
                        ) : '⏳'}
                      </td>
                      <td 
                        style={{...tdStyle, color: 'var(--accent-green)'}}
                        onClick={() => onStockClick && onStockClick(symbol)}
                      >
                        {price ? `₹${fmt(price.high)}` : '-'}
                      </td>
                      <td 
                        style={{...tdStyle, color: 'var(--accent-red)'}}
                        onClick={() => onStockClick && onStockClick(symbol)}
                      >
                        {price ? `₹${fmt(price.low)}` : '-'}
                      </td>
                      <td 
                        style={tdStyle}
                        onClick={() => onStockClick && onStockClick(symbol)}
                      >
                        {price ? fmt(price.volume) : '-'}
                      </td>
                      <td style={{...tdStyle, textAlign: 'center'}}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStockClick && onStockClick(symbol);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#3b82f6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="View Chart"
                          >
                            📊 Chart
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(symbol);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'transparent',
                              color: '#ef4444',
                              border: '1px solid #ef4444',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="Remove from watchlist"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              
              {/* NEW - Total Row (Summary) */}
              {watchlist.length > 0 && Object.keys(prices).length > 0 && (
                <tfoot>
                  <tr style={{ 
                    background: 'var(--bg-input)',
                    borderTop: '2px solid var(--border-color)',
                  }}>
                    <td style={{...tdStyle, fontWeight: 800, color: 'var(--text-primary)'}}>
                      📊 TOTAL ({watchlist.length})
                    </td>
                    <td style={{...tdStyle, fontWeight: 700}}>
                      -
                    </td>
                    <td style={{
                      ...tdStyle, 
                      fontWeight: 800,
                      color: totalStats.totalChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                      {totalStats.totalChange >= 0 ? '↑' : '↓'} ₹{Math.abs(totalStats.totalChange).toFixed(2)}
                      <div style={{ fontSize: 11, opacity: 0.8 }}>
                        Avg: ({totalStats.avgChangePct >= 0 ? '+' : ''}{totalStats.avgChangePct.toFixed(2)}%)
                      </div>
                    </td>
                    <td style={tdStyle} colSpan={4}>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>🟢 {totalStats.totalGainers} up</span>
                      {' • '}
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>🔴 {totalStats.totalLosers} down</span>
                      {totalStats.totalUnchanged > 0 && (
                        <>
                          {' • '}
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>⚪ {totalStats.totalUnchanged} unchanged</span>
                        </>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Quick Add Popular */}
      {!showAdd && watchlist.length > 0 && watchlist.length < 10 && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'var(--bg-input)',
          borderRadius: 8,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            ⭐ QUICK ADD POPULAR STOCKS
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'NIFTY', 'BANKNIFTY', 'SENSEX', 'ICICIBANK', 'ITC'].filter(s => !watchlist.includes(s)).slice(0, 8).map(symbol => (
              <button
                key={symbol}
                onClick={() => handleAdd(symbol)}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + {symbol}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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
  transition: 'background 0.2s',
};

const tdStyle = { padding: 12, fontSize: 13 };

export default Watchlist;