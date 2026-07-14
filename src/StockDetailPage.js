import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import ReactECharts from 'echarts-for-react';
import { getSectorForSymbol, getSectorColor } from './sectorsDatabase';
import { fetchStockPrice, fetchFullStockData, fetchHistoricalData } from './priceService';
import SymbolSearchBar from './SymbolSearchBar';
import IndicatorsModal from './IndicatorsModal';
import DrawingTools from './DrawingTools';
import LightweightChartView from './LightweightChartView';
import { 
  saveGlobalChartSettings, 
  loadGlobalChartSettings,
  saveStockChartSettings,
  loadStockChartSettings 
} from './chartSettingsService';
import { saveDrawings, loadDrawings, clearDrawings } from './drawingsService';
import { auth } from './firebase';

function EChartsStock({ symbol, userTrades = [], onSymbolChange }) {
  const chartRef = useRef(null);
    const axisDragRef = useRef({
    isDraggingY: false,
    isDraggingX: false,
    startY: 0,
    startX: 0,
    startZoomStart: 0,
    startZoomEnd: 100,
  });
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [userId, setUserId] = useState(auth.currentUser?.uid || null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [indicatorsModalOpen, setIndicatorsModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('cursor');
  const [advancedIndicators, setAdvancedIndicators] = useState({});
  const [loading, setLoading] = useState(true);
  const [candles, setCandles] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [timeframe, setTimeframe] = useState({ range: '5y', interval: '1d', label: '5Y' });
  const [indicators, setIndicators] = useState({ ma20: true, volume: true });
  const [stockSettings, setStockSettings] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const [drawings, setDrawings] = useState([]);
    const [chartEngine, setChartEngine] = useState(() => {
    return localStorage.getItem('tv_chartEngine') || 'echarts';
  });

  useEffect(() => {
    localStorage.setItem('tv_chartEngine', chartEngine);
  }, [chartEngine]);
  const [drawingsLoaded, setDrawingsLoaded] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  const drawingRef = useRef({
    isDrawing: false,
    startX: 0,
    startY: 0,
    tool: 'cursor',
    drawings: [],
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkTheme(theme !== 'light');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const globalSettings = await loadGlobalChartSettings(userId);
      if (globalSettings) {
        if (globalSettings.timeframe) setTimeframe(globalSettings.timeframe);
        if (globalSettings.indicators) setIndicators(globalSettings.indicators);
      }
      const stockData = await loadStockChartSettings(userId, symbol);
      if (stockData) {
        setStockSettings(stockData);
        if (stockData.timeframe) setTimeframe(stockData.timeframe);
      }
      setSettingsLoaded(true);
    };
    loadSettings();
  }, [userId, symbol]);

  useEffect(() => {
    if (!settingsLoaded) return;
    const saveSettings = async () => {
      await saveGlobalChartSettings(userId, { timeframe, indicators });
    };
    const timer = setTimeout(saveSettings, 1000);
    return () => clearTimeout(timer);
  }, [timeframe, indicators, userId, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    const saveStockSettings = async () => {
      await saveStockChartSettings(userId, symbol, {
        ...stockSettings,
        timeframe,
        lastViewedAt: new Date().toISOString(),
      });
    };
    const timer = setTimeout(saveStockSettings, 1000);
    return () => clearTimeout(timer);
  }, [timeframe, symbol, userId, settingsLoaded, stockSettings]);

  const timeframes = [
    { range: '7d', interval: '1m', label: '1m', group: 'intraday' },
    { range: '60d', interval: '5m', label: '5m', group: 'intraday' },
    { range: '60d', interval: '15m', label: '15m', group: 'intraday' },
    { range: '60d', interval: '30m', label: '30m', group: 'intraday' },
    { range: '730d', interval: '60m', label: '1H', group: 'intraday' },
    { range: '730d', interval: '90m', label: '90m', group: 'intraday' },
    { range: '3mo', interval: '1d', label: '1D', group: 'daily' },
    { range: '6mo', interval: '1d', label: '6M', group: 'daily' },
    { range: '1y', interval: '1d', label: '1Y', group: 'daily' },
    { range: '2y', interval: '1d', label: '2Y', group: 'daily' },
    { range: '5y', interval: '1d', label: '5Y', group: 'daily' },
    { range: '10y', interval: '1d', label: '10Y', group: 'daily' },
    { range: 'max', interval: '1d', label: 'ALL', group: 'daily' },
    { range: 'max', interval: '1wk', label: '1W', group: 'daily' },
    { range: 'max', interval: '1mo', label: '1M', group: 'daily' },
  ];

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

  useEffect(() => {
    const fetchLive = async () => {
      const data = await fetchStockPrice(symbol);
      if (data && data.price) setLivePrice(data.price);
    };
    fetchLive();
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  // ═══════════ DRAWING TOOL LOGIC ═══════════
  
  useEffect(() => {
    drawingRef.current.tool = activeTool;
  }, [activeTool]);

  useEffect(() => {
    drawingRef.current.drawings = drawings;
    redrawAll();
  }, [drawings]);

  // Load drawings from Firebase when symbol/user changes
  useEffect(() => {
    const load = async () => {
      setDrawingsLoaded(false);
      const savedDrawings = await loadDrawings(userId, symbol);
      setDrawings(savedDrawings || []);
      setDrawingsLoaded(true);
    };
    load();
  }, [symbol, userId]);

  // Save drawings to Firebase (debounced)
  useEffect(() => {
    if (!drawingsLoaded) return;
    const timer = setTimeout(() => {
      saveDrawings(userId, symbol, drawings);
    }, 800);
    return () => clearTimeout(timer);
  }, [drawings, symbol, userId, drawingsLoaded]);

    // ═══════════ TRADINGVIEW-STYLE AXIS DRAG ZOOM ═══════════
  useEffect(() => {
    if (loading || candles.length === 0) return;

    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    const zr = chartInstance.getZr();
    const chartDom = chartInstance.getDom();
    if (!zr || !chartDom) return;

    let dragMode = null; // 'y' or 'x' or null

    const getMousePos = (e) => {
      const rect = chartDom.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const isInYAxisArea = (pos) => {
      // Right side of chart - price axis area
      const width = chartDom.offsetWidth;
      return pos.x > width - 60 && pos.y > 60 && pos.y < chartDom.offsetHeight - 40;
    };

    const isInXAxisArea = (pos) => {
      // Bottom of chart - date axis area
      const height = chartDom.offsetHeight;
      return pos.y > height - 40 && pos.x > 40 && pos.x < chartDom.offsetWidth - 60;
    };

    const handleMouseDown = (e) => {
      const pos = getMousePos(e);

      if (isInYAxisArea(pos)) {
        dragMode = 'y';
        const opt = chartInstance.getOption();
        axisDragRef.current = {
          isDraggingY: true,
          isDraggingX: false,
          startY: e.clientY,
          startX: e.clientX,
          startZoomStart: opt.dataZoom[1]?.start ?? 0,
          startZoomEnd: opt.dataZoom[1]?.end ?? 100,
        };
        chartDom.style.cursor = 'ns-resize';
        e.preventDefault();
      } else if (isInXAxisArea(pos)) {
        dragMode = 'x';
        const opt = chartInstance.getOption();
        axisDragRef.current = {
          isDraggingY: false,
          isDraggingX: true,
          startY: e.clientY,
          startX: e.clientX,
          startZoomStart: opt.dataZoom[0]?.start ?? 0,
          startZoomEnd: opt.dataZoom[0]?.end ?? 100,
        };
        chartDom.style.cursor = 'ew-resize';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      const pos = getMousePos(e);

      // Cursor hint when hovering axis
      if (!dragMode) {
        if (isInYAxisArea(pos)) {
          chartDom.style.cursor = 'ns-resize';
        } else if (isInXAxisArea(pos)) {
          chartDom.style.cursor = 'ew-resize';
        } else {
          chartDom.style.cursor = 'default';
        }
        return;
      }

      // Y-axis drag (price zoom)
      if (dragMode === 'y' && axisDragRef.current.isDraggingY) {
        const dy = e.clientY - axisDragRef.current.startY;
        const zoomFactor = 1 + (dy / 200); // drag down = zoom out, up = zoom in
        const currentRange = axisDragRef.current.startZoomEnd - axisDragRef.current.startZoomStart;
        let newRange = currentRange * zoomFactor;
        newRange = Math.max(2, Math.min(100, newRange));
        const center = (axisDragRef.current.startZoomStart + axisDragRef.current.startZoomEnd) / 2;
        let newStart = center - newRange / 2;
        let newEnd = center + newRange / 2;
        if (newStart < 0) { newEnd -= newStart; newStart = 0; }
        if (newEnd > 100) { newStart -= (newEnd - 100); newEnd = 100; }
        newStart = Math.max(0, newStart);
        newEnd = Math.min(100, newEnd);
        chartInstance.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 1,
          start: newStart,
          end: newEnd,
        });
      }

      // X-axis drag (date zoom)
      if (dragMode === 'x' && axisDragRef.current.isDraggingX) {
        const dx = e.clientX - axisDragRef.current.startX;
        const zoomFactor = 1 - (dx / 300); // drag right = zoom in, left = zoom out
        const currentRange = axisDragRef.current.startZoomEnd - axisDragRef.current.startZoomStart;
        let newRange = currentRange * zoomFactor;
        newRange = Math.max(2, Math.min(100, newRange));
        const center = (axisDragRef.current.startZoomStart + axisDragRef.current.startZoomEnd) / 2;
        let newStart = center - newRange / 2;
        let newEnd = center + newRange / 2;
        if (newStart < 0) { newEnd -= newStart; newStart = 0; }
        if (newEnd > 100) { newStart -= (newEnd - 100); newEnd = 100; }
        newStart = Math.max(0, newStart);
        newEnd = Math.min(100, newEnd);
        chartInstance.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 0,
          start: newStart,
          end: newEnd,
        });
      }
    };

    const handleMouseUp = () => {
      dragMode = null;
      axisDragRef.current.isDraggingY = false;
      axisDragRef.current.isDraggingX = false;
      chartDom.style.cursor = 'default';
    };

    const handleDoubleClick = (e) => {
      const pos = getMousePos(e);
      // Double-click on Y-axis: reset price zoom
      if (isInYAxisArea(pos)) {
        chartInstance.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 1,
          start: 0,
          end: 100,
        });
      }
      // Double-click on X-axis: reset date zoom
      if (isInXAxisArea(pos)) {
        chartInstance.dispatchAction({
          type: 'dataZoom',
          dataZoomIndex: 0,
          start: 0,
          end: 100,
        });
      }
    };

    chartDom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    chartDom.addEventListener('dblclick', handleDoubleClick);

    return () => {
      chartDom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      chartDom.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [loading, candles.length]);
  useEffect(() => {
    const resize = () => {
      const canvas = overlayCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawAll();
    };
    const timer = setTimeout(resize, 300);
    window.addEventListener('resize', resize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [loading, candles.length]);

  const getCanvasPos = (e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drawColor = isDarkTheme ? '#2962ff' : '#1d4ed8';

  const drawShape = (ctx, d, preview = false) => {
    ctx.save();
    ctx.strokeStyle = d.color || drawColor;
    ctx.fillStyle = d.color || drawColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    if (preview) ctx.globalAlpha = 0.7;

    const { tool, x1, y1, x2, y2, text } = d;
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;

    switch (tool) {
      case 'trendline':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'ray':
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath(); ctx.moveTo(x1, y1);
        if (len > 0) {
          const s = 3000 / len;
          ctx.lineTo(x1 + dx * s, y1 + dy * s);
        }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'horizontal':
        ctx.setLineDash([6, 3]);
        ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(cw, y1); ctx.stroke();
        break;
      case 'vertical':
        ctx.setLineDash([6, 3]);
        ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, ch); ctx.stroke();
        break;
      case 'rectangle':
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.globalAlpha = 0.1;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        break;
      case 'fibonacci':
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444'];
        const h = y2 - y1;
        levels.forEach((lv, i) => {
          const y = y1 + h * lv;
          ctx.strokeStyle = colors[i];
          ctx.setLineDash([4, 2]);
          ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2 || cw, y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = colors[i];
          ctx.fillText(`${(lv * 100).toFixed(1)}%`, x1 + 5, y - 3);
        });
        break;
      case 'arrow':
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const sz = 12;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - sz * Math.cos(ang - Math.PI / 6), y2 - sz * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(x2 - sz * Math.cos(ang + Math.PI / 6), y2 - sz * Math.sin(ang + Math.PI / 6));
        ctx.closePath(); ctx.fill();
        break;
      case 'text':
        if (text) {
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(text, x1, y1);
        }
        break;
      default: break;
    }
    ctx.restore();
  };

  const redrawAll = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingRef.current.drawings.forEach(d => drawShape(ctx, d));
  };

  const handleMouseDown = (e) => {
    const tool = drawingRef.current.tool;
    if (tool === 'cursor') return;
    e.preventDefault();
    e.stopPropagation();

    const pos = getCanvasPos(e);

    if (tool === 'text') {
      const t = window.prompt('Enter label text:');
      if (t && t.trim()) {
        setDrawings(prev => [...prev, {
          id: Date.now(), tool: 'text',
          x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y,
          text: t.trim(), color: drawColor,
        }]);
      }
      return;
    }

    if (tool === 'horizontal') {
      setDrawings(prev => [...prev, {
        id: Date.now(), tool: 'horizontal',
        x1: 0, y1: pos.y, x2: overlayCanvasRef.current.width, y2: pos.y,
        color: drawColor,
      }]);
      return;
    }

    if (tool === 'vertical') {
      setDrawings(prev => [...prev, {
        id: Date.now(), tool: 'vertical',
        x1: pos.x, y1: 0, x2: pos.x, y2: overlayCanvasRef.current.height,
        color: drawColor,
      }]);
      return;
    }

    drawingRef.current.isDrawing = true;
    drawingRef.current.startX = pos.x;
    drawingRef.current.startY = pos.y;
  };

  const handleMouseMove = (e) => {
    if (!drawingRef.current.isDrawing) return;
    const pos = getCanvasPos(e);
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingRef.current.drawings.forEach(d => drawShape(ctx, d));
    drawShape(ctx, {
      tool: drawingRef.current.tool,
      x1: drawingRef.current.startX, y1: drawingRef.current.startY,
      x2: pos.x, y2: pos.y, color: drawColor,
    }, true);
  };

  const handleMouseUp = (e) => {
    if (!drawingRef.current.isDrawing) return;
    drawingRef.current.isDrawing = false;
    const pos = getCanvasPos(e);
    const dx = Math.abs(pos.x - drawingRef.current.startX);
    const dy = Math.abs(pos.y - drawingRef.current.startY);
    if (dx < 5 && dy < 5) { redrawAll(); return; }
    setDrawings(prev => [...prev, {
      id: Date.now(), tool: drawingRef.current.tool,
      x1: drawingRef.current.startX, y1: drawingRef.current.startY,
      x2: pos.x, y2: pos.y, color: drawColor,
    }]);
  };

  const handleClearAll = async () => {
    if (drawings.length === 0) return;
    if (!window.confirm(`Delete all ${drawings.length} drawings for ${symbol}?`)) return;
    setDrawings([]);
    drawingRef.current.drawings = [];
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    await clearDrawings(userId, symbol);
  };

  const handleUndo = () => {
    setDrawings(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const kd = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        setDrawings(prev => prev.slice(0, -1));
      }
      const map = { 
        v: 'cursor', t: 'trendline', h: 'horizontal', w: 'vertical', 
        b: 'rectangle', f: 'fibonacci', x: 'text', a: 'arrow', r: 'ray' 
      };
      if (!e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea') && map[e.key.toLowerCase()]) {
        setActiveTool(map[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  // ═══════════ CHART LOGIC ═══════════

  const calculateMA = (data, period) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) { result.push('-'); continue; }
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j][1];
      result.push((sum / period).toFixed(2));
    }
    return result;
  };

  const theme = useMemo(() => {
    if (isDarkTheme) {
      return {
        bg: '#0f172a', cardBg: '#1e293b', text: '#94a3b8', textPrimary: '#fff',
        border: '#334155', gridLine: '#1e293b', axisLine: '#334155', title: '#64748b',
        tooltipBg: '#1e293b', upColor: '#10b981', downColor: '#ef4444',
        volumeUp: 'rgba(16,185,129,0.6)', volumeDown: 'rgba(239,68,68,0.6)',
      };
    } else {
      return {
        bg: '#ffffff', cardBg: '#f8fafc', text: '#475569', textPrimary: '#0f172a',
        border: '#cbd5e1', gridLine: '#e2e8f0', axisLine: '#94a3b8', title: '#64748b',
        tooltipBg: '#ffffff', upColor: '#059669', downColor: '#dc2626',
        volumeUp: 'rgba(5,150,105,0.5)', volumeDown: 'rgba(220,38,38,0.5)',
      };
    }
  }, [isDarkTheme]);

  const chartOption = useMemo(() => {
    if (candles.length === 0) return {};
    const dates = candles.map(c => {
      const d = new Date(c.timestamp * 1000);
      return timeframe.group === 'intraday' ? format(d, 'dd MMM HH:mm') : format(d, 'dd MMM yy');
    });
    const candlestickData = candles.map(c => [c.open, c.close, c.low, c.high]);
    const volumeData = candles.map((c) => ({
      value: c.volume,
      itemStyle: { color: c.close >= c.open ? theme.volumeUp : theme.volumeDown }
    }));

    const tradeMarkers = [];
    userTrades.forEach(trade => {
      if (trade.entryDate && trade.entryPrice) {
        const entryTime = new Date(trade.entryDate).getTime() / 1000;
        const closestIndex = candles.findIndex(c => c.timestamp >= entryTime);
        if (closestIndex >= 0) {
          tradeMarkers.push({
            name: trade.direction === 'long' ? 'BUY' : 'SELL',
            coord: [closestIndex, trade.entryPrice],
            value: `${trade.direction === 'long' ? 'BUY' : 'SELL'} Rs${trade.entryPrice}`,
            itemStyle: { color: trade.direction === 'long' ? theme.upColor : theme.downColor },
            label: {
              show: true,
              position: trade.direction === 'long' ? 'bottom' : 'top',
              formatter: `${trade.direction === 'long' ? 'BUY' : 'SELL'} Rs${trade.entryPrice}`,
              color: '#fff',
              backgroundColor: trade.direction === 'long' ? theme.upColor : theme.downColor,
              padding: [4, 8], borderRadius: 4, fontSize: 10, fontWeight: 'bold',
            }
          });
        }
      }
    });

    const priceLineData = [];
    if (livePrice) {
      const isUp = candles.length > 0 && livePrice >= candles[candles.length - 1].open;
      priceLineData.push({
        yAxis: livePrice,
        lineStyle: { color: isUp ? theme.upColor : theme.downColor, width: 1, type: 'dashed' },
        label: {
          show: true, position: 'insideEndTop', formatter: `Rs${livePrice.toFixed(2)}`,
          color: '#fff', backgroundColor: isUp ? theme.upColor : theme.downColor,
          padding: [4, 8], borderRadius: 4, fontSize: 11, fontWeight: 'bold',
        },
      });
    }

    const series = [{
      name: 'Candlestick',
      type: 'candlestick',
      data: candlestickData,
      itemStyle: {
        color: theme.upColor, color0: theme.downColor,
        borderColor: theme.upColor, borderColor0: theme.downColor,
      },
      markPoint: tradeMarkers.length > 0 ? { symbol: 'pin', symbolSize: 40, data: tradeMarkers } : undefined,
      markLine: priceLineData.length > 0 ? { silent: true, symbol: 'none', data: priceLineData, animation: false } : undefined,
    }];

    if (indicators.ma20) {
      series.push({
        name: 'MA20', type: 'line',
        data: calculateMA(candlestickData, 20),
        smooth: true, symbol: 'none',
        lineStyle: { width: 1.5, color: '#3b82f6' },
      });
    }

    if (advancedIndicators.sma && advancedIndicators.sma.enabled) {
      series.push({
        name: `SMA ${advancedIndicators.sma.period}`, type: 'line',
        data: calculateMA(candlestickData, advancedIndicators.sma.period),
        smooth: true, symbol: 'none',
        lineStyle: { width: 1.5, color: '#f59e0b' },
      });
    }
    if (advancedIndicators.ema && advancedIndicators.ema.enabled) {
      series.push({
        name: `EMA ${advancedIndicators.ema.period}`, type: 'line',
        data: calculateMA(candlestickData, advancedIndicators.ema.period),
        smooth: true, symbol: 'none',
        lineStyle: { width: 1.5, color: '#8b5cf6' },
      });
    }

    if (indicators.volume) {
      series.push({
        name: 'Volume', type: 'bar',
        xAxisIndex: 1, yAxisIndex: 1,
        data: volumeData,
      });
    }

    return {
      backgroundColor: theme.bg,
      animation: true,
      title: {
        text: `${symbol} - NSE ${livePrice ? `- LIVE Rs${livePrice.toFixed(2)}` : ''}`,
        left: 'center', top: 5,
        textStyle: { color: theme.title, fontSize: 12, fontWeight: 'normal' },
      },
      legend: {
        data: series.map(s => s.name),
        top: 25,
        textStyle: { color: theme.text, fontSize: 11 },
        itemGap: 15,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#3b82f6' }, lineStyle: { color: '#3b82f6' } },
        backgroundColor: theme.tooltipBg,
        borderColor: theme.border,
        textStyle: { color: theme.textPrimary },
        formatter: function (params) {
          if (!params || params.length === 0) return '';
          const candle = params.find(p => p.seriesType === 'candlestick');
          if (!candle) return '';
          const [open, close, low, high] = candle.data;
          const change = close - open;
          const changePct = ((change / open) * 100).toFixed(2);
          const color = change >= 0 ? theme.upColor : theme.downColor;
          return `<div style="font-weight:700;margin-bottom:6px;color:${theme.text}">${candle.name}</div>
            <div style="display:grid;grid-template-columns:auto auto;gap:4px 12px;font-size:12px">
              <span style="color:${theme.text}">Open:</span><span style="color:${theme.textPrimary};font-weight:600">Rs${open.toFixed(2)}</span>
              <span style="color:${theme.text}">High:</span><span style="color:${theme.upColor};font-weight:600">Rs${high.toFixed(2)}</span>
              <span style="color:${theme.text}">Low:</span><span style="color:${theme.downColor};font-weight:600">Rs${low.toFixed(2)}</span>
              <span style="color:${theme.text}">Close:</span><span style="color:${color};font-weight:700">Rs${close.toFixed(2)}</span>
              <span style="color:${theme.text}">Change:</span><span style="color:${color};font-weight:700">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct}%)</span>
            </div>`;
        },
      },
      axisPointer: { link: [{ xAxisIndex: 'all' }], label: { backgroundColor: '#3b82f6' } },
      grid: [
        { left: '3%', right: '3%', top: 60, height: indicators.volume ? '60%' : '80%', containLabel: true },
        { left: '3%', right: '3%', top: indicators.volume ? '73%' : '90%', height: indicators.volume ? '15%' : '0%', containLabel: true },
      ],
      xAxis: [
        {
          type: 'category', data: dates, scale: true, boundaryGap: false,
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisLabel: { color: theme.text, fontSize: 10 },
          splitLine: { show: false }, axisPointer: { z: 100 },
        },
        {
          type: 'category', gridIndex: 1, data: dates, scale: true, boundaryGap: false,
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true, position: 'right',
          triggerEvent: true,
          axisPointer: { show: true, snap: false },
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisLabel: { color: theme.text, fontSize: 10, formatter: (val) => `Rs${val.toFixed(0)}` },
          splitLine: { lineStyle: { color: theme.gridLine } },
        },
        {
          scale: true, gridIndex: 1, position: 'right',
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisLabel: { color: theme.text, fontSize: 10, formatter: (val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}K` },
          splitLine: { show: false },
        },
      ],
            dataZoom: [
        // X-axis: mouse wheel + inside drag (existing behavior)
        { 
          type: 'inside', 
          xAxisIndex: [0, 1], 
          start: 0, 
          end: 100, 
          zoomLock: false,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
        },
        // Y-axis: inside zoom (controlled by our custom drag)
        {
          type: 'inside',
          yAxisIndex: [0],
          start: 0,
          end: 100,
          zoomOnMouseWheel: false,
          moveOnMouseMove: false,
          filterMode: 'none',
        },
        // Bottom slider (X-axis)
        {
          show: true, 
          xAxisIndex: [0, 1], 
          type: 'slider', 
          bottom: 10, 
          height: 20,
          start: 0, 
          end: 100,
          backgroundColor: theme.cardBg, 
          borderColor: theme.border,
          fillerColor: 'rgba(59, 130, 246, 0.2)',
          handleStyle: { color: '#3b82f6' },
          textStyle: { color: theme.text, fontSize: 10 },
          dataBackground: {
            lineStyle: { color: '#3b82f6' },
            areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
          },
        },
        // RIGHT-side price axis slider (Y-axis zoom - drag prices)
        {
          show: true,
          yAxisIndex: [0],
          type: 'slider',
          right: 5,
          width: 18,
          top: 60,
          bottom: 100,
          start: 0,
          end: 100,
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
          fillerColor: 'rgba(59, 130, 246, 0.15)',
          handleStyle: { color: '#3b82f6' },
          textStyle: { show: false },
          showDetail: false,
          brushSelect: false,
        },
      ],
      series: series,
    };
  }, [candles, indicators, symbol, timeframe, userTrades, theme, livePrice, advancedIndicators]);

  const toggleIndicator = (key) => setIndicators(prev => ({ ...prev, [key]: !prev[key] }));

  const takeScreenshot = () => {
    if (chartRef.current) {
      const url = chartRef.current.getEchartsInstance().getDataURL({
        type: 'png', pixelRatio: 2, backgroundColor: theme.bg,
      });
      const link = document.createElement('a');
      link.download = `${symbol}_chart_${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  const toggleAdvancedIndicator = (indicatorId, defaultPeriod) => {
    setAdvancedIndicators(prev => {
      const current = prev[indicatorId] || {};
      return {
        ...prev,
        [indicatorId]: {
          ...current,
          enabled: !current.enabled,
          period: current.period || defaultPeriod,
        }
      };
    });
  };

  const updateIndicatorPeriod = (indicatorId, period) => {
    setAdvancedIndicators(prev => ({
      ...prev,
      [indicatorId]: { ...prev[indicatorId], period: period }
    }));
  };

  const activeAdvancedCount = Object.values(advancedIndicators).filter(v => v && v.enabled).length;

  const getCursorStyle = () => {
    switch (activeTool) {
      case 'cursor': return 'default';
      case 'text': return 'text';
      case 'horizontal': return 'row-resize';
      case 'vertical': return 'col-resize';
      default: return 'crosshair';
    }
  };

  return (
    <div style={{
      position: fullscreen ? 'fixed' : 'relative',
      top: fullscreen ? 0 : 'auto',
      left: fullscreen ? 0 : 'auto',
      right: fullscreen ? 0 : 'auto',
      bottom: fullscreen ? 0 : 'auto',
      background: fullscreen ? theme.bg : 'transparent',
      zIndex: fullscreen ? 9999 : 'auto',
      padding: fullscreen ? 20 : 0,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, flexWrap: 'wrap', gap: 8,
        background: theme.cardBg, padding: 10, borderRadius: 8,
      }}>
        {onSymbolChange && (
          <SymbolSearchBar currentSymbol={symbol} onSymbolChange={onSymbolChange} theme={theme} />
        )}
        <div style={{
          fontSize: 11, color: theme.text, padding: '4px 8px',
          background: theme.bg, borderRadius: 4, border: `1px solid ${theme.border}`,
        }}>
          {symbol} - NSE
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, flexWrap: 'wrap', gap: 8,
        background: theme.cardBg, padding: 10, borderRadius: 8,
      }}>
              {/* ── Chart Engine Toggle ── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        marginBottom: 8, gap: 8,
        background: theme.cardBg, padding: 10, borderRadius: 8,
      }}>
        <span style={{ color: theme.text, fontSize: 11, fontWeight: 700 }}>Chart Engine:</span>
        <button
          onClick={() => setChartEngine('echarts')}
          style={{
            padding: '6px 14px',
            background: chartEngine === 'echarts' ? '#3b82f6' : theme.bg,
            color: chartEngine === 'echarts' ? '#fff' : theme.textPrimary,
            border: `1px solid ${chartEngine === 'echarts' ? '#3b82f6' : theme.border}`,
            borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >📊 ECharts (Drawings + Indicators)</button>
        <button
          onClick={() => setChartEngine('lightweight')}
          style={{
            padding: '6px 14px',
            background: chartEngine === 'lightweight' ? '#8b5cf6' : theme.bg,
            color: chartEngine === 'lightweight' ? '#fff' : theme.textPrimary,
            border: `1px solid ${chartEngine === 'lightweight' ? '#8b5cf6' : theme.border}`,
            borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >⚡ TradingView Lightweight (Better Zoom)</button>
      </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: theme.text, fontSize: 11, padding: '4px 6px', fontWeight: 700 }}>Time:</span>
          {timeframes.filter(t => t.group === 'intraday').map(tf => (
            <button key={tf.label} onClick={() => setTimeframe(tf)}
              style={{
                padding: '4px 10px',
                background: timeframe.label === tf.label ? '#3b82f6' : theme.bg,
                color: timeframe.label === tf.label ? '#fff' : theme.textPrimary,
                border: `1px solid ${theme.border}`,
                borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>{tf.label}</button>
          ))}
          <span style={{ color: theme.border, fontSize: 14, padding: '0 4px' }}>|</span>
          {timeframes.filter(t => t.group === 'daily').map(tf => (
            <button key={tf.label} onClick={() => setTimeframe(tf)}
              style={{
                padding: '4px 10px',
                background: timeframe.label === tf.label ? '#3b82f6' : theme.bg,
                color: timeframe.label === tf.label ? '#fff' : theme.textPrimary,
                border: `1px solid ${theme.border}`,
                borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>{tf.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {livePrice && (
            <div style={{
              padding: '6px 12px', background: '#10b981', color: '#fff',
              borderRadius: 6, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#fff', animation: 'pulse 1.5s infinite'
              }}></span>
              LIVE Rs{livePrice.toFixed(2)}
            </div>
          )}
          <button onClick={takeScreenshot}
            style={{ padding: '6px 12px', background: theme.bg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >Save</button>
          <button onClick={() => setFullscreen(!fullscreen)}
            style={{ padding: '6px 12px', background: fullscreen ? '#ef4444' : theme.bg, color: fullscreen ? '#fff' : theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >{fullscreen ? 'Exit' : 'Full'}</button>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, flexWrap: 'wrap', gap: 8,
        background: theme.cardBg, padding: 10, borderRadius: 8,
      }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: theme.text, fontSize: 11, padding: '4px 6px', fontWeight: 700 }}>Quick:</span>
          <button onClick={() => toggleIndicator('ma20')}
            style={{
              padding: '4px 10px',
              background: indicators.ma20 ? '#3b82f6' : theme.bg,
              color: indicators.ma20 ? '#fff' : theme.textPrimary,
              border: `1px solid ${indicators.ma20 ? '#3b82f6' : theme.border}`,
              borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>MA 20</button>
          <button onClick={() => toggleIndicator('volume')}
            style={{
              padding: '4px 10px',
              background: indicators.volume ? '#10b981' : theme.bg,
              color: indicators.volume ? '#fff' : theme.textPrimary,
              border: `1px solid ${indicators.volume ? '#10b981' : theme.border}`,
              borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>Volume</button>
          <button
            onClick={() => setIndicatorsModalOpen(true)}
            style={{
              padding: '4px 14px',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff', border: 'none', borderRadius: 4,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Indicators & Studies
            {activeAdvancedCount > 0 && (
              <span style={{
                background: '#fff', color: '#8b5cf6',
                padding: '1px 6px', borderRadius: 10,
                fontSize: 10, fontWeight: 700,
              }}>{activeAdvancedCount}</span>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeTool !== 'cursor' && (
            <div style={{
              fontSize: 11, color: '#f59e0b', fontWeight: 700,
              padding: '4px 8px', background: 'rgba(245,158,11,0.1)',
              border: '1px solid #f59e0b', borderRadius: 4,
            }}>
              ✏️ {activeTool.toUpperCase()} | V=cancel | Ctrl+Z=undo
            </div>
          )}
          <div style={{ fontSize: 11, color: theme.text }}>
            Scroll=Zoom · Drag=Pan
          </div>
        </div>
      </div>

      <div ref={containerRef} style={{ position: 'relative', minHeight: 700 }}>
        <DrawingTools
  activeTool={activeTool}
  onToolSelect={setActiveTool}
  onClearAll={handleClearAll}
  onUndo={handleUndo}
  drawingsCount={drawings.length}
  theme={theme}
/>

        {loading ? (
          <div style={{
            height: 700, background: theme.bg, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: theme.text, fontSize: 16,
          }}>
            Loading {timeframe.label} chart for {symbol}...
          </div>
        ) : candles.length === 0 ? (
          <div style={{
            height: 700, background: theme.bg, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', fontSize: 16,
          }}>
            No data available for {symbol}
          </div>
        ) : (
          <>
            <ReactECharts
              ref={chartRef}
              option={chartOption}
              style={{ height: fullscreen ? window.innerHeight - 200 : 700, width: '100%' }}
              theme={isDarkTheme ? 'dark' : 'light'}
              notMerge={true}
            />
            <canvas
              ref={overlayCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: activeTool === 'cursor' ? 'none' : 'auto',
                cursor: getCursorStyle(),
                zIndex: 10,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </>
        )}
      </div>

      <IndicatorsModal
        isOpen={indicatorsModalOpen}
        onClose={() => setIndicatorsModalOpen(false)}
        activeIndicators={advancedIndicators}
        onToggleIndicator={toggleAdvancedIndicator}
        onUpdatePeriod={updateIndicatorPeriod}
        theme={theme}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

const fmt = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const fmtCr = (val) => {
  if (!val) return '-';
  const num = Number(val);
  if (num >= 10000000) return `Rs${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `Rs${(num / 100000).toFixed(2)} L`;
  return `Rs${fmt(num)}`;
};

const fmtCurrencyWithSign = (val) => {
  if (val === undefined || val === null || isNaN(val)) return 'Rs0';
  const num = Number(val);
  const sign = num >= 0 ? '+' : '-';
  return `${sign}Rs${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

function StockDetailPage({ symbol, trades, onBack }) {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exchange] = useState('NSE');

  const sector = getSectorForSymbol(symbol);
  const sectorColor = getSectorColor(sector);
  const stockTrades = useMemo(() => trades.filter(t => t.symbol && t.symbol.toUpperCase() === (symbol || '').toUpperCase()), [trades, symbol]);
  const stockStats = useMemo(() => {
    const closed = stockTrades.filter(t => t.status === 'closed');
    const wins = closed.filter(t => Number(t.pnl) > 0);
    const totalPnL = closed.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const winRate = closed.length > 0 ? (wins.length / closed.length * 100) : 0;
    const openCount = stockTrades.filter(t => t.status === 'open').length;
    return { total: stockTrades.length, closed: closed.length, open: openCount, wins: wins.length, losses: closed.length - wins.length, totalPnL, winRate };
  }, [stockTrades]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchFullStockData(symbol);
        setPriceData(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadData();
    const interval = setInterval(async () => {
      const data = await fetchStockPrice(symbol);
      if (data) setPriceData(prev => ({ ...prev, ...data }));
    }, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  const price = priceData && priceData.price;
  const prevClose = priceData && priceData.previousClose;
  const change = price && prevClose ? price - prevClose : 0;
  const changePct = price && prevClose ? ((change / prevClose) * 100) : 0;
  const isProfit = change >= 0;

  return (
    <div style={{ padding: '0 4px' }}>
      <button onClick={() => onBack && onBack()} style={{ padding: '10px 18px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>Back</button>

      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 16, padding: 24, marginBottom: 20, border: `2px solid ${sectorColor}`, boxShadow: `0 0 30px ${sectorColor}22` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>{symbol}</h1>
              <span style={{ background: sectorColor, color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{sector}</span>
              <span style={{ background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>NSE</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Professional charting powered by Apache ECharts</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>LIVE PRICE</div>
            {loading ? <div style={{ fontSize: 20 }}>Loading...</div> : price ? (
              <div>
                <div style={{ fontSize: 36, fontWeight: 800 }}>Rs{fmt(price)}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isProfit ? 'var(--accent-green)' : 'var(--accent-red)' }}>{isProfit ? '+' : '-'} Rs{Math.abs(change).toFixed(2)} ({isProfit ? '+' : ''}{changePct.toFixed(2)}%)</div>
              </div>
            ) : <div style={{ fontSize: 14 }}>Price unavailable</div>}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, marginBottom: 20, border: '1px solid var(--border-color)' }}>
        <EChartsStock 
          symbol={symbol} 
          userTrades={stockTrades}
          onSymbolChange={onBack ? (newSymbol) => onBack(newSymbol) : undefined}
        />
      </div>

      {priceData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatBox label="Open" value={`Rs${fmt(priceData.open)}`} />
          <StatBox label="High" value={`Rs${fmt(priceData.high)}`} color="var(--accent-green)" />
          <StatBox label="Low" value={`Rs${fmt(priceData.low)}`} color="var(--accent-red)" />
          <StatBox label="Prev Close" value={`Rs${fmt(prevClose)}`} />
          <StatBox label="Volume" value={fmt(priceData.volume)} />
          <StatBox label="52W High" value={`Rs${fmt(priceData.high52w)}`} color="var(--accent-green)" />
          <StatBox label="52W Low" value={`Rs${fmt(priceData.low52w)}`} color="var(--accent-red)" />
          <StatBox label="Market Cap" value={fmtCr(priceData.marketCap)} />
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>About {symbol}</h3>
        {priceData && priceData.description && <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 16 }}><strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>Business Overview</strong><p style={{ margin: '8px 0 0 0' }}>{priceData.description}</p></div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
          <InfoRow label="Symbol" value={symbol} />
          <InfoRow label="Exchange" value={exchange} />
          <InfoRow label="Sector" value={(priceData && priceData.sector) || sector} color={sectorColor} />
          {priceData && priceData.industry && <InfoRow label="Industry" value={priceData.industry} />}
          {priceData && priceData.country && <InfoRow label="Country" value={priceData.country} />}
          {priceData && priceData.city && <InfoRow label="Headquarters" value={priceData.city} />}
          {priceData && priceData.employees > 0 && <InfoRow label="Employees" value={fmt(priceData.employees)} />}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Trades in {symbol} ({stockStats.total})</h3>
        {stockStats.total > 0 ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              <StatBox label="Total Trades" value={stockStats.total} />
              <StatBox label="Closed" value={stockStats.closed} />
              <StatBox label="Open" value={stockStats.open} color="var(--accent-blue)" />
              <StatBox label="Win Rate" value={`${stockStats.winRate.toFixed(1)}%`} color="var(--accent-green)" />
              <StatBox label="Total P&L" value={fmtCurrencyWithSign(stockStats.totalPnL)} color={stockStats.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
            </div>
            <div style={{ overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead><tr style={{ background: 'var(--bg-input)' }}><th style={thStyle}>Date</th><th style={thStyle}>Type</th><th style={thStyle}>Direction</th><th style={thStyle}>Entry</th><th style={thStyle}>Exit</th><th style={thStyle}>Qty</th><th style={thStyle}>P&L</th><th style={thStyle}>Status</th></tr></thead>
                <tbody>
                  {stockTrades.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={tdStyle}>{t.entryDate ? format(parseISO(t.entryDate), 'dd MMM yy') : '-'}</td>
                      <td style={tdStyle}>{t.tradeType}</td>
                      <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: t.direction === 'long' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: t.direction === 'long' ? '#10b981' : '#ef4444' }}>{t.direction && t.direction.toUpperCase()}</span></td>
                      <td style={tdStyle}>Rs{fmt(t.entryPrice)}</td>
                      <td style={tdStyle}>{t.exitPrice ? `Rs${fmt(t.exitPrice)}` : '-'}</td>
                      <td style={tdStyle}>{t.quantity}</td>
                      <td style={{ ...tdStyle, color: Number(t.pnl) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>{t.status === 'closed' ? fmtCurrencyWithSign(t.pnl) : '-'}</td>
                      <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: t.status === 'open' ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.2)', color: t.status === 'open' ? '#3b82f6' : '#94a3b8' }}>{t.status && t.status.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><div style={{ fontSize: 48, marginBottom: 12 }}>Empty</div><p>You haven't traded {symbol} yet</p></div>}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) { 
  return (
    <div style={{ padding: 14, background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  ); 
}

function InfoRow({ label, value, color }) { 
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  ); 
}

const thStyle = { padding: 12, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1 };
const tdStyle = { padding: 12, fontSize: 13 };

export default StockDetailPage;