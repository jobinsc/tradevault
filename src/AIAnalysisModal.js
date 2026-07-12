// src/AIAnalysisModal.js
import React, { useState, useRef } from 'react';
import { analyzeChartImage, validateImage } from './aiService';

const AIAnalysisModal = ({ onClose, onSave }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError('');
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    setAnalysis(null);

    const result = await analyzeChartImage(image, { symbol, timeframe });

    if (result.success) {
      setAnalysis(result.analysis);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setError('');
    setSymbol('');
    setTimeframe('');
  };

  const getTrendColor = (direction) => {
    if (!direction) return '#94a3b8';
    if (direction.toLowerCase().includes('bull')) return '#10b981';
    if (direction.toLowerCase().includes('bear')) return '#ef4444';
    return '#f59e0b';
  };

  const getRecommendationColor = (rec) => {
    if (!rec) return '#94a3b8';
    const r = rec.toLowerCase();
    if (r.includes('buy')) return '#10b981';
    if (r.includes('sell')) return '#ef4444';
    if (r.includes('hold')) return '#3b82f6';
    return '#f59e0b';
  };

  const getConfidenceStars = (score) => {
    const num = parseInt(score) || 0;
    return '⭐'.repeat(Math.min(num, 10));
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card, #1a1f35)', borderRadius: 16,
        maxWidth: 900, width: '100%', maxHeight: '95vh',
        overflowY: 'auto', border: '1px solid var(--border-color, #2a3150)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: 20, borderBottom: '1px solid var(--border-color, #2a3150)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px 16px 0 0'
        }}>
          <div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 22 }}>🤖 AI Chart Analysis</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: 13 }}>
              Powered by Google Gemini Vision AI
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            fontSize: 20
          }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          
          {/* Upload Zone */}
          {!analysis && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#3b82f6' : 'var(--border-color, #2a3150)'}`,
                  borderRadius: 12, padding: 40, textAlign: 'center',
                  cursor: 'pointer', background: dragActive ? 'rgba(59,130,246,0.05)' : 'var(--bg-input, #151b2e)',
                  transition: 'all 0.2s'
                }}
              >
                {imagePreview ? (
                  <div>
                    <img src={imagePreview} alt="Chart preview" style={{
                      maxWidth: '100%', maxHeight: 300, borderRadius: 8,
                      marginBottom: 12
                    }} />
                    <div style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: 13 }}>
                      Click to change image
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                    <div style={{ color: 'var(--text-primary, #f1f5f9)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                      Drop chart image here or click to upload
                    </div>
                    <div style={{ color: 'var(--text-muted, #64748b)', fontSize: 12 }}>
                      PNG, JPG, WebP • Max 5MB
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Optional Context */}
              {image && (
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input
                    type="text"
                    placeholder="Symbol (optional) e.g., RELIANCE"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    style={{
                      padding: '10px 14px', background: 'var(--bg-input, #151b2e)',
                      border: '1px solid var(--border-color, #2a3150)', borderRadius: 8,
                      color: 'var(--text-primary, #f1f5f9)', fontSize: 14
                    }}
                  />
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    style={{
                      padding: '10px 14px', background: 'var(--bg-input, #151b2e)',
                      border: '1px solid var(--border-color, #2a3150)', borderRadius: 8,
                      color: 'var(--text-primary, #f1f5f9)', fontSize: 14
                    }}
                  >
                    <option value="">Timeframe (optional)</option>
                    <option value="1min">1 Minute</option>
                    <option value="5min">5 Minutes</option>
                    <option value="15min">15 Minutes</option>
                    <option value="1H">1 Hour</option>
                    <option value="1D">1 Day</option>
                    <option value="1W">1 Week</option>
                  </select>
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: 12, padding: 12, background: 'rgba(239,68,68,0.1)',
                  border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', fontSize: 13
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!image || loading}
                style={{
                  width: '100%', marginTop: 16, padding: '14px',
                  background: !image || loading ? '#374151' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 600,
                  cursor: !image || loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '🔄 Analyzing... Please wait' : '🚀 Analyze Chart with AI'}
              </button>
            </>
          )}

          {/* Loading Animation */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <div style={{ color: 'var(--text-primary, #f1f5f9)', fontSize: 16, marginBottom: 8 }}>
                AI is analyzing your chart...
              </div>
              <div style={{ color: 'var(--text-muted, #64748b)', fontSize: 13 }}>
                This usually takes 5-15 seconds
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !loading && (
            <div>
              {/* Summary Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                border: '1px solid rgba(102,126,234,0.3)', borderRadius: 12,
                padding: 20, marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>ANALYSIS SUMMARY</div>
                    <h3 style={{ color: 'var(--text-primary, #f1f5f9)', margin: 0, fontSize: 18 }}>
                      {analysis.symbol} • {analysis.timeframe}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>Confidence</div>
                    <div style={{ fontSize: 16, color: '#f59e0b' }}>{getConfidenceStars(analysis.confidence)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>{analysis.confidence}/10</div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                  {analysis.summary}
                </p>
              </div>

              {/* Trend & Pattern */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{
                  background: 'var(--bg-input, #151b2e)', padding: 16, borderRadius: 10,
                  border: '1px solid var(--border-color, #2a3150)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginBottom: 6 }}>📊 TREND</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: getTrendColor(analysis.trend?.direction) }}>
                    {analysis.trend?.direction}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
                    {analysis.trend?.strength} • {analysis.trend?.description}
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg-input, #151b2e)', padding: 16, borderRadius: 10,
                  border: '1px solid var(--border-color, #2a3150)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginBottom: 6 }}>🔺 PATTERN</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
                    {analysis.pattern?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
                    {analysis.pattern?.type} • {analysis.pattern?.reliability} reliability
                  </div>
                </div>
              </div>

              {/* Trade Setup */}
              <div style={{
                background: 'var(--bg-input, #151b2e)', padding: 20, borderRadius: 10,
                border: '1px solid var(--border-color, #2a3150)', marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>🎯 TRADE SETUP</div>
                  <div style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: getRecommendationColor(analysis.tradeSetup?.recommendation),
                    color: '#fff'
                  }}>
                    {analysis.tradeSetup?.recommendation}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>ENTRY</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#3b82f6' }}>₹{analysis.tradeSetup?.entry}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>TARGET 1</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>₹{analysis.tradeSetup?.target1}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>TARGET 2</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>₹{analysis.tradeSetup?.target2}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>STOP LOSS</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#ef4444' }}>₹{analysis.tradeSetup?.stopLoss}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>R:R RATIO</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b' }}>{analysis.tradeSetup?.riskReward}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>POSITION SIZE</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#8b5cf6' }}>{analysis.tradeSetup?.positionSize}</div>
                  </div>
                </div>
              </div>

              {/* Support/Resistance */}
              <div style={{
                background: 'var(--bg-input, #151b2e)', padding: 16, borderRadius: 10,
                border: '1px solid var(--border-color, #2a3150)', marginBottom: 16
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', marginBottom: 10 }}>
                  📏 Support & Resistance Levels
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#ef4444' }}>R2</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary, #f1f5f9)' }}>₹{analysis.supportResistance?.resistance2}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#ef4444' }}>R1</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary, #f1f5f9)' }}>₹{analysis.supportResistance?.resistance1}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#10b981' }}>S1</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary, #f1f5f9)' }}>₹{analysis.supportResistance?.support1}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#10b981' }}>S2</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary, #f1f5f9)' }}>₹{analysis.supportResistance?.support2}</div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              {analysis.keyInsights && analysis.keyInsights.length > 0 && (
                <div style={{
                  background: 'var(--bg-input, #151b2e)', padding: 16, borderRadius: 10,
                  border: '1px solid var(--border-color, #2a3150)', marginBottom: 16
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', marginBottom: 10 }}>
                    💡 Key Insights
                  </div>
                  {analysis.keyInsights.map((insight, i) => (
                    <div key={i} style={{
                      color: 'var(--text-secondary, #94a3b8)', fontSize: 13,
                      marginBottom: 6, paddingLeft: 20, position: 'relative'
                    }}>
                      <span style={{ position: 'absolute', left: 0 }}>▸</span>
                      {insight}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {analysis.warnings && analysis.warnings.length > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.05)', padding: 16, borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.3)', marginBottom: 16
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 10 }}>
                    ⚠️ Warnings
                  </div>
                  {analysis.warnings.map((warning, i) => (
                    <div key={i} style={{ color: '#fca5a5', fontSize: 13, marginBottom: 4 }}>
                      • {warning}
                    </div>
                  ))}
                </div>
              )}

              {/* Meta info */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ padding: '6px 12px', background: 'var(--bg-input, #151b2e)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                  🎯 Risk: {analysis.riskLevel}
                </div>
                <div style={{ padding: '6px 12px', background: 'var(--bg-input, #151b2e)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                  ⏱️ Horizon: {analysis.timeHorizon}
                </div>
                <div style={{ padding: '6px 12px', background: 'var(--bg-input, #151b2e)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                  📊 Volume: {analysis.indicators?.volume}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleReset} style={{
                  flex: 1, padding: '12px', background: 'var(--bg-input, #151b2e)',
                  color: 'var(--text-primary, #f1f5f9)', border: '1px solid var(--border-color, #2a3150)',
                  borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600
                }}>
                  🔄 New Analysis
                </button>
                {onSave && (
                  <button onClick={() => onSave(analysis, imagePreview)} style={{
                    flex: 1, padding: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    cursor: 'pointer', fontSize: 14, fontWeight: 600
                  }}>
                    💾 Save Analysis
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;