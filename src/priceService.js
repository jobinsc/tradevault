import {
  fetchMultipleStockPrices,
  calculateLivePnL,
  calculateChangePercent,
  searchStocks,
} from './priceService';


// src/priceService.js
// Fetches live stock prices using NSE India API (via proxy) + Yahoo Finance fallback

// Cache to avoid too many API calls
const priceCache = {};
const CACHE_DURATION = 30000; // 30 seconds

// Fetch price for a single Indian stock using NSE India API (via CORS proxy)
export const fetchStockPrice = async (symbol) => {
  const cacheKey = symbol.toUpperCase();
  const cached = priceCache[cacheKey];
  
  // Return cached price if still fresh
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const cleanSymbol = symbol.toUpperCase().trim();
  
  // Try Method 1: Yahoo Finance via CORS proxy
  try {
    const yahooSymbol = `${cleanSymbol}.NS`;
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
    
    // Use multiple CORS proxies for reliability
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
    ];
    
    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const result = data.chart.result[0];
          const meta = result.meta;
          
          const priceData = {
            symbol: cleanSymbol,
            price: meta.regularMarketPrice || meta.chartPreviousClose || 0,
            previousClose: meta.chartPreviousClose || meta.previousClose || 0,
            dayHigh: meta.regularMarketDayHigh || 0,
            dayLow: meta.regularMarketDayLow || 0,
            currency: meta.currency || 'INR',
            marketState: meta.marketState || 'CLOSED',
            exchange: 'NSE',
            lastUpdated: new Date(),
            source: 'Yahoo Finance',
          };
          
          // Cache the data
          priceCache[cacheKey] = {
            data: priceData,
            timestamp: Date.now(),
          };
          
          return priceData;
        }
      } catch (proxyError) {
        // Try next proxy
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
};

// Fetch prices for multiple stocks
export const fetchMultipleStockPrices = async (symbols) => {
  const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];
  const results = {};
  
  // Fetch all in parallel
  const promises = uniqueSymbols.map(async (symbol) => {
    const price = await fetchStockPrice(symbol);
    if (price) {
      results[symbol] = price;
    }
  });
  
  await Promise.all(promises);
  return results;
};

// Calculate live P&L for a trade
export const calculateLivePnL = (trade, currentPrice) => {
  if (!currentPrice || !trade.entryPrice || !trade.quantity) return 0;
  
  const entry = Number(trade.entryPrice);
  const qty = Number(trade.quantity);
  const current = Number(currentPrice);
  
  if (trade.direction === 'long') {
    return (current - entry) * qty;
  } else {
    return (entry - current) * qty;
  }
};

// Calculate change percentage from entry
export const calculateChangePercent = (currentPrice, entryPrice) => {
  if (!entryPrice || !currentPrice) return 0;
  return ((currentPrice - entryPrice) / entryPrice) * 100;
};

// Clear cache (useful for manual refresh)
export const clearPriceCache = () => {
  Object.keys(priceCache).forEach(key => delete priceCache[key]);
};

// ─────────────────────────────────────────────
// LIVE STOCK SEARCH via Yahoo Finance
// ─────────────────────────────────────────────

const SEARCH_CACHE = {};
const SEARCH_CACHE_TTL = 15000;

export const searchStocks = async (query) => {
  if (!query || query.trim().length < 1) return [];

  const cacheKey = query.toLowerCase().trim();
  const cached = SEARCH_CACHE[cacheKey];
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    return cached.results;
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=IN&quotesCount=15&newsCount=0&enableFuzzyQuery=false`;

  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) continue;
      const data = await response.json();

      const quotes = data?.finance?.result?.[0]?.quotes || data?.quotes || [];

      const results = quotes
        .filter(q =>
          q.isYahooFinance &&
          (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND') &&
          (q.exchange === 'NSI' || q.exchange === 'BSE' || q.exchDisp === 'NSE' || q.exchDisp === 'BSE')
        )
        .map(q => ({
          symbol: q.symbol,
          displaySymbol: q.symbol.replace('.NS', '').replace('.BO', ''),
          name: q.longname || q.shortname || q.symbol,
          exchange: q.exchDisp || (q.exchange === 'NSI' ? 'NSE' : q.exchange),
          type: q.typeDisp || q.quoteType,
        }))
        .slice(0, 10);

      SEARCH_CACHE[cacheKey] = { results, timestamp: Date.now() };
      return results;
    } catch (e) {
      continue;
    }
  }

  return [];
};
