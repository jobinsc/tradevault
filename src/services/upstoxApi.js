import axios from 'axios';

const UPSTOX_BASE_URL = 'https://api.upstox.com/v2';

// Get access token from environment or localStorage
const getAccessToken = () => {
  return localStorage.getItem('upstox_access_token') || 
         process.env.REACT_APP_UPSTOX_ACCESS_TOKEN;
};

const upstoxAxios = axios.create({
  baseURL: UPSTOX_BASE_URL,
  headers: {
    'Accept': 'application/json'
  }
});

// Add token to every request
upstoxAxios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get historical candles
export const getHistoricalCandles = async (instrumentKey, interval = 'day', toDate = null) => {
  try {
    const date = toDate || new Date().toISOString().split('T')[0];
    const encoded = encodeURIComponent(instrumentKey);
    const response = await upstoxAxios.get(
      `/historical-candle/${encoded}/${interval}/${date}`
    );
    return response.data?.data?.candles || [];
  } catch (error) {
    console.error(`Error fetching ${instrumentKey}:`, error.message);
    return [];
  }
};

// Get live market quote
export const getMarketQuote = async (instrumentKeys) => {
  try {
    const keys = Array.isArray(instrumentKeys) ? instrumentKeys.join(',') : instrumentKeys;
    const response = await upstoxAxios.get(
      `/market-quote/quotes?instrument_key=${encodeURIComponent(keys)}`
    );
    return response.data?.data || {};
  } catch (error) {
    console.error('Quote error:', error.message);
    return {};
  }
};

// Set access token (for user to update daily)
export const setUpstoxToken = (token) => {
  localStorage.setItem('upstox_access_token', token);
};

export const getUpstoxToken = () => getAccessToken();