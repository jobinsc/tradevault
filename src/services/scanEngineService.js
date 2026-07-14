import { getYahooHistoricalData } from './yahooFinanceService';
import { NSE_STOCKS_LIST, getStocksByCategory } from './nseStocksList';
import {
  SMA, EMA, RSI, CCI, MACD, BollingerBands, ATR, Stochastic, VWAP,
  PivotPoints, High52Week, Low52Week, AvgVolume, PriceChangePercent,
  isHammer, isInvertedHammer, isDoji, isGravestoneDoji, isDragonflyDoji,
  isShootingStar, isBullishEngulfing, isBearishEngulfing,
  isMorningStar, isEveningStar, isThreeWhiteSoldiers, isThreeBlackCrows,
  isGapUp, isGapDown, latest
} from './indicatorsService';

export { NSE_STOCKS_LIST };

// Get indicator value from candles
export const getIndicatorValue = (candles, indicator, daysAgo = 0) => {
  if (!candles || candles.length === 0) return null;
  
  // Slice off recent days if looking back
  const data = daysAgo > 0 ? candles.slice(0, -daysAgo) : candles;
  if (data.length === 0) return null;
  
  const opens = data.map(c => c.open);
  const highs = data.map(c => c.high);
  const lows = data.map(c => c.low);
  const closes = data.map(c => c.close);
  const volumes = data.map(c => c.volume);
  const lastCandle = data[data.length - 1];
  
  const pivots = PivotPoints(data);

  switch (indicator) {
    // Price
    case 'Close': return latest(closes);
    case 'Open': return latest(opens);
    case 'High': return latest(highs);
    case 'Low': return latest(lows);
    case 'Volume': return latest(volumes);
    
    // Moving Averages
    case 'SMA(9)': return latest(SMA(closes, 9));
    case 'SMA(20)': return latest(SMA(closes, 20));
    case 'SMA(50)': return latest(SMA(closes, 50));
    case 'SMA(100)': return latest(SMA(closes, 100));
    case 'SMA(200)': return latest(SMA(closes, 200));
    case 'EMA(9)': return latest(EMA(closes, 9));
    case 'EMA(20)': return latest(EMA(closes, 20));
    case 'EMA(50)': return latest(EMA(closes, 50));
    case 'EMA(100)': return latest(EMA(closes, 100));
    case 'EMA(200)': return latest(EMA(closes, 200));
    
    // Oscillators
    case 'RSI(14)': return latest(RSI(closes, 14));
    case 'RSI(21)': return latest(RSI(closes, 21));
    case 'CCI(14)': return latest(CCI(highs, lows, closes, 14));
    case 'CCI(20)': return latest(CCI(highs, lows, closes, 20));
    case 'CCI(31)': return latest(CCI(highs, lows, closes, 31));
    case 'MACD': return latest(MACD(closes).macdLine);
    case 'MACD Signal': return latest(MACD(closes).signalLine);
    case 'MACD Histogram': return latest(MACD(closes).histogram);
    case 'Stochastic': return latest(Stochastic(highs, lows, closes));
    
    // Volatility
    case 'BB Upper': return latest(BollingerBands(closes))?.upper;
    case 'BB Middle': return latest(BollingerBands(closes))?.middle;
    case 'BB Lower': return latest(BollingerBands(closes))?.lower;
    case 'ATR(14)': return latest(ATR(highs, lows, closes, 14));
    case 'VWAP': return latest(VWAP(highs, lows, closes, volumes));
    
    // ⭐ Pivot Points (Chartink style!)
    case 'Pivot Point': return pivots?.PP;
    case 'Pivot R1': return pivots?.R1;
    case 'Pivot R2': return pivots?.R2;
    case 'Pivot R3': return pivots?.R3;
    case 'Pivot S1': return pivots?.S1;
    case 'Pivot S2': return pivots?.S2;
    case 'Pivot S3': return pivots?.S3;
    
    // Special
    case '52W High': return High52Week(highs);
    case '52W Low': return Low52Week(lows);
    case 'Avg Volume(20)': return latest(AvgVolume(volumes, 20));
    case 'Change %': return PriceChangePercent(closes, 1);
    case 'Change % 5D': return PriceChangePercent(closes, 5);
    case 'Change % 20D': return PriceChangePercent(closes, 20);
    
    default: return null;
  }
};

