import React, { useState, useEffect } from 'react';

function CalculatorModal({ onClose }) {
  const [tab, setTab] = useState('basic');

  // Detach to new window
  const handleDetach = () => {
    const width = 480;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const calcWindow = window.open(
      '',
      'TradeVaultCalculator',
      'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no'
    );
    
    if (calcWindow) {
      const htmlContent = getDetachedHTML();
      calcWindow.document.open();
      calcWindow.document.write(htmlContent);
      calcWindow.document.close();
      onClose();
    } else {
      alert('Please allow popups to detach the calculator');
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
          padding: 20,
          maxWidth: 450,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🧮 Trading Calculator</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={handleDetach}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Open in separate window"
            >
              ⇱ Detach
            </button>
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

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-input)', padding: 4, borderRadius: 10 }}>
          <TabButton active={tab === 'basic'} onClick={() => setTab('basic')} label="🔢 Basic" />
          <TabButton active={tab === 'position'} onClick={() => setTab('position')} label="📊 Position" />
          <TabButton active={tab === 'pnl'} onClick={() => setTab('pnl')} label="💰 P&L" />
          <TabButton active={tab === 'brokerage'} onClick={() => setTab('brokerage')} label="💸 Charges" />
        </div>

        {/* CONTENT */}
        {tab === 'basic' && <BasicCalculator />}
        {tab === 'position' && <PositionSizeCalculator />}
        {tab === 'pnl' && <PnLCalculator />}
        {tab === 'brokerage' && <BrokerageCalculator />}
      </div>
    </div>
  );
}

// ============ TAB BUTTON ============
function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 4px',
        background: active ? 'var(--accent-blue)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: 'none',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}

