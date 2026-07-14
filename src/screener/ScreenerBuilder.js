import React, { useState } from 'react';
import { saveScreener, updateScreener } from '../services/screenerService';

// Categorized indicators
const INDICATOR_GROUPS = {
  'Price': ['Close', 'Open', 'High', 'Low', 'Volume'],
  'Moving Averages': ['SMA(9)', 'SMA(20)', 'SMA(50)', 'SMA(100)', 'SMA(200)', 'EMA(9)', 'EMA(20)', 'EMA(50)', 'EMA(100)', 'EMA(200)'],
  'Oscillators': ['RSI(14)', 'RSI(21)', 'CCI(14)', 'CCI(20)', 'CCI(31)', 'MACD', 'MACD Signal', 'MACD Histogram', 'Stochastic'],
  'Volatility': ['BB Upper', 'BB Middle', 'BB Lower', 'ATR(14)', 'VWAP'],
  'Pivot Points': ['Pivot Point', 'Pivot R1', 'Pivot R2', 'Pivot R3', 'Pivot S1', 'Pivot S2', 'Pivot S3'],
  'Special': ['52W High', '52W Low', 'Avg Volume(20)', 'Change %', 'Change % 5D', 'Change % 20D'],
};

const OPERATORS = ['>', '<', '>=', '<=', '=', '!='];

const TIMEFRAMES = [
  'Daily', '1 day ago', '2 days ago', '3 days ago', 
  '5 days ago', '10 days ago', '20 days ago'
];

const PATTERNS = [
  { id: 'hammer', label: '🔨 Hammer', bullish: true },
  { id: 'inverted_hammer', label: '🔺 Inverted Hammer', bullish: true },
  { id: 'doji', label: '➕ Doji', bullish: null },
  { id: 'gravestone_doji', label: '⚰️ Gravestone Doji', bullish: false },
  { id: 'dragonfly_doji', label: '🐉 Dragonfly Doji', bullish: true },
  { id: 'shooting_star', label: '🌠 Shooting Star', bullish: false },
  { id: 'bullish_engulfing', label: '🟢 Bullish Engulfing', bullish: true },
  { id: 'bearish_engulfing', label: '🔴 Bearish Engulfing', bullish: false },
  { id: 'morning_star', label: '🌅 Morning Star', bullish: true },
  { id: 'evening_star', label: '🌆 Evening Star', bullish: false },
  { id: 'three_white_soldiers', label: '⚔️ 3 White Soldiers', bullish: true },
  { id: 'three_black_crows', label: '🐦 3 Black Crows', bullish: false },
  { id: 'gap_up', label: '⬆️ Gap Up', bullish: true },
  { id: 'gap_down', label: '⬇️ Gap Down', bullish: false },
];

// Suggested filter templates (like Chartink!)
const SUGGESTED_FILTERS = [
  { label: 'RSI oversold', conditions: [{ timeframe: 'Daily', indicator: 'RSI(14)', operator: '<', value: '30', valueType: 'number' }] },
  { label: 'RSI overbought', conditions: [{ timeframe: 'Daily', indicator: 'RSI(14)', operator: '>', value: '70', valueType: 'number' }] },
  { label: 'Above SMA 50', conditions: [{ timeframe: 'Daily', indicator: 'Close', operator: '>', value: 'SMA(50)', valueType: 'indicator' }] },
  { label: 'Above SMA 200', conditions: [{ timeframe: 'Daily', indicator: 'Close', operator: '>', value: 'SMA(200)', valueType: 'indicator' }] },
  { label: 'Golden Cross', conditions: [{ timeframe: 'Daily', indicator: 'SMA(50)', operator: '>', value: 'SMA(200)', valueType: 'indicator' }] },
  { label: 'Above Pivot R2', conditions: [{ timeframe: 'Daily', indicator: 'Close', operator: '>', value: 'Pivot R2', valueType: 'indicator' }] },
  { label: 'Below Pivot S2', conditions: [{ timeframe: 'Daily', indicator: 'Close', operator: '<', value: 'Pivot S2', valueType: 'indicator' }] },
  { label: 'Volume Spike', conditions: [{ timeframe: 'Daily', indicator: 'Volume', operator: '>', value: 'Avg Volume(20)', valueType: 'indicator' }] },
  { label: 'Near 52W High', conditions: [{ timeframe: 'Daily', indicator: 'Close', operator: '>=', value: '52W High', valueType: 'indicator' }] },
  { label: 'Big Gain 5%+', conditions: [{ timeframe: 'Daily', indicator: 'Change %', operator: '>', value: '5', valueType: 'number' }] },
  { label: 'MACD Bullish', conditions: [{ timeframe: 'Daily', indicator: 'MACD', operator: '>', value: 'MACD Signal', valueType: 'indicator' }] },
];

