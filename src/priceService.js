// src/priceService.js
// Enhanced price service with full stock data (OHLC, Market Cap, P/E, EPS, etc.)

// Cache to avoid too many API calls
const priceCache = {};
const CACHE_DURATION = 30000; // 30 seconds

const detailCache = {};
const DETAIL_CACHE_DURATION = 300000; // 5 minutes for detailed data

// ─────────────────────────────────────────────
// FETCH BASIC PRICE (for Live Prices widget)
// ─────────────────────────────────────────────
export const fetchStockPrice = async (symbol) => {
  const cacheKey = symbol.toUpperCase();
  const cached = priceCache[cacheKey];
  
  // Return cached price if still fresh
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const cleanSymbol = symbol.toUpperCase().trim();
  
  try {
    const yahooSymbol = `${cleanSymbol}.NS`;
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
    
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
          
          // Get today's OHLC from the quote data
          const quote = result.indicators?.quote?.[0];
          const timestamps = result.timestamp || [];
          
          // Calculate today's open, high, low from the data
          let todayOpen = meta.regularMarketOpen || meta.chartPreviousClose || 0;
          let todayHigh = meta.regularMarketDayHigh || 0;
          let todayLow = meta.regularMarketDayLow || 0;
          let volume = meta.regularMarketVolume || 0;
          
          // If we have detailed quote data, use it
          if (quote && quote.open && quote.open.length > 0) {
            // Filter out null values
            const opens = quote.open.filter(v => v !== null);
            const highs = quote.high.filter(v => v !== null);
            const lows = quote.low.filter(v => v !== null);
            const volumes = quote.volume.filter(v => v !== null);
            
            if (opens.length > 0) todayOpen = opens[0];
            if (highs.length > 0) todayHigh = Math.max(...highs);
            if (lows.length > 0) todayLow = Math.min(...lows);
            if (volumes.length > 0) volume = volumes.reduce((a, b) => a + b, 0);
          }
          
          const priceData = {
            symbol: cleanSymbol,
            price: meta.regularMarketPrice || meta.chartPreviousClose || 0,
            previousClose: meta.chartPreviousClose || meta.previousClose || 0,
            open: todayOpen,
            high: todayHigh,
            low: todayLow,
            dayHigh: todayHigh,  // Keep for backward compatibility
            dayLow: todayLow,     // Keep for backward compatibility
            volume: volume,
            high52w: meta.fiftyTwoWeekHigh || 0,
            low52w: meta.fiftyTwoWeekLow || 0,
            currency: meta.currency || 'INR',
            marketState: meta.marketState || 'CLOSED',
            exchange: meta.exchangeName || 'NSE',
            fullExchangeName: meta.fullExchangeName || '',
            instrumentType: meta.instrumentType || 'EQUITY',
            timezone: meta.timezone || 'IST',
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
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
};

// ─────────────────────────────────────────────
// FETCH DETAILED STOCK INFO (for Detail Page)
// Includes: Market Cap, P/E, EPS, Description, etc.
// ─────────────────────────────────────────────
export const fetchStockDetails = async (symbol) => {
  const cacheKey = `detail_${symbol.toUpperCase()}`;
  const cached = detailCache[cacheKey];
  
  if (cached && (Date.now() - cached.timestamp) < DETAIL_CACHE_DURATION) {
    return cached.data;
  }
  
  const cleanSymbol = symbol.toUpperCase().trim();
  const yahooSymbol = `${cleanSymbol}.NS`;
  
  // Yahoo Finance quoteSummary API - has detailed fundamentals
  const modules = 'summaryDetail,defaultKeyStatistics,financialData,assetProfile,price';
  const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=${modules}`;
  
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`,
  ];
  
  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data?.quoteSummary?.result?.[0]) {
        const result = data.quoteSummary.result[0];
        const summary = result.summaryDetail || {};
        const keyStats = result.defaultKeyStatistics || {};
        const financial = result.financialData || {};
        const profile = result.assetProfile || {};
        const priceInfo = result.price || {};
        
        const details = {
          // Price info
          marketCap: priceInfo.marketCap?.raw || summary.marketCap?.raw || 0,
          
          // Fundamentals
          pe: summary.trailingPE?.raw || 0,
          forwardPe: summary.forwardPE?.raw || 0,
          eps: keyStats.trailingEps?.raw || 0,
          forwardEps: keyStats.forwardEps?.raw || 0,
          pegRatio: keyStats.pegRatio?.raw || 0,
          priceToBook: keyStats.priceToBook?.raw || 0,
          
          // Yield & Dividend
          dividendYield: summary.dividendYield?.raw ? (summary.dividendYield.raw * 100) : 0,
          dividendRate: summary.dividendRate?.raw || 0,
          exDividendDate: summary.exDividendDate?.fmt || null,
          
          // 52 Week
          high52w: summary.fiftyTwoWeekHigh?.raw || 0,
          low52w: summary.fiftyTwoWeekLow?.raw || 0,
          
          // Moving Averages
          fiftyDayAvg: summary.fiftyDayAverage?.raw || 0,
          twoHundredDayAvg: summary.twoHundredDayAverage?.raw || 0,
          
          // Volume
          volume: summary.volume?.raw || 0,
          avgVolume: summary.averageVolume?.raw || 0,
          
          // Beta
          beta: summary.beta?.raw || keyStats.beta?.raw || 0,
          
          // Company Profile
          description: profile.longBusinessSummary || '',
          industry: profile.industry || '',
          sector: profile.sector || '',
          website: profile.website || '',
          employees: profile.fullTimeEmployees || 0,
          country: profile.country || 'India',
          city: profile.city || '',
          address: profile.address1 || '',
          phone: profile.phone || '',
          
          // Financials
          totalRevenue: financial.totalRevenue?.raw || 0,
          profitMargins: financial.profitMargins?.raw ? (financial.profitMargins.raw * 100) : 0,
          operatingMargins: financial.operatingMargins?.raw ? (financial.operatingMargins.raw * 100) : 0,
          returnOnAssets: financial.returnOnAssets?.raw ? (financial.returnOnAssets.raw * 100) : 0,
          returnOnEquity: financial.returnOnEquity?.raw ? (financial.returnOnEquity.raw * 100) : 0,
          revenueGrowth: financial.revenueGrowth?.raw ? (financial.revenueGrowth.raw * 100) : 0,
          earningsGrowth: financial.earningsGrowth?.raw ? (financial.earningsGrowth.raw * 100) : 0,
          debtToEquity: financial.debtToEquity?.raw || 0,
          totalCash: financial.totalCash?.raw || 0,
          totalDebt: financial.totalDebt?.raw || 0,
          
          // Analyst Recommendations
          targetHighPrice: financial.targetHighPrice?.raw || 0,
          targetLowPrice: financial.targetLowPrice?.raw || 0,
          targetMeanPrice: financial.targetMeanPrice?.raw || 0,
          recommendationKey: financial.recommendationKey || '',
          numberOfAnalystOpinions: financial.numberOfAnalystOpinions?.raw || 0,
          
          // Shares
          sharesOutstanding: keyStats.sharesOutstanding?.raw || 0,
          floatShares: keyStats.floatShares?.raw || 0,
          heldPercentInsiders: keyStats.heldPercentInsiders?.raw ? (keyStats.heldPercentInsiders.raw * 100) : 0,
          heldPercentInstitutions: keyStats.heldPercentInstitutions?.raw ? (keyStats.heldPercentInstitutions.raw * 100) : 0,
        };
        
        // Cache the data
        detailCache[cacheKey] = {
          data: details,
          timestamp: Date.now(),
        };
        
        return details;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
};

// ─────────────────────────────────────────────
// FETCH COMBINED DATA (Price + Details)
// This is what Stock Detail Page will use
// ─────────────────────────────────────────────
export const fetchFullStockData = async (symbol) => {
  try {
    // Fetch both in parallel
    const [priceData, details] = await Promise.all([
      fetchStockPrice(symbol),
      fetchStockDetails(symbol),
    ]);
    
    if (!priceData) return null;
    
    // Merge both
    return {
      ...priceData,
      ...(details || {}),
    };
  } catch (error) {
    console.error(`Error fetching full data for ${symbol}:`, error);
    return null;
  }
};

// ─────────────────────────────────────────────
// FETCH MULTIPLE STOCK PRICES (for dashboard widget)
// ─────────────────────────────────────────────
export const fetchMultipleStockPrices = async (symbols) => {
  const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];
  const results = {};
  
  const promises = uniqueSymbols.map(async (symbol) => {
    const price = await fetchStockPrice(symbol);
    if (price) {
      results[symbol] = price;
    }
  });
  
  await Promise.all(promises);
  return results;
};

// ─────────────────────────────────────────────
// CALCULATE LIVE P&L
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// CALCULATE CHANGE PERCENTAGE
// ─────────────────────────────────────────────
export const calculateChangePercent = (currentPrice, entryPrice) => {
  if (!entryPrice || !currentPrice) return 0;
  return ((currentPrice - entryPrice) / entryPrice) * 100;
};

// ─────────────────────────────────────────────
// CLEAR CACHE (for manual refresh)
// ─────────────────────────────────────────────
export const clearPriceCache = () => {
  Object.keys(priceCache).forEach(key => delete priceCache[key]);
  Object.keys(detailCache).forEach(key => delete detailCache[key]);
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