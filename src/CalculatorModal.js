import React, { useState } from 'react';

function CalculatorModal({ onClose }) {
  const [tab, setTab] = useState('basic');

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
        <ResultRow label="Risk Amount" value={`₹${riskAmount.toLocaleString('en-IN')}`} color="var(--accent-red)" />
        <ResultRow label="Risk per Share" value={`₹${riskPerShare.toFixed(2)}`} />
        <ResultRow label="Shares to Buy" value={shares.toLocaleString('en-IN')} color="var(--accent-green)" big />
        <ResultRow label="Position Value" value={`₹${positionValue.toLocaleString('en-IN')}`} color="var(--accent-blue)" />
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

      {/* Direction Toggle */}
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
        <ResultRow label="Investment" value={`₹${entryValue.toLocaleString('en-IN')}`} />
        <ResultRow label="Exit Value" value={`₹${exitValue.toLocaleString('en-IN')}`} />
        <ResultRow 
          label={pnl >= 0 ? "Profit" : "Loss"} 
          value={`${pnl >= 0 ? '+' : ''}₹${pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} 
          color={pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} 
          big 
        />
        <ResultRow 
          label="Return %" 
          value={`${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`} 
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

  // Zerodha-style charges (approximate)
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

      {/* Segment Selector */}
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
        <ResultRow label="Brokerage" value={`₹${brokerage.toFixed(2)}`} />
        <ResultRow label="STT" value={`₹${stt.toFixed(2)}`} />
        <ResultRow label="Exchange Charges" value={`₹${exchangeCharge.toFixed(2)}`} />
        <ResultRow label="GST (18%)" value={`₹${gst.toFixed(2)}`} />
        <ResultRow label="SEBI Charges" value={`₹${sebiCharge.toFixed(2)}`} />
        <ResultRow label="Stamp Duty" value={`₹${stampDuty.toFixed(2)}`} />
        <div style={{ borderTop: '1px dashed var(--border-color)', margin: '12px 0' }} />
        <ResultRow label="Total Charges" value={`₹${totalCharges.toFixed(2)}`} color="var(--accent-red)" big />
        <ResultRow label="Break-even Price" value={`₹${breakEven.toFixed(2)}`} color="var(--accent-yellow)" />
        <ResultRow 
          label="Net P&L" 
          value={`${netPnL >= 0 ? '+' : ''}₹${netPnL.toFixed(2)}`} 
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

export default CalculatorModal;