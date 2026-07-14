// ==================== MOVING AVERAGES ====================
export const SMA = (data, period) => {
  if (!data || data.length < period) return [];
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
};

export const EMA = (data, period) => {
  if (!data || data.length < period) return [];
  const k = 2 / (period + 1);
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
};

// ==================== RSI ====================
export const RSI = (closes, period = 14) => {
  if (!closes || closes.length < period + 1) return [];
  const rsi = [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
};

// ==================== CCI ====================
export const CCI = (highs, lows, closes, period = 20) => {
  if (!closes || closes.length < period) return [];
  const cci = [];
  const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
  for (let i = period - 1; i < tp.length; i++) {
    const slice = tp.slice(i - period + 1, i + 1);
    const smaTP = slice.reduce((a, b) => a + b, 0) / period;
    const meanDev = slice.reduce((sum, val) => sum + Math.abs(val - smaTP), 0) / period;
    cci.push(meanDev === 0 ? 0 : (tp[i] - smaTP) / (0.015 * meanDev));
  }
  return cci;
};

// ==================== MACD ====================
export const MACD = (closes, fast = 12, slow = 26, signal = 9) => {
  const emaFast = EMA(closes, fast);
  const emaSlow = EMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = EMA(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - (signalLine[i] || 0));
  return { macdLine, signalLine, histogram };
};

// ==================== BOLLINGER BANDS ====================
export const BollingerBands = (closes, period = 20, stdDev = 2) => {
  if (!closes || closes.length < period) return [];
  const smaValues = SMA(closes, period);
  const bands = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = smaValues[i - period + 1];
    const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    bands.push({ upper: mean + stdDev * sd, middle: mean, lower: mean - stdDev * sd });
  }
  return bands;
};

// ==================== ATR ====================
export const ATR = (highs, lows, closes, period = 14) => {
  const tr = [];
  for (let i = 1; i < closes.length; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  }
  return SMA(tr, period);
};

// ==================== STOCHASTIC ====================
export const Stochastic = (highs, lows, closes, period = 14) => {
  const k = [];
  for (let i = period - 1; i < closes.length; i++) {
    const sliceHigh = Math.max(...highs.slice(i - period + 1, i + 1));
    const sliceLow = Math.min(...lows.slice(i - period + 1, i + 1));
    k.push(sliceHigh === sliceLow ? 50 : ((closes[i] - sliceLow) / (sliceHigh - sliceLow)) * 100);
  }
  return k;
};

// ==================== VWAP ====================
export const VWAP = (highs, lows, closes, volumes) => {
  const vwap = [];
  let cumTPV = 0, cumVol = 0;
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    cumTPV += tp * volumes[i];
    cumVol += volumes[i];
    vwap.push(cumVol === 0 ? tp : cumTPV / cumVol);
  }
  return vwap;
};

// ==================== ⭐ PIVOT POINTS (Chartink Style!) ====================
export const PivotPoints = (candles) => {
  // Use PREVIOUS day's data for today's pivots
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  
  const H = prev.high;
  const L = prev.low;
  const C = prev.close;
  const PP = (H + L + C) / 3;
  
  return {
    PP,      // Pivot Point
    R1: (2 * PP) - L,
    R2: PP + (H - L),
    R3: H + 2 * (PP - L),
    S1: (2 * PP) - H,
    S2: PP - (H - L),
    S3: L - 2 * (H - PP),
  };
};

// ==================== 52-WEEK HIGH/LOW ====================
export const High52Week = (highs) => {
  const period = Math.min(252, highs.length);
  return Math.max(...highs.slice(-period));
};

export const Low52Week = (lows) => {
  const period = Math.min(252, lows.length);
  return Math.min(...lows.slice(-period));
};

// ==================== VOLUME ANALYSIS ====================
export const AvgVolume = (volumes, period = 20) => {
  return SMA(volumes, period);
};

export const VolumeSpike = (volumes, multiplier = 2) => {
  const avg = AvgVolume(volumes, 20);
  const lastAvg = avg[avg.length - 1];
  const lastVol = volumes[volumes.length - 1];
  return lastVol > (lastAvg * multiplier);
};

// ==================== PRICE CHANGE % ====================
export const PriceChangePercent = (closes, daysAgo = 1) => {
  if (closes.length < daysAgo + 1) return 0;
  const current = closes[closes.length - 1];
  const past = closes[closes.length - 1 - daysAgo];
  return ((current - past) / past) * 100;
};

// ==================== CANDLESTICK PATTERNS ====================
const isBull = (c) => c.close > c.open;
const isBear = (c) => c.close < c.open;
const body = (c) => Math.abs(c.close - c.open);
const upperShadow = (c) => c.high - Math.max(c.open, c.close);
const lowerShadow = (c) => Math.min(c.open, c.close) - c.low;
const range = (c) => c.high - c.low;

export const isHammer = (c) => {
  const b = body(c);
  return b > 0 && lowerShadow(c) > 2 * b && upperShadow(c) < b * 0.3;
};

export const isInvertedHammer = (c) => {
  const b = body(c);
  return b > 0 && upperShadow(c) > 2 * b && lowerShadow(c) < b * 0.3;
};

export const isDoji = (c) => {
  const r = range(c);
  return r > 0 && body(c) / r < 0.1;
};

export const isGravestoneDoji = (c) => {
  return isDoji(c) && upperShadow(c) > range(c) * 0.6;
};

export const isDragonflyDoji = (c) => {
  return isDoji(c) && lowerShadow(c) > range(c) * 0.6;
};

export const isShootingStar = (c) => {
  const b = body(c);
  return isBear(c) && upperShadow(c) > 2 * b && lowerShadow(c) < b * 0.3;
};

export const isBullishEngulfing = (prev, curr) => {
  return isBear(prev) && isBull(curr) && curr.close > prev.open && curr.open < prev.close;
};

export const isBearishEngulfing = (prev, curr) => {
  return isBull(prev) && isBear(curr) && curr.close < prev.open && curr.open > prev.close;
};

export const isMorningStar = (c1, c2, c3) => {
  return isBear(c1) && body(c2) < body(c1) * 0.3 && isBull(c3) && c3.close > (c1.open + c1.close) / 2;
};

export const isEveningStar = (c1, c2, c3) => {
  return isBull(c1) && body(c2) < body(c1) * 0.3 && isBear(c3) && c3.close < (c1.open + c1.close) / 2;
};

export const isThreeWhiteSoldiers = (c1, c2, c3) => {
  return isBull(c1) && isBull(c2) && isBull(c3) && 
         c2.close > c1.close && c3.close > c2.close;
};

export const isThreeBlackCrows = (c1, c2, c3) => {
  return isBear(c1) && isBear(c2) && isBear(c3) && 
         c2.close < c1.close && c3.close < c2.close;
};

// ==================== GAP UP/DOWN ====================
export const isGapUp = (prev, curr) => curr.open > prev.high;
export const isGapDown = (prev, curr) => curr.open < prev.low;

// ==================== HELPER ====================
export const latest = (arr) => arr && arr.length > 0 ? arr[arr.length - 1] : null;