const ScreenerBuilder = ({ user, existing, onClose, onSaved }) => {
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [tags, setTags] = useState(existing?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [logic, setLogic] = useState(existing?.logic || 'AND');
  const [conditions, setConditions] = useState(
    existing?.conditions || [{ timeframe: 'Daily', indicator: 'Close', operator: '>', value: '100', valueType: 'number' }]
  );
  const [patterns, setPatterns] = useState(existing?.patterns || []);
  const [stockUniverse, setStockUniverse] = useState(existing?.stockUniverse || 'nifty100');    
  const [saving, setSaving] = useState(false);
  const [magicInput, setMagicInput] = useState('');

  const addCondition = () => {
    setConditions([...conditions, { timeframe: 'Daily', indicator: 'Close', operator: '>', value: '', valueType: 'number' }]);
  };

  const updateCondition = (i, field, val) => {
    const arr = [...conditions];
    arr[i][field] = val;
    setConditions(arr);
  };

  const removeCondition = (i) => setConditions(conditions.filter((_, idx) => idx !== i));

  const togglePattern = (id) => {
    setPatterns(patterns.includes(id) ? patterns.filter(p => p !== id) : [...patterns, id]);
  };

  const applySuggestedFilter = (filter) => {
    setConditions([...conditions, ...filter.conditions]);
  };

  const parseMagicFilter = () => {
    if (!magicInput.trim()) return;
    const input = magicInput.toLowerCase();
    const newConditions = [];
    
    if (input.includes('rsi') && (input.includes('over') || input.includes('bought'))) {
      newConditions.push({ timeframe: 'Daily', indicator: 'RSI(14)', operator: '>', value: '70', valueType: 'number' });
    }
    if (input.includes('rsi') && (input.includes('sold') || input.includes('oversold'))) {
      newConditions.push({ timeframe: 'Daily', indicator: 'RSI(14)', operator: '<', value: '30', valueType: 'number' });
    }
    if (input.includes('above') && input.includes('sma')) {
      const match = input.match(/sma[\s(]*(\d+)/);
      const period = match ? match[1] : '50';
      newConditions.push({ timeframe: 'Daily', indicator: 'Close', operator: '>', value: `SMA(${period})`, valueType: 'indicator' });
    }
    if (input.includes('above') && input.includes('pivot')) {
      newConditions.push({ timeframe: 'Daily', indicator: 'Close', operator: '>', value: 'Pivot Point', valueType: 'indicator' });
    }
    if (input.includes('volume') && (input.includes('spike') || input.includes('high'))) {
      newConditions.push({ timeframe: 'Daily', indicator: 'Volume', operator: '>', value: 'Avg Volume(20)', valueType: 'indicator' });
    }
    if (input.match(/up.*(\d+)%/)) {
      const match = input.match(/(\d+)/);
      newConditions.push({ timeframe: 'Daily', indicator: 'Change %', operator: '>', value: match[1], valueType: 'number' });
    }
    if (input.includes('hammer')) setPatterns(prev => [...new Set([...prev, 'hammer'])]);
    if (input.includes('doji')) setPatterns(prev => [...new Set([...prev, 'doji'])]);
    if (input.includes('bullish engulfing')) setPatterns(prev => [...new Set([...prev, 'bullish_engulfing'])]);
    if (input.includes('gap up')) setPatterns(prev => [...new Set([...prev, 'gap_up'])]);
    
    if (newConditions.length > 0) {
      setConditions([...conditions, ...newConditions]);
      alert(`✨ Added ${newConditions.length} condition(s) from magic filter!`);
    } else {
      alert('🤖 Try: "RSI oversold", "Close above SMA 50", "Volume spike", "Up 5%", "Hammer pattern"');
    }
    setMagicInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { alert('Please enter screener name'); return; }
    setSaving(true);
    try {
      const data = { name, description, conditions, patterns, tags, logic, stockUniverse };
      if (existing?.id) {
        await updateScreener(existing.id, data);
      } else {
        await saveScreener(data, user.email);
      }
      onSaved();
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            🔍 {existing?.id ? 'Edit' : 'New'} Screener
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {/* Basic Info */}
          <div style={styles.section}>
            <input
              style={styles.input}
              placeholder="Screener Name (e.g., Bullish Breakout Scanner)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <textarea
              style={{ ...styles.input, minHeight: 60, resize: 'vertical' }}
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Magic Filter (Chartink style!) */}
          <div style={styles.magicSection}>
            <div style={styles.magicHeader}>
              <span style={{ fontSize: 20 }}>✨</span>
              <strong>Magic Filter</strong>
              <span style={styles.magicBadge}>AI</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                placeholder='Try: "RSI oversold" or "Close above SMA 50" or "Volume spike"'
                value={magicInput}
                onChange={e => setMagicInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && parseMagicFilter()}
              />
              <button onClick={parseMagicFilter} style={styles.magicBtn}>
                🚀 Generate
              </button>
            </div>
          </div>

          {/* Suggested Filters (Clickable Tags) */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>💡 Suggested Filters (click to add)</div>
            <div style={styles.suggestedGrid}>
              {SUGGESTED_FILTERS.map((filter, i) => (
                <button
                  key={i}
                  onClick={() => applySuggestedFilter(filter)}
                  style={styles.suggestedBtn}
                >
                  + {filter.label}
                </button>
              ))}
            </div>
          </div>
          {/* Stock Universe Selector */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>📊 Stock Universe (Scan Speed)</div>
            <div style={styles.logicToggle}>
              <button 
                onClick={() => setStockUniverse('nifty50')}
                style={{ ...styles.logicBtn, ...(stockUniverse === 'nifty50' ? styles.logicBtnActive : {}) }}
              >
                🚀 Nifty 50 (Fast • 2 min)
              </button>
              <button 
                onClick={() => setStockUniverse('nifty100')}
                style={{ ...styles.logicBtn, ...(stockUniverse === 'nifty100' ? styles.logicBtnActive : {}) }}
              >
                ⚡ Nifty 100 (Medium • 5 min)
              </button>
              <button 
                onClick={() => setStockUniverse('nifty250')}
                style={{ ...styles.logicBtn, ...(stockUniverse === 'nifty250' ? styles.logicBtnActive : {}) }}
              >
                📈 Nifty 250 (Slower • 10 min)
              </button>
              <button 
                onClick={() => setStockUniverse('all')}
                style={{ ...styles.logicBtn, ...(stockUniverse === 'all' ? styles.logicBtnActive : {}) }}
              >
                🌐 All Stocks (Slowest • 15 min)
              </button>
            </div>
          </div>
          {/* Logic Toggle */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>🔗 Match Logic</div>
            <div style={styles.logicToggle}>
              <button 
                onClick={() => setLogic('AND')}
                style={{ ...styles.logicBtn, ...(logic === 'AND' ? styles.logicBtnActive : {}) }}
              >
                AND (all conditions must pass)
              </button>
              <button 
                onClick={() => setLogic('OR')}
                style={{ ...styles.logicBtn, ...(logic === 'OR' ? styles.logicBtnActive : {}) }}
              >
                OR (any condition passes)
              </button>
            </div>
          </div>

          {/* Conditions */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              📋 Filter Conditions ({conditions.length})
            </div>
            {conditions.map((c, i) => (
              <div key={i} style={styles.conditionRow}>
                <span style={styles.numBadge}>{i + 1}</span>
                
                <select 
                  value={c.timeframe} 
                  onChange={e => updateCondition(i, 'timeframe', e.target.value)}
                  style={styles.select}
                >
                  {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
                </select>
                
                <select 
                  value={c.indicator} 
                  onChange={e => updateCondition(i, 'indicator', e.target.value)}
                  style={{ ...styles.select, minWidth: 120 }}
                >
                  {Object.entries(INDICATOR_GROUPS).map(([group, items]) => (
                    <optgroup key={group} label={group}>
                      {items.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </optgroup>
                  ))}
                </select>
                
                <select 
                  value={c.operator} 
                  onChange={e => updateCondition(i, 'operator', e.target.value)}
                  style={styles.select}
                >
                  {OPERATORS.map(op => <option key={op}>{op}</option>)}
                </select>
                
                <select
                  value={c.valueType || 'number'}
                  onChange={e => updateCondition(i, 'valueType', e.target.value)}
                  style={styles.select}
                  title="Compare with"
                >
                  <option value="number">Number</option>
                  <option value="indicator">Indicator</option>
                </select>
                
                {c.valueType === 'indicator' ? (
                  <select
                    value={c.value}
                    onChange={e => updateCondition(i, 'value', e.target.value)}
                    style={{ ...styles.select, minWidth: 120 }}
                  >
                    <option value="">Select indicator</option>
                    {Object.entries(INDICATOR_GROUPS).map(([group, items]) => (
                      <optgroup key={group} label={group}>
                        {items.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  <input
                    value={c.value}
                    onChange={e => updateCondition(i, 'value', e.target.value)}
                    placeholder="Enter number"
                    style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                  />
                )}
                
                <button onClick={() => removeCondition(i)} style={styles.removeBtn}>✕</button>
              </div>
            ))}
            
            <button onClick={addCondition} style={styles.addBtn}>
              + Add Condition
            </button>
          </div>

          {/* Candlestick Patterns */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              🕯️ Candlestick Patterns ({patterns.length} selected)
            </div>
            <div style={styles.patternGrid}>
              {PATTERNS.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePattern(p.id)}
                  style={{
                    ...styles.patternBtn,
                    background: patterns.includes(p.id) 
                      ? (p.bullish === true ? '#10b981' : p.bullish === false ? '#ef4444' : '#6366f1')
                      : '#1e293b',
                    color: patterns.includes(p.id) ? 'white' : '#94a3b8',
                    borderColor: patterns.includes(p.id) ? 'transparent' : '#334155',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>🏷️ Tags (organize your screeners)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag (e.g., bullish, breakout)"
                style={{ ...styles.input, marginBottom: 0, flex: 1 }}
              />
              <button onClick={addTag} style={styles.tagAddBtn}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <span key={tag} style={styles.tagChip}>
                  {tag}
                  <span 
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    style={{ cursor: 'pointer', marginLeft: 6, color: '#ef4444' }}
                  >✕</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? '⏳ Saving...' : '💾 Save Screener'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modal: { background: '#0f172a', width: '100%', maxWidth: 1000, maxHeight: '90vh', borderRadius: 16, display: 'flex', flexDirection: 'column', border: '1px solid #334155', color: '#f1f5f9' },
  header: { padding: 20, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  body: { padding: 20, overflow: 'auto', flex: 1 },
  footer: { padding: 20, borderTop: '1px solid #334155', display: 'flex', gap: 12, justifyContent: 'flex-end' },
  closeBtn: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: { width: '100%', padding: 10, background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, marginBottom: 10, fontSize: 13, boxSizing: 'border-box', outline: 'none' },
  select: { padding: 8, background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6, fontSize: 12, outline: 'none' },
  magicSection: { padding: 16, background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, marginBottom: 20 },
  magicHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  magicBadge: { fontSize: 10, padding: '2px 8px', background: 'linear-gradient(135deg, #ec4899, #f59e0b)', color: 'white', borderRadius: 8, fontWeight: 700 },
  magicBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  suggestedGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  suggestedBtn: { padding: '6px 12px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  logicToggle: { display: 'flex', gap: 8 },
  logicBtn: { flex: 1, padding: 10, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  logicBtnActive: { background: '#6366f1', color: 'white', borderColor: '#6366f1' },
  conditionRow: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, padding: 10, background: '#1e293b', borderRadius: 8, flexWrap: 'wrap' },
  numBadge: { background: '#6366f1', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  removeBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  addBtn: { width: '100%', padding: 12, background: 'transparent', border: '2px dashed #6366f1', color: '#6366f1', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 4 },
  patternGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 },
  patternBtn: { padding: '8px 12px', border: '1px solid', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, textAlign: 'left' },
  tagAddBtn: { padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  tagChip: { padding: '4px 10px', background: '#334155', color: '#cbd5e1', borderRadius: 12, fontSize: 11, display: 'inline-flex', alignItems: 'center' },
  cancelBtn: { padding: '10px 24px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  saveBtn: { padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 },
};

export default ScreenerBuilder;