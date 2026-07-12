import React, { useState, useEffect } from 'react';

const TRADE_TYPES = [
  { value: 'scalp', label: '⚡ Scalping' },
  { value: 'intraday', label: '📊 Intraday (MIS)' },
  { value: 'btst', label: '🌙 BTST/STBT' },
  { value: 'swing', label: '🌊 Swing' },
  { value: 'positional', label: '📈 Positional' },
  { value: 'delivery', label: '💎 Delivery/Long-term' },
  { value: 'investment', label: '🏦 Investment (SIP)' },
];

const SEGMENTS = [
  'Equity - Cash', 'Equity - Delivery (CNC)', 'F&O - Futures', 'F&O - Options',
  'Commodity', 'Currency', 'Crypto', 'Mutual Funds', 'ETF', 'Bonds'
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: 'Daily' },
  { value: '1w', label: 'Weekly' },
  { value: '1M', label: 'Monthly' },
];

const ACCENT_COLORS = [
  { value: 'blue', label: '🔵 Blue', color: '#3b82f6' },
  { value: 'purple', label: '🟣 Purple', color: '#8b5cf6' },
  { value: 'green', label: '🟢 Green', color: '#10b981' },
  { value: 'orange', label: '🟠 Orange', color: '#f59e0b' },
  { value: 'red', label: '🔴 Red', color: '#ef4444' },
  { value: 'cyan', label: '🔷 Cyan', color: '#06b6d4' },
  { value: 'black', label: '⚫ Black', color: '#1e293b' },
  { value: 'gray', label: '⚪ Gray', color: '#64748b' },
];

