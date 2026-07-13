// src/DrawingTools.js
import React from 'react';

const TOOLS = [
  { id: 'cursor', icon: '👆', name: 'Cursor', shortcut: 'V' },
  { id: 'trendline', icon: '📈', name: 'Trend Line', shortcut: 'T' },
  { id: 'horizontal', icon: '━', name: 'Horizontal Line', shortcut: 'H' },
  { id: 'vertical', icon: '┃', name: 'Vertical Line', shortcut: 'W' },
  { id: 'rectangle', icon: '▭', name: 'Rectangle', shortcut: 'R' },
  { id: 'fibonacci', icon: '🌀', name: 'Fibonacci Retracement', shortcut: 'F' },
  { id: 'text', icon: 'T', name: 'Text/Label', shortcut: 'A' },
  { id: 'arrow', icon: '➜', name: 'Arrow', shortcut: 'Y' },
  { id: 'ray', icon: '↗', name: 'Ray Line' },
];

function DrawingTools({ activeTool, onToolSelect, onClearAll, drawingsCount = 0, theme }) {
  const bg = theme?.bg || '#0f172a';
  const cardBg = theme?.cardBg || '#1e293b';
  const text = theme?.text || '#94a3b8';
  const textPrimary = theme?.textPrimary || '#fff';
  const border = theme?.border || '#334155';

  return (
    <div style={{
      position: 'absolute',
      left: 10,
      top: 80,
      background: cardBg,
      border: `2px solid ${border}`,
      borderRadius: 8,
      padding: 6,
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      zIndex: 100,
      boxShadow: '4px 4px 20px rgba(0,0,0,0.5)',
    }}>
      {/* Title */}
      <div style={{
        fontSize: 8,
        color: text,
        textAlign: 'center',
        fontWeight: 700,
        marginBottom: 4,
        textTransform: 'uppercase',
      }}>
        Tools
      </div>
      
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => onToolSelect(tool.id)}
          title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          style={{
            width: 40,
            height: 40,
            background: activeTool === tool.id ? '#3b82f6' : bg,
            color: activeTool === tool.id ? '#fff' : textPrimary,
            border: `1px solid ${activeTool === tool.id ? '#3b82f6' : border}`,
            borderRadius: 6,
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (activeTool !== tool.id) {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTool !== tool.id) {
              e.currentTarget.style.background = bg;
              e.currentTarget.style.color = textPrimary;
            }
          }}
        >
          {tool.icon}
        </button>
      ))}
      
      {/* Separator */}
      <div style={{ height: 1, background: border, margin: '4px 0' }}></div>
      
      {/* Clear All */}
      <button
        onClick={onClearAll}
        title="Clear all drawings"
        style={{
          width: 40,
          height: 40,
          background: bg,
          color: '#ef4444',
          border: `1px solid ${border}`,
          borderRadius: 6,
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ef4444';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = bg;
          e.currentTarget.style.color = '#ef4444';
        }}
      >
        🗑️
      </button>
      
      {/* Count Badge */}
      {drawingsCount > 0 && (
        <div style={{
          fontSize: 10,
          color: text,
          textAlign: 'center',
          padding: '2px 0',
          fontWeight: 700,
          background: '#3b82f6',
          color: '#fff',
          borderRadius: 4,
        }}>
          {drawingsCount}
        </div>
      )}
    </div>
  );
}

export default DrawingTools;