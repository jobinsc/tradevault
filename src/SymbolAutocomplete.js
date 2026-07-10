// src/SymbolAutocomplete.js
import React, { useState, useEffect, useRef } from 'react';
import { searchStocksLive, getPopularStocks } from './stocksDatabase';

function SymbolAutocomplete({ value, onChange, placeholder = "Type to search any stock..." }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.length === 0) {
      setSuggestions(getPopularStocks().slice(0, 8));
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchStocksLive(inputValue);
      setSuggestions(results);
      setLoading(false);
    }, 300); // 300ms delay to avoid too many API calls

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    onChange(newValue);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleSelectStock = (stock) => {
    setInputValue(stock.symbol);
    onChange(stock.symbol);
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectStock(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const getExchangeColor = (exchange) => {
    if (exchange === 'NSE') return '#10b981';
    if (exchange === 'BSE') return '#3b82f6';
    if (exchange === 'US') return '#f59e0b';
    return '#94a3b8';
  };

  const getExchangeEmoji = (exchange) => {
    if (exchange === 'NSE') return '🇮🇳';
    if (exchange === 'BSE') return '🇮🇳';
    if (exchange === 'US') return '🇺🇸';
    return '🌍';
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          fontSize: 14,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      />
      
      {loading && (
        <div style={{ 
          position: 'absolute', 
          right: 14, 
          top: '50%', 
          transform: 'translateY(-50%)',
          fontSize: 11,
          color: '#94a3b8',
        }}>
          ⏳ Searching...
        </div>
      )}
      
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: '#1a1f35',
          border: '1px solid #2a3150',
          borderRadius: 10,
          maxHeight: 400,
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}>
          {inputValue.length === 0 && (
            <div style={{ 
              padding: '8px 14px', 
              fontSize: 10, 
              color: '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: 1,
              fontWeight: 700,
              background: '#0f172a',
              borderBottom: '1px solid #2a3150',
            }}>
              ⭐ Popular Stocks (type to search all)
            </div>
          )}
          
          {inputValue.length > 0 && !loading && (
            <div style={{ 
              padding: '8px 14px', 
              fontSize: 10, 
              color: '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: 1,
              fontWeight: 700,
              background: '#0f172a',
              borderBottom: '1px solid #2a3150',
            }}>
              🔍 {suggestions.length} results found
            </div>
          )}
          
          {suggestions.map((stock, index) => (
            <div
              key={`${stock.symbol}-${stock.exchange}-${index}`}
              onClick={() => handleSelectStock(stock)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                background: selectedIndex === index ? '#2a3150' : 'transparent',
                borderBottom: '1px solid rgba(42,49,80,0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: 14, 
                  color: '#fff',
                  marginBottom: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span>{getExchangeEmoji(stock.exchange)}</span>
                  <span>{stock.symbol}</span>
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {stock.name}
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end',
                gap: 4,
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 9,
                  padding: '2px 8px',
                  background: getExchangeColor(stock.exchange),
                  color: '#fff',
                  borderRadius: 4,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}>
                  {stock.exchange}
                </span>
                {stock.sector && stock.sector !== 'Stock' && (
                  <span style={{
                    fontSize: 9,
                    color: '#64748b',
                    fontWeight: 600,
                  }}>
                    {stock.sector.substring(0, 12)}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {inputValue.length > 0 && !loading && suggestions.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
              <div>No stocks found for "{inputValue}"</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                You can still type any symbol manually
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SymbolAutocomplete;