// ============ BASIC CALCULATOR ============
function BasicCalculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const inputDigit = (digit) => {
    if (waiting) {
      setDisplay(String(digit));
      setWaiting(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDot = () => {
    if (waiting) {
      setDisplay('0.');
      setWaiting(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setWaiting(false);
  };

  const toggleSign = () => {
    setDisplay(String(-parseFloat(display)));
  };

  const percent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const performOp = (nextOp) => {
    const value = parseFloat(display);
    if (prev === null) {
      setPrev(value);
    } else if (op) {
      const result = calculate(prev, value, op);
      setPrev(result);
      setDisplay(String(result));
    }
    setWaiting(true);
    setOp(nextOp);
  };

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const equals = () => {
    const value = parseFloat(display);
    if (prev !== null && op) {
      const result = calculate(prev, value, op);
      setDisplay(String(result));
      setPrev(null);
      setOp(null);
      setWaiting(true);
    }
  };

  const btnStyle = (color) => ({
    padding: '18px',
    background: color || 'var(--bg-input)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.1s',
  });

  return (
    <div>
      {/* DISPLAY */}
      <div style={{
        background: 'var(--bg-input)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        textAlign: 'right',
        fontSize: 36,
        fontWeight: 700,
        overflow: 'hidden',
        color: 'var(--accent-blue)',
      }}>
        {display}
      </div>

      {/* BUTTONS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <button style={btnStyle('#ef4444')} onClick={clear}>AC</button>
        <button style={btnStyle('#f59e0b')} onClick={toggleSign}>±</button>
        <button style={btnStyle('#f59e0b')} onClick={percent}>%</button>
        <button style={btnStyle('#3b82f6')} onClick={() => performOp('÷')}>÷</button>
        
        <button style={btnStyle()} onClick={() => inputDigit(7)}>7</button>
        <button style={btnStyle()} onClick={() => inputDigit(8)}>8</button>
        <button style={btnStyle()} onClick={() => inputDigit(9)}>9</button>
        <button style={btnStyle('#3b82f6')} onClick={() => performOp('×')}>×</button>
        
        <button style={btnStyle()} onClick={() => inputDigit(4)}>4</button>
        <button style={btnStyle()} onClick={() => inputDigit(5)}>5</button>
        <button style={btnStyle()} onClick={() => inputDigit(6)}>6</button>
        <button style={btnStyle('#3b82f6')} onClick={() => performOp('-')}>-</button>
        
        <button style={btnStyle()} onClick={() => inputDigit(1)}>1</button>
        <button style={btnStyle()} onClick={() => inputDigit(2)}>2</button>
        <button style={btnStyle()} onClick={() => inputDigit(3)}>3</button>
        <button style={btnStyle('#3b82f6')} onClick={() => performOp('+')}>+</button>
        
        <button style={{ ...btnStyle(), gridColumn: 'span 2' }} onClick={() => inputDigit(0)}>0</button>
        <button style={btnStyle()} onClick={inputDot}>.</button>
        <button style={btnStyle('#10b981')} onClick={equals}>=</button>
      </div>
    </div>
  );
}

// ============ POSITION SIZE CALCULATOR ============
function PositionSizeCalculator() {
  const [capital, setCapital] = useState('100000');
  const [riskPct, setRiskPct] = useState('2');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const riskAmount = (parseFloat(capital) || 0) * (parseFloat(riskPct) || 0) / 100;
  const riskPerShare = Math.abs((parseFloat(entry) || 0) - (parseFloat(stopLoss) || 0));
  const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  const positionValue = shares * (parseFloat(entry) || 0);

  return (
    <div>
      <div style={{ padding: 14, background: 'rgba(59,130,246,0.1)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        💡 Calculate exact position size based on your risk tolerance (2% Rule)
      </div>

      <Input label="Total Capital (₹)" value={capital} onChange={setCapital} icon="💰" />
      <Input label="Risk % per Trade" value={riskPct} onChange={setRiskPct} icon="🎯" suffix="%" />
      <Input label="Entry Price (₹)" value={entry} onChange={setEntry} icon="📈" />
      <Input label="Stop Loss (₹)" value={stopLoss} onChange={setStopLoss} icon="🛑" />

      <div style={{
        marginTop: 20,
        padding: 20,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
        borderRadius: 12,
        border: '1px solid rgba(16,185,129,0.3)',
      }}>
        <h4 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>📊 Results</h4>
        <ResultRow label="Risk Amount" value={'₹' + riskAmount.toLocaleString('en-IN')} color="var(--accent-red)" />
        <ResultRow label="Risk per Share" value={'₹' + riskPerShare.toFixed(2)} />
        <ResultRow label="Shares to Buy" value={shares.toLocaleString('en-IN')} color="var(--accent-green)" big />
        <ResultRow label="Position Value" value={'₹' + positionValue.toLocaleString('en-IN')} color="var(--accent-blue)" />
      </div>
    </div>
  );
}

// ============ P&L CALCULATOR ============
function PnLCalculator() {
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [qty, setQty] = useState('');
  const [direction, setDirection] = useState('long');

  const entryValue = (parseFloat(entry) || 0) * (parseFloat(qty) || 0);
  const exitValue = (parseFloat(exit) || 0) * (parseFloat(qty) || 0);
  const pnl = direction === 'long' ? exitValue - entryValue : entryValue - exitValue;
  const pnlPct = entryValue > 0 ? (pnl / entryValue) * 100 : 0;

  return (
    <div>
      <div style={{ padding: 14, background: 'rgba(59,130,246,0.1)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        💡 Calculate profit/loss for any trade before executing
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
          Direction
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setDirection('long')}
            style={{
              flex: 1,
              padding: 10,
              background: direction === 'long' ? 'var(--accent-green)' : 'var(--bg-input)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            🟢 LONG (Buy)
          </button>
          <button
            onClick={() => setDirection('short')}
            style={{
              flex: 1,
              padding: 10,
              background: direction === 'short' ? 'var(--accent-red)' : 'var(--bg-input)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            🔴 SHORT (Sell)
          </button>
        </div>
      </div>

      <Input label="Entry Price (₹)" value={entry} onChange={setEntry} icon="📈" />
      <Input label="Exit Price (₹)" value={exit} onChange={setExit} icon="📉" />
      <Input label="Quantity" value={qty} onChange={setQty} icon="🔢" />

      <div style={{
        marginTop: 20,
        padding: 20,
        background: pnl >= 0 
          ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
        borderRadius: 12,
        border: pnl >= 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
      }}>
        <h4 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>💰 Results</h4>
        <ResultRow label="Investment" value={'₹' + entryValue.toLocaleString('en-IN')} />
        <ResultRow label="Exit Value" value={'₹' + exitValue.toLocaleString('en-IN')} />
        <ResultRow 
          label={pnl >= 0 ? "Profit" : "Loss"} 
          value={(pnl >= 0 ? '+' : '') + '₹' + pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          color={pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} 
          big 
        />
        <ResultRow 
          label="Return %" 
          value={(pnl >= 0 ? '+' : '') + pnlPct.toFixed(2) + '%'}
          color={pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} 
        />
      </div>
    </div>
  );
}

// ============ BROKERAGE CALCULATOR ============
function BrokerageCalculator() {
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [qty, setQty] = useState('');
  const [segment, setSegment] = useState('intraday');

  const buyValue = (parseFloat(buyPrice) || 0) * (parseFloat(qty) || 0);
  const sellValue = (parseFloat(sellPrice) || 0) * (parseFloat(qty) || 0);
  const turnover = buyValue + sellValue;

  let brokerage = 0;
  let stt = 0;
  let exchangeCharge = 0;
  let gst = 0;
  let sebiCharge = 0;
  let stampDuty = 0;

  if (segment === 'intraday') {
    brokerage = Math.min(20, buyValue * 0.0003) + Math.min(20, sellValue * 0.0003);
    stt = sellValue * 0.00025;
    exchangeCharge = turnover * 0.0000345;
    stampDuty = buyValue * 0.00003;
  } else if (segment === 'delivery') {
    brokerage = 0;
    stt = turnover * 0.001;
    exchangeCharge = turnover * 0.0000345;
    stampDuty = buyValue * 0.00015;
  } else if (segment === 'futures') {
    brokerage = Math.min(20, buyValue * 0.0003) + Math.min(20, sellValue * 0.0003);
    stt = sellValue * 0.000125;
    exchangeCharge = turnover * 0.0000019;
    stampDuty = buyValue * 0.00002;
  }

  sebiCharge = turnover * 0.000001;
  gst = (brokerage + exchangeCharge + sebiCharge) * 0.18;

  const totalCharges = brokerage + stt + exchangeCharge + gst + sebiCharge + stampDuty;
  const netPnL = (sellValue - buyValue) - totalCharges;
  const breakEven = qty > 0 ? (parseFloat(buyPrice) + (totalCharges / parseFloat(qty))) : 0;

  return (
    <div>
      <div style={{ padding: 14, background: 'rgba(59,130,246,0.1)', borderRadius: 10, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        💡 Calculate exact brokerage & charges (Zerodha-style rates)
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
          Segment
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {['intraday', 'delivery', 'futures'].map(s => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              style={{
                flex: 1,
                padding: 8,
                background: segment === s ? 'var(--accent-blue)' : 'var(--bg-input)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Input label="Buy Price (₹)" value={buyPrice} onChange={setBuyPrice} icon="📈" />
      <Input label="Sell Price (₹)" value={sellPrice} onChange={setSellPrice} icon="📉" />
      <Input label="Quantity" value={qty} onChange={setQty} icon="🔢" />

      <div style={{
        marginTop: 20,
        padding: 20,
        background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
        borderRadius: 12,
        border: '1px solid rgba(239,68,68,0.3)',
      }}>
        <h4 style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>💸 Charges Breakdown</h4>
        <ResultRow label="Brokerage" value={'₹' + brokerage.toFixed(2)} />
        <ResultRow label="STT" value={'₹' + stt.toFixed(2)} />
        <ResultRow label="Exchange Charges" value={'₹' + exchangeCharge.toFixed(2)} />
        <ResultRow label="GST (18%)" value={'₹' + gst.toFixed(2)} />
        <ResultRow label="SEBI Charges" value={'₹' + sebiCharge.toFixed(2)} />
        <ResultRow label="Stamp Duty" value={'₹' + stampDuty.toFixed(2)} />
        <div style={{ borderTop: '1px dashed var(--border-color)', margin: '12px 0' }} />
        <ResultRow label="Total Charges" value={'₹' + totalCharges.toFixed(2)} color="var(--accent-red)" big />
        <ResultRow label="Break-even Price" value={'₹' + breakEven.toFixed(2)} color="var(--accent-yellow)" />
        <ResultRow 
          label="Net P&L" 
          value={(netPnL >= 0 ? '+' : '') + '₹' + netPnL.toFixed(2)}
          color={netPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} 
          big 
        />
      </div>
    </div>
  );
}

// ============ HELPER COMPONENTS ============
function Input({ label, value, onChange, icon, suffix }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>
        {icon} {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={{
            width: '100%',
            padding: '12px 14px',
            paddingRight: suffix ? 40 : 14,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 15,
            fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {suffix && (
          <span style={{ 
            position: 'absolute', 
            right: 14, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            fontSize: 13, 
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, big }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '6px 0',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: big ? 13 : 12, color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ 
        fontSize: big ? 20 : 14, 
        fontWeight: 700, 
        color: color || 'var(--text-primary)',
      }}>
        {value}
      </span>
    </div>
  );
}

// ============ DETACHED WINDOW HTML ============
function getDetachedHTML() {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<title>TradeVault Calculator</title>',
    '<style>',
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background: #0f172a; color: #fff; padding: 16px; min-height: 100vh; }',
    '.calc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #2a3150; }',
    '.calc-title { font-size: 18px; font-weight: 700; }',
    '.calc-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: #1a1f35; padding: 4px; border-radius: 10px; }',
    '.calc-tab { flex: 1; padding: 8px 4px; background: transparent; color: #94a3b8; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }',
    '.calc-tab.active { background: #3b82f6; color: #fff; }',
    '.display { background: #1a1f35; padding: 20px; border-radius: 12px; margin-bottom: 12px; text-align: right; font-size: 36px; font-weight: 700; color: #3b82f6; overflow: hidden; }',
    '.btn-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }',
    '.btn { padding: 18px; background: #1a1f35; color: #fff; border: none; border-radius: 12px; font-size: 20px; font-weight: 600; cursor: pointer; transition: transform 0.1s; }',
    '.btn:hover { transform: scale(1.02); }',
    '.btn:active { transform: scale(0.98); }',
    '.btn-red { background: #ef4444; }',
    '.btn-orange { background: #f59e0b; }',
    '.btn-blue { background: #3b82f6; }',
    '.btn-green { background: #10b981; }',
    '.btn-zero { grid-column: span 2; }',
    'input[type="number"] { width: 100%; padding: 12px 14px; background: #1a1f35; border: 1px solid #2a3150; border-radius: 8px; color: #fff; font-size: 15px; font-weight: 600; outline: none; margin-bottom: 8px; }',
    'label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px; }',
    '.form-group { margin-bottom: 12px; }',
    '.info-box { padding: 14px; background: rgba(59,130,246,0.1); border-radius: 10px; margin-bottom: 16px; font-size: 12px; color: #94a3b8; }',
    '.results { margin-top: 20px; padding: 20px; background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15)); border-radius: 12px; border: 1px solid rgba(16,185,129,0.3); }',
    '.results.loss { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15)); border-color: rgba(239,68,68,0.3); }',
    '.results h4 { font-size: 13px; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }',
    '.result-row { display: flex; justify-content: space-between; padding: 6px 0; align-items: center; }',
    '.result-row .rlabel { font-size: 12px; color: #94a3b8; }',
    '.result-row .rvalue { font-size: 14px; font-weight: 700; }',
    '.result-row .rvalue.big { font-size: 20px; }',
    '.result-row .rvalue.green { color: #10b981; }',
    '.result-row .rvalue.red { color: #ef4444; }',
    '.result-row .rvalue.blue { color: #3b82f6; }',
    '.result-row .rvalue.yellow { color: #f59e0b; }',
    '.segment-btns { display: flex; gap: 6px; margin-bottom: 16px; }',
    '.segment-btn { flex: 1; padding: 8px; background: #1a1f35; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px; text-transform: uppercase; }',
    '.segment-btn.active { background: #3b82f6; }',
    '.direction-btns { display: flex; gap: 8px; margin-bottom: 16px; }',
    '.dir-btn { flex: 1; padding: 10px; background: #1a1f35; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }',
    '.dir-btn.active-long { background: #10b981; }',
    '.dir-btn.active-short { background: #ef4444; }',
    '.divider { border-top: 1px dashed #2a3150; margin: 12px 0; }',
    '</style>',
    '</head>',
    '<body>',
    '<div class="calc-header"><div class="calc-title">🧮 TradeVault Calculator</div></div>',
    '<div class="calc-tabs">',
    '<button class="calc-tab active" data-tab="basic">🔢 Basic</button>',
    '<button class="calc-tab" data-tab="position">📊 Position</button>',
    '<button class="calc-tab" data-tab="pnl">💰 P&L</button>',
    '<button class="calc-tab" data-tab="brokerage">💸 Charges</button>',
    '</div>',
    '<div id="calc-content"></div>',
    '<script>',
    'var currentTab = "basic";',
    'var display = "0";',
    'var prev = null;',
    'var op = null;',
    'var waiting = false;',
    'var pnlDir = "long";',
    'var brokerSeg = "intraday";',
    'var savedInputs = {};',
    
    'function fmt(val) { if (isNaN(val)) return "0"; return Number(val).toLocaleString("en-IN", { maximumFractionDigits: 2 }); }',
    
    'function saveInput(id, val) { savedInputs[id] = val; }',
    'function getInput(id, def) { return savedInputs[id] !== undefined ? savedInputs[id] : (def || ""); }',
    
    'function renderBasic() {',
    '  return \'<div class="display">\' + display + \'</div>\' +',
    '    \'<div class="btn-grid">\' +',
    '    \'<button class="btn btn-red" onclick="clearCalc()">AC</button>\' +',
    '    \'<button class="btn btn-orange" onclick="toggleSign()">±</button>\' +',
    '    \'<button class="btn btn-orange" onclick="percent()">%</button>\' +',
    '    \'<button class="btn btn-blue" onclick="performOp(\\\'÷\\\')">÷</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(7)">7</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(8)">8</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(9)">9</button>\' +',
    '    \'<button class="btn btn-blue" onclick="performOp(\\\'×\\\')">×</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(4)">4</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(5)">5</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(6)">6</button>\' +',
    '    \'<button class="btn btn-blue" onclick="performOp(\\\'-\\\')">-</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(1)">1</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(2)">2</button>\' +',
    '    \'<button class="btn" onclick="inputDigit(3)">3</button>\' +',
    '    \'<button class="btn btn-blue" onclick="performOp(\\\'+\\\')">+</button>\' +',
    '    \'<button class="btn btn-zero" onclick="inputDigit(0)">0</button>\' +',
    '    \'<button class="btn" onclick="inputDot()">.</button>\' +',
    '    \'<button class="btn btn-green" onclick="equals()">=</button>\' +',
    '    \'</div>\';',
    '}',
    
    'function renderPosition() {',
    '  var cap = getInput("capital", "100000");',
    '  var risk = getInput("riskPct", "2");',
    '  var ent = getInput("entry", "");',
    '  var sl = getInput("sl", "");',
    '  var riskAmt = (parseFloat(cap) || 0) * (parseFloat(risk) || 0) / 100;',
    '  var rps = Math.abs((parseFloat(ent) || 0) - (parseFloat(sl) || 0));',
    '  var shares = rps > 0 ? Math.floor(riskAmt / rps) : 0;',
    '  var posVal = shares * (parseFloat(ent) || 0);',
    '  return \'<div class="info-box">💡 Calculate exact position size based on your risk (2% Rule)</div>\' +',
    '    \'<div class="form-group"><label>💰 Total Capital (₹)</label><input type="number" value="\' + cap + \'" oninput="saveInput(\\\'capital\\\', this.value); render();" /></div>\' +',
    '    \'<div class="form-group"><label>🎯 Risk % per Trade</label><input type="number" value="\' + risk + \'" oninput="saveInput(\\\'riskPct\\\', this.value); render();" /></div>\' +',
    '    \'<div class="form-group"><label>📈 Entry Price (₹)</label><input type="number" value="\' + ent + \'" oninput="saveInput(\\\'entry\\\', this.value); render();" /></div>\' +',
    '    \'<div class="form-group"><label>🛑 Stop Loss (₹)</label><input type="number" value="\' + sl + \'" oninput="saveInput(\\\'sl\\\', this.value); render();" /></div>\' +',
    '    \'<div class="results"><h4>📊 Results</h4>\' +',
    '    \'<div class="result-row"><span class="rlabel">Risk Amount:</span><span class="rvalue red">₹\' + fmt(riskAmt) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Risk per Share:</span><span class="rvalue">₹\' + rps.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Shares to Buy:</span><span class="rvalue big green">\' + shares.toLocaleString("en-IN") + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Position Value:</span><span class="rvalue blue">₹\' + fmt(posVal) + \'</span></div>\' +',
    '    \'</div>\';',
    '}',
    
    'function renderPnL() {',
    '  var ent = getInput("pentry", "");',
    '  var exi = getInput("pexit", "");',
    '  var qty = getInput("pqty", "");',
    '  var eVal = (parseFloat(ent) || 0) * (parseFloat(qty) || 0);',
    '  var xVal = (parseFloat(exi) || 0) * (parseFloat(qty) || 0);',
    '  var pnl = pnlDir === "long" ? xVal - eVal : eVal - xVal;',
    '  var pct = eVal > 0 ? (pnl / eVal) * 100 : 0;',
    '  return \'<div class="info-box">💡 Calculate profit/loss for any trade before executing</div>\' +',
    '    \'<label>Direction</label>\' +',
    '    \'<div class="direction-btns">\' +',
    '    \'<button class="dir-btn \' + (pnlDir === "long" ? "active-long" : "") + \'" onclick="pnlDir=\\\'long\\\'; render();">🟢 LONG (Buy)</button>\' +',
    '    \'<button class="dir-btn \' + (pnlDir === "short" ? "active-short" : "") + \'" onclick="pnlDir=\\\'short\\\'; render();">🔴 SHORT (Sell)</button>\' +',
    '    \'</div>\' +',
    '    \'<div class="form-group"><label>📈 Entry Price (₹)</label><input type="number" value="\' + ent + \'" oninput="saveInput(\\\'pentry\\\', this.value); render();" /></div>\' +',
    '    \'<div class="form-group"><label>📉 Exit Price (₹)</label><input type="number" value="\' + exi + \'" oninput="saveInput(\\\'pexit\\\', this.value); render();" /></div>\' +',
    '    \'<div class="form-group"><label>🔢 Quantity</label><input type="number" value="\' + qty + \'" oninput="saveInput(\\\'pqty\\\', this.value); render();" /></div>\' +',
    '    \'<div class="results \' + (pnl < 0 ? "loss" : "") + \'"><h4>💰 Results</h4>\' +',
    '    \'<div class="result-row"><span class="rlabel">Investment:</span><span class="rvalue">₹\' + fmt(eVal) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Exit Value:</span><span class="rvalue">₹\' + fmt(xVal) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">\' + (pnl >= 0 ? "Profit" : "Loss") + \':</span><span class="rvalue big \' + (pnl >= 0 ? "green" : "red") + \'">\' + (pnl >= 0 ? "+" : "") + \'₹\' + fmt(pnl) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Return %:</span><span class="rvalue \' + (pnl >= 0 ? "green" : "red") + \'">\' + (pnl >= 0 ? "+" : "") + pct.toFixed(2) + \'%</span></div>\' +',
    '    \'</div>\';',
    '}',
    
    'function renderBrokerage() {',
    '  var buy = getInput("buy", "");',
    '  var sell = getInput("sell", "");',
    '  var qty = getInput("bqty", "");',
    '  var buyVal = (parseFloat(buy) || 0) * (parseFloat(qty) || 0);',
    '  var sellVal = (parseFloat(sell) || 0) * (parseFloat(qty) || 0);',
    '  var turnover = buyVal + sellVal;',
    '  var brokerage = 0, stt = 0, exchange = 0, gst = 0, sebi = 0, stamp = 0;',
    '  if (brokerSeg === "intraday") { brokerage = Math.min(20, buyVal * 0.0003) + Math.min(20, sellVal * 0.0003); stt = sellVal * 0.00025; exchange = turnover * 0.0000345; stamp = buyVal * 0.00003; }',
    '  else if (brokerSeg === "delivery") { stt = turnover * 0.001; exchange = turnover * 0.0000345; stamp = buyVal * 0.00015; }',
    '  else if (brokerSeg === "futures") { brokerage = Math.min(20, buyVal * 0.0003) + Math.min(20, sellVal * 0.0003); stt = sellVal * 0.000125; exchange = turnover * 0.0000019; stamp = buyVal * 0.00002; }',
    '  sebi = turnover * 0.000001;',
    '  gst = (brokerage + exchange + sebi) * 0.18;',
    '  var total = brokerage + stt + exchange + gst + sebi + stamp;',
    '  var net = (sellVal - buyVal) - total;',
    '  var breakEven = qty > 0 ? (parseFloat(buy) + (total / parseFloat(qty))) : 0;',
    '  return \'<div class="info-box">💡 Calculate exact brokerage & charges (Zerodha-style)</div>\' +',
    '    \'<label>Segment</label>\' +',
    '    \'<div class="segment-btns">\' +',
    '    \'<button class="segment-btn \' + (brokerSeg === "intraday" ? "active" : "") + \'" onclick="brokerSeg=\\\'intraday\\\'; render();">Intraday</button>\' +',
    '    \'<button class="segment-btn \' + (brokerSeg === "delivery" ? "active" : "") + \'" onclick="brokerSeg=\\\'delivery\\\'; render();">Delivery</button>\' +',
    '    \'<button class="segment-btn \' + (brokerSeg === "futures" ? "active" : "") + \'" onclick="brokerSeg=\\\'futures\\\'; render();">Futures</button>\' +',
    '    \'</div>\' +',
    '    \'<div class="form-group"><label>📈 Buy Price (₹)</label><input type="number" value="\' + buy + \'" oninput="saveInput(\\\'buy\\\', this.value); render();" /></div>\' +',
    '    \'<div class="form-group"><label>📉 Sell Price (₹)</label><input type="number" value="\' + sell + \'" oninput="saveInput(\\\'sell\\\', this.value); render();" /></div>\' +',
    '    \'<div class="form-group"><label>🔢 Quantity</label><input type="number" value="\' + qty + \'" oninput="saveInput(\\\'bqty\\\', this.value); render();" /></div>\' +',
    '    \'<div class="results loss"><h4>💸 Charges Breakdown</h4>\' +',
    '    \'<div class="result-row"><span class="rlabel">Brokerage:</span><span class="rvalue">₹\' + brokerage.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">STT:</span><span class="rvalue">₹\' + stt.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Exchange:</span><span class="rvalue">₹\' + exchange.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">GST (18%):</span><span class="rvalue">₹\' + gst.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">SEBI:</span><span class="rvalue">₹\' + sebi.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Stamp Duty:</span><span class="rvalue">₹\' + stamp.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="divider"></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Total Charges:</span><span class="rvalue big red">₹\' + total.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Break-even:</span><span class="rvalue yellow">₹\' + breakEven.toFixed(2) + \'</span></div>\' +',
    '    \'<div class="result-row"><span class="rlabel">Net P&L:</span><span class="rvalue big \' + (net >= 0 ? "green" : "red") + \'">\' + (net >= 0 ? "+" : "") + \'₹\' + net.toFixed(2) + \'</span></div>\' +',
    '    \'</div>\';',
    '}',
    
    'function render() {',
    '  var content = document.getElementById("calc-content");',
    '  if (currentTab === "basic") content.innerHTML = renderBasic();',
    '  else if (currentTab === "position") content.innerHTML = renderPosition();',
    '  else if (currentTab === "pnl") content.innerHTML = renderPnL();',
    '  else if (currentTab === "brokerage") content.innerHTML = renderBrokerage();',
    '}',
    
    'function inputDigit(d) { if (waiting) { display = String(d); waiting = false; } else { display = display === "0" ? String(d) : display + d; } render(); }',
    'function inputDot() { if (waiting) { display = "0."; waiting = false; } else if (!display.includes(".")) display += "."; render(); }',
    'function clearCalc() { display = "0"; prev = null; op = null; waiting = false; render(); }',
    'function toggleSign() { display = String(-parseFloat(display)); render(); }',
    'function percent() { display = String(parseFloat(display) / 100); render(); }',
    'function performOp(nextOp) { var val = parseFloat(display); if (prev === null) prev = val; else if (op) { var r = calcOp(prev, val, op); prev = r; display = String(r); } waiting = true; op = nextOp; render(); }',
    'function calcOp(a, b, o) { if (o === "+") return a + b; if (o === "-") return a - b; if (o === "×") return a * b; if (o === "÷") return b !== 0 ? a / b : 0; return b; }',
    'function equals() { var val = parseFloat(display); if (prev !== null && op) { display = String(calcOp(prev, val, op)); prev = null; op = null; waiting = true; } render(); }',
    
    'document.querySelectorAll(".calc-tab").forEach(function(btn) {',
    '  btn.addEventListener("click", function() {',
    '    document.querySelectorAll(".calc-tab").forEach(function(b) { b.classList.remove("active"); });',
    '    btn.classList.add("active");',
    '    currentTab = btn.dataset.tab;',
    '    render();',
    '  });',
    '});',
    
    'render();',
    '</script>',
    '</body>',
    '</html>'
  ].join('\n');
}

export default CalculatorModal;