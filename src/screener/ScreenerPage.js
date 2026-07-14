import React, { useState, useEffect } from 'react';
import { getScreeners, deleteScreener, updateScreener } from '../services/screenerService';
import ScreenerBuilder from './ScreenerBuilder';
import ScreenerResults from './ScreenerResults';

const ScreenerPage = ({ user, onSymbolClick, onClose }) => {
  const [screeners, setScreeners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingScreener, setEditingScreener] = useState(null);
  const [runningScreener, setRunningScreener] = useState(null);
  const [filter, setFilter] = useState('all'); // all, favorites
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadScreeners();
    preloadTopStocks();
    
    // Auto-reopen last screener if user came back from stock detail
    const lastScreenerData = sessionStorage.getItem('lastScreenerData');
    if (lastScreenerData) {
      try {
        const screener = JSON.parse(lastScreenerData);
        setRunningScreener(screener);
        // Clear so it doesn't auto-open again
        sessionStorage.removeItem('lastScreenerData');
        sessionStorage.removeItem('lastScreenerId');
      } catch (e) {
        console.error('Error restoring screener:', e);
      }
    }
  }, []);
  
  // ⚡ Pre-load top stocks in background for instant scanning
  const preloadTopStocks = async () => {
    const { NIFTY_50_STOCKS } = await import('../services/nseStocksList');
    const { getYahooHistoricalData } = await import('../services/yahooFinanceService');
    
    console.log('⚡ Pre-loading top stocks in background...');
    // Silently load top 50 stocks (fires and forgets)
    NIFTY_50_STOCKS.forEach((stock, i) => {
      setTimeout(() => {
        getYahooHistoricalData(stock.symbol, '3mo', '1d');
      }, i * 200); // Stagger requests
    });
  };

  const loadScreeners = async () => {
    setLoading(true);
    try {
      const data = await getScreeners(user.email);
      setScreeners(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this screener?')) {
      await deleteScreener(id);
      loadScreeners();
    }
  };

  const toggleFavorite = async (screener, e) => {
    e.stopPropagation();
    await updateScreener(screener.id, { favorite: !screener.favorite });
    loadScreeners();
  };

  const handleEdit = (screener, e) => {
    e.stopPropagation();
    setEditingScreener(screener);
    setShowBuilder(true);
  };

  const handleDuplicate = async (screener, e) => {
    e.stopPropagation();
    const { id, createdAt, ...rest } = screener;
    setEditingScreener({ ...rest, name: `Copy - ${rest.name}` });
    setShowBuilder(true);
  };

  const filteredScreeners = screeners
    .filter(s => filter === 'favorites' ? s.favorite : true)
    .filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            📊 Stock Screener
            <span style={styles.badge}>PRO</span>
          </h1>
          <p style={styles.subtitle}>
            🚀 Powered by Yahoo Finance • {screeners.length} screener{screeners.length !== 1 ? 's' : ''} • {user.email}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={() => { setEditingScreener(null); setShowBuilder(true); }}
            style={styles.createBtn}
          >
            ✨ Create Scanner
          </button>
          <button 
  onClick={() => {
    import('../services/cacheService').then(({ clearAllCache, getCacheStats }) => {
      const stats = getCacheStats();
      if (window.confirm(`Cache: ${stats.count} stocks (${stats.sizeMB} MB)\n\nClear cache?`)) {
        clearAllCache();
        alert('✅ Cache cleared!');
      }
    });
  }}
  style={{ padding: '12px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}
  title="Cache Manager"
>
  🗄️ Cache
</button>
{onClose && (
  <button onClick={onClose} style={styles.backBtn}>← Back</button>
)}
        </div>
      </div>

      {/* Info Banner */}
      <div style={styles.infoBanner}>
        <span>💡</span>
        <span>
          <strong>Free & Unlimited:</strong> Uses Yahoo Finance API - No token needed! 
          Scans 150+ NSE stocks with 30+ indicators & 14 candlestick patterns.
        </span>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.filterTabs}>
          <button 
            onClick={() => setFilter('all')}
            style={{ ...styles.filterTab, ...(filter === 'all' ? styles.filterTabActive : {}) }}
          >
            All ({screeners.length})
          </button>
          <button 
            onClick={() => setFilter('favorites')}
            style={{ ...styles.filterTab, ...(filter === 'favorites' ? styles.filterTabActive : {}) }}
          >
            ⭐ Favorites ({screeners.filter(s => s.favorite).length})
          </button>
        </div>
        
        <input
          type="text"
          placeholder="🔍 Search screeners..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Screeners Grid */}
      {loading ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48 }}>⏳</div>
          <h3>Loading screeners...</h3>
        </div>
      ) : filteredScreeners.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            {searchQuery ? 'No matching screeners' : 'No screeners yet'}
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>
            {searchQuery ? 'Try different keywords' : 'Create your first screener to find trading opportunities'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowBuilder(true)} style={styles.createBtn}>
              ✨ Create Your First Screener
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredScreeners.map(screener => (
            <div 
              key={screener.id}
              onClick={() => setRunningScreener(screener)}
              style={styles.card}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={styles.cardHeader}>
                <button 
                  onClick={(e) => toggleFavorite(screener, e)}
                  style={styles.starBtn}
                  title="Favorite"
                >
                  {screener.favorite ? '⭐' : '☆'}
                </button>
                <div style={styles.cardMenu}>
                  <button onClick={(e) => handleEdit(screener, e)} style={styles.iconBtn} title="Edit">✏️</button>
                  <button onClick={(e) => handleDuplicate(screener, e)} style={styles.iconBtn} title="Duplicate">📋</button>
                  <button onClick={(e) => handleDelete(screener.id, e)} style={styles.iconBtn} title="Delete">🗑️</button>
                </div>
              </div>
              
              <h3 style={styles.cardTitle}>{screener.name}</h3>
              
              {screener.description && (
                <p style={styles.cardDesc}>{screener.description}</p>
              )}
              
              <div style={styles.cardStats}>
                <span style={styles.statChip}>
                  📊 {screener.conditions?.length || 0} filters
                </span>
                {screener.patterns?.length > 0 && (
                  <span style={styles.statChip}>
                    🕯️ {screener.patterns.length} patterns
                  </span>
                )}
                <span style={styles.statChip}>
                  🔗 {screener.logic || 'AND'}
                </span>
              </div>
              
              {screener.tags?.length > 0 && (
                <div style={styles.tagsRow}>
                  {screener.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}
              
              <div style={styles.cardFooter}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {new Date(screener.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <button style={styles.runBtn} onClick={(e) => { e.stopPropagation(); setRunningScreener(screener); }}>
                  ▶ Run Scan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showBuilder && (
        <ScreenerBuilder
          user={user}
          existing={editingScreener}
          onClose={() => { setShowBuilder(false); setEditingScreener(null); }}
          onSaved={loadScreeners}
        />
      )}

      {runningScreener && (
        <ScreenerResults
          screener={runningScreener}
          onClose={() => setRunningScreener(null)}
          onSymbolClick={onSymbolClick}
        />
      )}
    </div>
  );
};

const styles = {
  container: { padding: 20, background: '#0f172a', minHeight: '100vh', color: '#f1f5f9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 },
  badge: { fontSize: 11, padding: '4px 10px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', borderRadius: 12, fontWeight: 700 },
  subtitle: { color: '#94a3b8', margin: '6px 0 0', fontSize: 13 },
  headerActions: { display: 'flex', gap: 8 },
  createBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.4)' },
  backBtn: { padding: '12px 20px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  infoBanner: { display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, marginBottom: 20, fontSize: 13 },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  filterTabs: { display: 'flex', gap: 8 },
  filterTab: { padding: '8px 16px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  filterTabActive: { background: '#6366f1', color: 'white', borderColor: '#6366f1' },
  searchInput: { padding: '10px 16px', background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 8, fontSize: 13, minWidth: 240, outline: 'none' },
  emptyState: { textAlign: 'center', padding: 60, background: '#1e293b', borderRadius: 16, border: '1px solid #334155' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  card: { padding: 20, background: 'linear-gradient(135deg, #1e293b, #1a2234)', borderRadius: 16, border: '1px solid #334155', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  starBtn: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#f59e0b', padding: 0 },
  cardMenu: { display: 'flex', gap: 4 },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4, fontSize: 14 },
  cardTitle: { fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: '#f1f5f9' },
  cardDesc: { fontSize: 13, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5, minHeight: 40 },
  cardStats: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  statChip: { fontSize: 11, padding: '4px 8px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderRadius: 6, fontWeight: 600 },
  tagsRow: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 },
  tag: { fontSize: 10, padding: '2px 8px', background: '#334155', color: '#cbd5e1', borderRadius: 4 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #334155' },
  runBtn: { padding: '8px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
};

export default ScreenerPage;