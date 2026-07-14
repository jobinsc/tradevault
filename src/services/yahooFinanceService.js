import { getCache, setCache } from './cacheService';

const YAHOO_BASE = 'https://query1.finance.yahoo.com';

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${url}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const fetchWithProxy = async (url) => {
  for (const proxyFn of CORS_PROXIES) {
    try {
      const response = await fetch(proxyFn(url));
      if (response.ok) {
        const text = await response.text();
        try { return JSON.parse(text); } catch { return null; }
      }
    } catch { continue; }
  }
  return null;
};

export const getYahooHistoricalData = async (symbol, range = '3mo', interval = '1d') => {
  // ⚡ Check cache first (10x faster!)
  const cacheKey = `${symbol}_${range}_${interval}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    const url = `${YAHOO_BASE}/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`;
    const data = await fetchWithProxy(url);
    if (!data?.chart?.result?.[0]) return null;
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0];
    
    const candles = timestamps.map((ts, i) => ({
      timestamp: ts * 1000,
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open[i] || 0,
      high: quotes.high[i] || 0,
      low: quotes.low[i] || 0,
      close: quotes.close[i] || 0,
      volume: quotes.volume[i] || 0,
    })).filter(c => c.close > 0);
    
    // ⚡ Save to cache
    if (candles.length > 0) {
      setCache(cacheKey, candles);
    }
    return candles;
  } catch (error) {
    console.error(`Yahoo error for ${symbol}:`, error.message);
    return null;
  }
};

export const getYahooQuote = async (symbol) => {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    const url = `${YAHOO_BASE}/v7/finance/quote?symbols=${yahooSymbol}`;
    const data = await fetchWithProxy(url);
    return data?.quoteResponse?.result?.[0] || null;
  } catch (error) {
    return null;
  }
};