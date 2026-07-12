import React from 'react';

const SHORTCUTS = [
  {
    category: '🧭 Navigation',
    items: [
      { keys: ['Ctrl', 'D'], action: 'Go to Dashboard' },
      { keys: ['Ctrl', 'T'], action: 'Go to Trade Log' },
      { keys: ['Ctrl', 'P'], action: 'Go to Portfolio' },
      { keys: ['Ctrl', 'A'], action: 'Go to Analytics' },
      { keys: ['Ctrl', 'I'], action: 'Go to Intraday Zone' },
      { keys: ['Ctrl', 'R'], action: 'Go to Detailed Report' },
      { keys: ['Ctrl', 'Y'], action: 'Go to Calendar' },
    ],
  },
  {
    category: '⚡ Quick Actions',
    items: [
      { keys: ['Ctrl', 'N'], action: 'New Trade' },
      { keys: ['Ctrl', 'K'], action: 'Focus Search' },
      { keys: ['Ctrl', 'M'], action: 'Open Calculator' },
    ],
  },
  {
    category: '🛠️ Other',
    items: [
      { keys: ['Ctrl', '/'], action: 'Show this help' },
      { keys: ['Ctrl', 'L'], action: 'Logout' },
      { keys: ['Escape'], action: 'Close modal' },
    ],
  },
];

function ShortcutsHelpModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          padding: 24,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* HEADER */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⌨️ Keyboard Shortcuts</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Work faster with these keyboard combinations
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-input)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* SHORTCUTS LIST */}
        {SHORTCUTS.map(section => (
          <div key={section.category} style={{ marginBottom: 24 }}>
            <h4 style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: 'var(--text-secondary)',
              marginBottom: 12,
            }}>
              {section.category}
            </h4>
            <div style={{ 
              background: 'var(--bg-input)', 
              borderRadius: 12, 
              padding: 8,
            }}>
              {section.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderBottom: idx < section.items.length - 1 
                      ? '1px solid var(--border-color)' 
                      : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {item.action}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {item.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd style={{
                          padding: '4px 10px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: 'var(--accent-blue)',
                          boxShadow: '0 2px 0 var(--border-color)',
                          minWidth: 24,
                          textAlign: 'center',
                        }}>
                          {key}
                        </kbd>
                        {i < item.keys.length - 1 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, alignSelf: 'center' }}>
                            +
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* FOOTER TIP */}
        <div style={{
          padding: 14,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
          borderRadius: 10,
          border: '1px solid rgba(59,130,246,0.2)',
          fontSize: 12,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          💡 <strong style={{ color: 'var(--text-primary)' }}>Pro Tip:</strong> Press{' '}
          <kbd style={{
            padding: '2px 8px',
            background: 'var(--bg-input)',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--accent-blue)',
          }}>Ctrl + /</kbd>{' '}
          anytime to see this help
        </div>
      </div>
    </div>
  );
}

export default ShortcutsHelpModal;