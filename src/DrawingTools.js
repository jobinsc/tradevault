// src/DrawingTools.js
import React, { useState } from 'react';

const TOOLS = [
  { id: 'cursor', name: 'Cursor', shortcut: 'V',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 13l6 6"/><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
  },
  { id: 'trendline', name: 'Trend Line', shortcut: 'T',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="20" y2="4"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="4" r="1.5" fill="currentColor"/></svg>
  },
  { id: 'ray', name: 'Ray Line', shortcut: 'R',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="22" y2="2"/><circle cx="4" cy="20" r="1.5" fill="currentColor"/></svg>
  },
  { id: 'horizontal', name: 'Horizontal Line', shortcut: 'H',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12" strokeDasharray="4 2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
  },
  { id: 'vertical', name: 'Vertical Line', shortcut: 'W',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22" strokeDasharray="4 2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
  },
  { id: 'rectangle', name: 'Rectangle', shortcut: 'B',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="12" rx="1"/></svg>
  },
  { id: 'fibonacci', name: 'Fibonacci', shortcut: 'F',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="17" x2="21" y2="17"/><line x1="3" y1="21" x2="21" y2="21"/></svg>
  },
  { id: 'arrow', name: 'Arrow', shortcut: 'A',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="18" y2="6"/><polyline points="12 6 18 6 18 12"/></svg>
  },
  { id: 'text', name: 'Text Label', shortcut: 'X',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
  },
];

function DrawingTools({ activeTool, onToolSelect, onClearAll, onUndo, drawingsCount = 0, theme }) {
  const [hoveredTool, setHoveredTool] = useState(null);
  const [hidden, setHidden] = useState(false);
  
  const isDark = !theme?.bg?.includes('#ffffff');
  const bg = isDark ? '#131722' : '#ffffff';
  const cardBg = isDark ? '#1e222d' : '#f8fafc';
  const hoverBg = isDark ? '#2a2e39' : '#eef1f5';
  const text = isDark ? '#787b86' : '#6a6d78';
  const textActive = isDark ? '#ffffff' : '#131722';
  const border = isDark ? '#2a2e39' : '#e0e3eb';
  const accent = '#2962ff';

  // When hidden - show only a small "show" button
  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        title="Show drawing tools"
        style={{
          position: 'absolute',
          left: 8, top: 8,
          width: 28, height: 28,
          background: accent, color: '#fff',
          border: 'none', borderRadius: 4,
          cursor: 'pointer', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      left: 8, top: 8,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 6,
      padding: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      width: 40,
    }}>
      {/* Hide button (arrow pointing left) */}
      <button
        onClick={() => setHidden(true)}
        title="Hide drawing tools"
        style={{
          width: '100%', height: 24,
          background: 'transparent', border: 'none',
          color: text, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 3,
          padding: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textActive; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = text; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div style={{ height: 1, background: border, margin: '2px 0' }}/>

      {TOOLS.map(tool => {
        const isActive = activeTool === tool.id;
        const isHovered = hoveredTool === tool.id;
        return (
          <div key={tool.id} style={{ position: 'relative' }}>
            <button
              onClick={() => onToolSelect(tool.id)}
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
              style={{
                width: '100%', height: 32,
                background: isActive ? accent : (isHovered ? hoverBg : 'transparent'),
                color: isActive ? '#fff' : (isHovered ? textActive : text),
                border: 'none', borderRadius: 4,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, transition: 'all 0.15s',
              }}
            >
              <div style={{ width: 18, height: 18 }}>{tool.svg}</div>
            </button>
            {isHovered && (
              <div style={{
                position: 'absolute', left: 'calc(100% + 8px)', top: '50%',
                transform: 'translateY(-50%)',
                background: cardBg, color: textActive,
                padding: '6px 10px', borderRadius: 4,
                fontSize: 11, fontWeight: 500,
                whiteSpace: 'nowrap',
                border: `1px solid ${border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 200, pointerEvents: 'none',
              }}>
                {tool.name}
                {tool.shortcut && (
                  <span style={{
                    marginLeft: 8, padding: '2px 5px',
                    background: hoverBg, borderRadius: 3,
                    fontSize: 10, color: text, fontFamily: 'monospace',
                  }}>{tool.shortcut}</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ height: 1, background: border, margin: '4px 0' }}/>

      {/* Undo button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={onUndo}
          onMouseEnter={() => setHoveredTool('undo')}
          onMouseLeave={() => setHoveredTool(null)}
          disabled={drawingsCount === 0}
          style={{
            width: '100%', height: 32,
            background: hoveredTool === 'undo' && drawingsCount > 0 ? hoverBg : 'transparent',
            color: drawingsCount === 0 ? (isDark ? '#3a3e49' : '#c0c3ca') : (hoveredTool === 'undo' ? textActive : text),
            border: 'none', borderRadius: 4,
            cursor: drawingsCount === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, transition: 'all 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 00-15-6.7L3 13"/>
          </svg>
        </button>
        {hoveredTool === 'undo' && (
          <div style={{
            position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)',
            background: cardBg, color: textActive, padding: '6px 10px', borderRadius: 4,
            fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
            border: `1px solid ${border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 200, pointerEvents: 'none',
          }}>
            Undo <span style={{ marginLeft: 8, padding: '2px 5px', background: hoverBg, borderRadius: 3, fontSize: 10, color: text, fontFamily: 'monospace' }}>Ctrl+Z</span>
          </div>
        )}
      </div>

      {/* Delete All */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={onClearAll}
          onMouseEnter={() => setHoveredTool('trash')}
          onMouseLeave={() => setHoveredTool(null)}
          disabled={drawingsCount === 0}
          style={{
            width: '100%', height: 32,
            background: hoveredTool === 'trash' && drawingsCount > 0 ? 'rgba(239,68,68,0.15)' : 'transparent',
            color: drawingsCount === 0 ? (isDark ? '#3a3e49' : '#c0c3ca') : (hoveredTool === 'trash' ? '#ef4444' : text),
            border: 'none', borderRadius: 4,
            cursor: drawingsCount === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, transition: 'all 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
        {hoveredTool === 'trash' && (
          <div style={{
            position: 'absolute', left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)',
            background: cardBg, color: textActive, padding: '6px 10px', borderRadius: 4,
            fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
            border: `1px solid ${border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 200, pointerEvents: 'none',
          }}>
            Delete All
          </div>
        )}
      </div>

      {drawingsCount > 0 && (
        <div style={{
          marginTop: 2, padding: '3px 0',
          background: accent, color: '#fff',
          borderRadius: 3, fontSize: 10,
          fontWeight: 700, textAlign: 'center',
          fontFamily: 'monospace',
        }}>
          {drawingsCount}
        </div>
      )}
    </div>
  );
}

export default DrawingTools;