// Evaluate one condition
const evaluateCondition = (candles, condition) => {
  const { timeframe, indicator, operator, value, valueType } = condition;
  
  // Parse timeframe (e.g., "1 day ago" → 1)
  const daysAgo = timeframe && timeframe.includes('day ago') 
    ? parseInt(timeframe) || 1 
    : 0;
  
  const leftValue = getIndicatorValue(candles, indicator, daysAgo);
  if (leftValue === null || leftValue === undefined || isNaN(leftValue)) return false;

  // Right value: either number or another indicator
  let rightValue;
  if (valueType === 'indicator' || (isNaN(parseFloat(value)) && value)) {
    rightValue = getIndicatorValue(candles, value, 0);
  } else {
    rightValue = parseFloat(value);
  }
  
  if (rightValue === null || rightValue === undefined || isNaN(rightValue)) return false;

  switch (operator) {
    case '>': return leftValue > rightValue;
    case '<': return leftValue < rightValue;
    case '>=': return leftValue >= rightValue;
    case '<=': return leftValue <= rightValue;
    case '=': return Math.abs(leftValue - rightValue) < 0.01;
    case '!=': return Math.abs(leftValue - rightValue) >= 0.01;
    default: return false;
  }
};

// Check candlestick pattern
const checkPattern = (candles, pattern) => {
  if (candles.length < 3) return false;
  const c1 = candles[candles.length - 3];
  const c2 = candles[candles.length - 2];
  const c3 = candles[candles.length - 1];
  
  switch (pattern) {
    case 'hammer': return isHammer(c3);
    case 'inverted_hammer': return isInvertedHammer(c3);
    case 'doji': return isDoji(c3);
    case 'gravestone_doji': return isGravestoneDoji(c3);
    case 'dragonfly_doji': return isDragonflyDoji(c3);
    case 'shooting_star': return isShootingStar(c3);
    case 'bullish_engulfing': return isBullishEngulfing(c2, c3);
    case 'bearish_engulfing': return isBearishEngulfing(c2, c3);
    case 'morning_star': return isMorningStar(c1, c2, c3);
    case 'evening_star': return isEveningStar(c1, c2, c3);
    case 'three_white_soldiers': return isThreeWhiteSoldiers(c1, c2, c3);
    case 'three_black_crows': return isThreeBlackCrows(c1, c2, c3);
    case 'gap_up': return isGapUp(c2, c3);
    case 'gap_down': return isGapDown(c2, c3);
    default: return false;
  }
};

// MAIN: Run scan
export const runScan = async (screener, onProgress) => {
  const { conditions = [], patterns = [], logic = 'AND', stockUniverse = 'nifty100' } = screener;
  const results = [];
  const stocks = getStocksByCategory(stockUniverse);
  
  // Batch processing to avoid overwhelming
  const BATCH_SIZE = 25; // Was 10, now 25 = 2.5x faster!
  
  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (stock) => {
      try {
        const candles = await getYahooHistoricalData(stock.symbol, '3mo', '1d'); // 3 months is enough
        if (!candles || candles.length < 50) return;
        
        // Evaluate conditions
        let conditionsPass;
        if (logic === 'OR') {
          conditionsPass = conditions.length === 0 || conditions.some(c => evaluateCondition(candles, c));
        } else {
          conditionsPass = conditions.every(c => evaluateCondition(candles, c));
        }
        
        const patternsPass = patterns.length === 0 || patterns.every(p => checkPattern(candles, p));
        
        if (conditionsPass && patternsPass) {
          const last = candles[candles.length - 1];
          const prev = candles[candles.length - 2];
          const change = prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
          
          results.push({
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            close: last.close,
            open: last.open,
            high: last.high,
            low: last.low,
            volume: last.volume,
            change: parseFloat(change.toFixed(2)),
            date: last.date,
          });
        }
      } catch (err) {
        console.error(`${stock.symbol}:`, err.message);
      }
    }));
    
    onProgress?.(Math.min(i + BATCH_SIZE, stocks.length), stocks.length, batch[batch.length - 1]?.symbol);
  }
  
  // Sort by change % descending
  results.sort((a, b) => b.change - a.change);
  return results;
};