function UserSettingsModal({ currentSettings, onSave, onClose, onAutoSave }) {
  const [settings, setSettings] = useState(currentSettings);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const update = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
    
    // Auto-save (with slight delay)
    if (onAutoSave) {
      onAutoSave(newSettings);
      setSavedMsg('✅ Auto-saved');
      setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(settings);
    setSaving(false);
    setHasChanges(false);
    setSavedMsg('✅ Settings saved successfully!');
    setTimeout(() => {
      setSavedMsg('');
      onClose();
    }, 1500);
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default? Your data won\'t be affected.')) {
      const defaults = {
        theme: 'dark',
        accentColor: 'blue',
        fontSize: 'medium',
        compactMode: false,
        defaultTradeType: 'intraday',
        defaultSegment: 'Equity - Cash',
        defaultDirection: 'long',
        defaultRiskPercent: 2,
        defaultTimeframe: '15m',
        showLivePrices: true,
        autoRefreshInterval: 30,
        showRecentTrades: true,
        recentTradesCount: 5,
        currency: 'INR',
        dateFormat: 'dd MMM yy',
        showSectors: true,
        showEmojis: true,
        showSuccessMessages: true,
        showTradeNotifications: true,
        successMessageDuration: 4000,
        confirmBeforeDelete: true,
        autoBackup: false,
      };
      setSettings(defaults);
      setHasChanges(true);
      if (onAutoSave) onAutoSave(defaults);
    }
  };

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
          padding: 0,
          maxWidth: 650,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⚙️ User Settings</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Preferences are auto-saved to your account • Sync across devices
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
        </div>

        {/* SAVED MESSAGE */}
        {savedMsg && (
          <div style={{
            padding: '10px 24px',
            background: 'rgba(16,185,129,0.1)',
            color: 'var(--accent-green)',
            fontSize: 13,
            fontWeight: 600,
            borderBottom: '1px solid rgba(16,185,129,0.2)',
          }}>
            {savedMsg}
          </div>
        )}

        {/* CONTENT - SCROLLABLE */}
        <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
          {/* APPEARANCE */}
          <Section title="🎨 Appearance">
            {/* Theme Toggle */}
            <SettingRow 
              label="Theme" 
              description="Choose between dark and light mode"
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <ThemeButton 
                  active={settings.theme === 'dark'}
                  onClick={() => update('theme', 'dark')}
                  icon="🌙"
                  label="Dark"
                />
                <ThemeButton 
                  active={settings.theme === 'light'}
                  onClick={() => update('theme', 'light')}
                  icon="☀️"
                  label="Light"
                />
              </div>
            </SettingRow>

            {/* Accent Color */}
            <SettingRow 
              label="Accent Color" 
              description="Primary color for buttons and highlights"
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => update('accentColor', color.value)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: color.color,
                      border: settings.accentColor === color.value ? '3px solid #fff' : '3px solid transparent',
                      cursor: 'pointer',
                      boxShadow: settings.accentColor === color.value ? `0 0 0 2px ${color.color}` : 'none',
                      transition: 'all 0.2s',
                    }}
                    title={color.label}
                  />
                ))}
              </div>
            </SettingRow>

            {/* Font Size */}
            <SettingRow label="Font Size" description="UI text size">
              <select
                value={settings.fontSize}
                onChange={e => update('fontSize', e.target.value)}
                style={selectStyle}
              >
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
              </select>
            </SettingRow>

            {/* Compact Mode */}
            <ToggleRow
              label="Compact Mode"
              description="Reduce padding for more content on screen"
              value={settings.compactMode}
              onChange={val => update('compactMode', val)}
            />
          </Section>

          {/* TRADING DEFAULTS */}
          <Section title="💼 Trading Defaults">
            <SettingRow 
              label="Default Trade Type" 
              description="Pre-select this when adding new trade"
            >
              <select
                value={settings.defaultTradeType}
                onChange={e => update('defaultTradeType', e.target.value)}
                style={selectStyle}
              >
                {TRADE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </SettingRow>

            <SettingRow label="Default Segment">
              <select
                value={settings.defaultSegment}
                onChange={e => update('defaultSegment', e.target.value)}
                style={selectStyle}
              >
                {SEGMENTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </SettingRow>

            <SettingRow label="Default Direction">
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => update('defaultDirection', 'long')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: settings.defaultDirection === 'long' ? 'var(--accent-green)' : 'var(--bg-input)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  🟢 Long
                </button>
                <button
                  onClick={() => update('defaultDirection', 'short')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: settings.defaultDirection === 'short' ? 'var(--accent-red)' : 'var(--bg-input)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  🔴 Short
                </button>
              </div>
            </SettingRow>

            <SettingRow 
              label="Default Risk %" 
              description="Risk per trade (2% recommended)"
            >
              <input
                type="number"
                value={settings.defaultRiskPercent}
                onChange={e => update('defaultRiskPercent', parseFloat(e.target.value) || 0)}
                min="0.1"
                max="100"
                step="0.5"
                style={inputStyle}
              />
            </SettingRow>

            <SettingRow label="Default Timeframe">
              <select
                value={settings.defaultTimeframe}
                onChange={e => update('defaultTimeframe', e.target.value)}
                style={selectStyle}
              >
                {TIMEFRAMES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </SettingRow>
          </Section>

          {/* DASHBOARD */}
          <Section title="📊 Dashboard">
            <ToggleRow
              label="Show Live Prices"
              description="Display real-time stock prices for open positions"
              value={settings.showLivePrices}
              onChange={val => update('showLivePrices', val)}
            />

            <SettingRow 
              label="Auto-refresh Interval" 
              description="How often to refresh live prices (seconds)"
            >
              <select
                value={settings.autoRefreshInterval}
                onChange={e => update('autoRefreshInterval', parseInt(e.target.value))}
                style={selectStyle}
              >
                <option value="15">15 seconds (Fast)</option>
                <option value="30">30 seconds (Default)</option>
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes (Slow)</option>
              </select>
            </SettingRow>

            <ToggleRow
              label="Show Recent Trades"
              description="Display recent trades table on dashboard"
              value={settings.showRecentTrades}
              onChange={val => update('showRecentTrades', val)}
            />

            <SettingRow 
              label="Recent Trades Count" 
              description="Number of recent trades to show"
            >
              <select
                value={settings.recentTradesCount}
                onChange={e => update('recentTradesCount', parseInt(e.target.value))}
                style={selectStyle}
              >
                <option value="3">3 trades</option>
                <option value="5">5 trades (Default)</option>
                <option value="10">10 trades</option>
                <option value="20">20 trades</option>
              </select>
            </SettingRow>
          </Section>

          {/* DISPLAY */}
          <Section title="🎯 Display">
            <ToggleRow
              label="Show Sector Badges"
              description="Display sector info in trade tables"
              value={settings.showSectors}
              onChange={val => update('showSectors', val)}
            />

            <ToggleRow
              label="Show Emojis"
              description="Use emojis throughout the app"
              value={settings.showEmojis}
              onChange={val => update('showEmojis', val)}
            />

            <SettingRow label="Date Format">
              <select
                value={settings.dateFormat}
                onChange={e => update('dateFormat', e.target.value)}
                style={selectStyle}
              >
                <option value="dd MMM yy">01 Jul 26 (Default)</option>
                <option value="dd/MM/yy">01/07/26</option>
                <option value="MM/dd/yy">07/01/26 (US)</option>
                <option value="yyyy-MM-dd">2026-07-01 (ISO)</option>
              </select>
            </SettingRow>
          </Section>

          {/* NOTIFICATIONS */}
          <Section title="🔔 Notifications">
            <ToggleRow
              label="Success Messages"
              description="Show success notifications (green banner)"
              value={settings.showSuccessMessages}
              onChange={val => update('showSuccessMessages', val)}
            />

            <ToggleRow
              label="Trade Notifications"
              description="Show notifications when trades are saved/deleted"
              value={settings.showTradeNotifications}
              onChange={val => update('showTradeNotifications', val)}
            />

            <SettingRow 
              label="Message Duration" 
              description="How long notifications stay visible"
            >
              <select
                value={settings.successMessageDuration}
                onChange={e => update('successMessageDuration', parseInt(e.target.value))}
                style={selectStyle}
              >
                <option value="2000">2 seconds (Fast)</option>
                <option value="4000">4 seconds (Default)</option>
                <option value="6000">6 seconds</option>
                <option value="10000">10 seconds (Long)</option>
              </select>
            </SettingRow>
          </Section>

          {/* SAFETY */}
          <Section title="🛡️ Safety">
            <ToggleRow
              label="Confirm Before Delete"
              description="Ask for confirmation before deleting trades"
              value={settings.confirmBeforeDelete}
              onChange={val => update('confirmBeforeDelete', val)}
            />
          </Section>

          {/* RESET */}
          <div style={{
            marginTop: 20,
            padding: 16,
            background: 'rgba(239,68,68,0.05)',
            borderRadius: 10,
            border: '1px solid rgba(239,68,68,0.2)',
            textAlign: 'center',
          }}>
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--accent-red)',
                border: '1px solid var(--accent-red)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Reset All Settings to Default
            </button>
          </div>
        </div>

        {/* FOOTER WITH SAVE BUTTON */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-input)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {hasChanges ? '⚡ Changes auto-saved' : '✓ All changes saved'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving ? '⏳ Saving...' : '💾 Save & Sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ HELPER COMPONENTS ============
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'var(--text-secondary)',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border-color)',
      }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: 'var(--bg-input)',
      borderRadius: 8,
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <SettingRow label={label} description={description}>
      <button
        onClick={() => onChange(!value)}
        style={{
          position: 'relative',
          width: 48,
          height: 26,
          background: value ? 'var(--accent-green)' : 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 13,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: value ? 24 : 2,
          width: 20,
          height: 20,
          background: '#fff',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </SettingRow>
  );
}

function ThemeButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        background: active ? 'var(--accent-blue)' : 'var(--bg-input)',
        color: active ? '#fff' : 'var(--text-primary)',
        border: `2px solid ${active ? 'var(--accent-blue)' : 'transparent'}`,
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon} {label}
    </button>
  );
}

const selectStyle = {
  padding: '8px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  minWidth: 180,
};

const inputStyle = {
  padding: '8px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 600,
  outline: 'none',
  width: 100,
};

export default UserSettingsModal;