// src/IndicatorsModal.js
import React, { useState } from 'react';

// All available indicators
const INDICATORS = {
  'Moving Averages': [
    { id: 'sma', name: 'Simple Moving Average (SMA)', hasPeriod: true, defaultPeriod: 20, color: '#f59e0b' },
    { id: 'ema', name: 'Exponential Moving Average (EMA)', hasPeriod: true, defaultPeriod: 20, color: '#8b5cf6' },
    { id: 'wma', name: 'Weighted Moving Average (WMA)', hasPeriod: true, defaultPeriod: 20, color: '#06b6d4' },
    { id: 'vwap', name: 'Volume Weighted Average Price (VWAP)', hasPeriod: false, color: '#10b981' },
  ],
  'Oscillators': [
    { id: 'rsi', name: 'Relative Strength Index (RSI)', hasPeriod: true, defaultPeriod: 14, color: '#8b5cf6', separatePanel: true },
    { id: 'macd', name: 'MACD (12,26,9)', hasPeriod: false, color: '#3b82f6', separatePanel: true },
    { id: 'stochastic', name: 'Stochastic (%K, %D)', hasPeriod: true, defaultPeriod: 14, color: '#ec4899', separatePanel: true },
    { id: 'cci', name: 'Commodity Channel Index (CCI)', hasPeriod: true, defaultPeriod: 20, color: '#f59e0b', separatePanel: true },
    { id: 'williams', name: 'Williams %R', hasPeriod: true, defaultPeriod: 14, color: '#06b6d4', separatePanel: true },
  ],
  'Bands & Channels': [
    { id: 'bollinger', name: 'Bollinger Bands (20, 2)', hasPeriod: true, defaultPeriod: 20, color: '#3b82f6' },
    { id: 'keltner', name: 'Keltner Channels', hasPeriod: true, defaultPeriod: 20, color: '#ec4899' },
    { id: 'donchian', name: 'Donchian Channels', hasPeriod: true, defaultPeriod: 20, color: '#f59e0b' },
  ],
  'Volume': [
    { id: 'volume', name: 'Volume', hasPeriod: false, color: '#10b981' },
    { id: 'obv', name: 'On Balance Volume (OBV)', hasPeriod: false, color: '#8b5cf6', separatePanel: true },
    { id: 'volume_ma', name: 'Volume Moving Average', hasPeriod: true, defaultPeriod: 20, color: '#f59e0b' },
  ],
  'Trend': [
    { id: 'supertrend', name: 'Supertrend', hasPeriod: true, defaultPeriod: 10, color: '#10b981' },
    { id: 'ichimoku', name: 'Ichimoku Cloud', hasPeriod: false, color: '#8b5cf6' },
    { id: 'parabolic_sar', name: 'Parabolic SAR', hasPeriod: false, color: '#f59e0b' },
    { id: 'adx', name: 'Average Directional Index (ADX)', hasPeriod: true, defaultPeriod: 14, color: '#ec4899', separatePanel: true },
  ],
  'Volatility': [
    { id: 'atr', name: 'Average True Range (ATR)', hasPeriod: true, defaultPeriod: 14, color: '#3b82f6', separatePanel: true },
    { id: 'std_dev', name: 'Standard Deviation', hasPeriod: true, defaultPeriod: 20, color: '#06b6d4', separatePanel: true },
  ],
};

function IndicatorsModal({ isOpen, onClose, activeIndicators, onToggleIndicator, onUpdatePeriod, theme }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!isOpen) return null;

  const bg = theme?.bg || '#0f172a';
  const cardBg = theme?.cardBg || '#1e293b';
  const text = theme?.text || '#94a3b8';
  const textPrimary = theme?.textPrimary || '#fff';
  const border = theme?.border || '#334155';

  const categories = ['All', ...Object.keys(INDICATORS)];

  // Filter indicators
  const filteredIndicators = {};
  Object.keys(INDICATORS).forEach(category => {
    if (selectedCategory !== 'All' && selectedCategory !== category) return;
    
    const filtered = INDICATORS[category].filter(ind =>
      !search || 
      ind.name.toLowerCase().includes(search.toLowerCase()) ||
      ind.id.toLowerCase().includes(search.toLowerCase())
    );
    
    if (filtered.length > 0) {
      filteredIndicators[category] = filtered;
    }
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: 20,
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: cardBg,
          borderRadius: 12,
          maxWidth: 700,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${border}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: 18, 
            fontWeight: 700, 
            color: textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            📊 Indicators & Studies
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: text,
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: 16, borderBottom: `1px solid ${border}` }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 8,
            padding: '8px 12px',
            gap: 8,
          }}>
            <span style={{ color: text, fontSize: 14 }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search indicators..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: textPrimary,
                fontSize: 13,
              }}
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: text,
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 0,
                }}
              >✕</button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                background: selectedCategory === cat ? '#3b82f6' : bg,
                color: selectedCategory === cat ? '#fff' : textPrimary,
                border: `1px solid ${border}`,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* Indicators List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
        }}>
          {Object.keys(filteredIndicators).length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: text }}>
              No indicators found for "{search}"
            </div>
          ) : (
            Object.entries(filteredIndicators).map(([category, indicators]) => (
              <div key={category}>
                <div style={{
                  padding: '10px 20px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: text,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  background: bg,
                  borderTop: `1px solid ${border}`,
                  borderBottom: `1px solid ${border}`,
                }}>
                  {category}
                </div>
                {indicators.map(ind => {
                  const isActive = activeIndicators?.[ind.id]?.enabled || false;
                  const currentPeriod = activeIndicators?.[ind.id]?.period || ind.defaultPeriod;
                  
                  return (
                    <div
                      key={ind.id}
                      style={{
                        padding: '12px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            width: 12, height: 12, borderRadius: 2,
                            background: ind.color,
                          }}></span>
                          <span style={{ 
                            fontSize: 13, 
                            fontWeight: 600, 
                            color: textPrimary 
                          }}>{ind.name}</span>
                          {ind.separatePanel && (
                            <span style={{
                              fontSize: 9,
                              padding: '2px 6px',
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#8b5cf6',
                              borderRadius: 4,
                              fontWeight: 700,
                            }}>SEPARATE PANEL</span>
                          )}
                        </div>
                        {ind.hasPeriod && isActive && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: text }}>Period:</span>
                            <input
                              type="number"
                              value={currentPeriod}
                              min="1"
                              max="500"
                              onChange={(e) => onUpdatePeriod(ind.id, parseInt(e.target.value) || ind.defaultPeriod)}
                              style={{
                                width: 60,
                                padding: '2px 8px',
                                background: bg,
                                border: `1px solid ${border}`,
                                borderRadius: 4,
                                color: textPrimary,
                                fontSize: 11,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onToggleIndicator(ind.id, ind.defaultPeriod)}
                        style={{
                          padding: '6px 16px',
                          background: isActive ? '#ef4444' : '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          minWidth: 80,
                        }}
                      >
                        {isActive ? '✕ Remove' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: text,
        }}>
          <span>
            {Object.values(activeIndicators || {}).filter(v => v?.enabled).length} indicators active
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >Done</button>
        </div>
      </div>
    </div>
  );
}

export default IndicatorsModal;