import React from 'react';

const TRADE_TYPE_GROUPS = [
  { 
    value: 'all', 
    label: '📊 All Trades', 
    color: '#3b82f6',
    types: [],
    description: 'Show all trades'
  },
  { 
    value: 'intraday', 
    label: '⚡ Intraday', 
    color: '#f59e0b',
    types: ['intraday', 'scalp'],
    description: 'Same-day trades (Intraday + Scalping)'
  },
  { 
    value: 'swing', 
    label: '🌊 Swing/Positional', 
    color: '#8b5cf6',
    types: ['swing', 'positional', 'btst'],
    description: 'Multi-day trades (Swing + Positional + BTST)'
  },
  { 
    value: 'investment', 
    label: '💎 Investment', 
    color: '#10b981',
    types: ['delivery', 'investment'],
    description: 'Long-term holdings (Delivery + Investment)'
  },
];

function TradeTypeFilter({ selected, onChange, trades }) {
  // Count trades in each category
  const getCount = (group) => {
    if (group.value === 'all') return trades.length;
    return trades.filter(t => group.types.includes(t.tradeType)).length;
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
          🎯 Filter by Trading Style
        </div>
        {selected !== 'all' && (
          <button
            onClick={() => onChange('all')}
            style={{
              padding: '4px 10px',
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✕ Clear Filter
          </button>
        )}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 8 
      }}>
        {TRADE_TYPE_GROUPS.map(group => {
          const count = getCount(group);
          const isSelected = selected === group.value;
          
          return (
            <button
              key={group.value}
              onClick={() => onChange(group.value)}
              disabled={count === 0 && group.value !== 'all'}
              style={{
                padding: 12,
                background: isSelected ? group.color : 'var(--bg-input)',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                border: `2px solid ${isSelected ? group.color : 'transparent'}`,
                borderRadius: 10,
                cursor: count === 0 && group.value !== 'all' ? 'not-allowed' : 'pointer',
                opacity: count === 0 && group.value !== 'all' ? 0.4 : 1,
                transition: 'all 0.2s',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                if (!isSelected && count > 0) {
                  e.currentTarget.style.borderColor = group.color;
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{group.label}</span>
                <span style={{
                  background: isSelected ? 'rgba(255,255,255,0.2)' : group.color,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              </div>
              <div style={{ 
                fontSize: 10, 
                color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
                lineHeight: 1.3,
              }}>
                {group.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to filter trades based on selected type
export const filterTradesByType = (trades, selectedType) => {
  if (selectedType === 'all') return trades;
  
  const group = TRADE_TYPE_GROUPS.find(g => g.value === selectedType);
  if (!group) return trades;
  
  return trades.filter(t => group.types.includes(t.tradeType));
};

// Helper to get label
export const getTypeLabel = (selectedType) => {
  const group = TRADE_TYPE_GROUPS.find(g => g.value === selectedType);
  return group?.label || '📊 All Trades';
};

// Helper to get color
export const getTypeColor = (selectedType) => {
  const group = TRADE_TYPE_GROUPS.find(g => g.value === selectedType);
  return group?.color || '#3b82f6';
};

export default TradeTypeFilter;