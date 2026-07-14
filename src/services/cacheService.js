// Smart cache for stock data
// Saves API calls & makes app 10x faster

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const CACHE_PREFIX = 'stock_cache_';

// Save data to cache
export const setCache = (symbol, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      symbol
    };
    localStorage.setItem(`${CACHE_PREFIX}${symbol}`, JSON.stringify(cacheData));
  } catch (e) {
    // Cache full - clear old entries
    clearOldCache();
  }
};

// Get data from cache
export const getCache = (symbol) => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${symbol}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Return null if expired
    if (age > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_PREFIX}${symbol}`);
      return null;
    }
    
    return data;
  } catch (e) {
    return null;
  }
};

// Clear old cache entries
export const clearOldCache = () => {
  const now = Date.now();
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(key));
        if (now - timestamp > CACHE_DURATION) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
};

// Clear all cache
export const clearAllCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

// Get cache stats
export const getCacheStats = () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  return {
    count: keys.length,
    sizeMB: (JSON.stringify(keys.map(k => localStorage.getItem(k))).length / 1024 / 1024).toFixed(2)
  };
};