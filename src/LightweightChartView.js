// src/LightweightChartView.js
// TradingView Lightweight Charts version - EXACT TradingView zoom feel

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { fetchStockPrice, fetchHistoricalData } from './priceService';

function LightweightChartView({ symbol, timeframe, isDarkTheme, theme, userTrades = [] }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const priceLineRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState(null);
  const [candles, setCandles] = useState([]);

  // Load historical data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchHistoricalData(symbol, timeframe.range, timeframe.interval);
      setCandles(data);
      if (data.length > 0) setLivePrice(data[data.length - 1].close);
      setLoading(false);
    };
    load();
  }, [symbol, timeframe]);

  // Live price updates
  useEffect(() => {
    const fetchLive = async () => {
      const data = await fetchStockPrice(symbol);
      if (data && data.price) setLivePrice(data.price);
    };
    fetchLive();
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Create/recreate chart when theme changes or on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 700,
      layout: {
        background: { color: isDarkTheme ? '#0f172a' : '#ffffff' },
        textColor: isDarkTheme ? '#94a3b8' : '#475569',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: isDarkTheme ? '#1e293b' : '#e2e8f0' },
        horzLines: { color: isDarkTheme ? '#1e293b' : '#e2e8f0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
      },
      rightPriceScale: {
        borderColor: isDarkTheme ? '#334155' : '#cbd5e1',
        scaleMargins: {
          top: 0.05,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: isDarkTheme ? '#334155' : '#cbd5e1',
        timeVisible: timeframe.group === 'intraday',
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,   // ⭐ Drag time axis to zoom (like TradingView!)
          price: true,  // ⭐ Drag price axis to zoom (like TradingView!)
        },
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    // Volume series (below chart)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isDarkTheme, timeframe.group]);

  // Update candles when data changes
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const candleData = candles.map(c => ({
      time: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candles.map(c => ({
      time: c.timestamp,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
    }));

    candleSeriesRef.current.setData(candleData);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeData);
    }

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  // Live price horizontal line
  useEffect(() => {
    if (!candleSeriesRef.current || !livePrice) return;

    // Remove old price line
    if (priceLineRef.current) {
      candleSeriesRef.current.removePriceLine(priceLineRef.current);
    }

    // Add new price line
    const isUp = candles.length > 0 && livePrice >= candles[candles.length - 1].open;
    priceLineRef.current = candleSeriesRef.current.createPriceLine({
      price: livePrice,
      color: isUp ? '#10b981' : '#ef4444',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'LIVE',
    });
  }, [livePrice, candles]);

  // Add trade markers
  useEffect(() => {
    if (!candleSeriesRef.current || !userTrades || userTrades.length === 0) return;

    const markers = userTrades
      .filter(trade => trade.entryDate && trade.entryPrice)
      .map(trade => {
        const entryTime = Math.floor(new Date(trade.entryDate).getTime() / 1000);
        return {
          time: entryTime,
          position: trade.direction === 'long' ? 'belowBar' : 'aboveBar',
          color: trade.direction === 'long' ? '#10b981' : '#ef4444',
          shape: trade.direction === 'long' ? 'arrowUp' : 'arrowDown',
          text: `${trade.direction === 'long' ? 'BUY' : 'SELL'} ₹${trade.entryPrice}`,
        };
      });

    if (markers.length > 0) {
      candleSeriesRef.current.setMarkers(markers);
    }
  }, [userTrades, candles]);

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: isDarkTheme ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isDarkTheme ? '#fff' : '#000', fontSize: 16, zIndex: 10,
        }}>
          Loading {timeframe.label} chart for {symbol}...
        </div>
      )}
      
      {/* Title bar */}
      <div style={{
        padding: '8px 12px',
        background: isDarkTheme ? '#1e293b' : '#f8fafc',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: isDarkTheme ? '#94a3b8' : '#475569',
        fontSize: 12,
        borderBottom: `1px solid ${isDarkTheme ? '#334155' : '#cbd5e1'}`,
      }}>
        <div>
          <strong style={{ color: isDarkTheme ? '#fff' : '#000' }}>{symbol}</strong> · NSE
          {livePrice && (
            <span style={{ 
              marginLeft: 12, 
              color: '#10b981', 
              fontWeight: 700,
            }}>
              ● LIVE ₹{livePrice.toFixed(2)}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11 }}>
          🖱️ Drag axis to zoom · Scroll to zoom · Drag chart to pan
        </div>
      </div>

      <div 
        ref={chartContainerRef} 
        style={{ 
          width: '100%', 
          height: 700,
          background: isDarkTheme ? '#0f172a' : '#ffffff',
        }} 
      />
    </div>
  );
}

export default LightweightChartView;