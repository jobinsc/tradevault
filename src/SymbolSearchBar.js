// src/SymbolSearchBar.js
import React, { useState, useEffect, useRef } from 'react';
import allStocks from './allStocks';

// Popular Indian stocks for quick access
// Major Indian Indices (for quick access at top)
const INDICES = [
  { symbol: 'NIFTY', yahoo: '^NSEI', name: 'Nifty 50', type: 'index' },
  { symbol: 'BANKNIFTY', yahoo: '^NSEBANK', name: 'Bank Nifty', type: 'index' },
  { symbol: 'SENSEX', yahoo: '^BSESN', name: 'BSE Sensex', type: 'index' },
  { symbol: 'NIFTYMIDCAP', yahoo: 'NIFTY_MIDCAP_100.NS', name: 'Nifty Midcap 100', type: 'index' },
  { symbol: 'NIFTYSMALLCAP', yahoo: '^CNXSC', name: 'Nifty Smallcap 100', type: 'index' },
  { symbol: 'NIFTYIT', yahoo: '^CNXIT', name: 'Nifty IT', type: 'index' },
  { symbol: 'NIFTYAUTO', yahoo: '^CNXAUTO', name: 'Nifty Auto', type: 'index' },
  { symbol: 'NIFTYPHARMA', yahoo: '^CNXPHARMA', name: 'Nifty Pharma', type: 'index' },
  { symbol: 'NIFTYMETAL', yahoo: '^CNXMETAL', name: 'Nifty Metal', type: 'index' },
  { symbol: 'NIFTYFMCG', yahoo: '^CNXFMCG', name: 'Nifty FMCG', type: 'index' },
];

// Popular Indian stocks for quick access
const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp' },
  { symbol: 'ITC', name: 'ITC Limited' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
];
function SymbolSearchBar({ currentSymbol, onSymbolChange, theme }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [results, setResults] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chart_recent_stocks');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {}
  }, []);

  // Save recent searches
  const saveRecent = (symbol) => {
    try {
      const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('chart_recent_stocks', JSON.stringify(updated));
    } catch (e) {}
  };

  // Search stocks
  useEffect(() => {
    if (!search || search.length < 1) {
      setResults([]);
      return;
    }

    const q = search.toUpperCase();
    const stockList = allStocks || [];
    
    // Filter and sort
    // Search in indices first
    const indexMatches = INDICES.filter(idx => 
      idx.symbol.toUpperCase().includes(q) || 
      idx.name.toUpperCase().includes(q)
    );
    
    // Search in stocks
    const stockMatches = stockList
      .filter(s => {
        const sym = (typeof s === 'string' ? s : s.symbol || '').toUpperCase();
        const name = (typeof s === 'object' && s.name ? s.name : '').toUpperCase();
        return sym.startsWith(q) || sym.includes(q) || name.includes(q);
      })
      .slice(0, 15)
      .map(s => {
        if (typeof s === 'string') return { symbol: s, name: s, type: 'stock' };
        return { symbol: s.symbol || s, name: s.name || s.symbol || s, type: 'stock' };
      });
    
    // Combine: indices first, then stocks
    setResults([...indexMatches, ...stockMatches].slice(0, 20));
  }, [search]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (symbol) => {
    const sym = symbol.toUpperCase();
    saveRecent(sym);
    onSymbolChange(sym);
    setSearch('');
    setIsOpen(false);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleSelectStock(results[0].symbol);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const bg = theme?.bg || '#0f172a';
  const cardBg = theme?.cardBg || '#1e293b';
  const text = theme?.text || '#94a3b8';
  const textPrimary = theme?.textPrimary || '#fff';
  const border = theme?.border || '#334155';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: '6px 12px',
        gap: 8,
      }}>
        <span style={{ color: text, fontSize: 14 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search stocks... (Current: ${currentSymbol})`}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: textPrimary,
            fontSize: 13,
            fontWeight: 600,
          }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); if (inputRef.current) inputRef.current.focus(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: text,
              cursor: 'pointer',
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 10000,
          maxHeight: 400,
          overflow: 'auto',
        }}>
          {/* Search Results */}
          {search && results.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px',
                fontSize: 10,
                fontWeight: 700,
                color: text,
                textTransform: 'uppercase',
                letterSpacing: 1,
                borderBottom: `1px solid ${border}`,
              }}>
                🔍 Search Results ({results.length})
              </div>
              {results.map((stock, i) => (
                <button
                  key={`result-${stock.symbol}-${i}`}
                  onClick={() => handleSelectStock(stock.symbol)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${border}`,
                    color: textPrimary,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = bg}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{stock.symbol}</div>
                    <div style={{ fontSize: 11, color: text, marginTop: 2 }}>{stock.name}</div>
                  </div>
                  <span style={{
                    background: '#10b981',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>NSE</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {search && results.length === 0 && (
            <div style={{
              padding: 20,
              textAlign: 'center',
              color: text,
              fontSize: 13,
            }}>
              No stocks found for "{search}"
            </div>
          )}

          {/* Recent Searches (only when no search text) */}
          {!search && recentSearches.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px',
                fontSize: 10,
                fontWeight: 700,
                color: text,
                textTransform: 'uppercase',
                letterSpacing: 1,
                borderBottom: `1px solid ${border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>🕐 Recent Searches</span>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('chart_recent_stocks');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((symbol, i) => (
                <button
                  key={`recent-${symbol}-${i}`}
                  onClick={() => handleSelectStock(symbol)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${border}`,
                    color: textPrimary,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = bg}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{symbol}</div>
                  <span style={{ fontSize: 10, color: text }}>Recent ↗</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Stocks (only when no search text) */}
          {!search && (
            <div>
              <div style={{
                padding: '8px 12px',
                fontSize: 10,
                fontWeight: 700,
                color: text,
                textTransform: 'uppercase',
                letterSpacing: 1,
                borderBottom: `1px solid ${border}`,
              }}>
                ⭐ Popular Stocks
              </div>
              {
              POPULAR_STOCKS.map((stock, i) => (
                <button
                  key={`popular-${stock.symbol}-${i}`}
                  onClick={() => handleSelectStock(stock.symbol)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${border}`,
                    color: textPrimary,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = bg}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{stock.symbol}</div>
                    <div style={{ fontSize: 11, color: text, marginTop: 2 }}>{stock.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '8px 12px',
            fontSize: 10,
            color: text,
            textAlign: 'center',
            borderTop: `1px solid ${border}`,
          }}>
            💡 Press Enter for first result • Esc to close
          </div>
        </div>
      )}
    </div>
  );
}

export default SymbolSearchBar;