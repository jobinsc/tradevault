// src/stocksDatabase.js
// Live search from Yahoo Finance - covers ALL global stocks (NSE, BSE, US, etc.)

const searchCache = {};
const CACHE_DURATION = 300000; // 5 minutes

// Popular stocks shown when field is empty
export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE' },
  { symbol: 'INFY', name: 'Infosys', exchange: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE' },
  { symbol: 'ITC', name: 'ITC Limited', exchange: 'NSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', exchange: 'NSE' },
  { symbol: 'NIFTY', name: 'Nifty 50 Index', exchange: 'NSE' },
  { symbol: 'BANKNIFTY', name: 'Nifty Bank Index', exchange: 'NSE' },
];

// Live search from Yahoo Finance (covers ALL stocks)
export const searchStocksLive = async (query) => {
  if (!query || query.length < 1) {
    return POPULAR_STOCKS;
  }
  
  const cacheKey = query.toUpperCase();
  const cached = searchCache[cacheKey];
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`;
    
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(yahooUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
    ];
    
    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, { 
          timeout: 5000 
        });
        const data = await response.json();
        
        if (data.quotes && data.quotes.length > 0) {
          const results = data.quotes
            .filter(q => q.symbol && (q.shortname || q.longname))
            .map(q => {
              let symbol = q.symbol;
              let exchange = 'US';
              
              if (symbol.endsWith('.NS')) {
                symbol = symbol.replace('.NS', '');
                exchange = 'NSE';
              } else if (symbol.endsWith('.BO')) {
                symbol = symbol.replace('.BO', '');
                exchange = 'BSE';
              } else if (symbol.includes('.')) {
                return null; // Skip other exchanges
              }
              
              return {
                symbol: symbol,
                name: q.shortname || q.longname || symbol,
                exchange: exchange,
                type: q.quoteType || 'EQUITY',
              };
            })
            .filter(s => s !== null)
            .slice(0, 15);
          
          // Sort: NSE > BSE > US
          results.sort((a, b) => {
            const order = { 'NSE': 0, 'BSE': 1, 'US': 2 };
            return (order[a.exchange] || 3) - (order[b.exchange] || 3);
          });
          
          searchCache[cacheKey] = {
            data: results,
            timestamp: Date.now(),
          };
          
          return results;
        }
      } catch (err) {
        continue;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Stock search error:', error);
    return [];
  }
};

export const getPopularStocks = () => POPULAR_STOCKS;