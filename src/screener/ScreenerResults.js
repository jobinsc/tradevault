import React, { useState, useEffect } from 'react';
import { runScan } from '../services/scanEngineService';

const ScreenerResults = ({ screener, onClose, onSymbolClick }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0, symbol: '' });
  const [sortBy, setSortBy] = useState('change');
  const [sortDir, setSortDir] = useState('desc');
  const [searchFilter, setSearchFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');

  useEffect(() => { 
    execute(); 
    // eslint-disable-next-line
  }, []);

  const execute = async () => {
    setLoading(true);
    setResults([]);
    setProgress({ current: 0, total: 0, symbol: '' });
    try {
      const data = await runScan(screener, (curr, total, symbol) => {
        setProgress({ current: curr, total, symbol });
      });
      setResults(data);
    } catch (err) {
      alert('Scan error: ' + err.message);
    }
    setLoading(false);
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const sortedResults = [...results]
    .filter(r => 
      r.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.name?.toLowerCase().includes(searchFilter.toLowerCase())
    )
    .filter(r => sectorFilter === 'all' || r.sector === sectorFilter)
    .sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const uniqueSectors = [...new Set(results.map(r => r.sector))].sort();

  const exportCSV = () => {
    const headers = ['Symbol', 'Name', 'Sector', 'Close', 'Change %', 'Volume', 'High', 'Low', 'Date'];
    const rows = sortedResults.map(r => [
      r.symbol, r.name, r.sector, r.close, r.change, r.volume, r.high, r.low, r.date
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${screener.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const copyToClipboard = () => {
    const text = sortedResults.map(r => r.symbol).join(', ');
    navigator.clipboard.writeText(text);
    alert('✅ Symbols copied to clipboard!');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>📊 {screener.name}</h2>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 12 }}>
              {screener.conditions?.length || 0} conditions • {screener.patterns?.length || 0} patterns • {screener.logic || 'AND'} logic
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ margin: '0 0 12px' }}>Scanning stocks...</h3>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
                Currently checking: <strong style={{ color: '#6366f1' }}>{progress.symbol}</strong>
              </p>
              <div style={styles.progressBar}>
                <div style={{ 
                  ...styles.progressFill, 
                  width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' 
                }} />
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
                {progress.current} / {progress.total} stocks • {results.length} matches so far
              </p>
            </div>
          ) : (
            <>
              {/* Summary Bar */}
              <div style={styles.summaryBar}>
                <div>
                  <strong style={{ fontSize: 24, color: '#10b981' }}>{sortedResults.length}</strong>
                  <span style={{ color: '#94a3b8', marginLeft: 8 }}>
                    stocks matched {sortedResults.length !== results.length && `(filtered from ${results.length})`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={execute} style={styles.actionBtn}>🔄 Refresh</button>
                  <button onClick={copyToClipboard} style={styles.actionBtn}>📋 Copy Symbols</button>
                  <button onClick={exportCSV} style={{ ...styles.actionBtn, background: '#10b981', color: 'white' }}>
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              {results.length > 0 && (
                <div style={styles.filterRow}>
                  <input
                    type="text"
                    placeholder="🔍 Search symbol or name..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    style={styles.filterInput}
                  />
                  <select
                    value={sectorFilter}
                    onChange={e => setSectorFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Sectors ({results.length})</option>
                    {uniqueSectors.map(s => (
                      <option key={s} value={s}>
                        {s} ({results.filter(r => r.sector === s).length})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Results Table */}
              {sortedResults.length === 0 ? (
                <div style={styles.emptyResults}>
                  <div style={{ fontSize: 48 }}>😔</div>
                  <h3>No stocks match</h3>
                  <p style={{ color: '#94a3b8' }}>Try adjusting your screener conditions</p>
                </div>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead style={styles.thead}>
                      <tr>
                        <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('symbol')}>
                          Symbol {sortBy === 'symbol' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Sector</th>
                        <th style={{ ...styles.thRight, cursor: 'pointer' }} onClick={() => handleSort('close')}>
                          Close {sortBy === 'close' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ ...styles.thRight, cursor: 'pointer' }} onClick={() => handleSort('change')}>
                          Change % {sortBy === 'change' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ ...styles.thRight, cursor: 'pointer' }} onClick={() => handleSort('volume')}>
                          Volume {sortBy === 'volume' && (sortDir === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResults.map((r, i) => (
                        <tr key={r.symbol} style={{ ...styles.tr, background: i % 2 === 0 ? '#0f172a' : '#1a2234' }}>
                          <td style={styles.tdSymbol}>
                            <strong>{r.symbol}</strong>
                          </td>
                          <td style={{ ...styles.td, color: '#94a3b8', fontSize: 12 }}>{r.name}</td>
                          <td style={styles.td}>
                            <span style={styles.sectorChip}>{r.sector}</span>
                          </td>
                          <td style={styles.tdRight}>₹{r.close?.toFixed(2)}</td>
                          <td style={{ 
                            ...styles.tdRight, 
                            color: r.change >= 0 ? '#10b981' : '#ef4444',
                            fontWeight: 700
                          }}>
                            {r.change >= 0 ? '+' : ''}{r.change}%
                          </td>
                          <td style={{ ...styles.tdRight, color: '#94a3b8', fontSize: 12 }}>
                            {r.volume?.toLocaleString('en-IN')}
                          </td>
                          <td style={styles.td}>
                            <button
  onClick={() => {
    // Save current screener to return to
    sessionStorage.setItem('lastScreenerId', screener.id);
    sessionStorage.setItem('lastScreenerData', JSON.stringify(screener));
    onSymbolClick?.(r.symbol);
    onClose(); // Close the results modal
  }}
  style={styles.chartBtn}
>
  📈 View
</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modal: { background: '#0f172a', width: '100%', maxWidth: 1200, maxHeight: '90vh', borderRadius: 16, display: 'flex', flexDirection: 'column', border: '1px solid #334155', color: '#f1f5f9' },
  header: { padding: 20, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  body: { padding: 20, overflow: 'auto', flex: 1 },
  closeBtn: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' },
  loadingState: { textAlign: 'center', padding: 60 },
  progressBar: { width: '100%', maxWidth: 500, margin: '0 auto', height: 12, background: '#1e293b', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', transition: 'width 0.3s' },
  summaryBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#1e293b', borderRadius: 10, marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  actionBtn: { padding: '8px 14px', background: '#334155', color: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 16 },
  filterInput: { flex: 1, padding: 10, background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, fontSize: 13, outline: 'none' },
  filterSelect: { padding: 10, background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  emptyResults: { textAlign: 'center', padding: 60 },
  tableWrap: { overflow: 'auto', borderRadius: 10, border: '1px solid #334155' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead: { background: '#1e293b', position: 'sticky', top: 0 },
  th: { padding: 12, textAlign: 'left', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #334155' },
  thRight: { padding: 12, textAlign: 'right', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #334155' },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: 12 },
  tdSymbol: { padding: 12, color: '#6366f1', fontWeight: 700 },
  tdRight: { padding: 12, textAlign: 'right' },
  sectorChip: { padding: '3px 8px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderRadius: 4, fontSize: 10, fontWeight: 600 },
  chartBtn: { padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 },
};

export default ScreenerResults;