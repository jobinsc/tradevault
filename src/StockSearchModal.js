// src/StockSearchModal.js
// World-class stock search modal (like Zerodha/Groww)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ALL_STOCKS } from './allStocks';

function StockSearchModal({ isOpen, onClose, onSelect, currentValue }) {
  const [search, setSearch] = useState('');
  const [recentStocks, setRecentStocks] = useState([]);
  const inputRef = useRef(null);

  // Load recent stocks from localStorage
  useEffect(() => {
    if (isOpen) {
      const recent = JSON.parse(localStorage.getItem('recentStocks') || '[]');
      setRecentStocks(recent);
      // Auto-focus search input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fast search using useMemo (only recalculates when search changes)
  const searchResults = useMemo(() => {
    if (!search || search.length === 0) return [];
    
    const q = search.toUpperCase().trim();
    
    // Priority 1: Symbol starts with query
    const exactSymbol = ALL_STOCKS.filter(s => 
      s.symbol.toUpperCase().startsWith(q)
    );
    
    // Priority 2: Symbol contains query
    const symbolContains = ALL_STOCKS.filter(s => 
      !s.symbol.toUpperCase().startsWith(q) && 
      s.symbol.toUpperCase().includes(q)
    );
    
    // Priority 3: Name contains query
    const nameContains = ALL_STOCKS.filter(s => 
      !s.symbol.toUpperCase().includes(q) &&
      s.name.toUpperCase().includes(q)
    );
    
    return [...exactSymbol, ...symbolContains, ...nameContains].slice(0, 50);
  }, [search]);

  const handleSelect = (stock) => {
    // Save to recent stocks
    const newRecent = [
      stock,
      ...recentStocks.filter(s => s.symbol !== stock.symbol)
    ].slice(0, 10);
    
    localStorage.setItem('recentStocks', JSON.stringify(newRecent));
    setRecentStocks(newRecent);
    
    // Return selected stock
    onSelect(stock.symbol);
    onClose();
    setSearch('');
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const clearRecent = () => {
    if (window.confirm('Clear recent stocks history?')) {
      localStorage.removeItem('recentStocks');
      setRecentStocks([]);
    }
  };

  if (!isOpen) return null;

  const stocksToShow = search.length > 0 ? searchResults : recentStocks;
  const showingRecent = search.length === 0 && recentStocks.length > 0;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.searchContainer}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search 7,500+ stocks (e.g., RELIANCE, TCS)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={styles.clearButton}
              >
                ✕
              </button>
            )}
          </div>
          <button onClick={handleClose} style={styles.closeButton}>
            Cancel
          </button>
        </div>

        {/* Stats Bar */}
        {search.length > 0 && (
          <div style={styles.statsBar}>
            <span style={styles.statsText}>
              🔎 Found <strong>{searchResults.length}</strong> stocks matching "{search}"
            </span>
          </div>
        )}

        {/* Recent Header */}
        {showingRecent && (
          <div style={styles.sectionHeader}>
            <span>📌 RECENT STOCKS</span>
            <button onClick={clearRecent} style={styles.clearRecentBtn}>
              Clear
            </button>
          </div>
        )}

        {/* Empty State */}
        {search.length === 0 && recentStocks.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>Search Any Stock</h3>
            <p style={styles.emptyText}>
              Type stock symbol or company name to search from<br/>
              <strong>7,500+ NSE + BSE stocks</strong>
            </p>
            <div style={styles.exampleContainer}>
              <div style={styles.exampleTitle}>Try searching:</div>
              {['RELIANCE', 'TCS', 'HDFC', 'INFY', 'ADANI'].map(ex => (
                <button
                  key={ex}
                  onClick={() => setSearch(ex)}
                  style={styles.exampleButton}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {search.length > 0 && searchResults.length === 0 && (
          <div style={styles.noResults}>
            <div style={styles.noResultsIcon}>😕</div>
            <h3>No stocks found for "{search}"</h3>
            <p style={styles.noResultsText}>
              Don't worry! You can still use this symbol manually.
            </p>
            <button
              onClick={() => {
                onSelect(search.toUpperCase());
                onClose();
                setSearch('');
              }}
              style={styles.useCustomBtn}
            >
              ✅ Use "{search.toUpperCase()}" anyway
            </button>
          </div>
        )}

        {/* Stock List */}
        {stocksToShow.length > 0 && (
          <div style={styles.stockList}>
            {stocksToShow.map((stock, idx) => (
              <div
                key={`${stock.symbol}-${stock.exchange}-${idx}`}
                onClick={() => handleSelect(stock)}
                style={{
                  ...styles.stockItem,
                  ...(currentValue === stock.symbol ? styles.stockItemActive : {}),
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.background = '#2a3150';
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a3150';
                }}
                onMouseLeave={(e) => {
                  if (currentValue !== stock.symbol) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={styles.stockInfo}>
                  <div style={styles.stockSymbol}>
                    {stock.symbol}
                    {currentValue === stock.symbol && (
                      <span style={styles.selectedBadge}>✓ Selected</span>
                    )}
                  </div>
                  <div style={styles.stockName}>{stock.name}</div>
                </div>
                <span style={{
                  ...styles.exchangeBadge,
                  background: stock.exchange === 'NSE' ? '#10b981' : '#3b82f6',
                }}>
                  {stock.exchange}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            💡 Tip: Type symbol or company name for instant results
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '20px 10px',
    animation: 'fadeIn 0.2s',
  },
  modal: {
    background: '#0f172a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #2a3150',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottom: '1px solid #2a3150',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    background: '#1a1f35',
  },
  searchContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    background: '#0f172a',
    borderRadius: 10,
    padding: '10px 14px',
    border: '2px solid #3b82f6',
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  clearButton: {
    background: '#334155',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 24,
    height: 24,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
  },
  closeButton: {
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  statsBar: {
    padding: '10px 16px',
    background: '#1e293b',
    borderBottom: '1px solid #2a3150',
  },
  statsText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sectionHeader: {
    padding: '12px 16px',
    background: '#1e293b',
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 700,
    letterSpacing: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2a3150',
  },
  clearRecentBtn: {
    background: 'transparent',
    color: '#ef4444',
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  },
  emptyState: {
    padding: 40,
    textAlign: 'center',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 1.6,
  },
  exampleContainer: {
    marginTop: 24,
  },
  exampleTitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exampleButton: {
    margin: 4,
    padding: '6px 14px',
    background: '#1e293b',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  noResults: {
    padding: 40,
    textAlign: 'center',
    color: '#94a3b8',
  },
  noResultsIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 13,
    marginBottom: 20,
  },
  useCustomBtn: {
    padding: '10px 20px',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  stockList: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
  },
  stockItem: {
    padding: '14px 12px',
    cursor: 'pointer',
    borderRadius: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    borderBottom: '1px solid rgba(42,49,80,0.3)',
    transition: 'background 0.15s',
    minHeight: 60,
  },
  stockItemActive: {
    background: '#1e40af !important',
    border: '1px solid #3b82f6',
  },
  stockInfo: {
    flex: 1,
    minWidth: 0,
  },
  stockSymbol: {
    fontWeight: 700,
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  selectedBadge: {
    fontSize: 10,
    background: '#10b981',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 600,
  },
  stockName: {
    fontSize: 12,
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  exchangeBadge: {
    fontSize: 10,
    padding: '4px 10px',
    color: '#fff',
    borderRadius: 4,
    fontWeight: 700,
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  footer: {
    padding: 12,
    borderTop: '1px solid #2a3150',
    background: '#1a1f35',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
  },
};

export default StockSearchModal;