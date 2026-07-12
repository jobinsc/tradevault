// src/aiService.js
// Google Gemini Vision API integration for chart analysis

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

// Convert image file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

// Analyze chart image with Gemini Vision
export const analyzeChartImage = async (imageFile, userContext = {}) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found. Please add REACT_APP_GEMINI_API_KEY to .env');
  }

  try {
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

    const prompt = `You are an expert technical analyst for Indian stock markets (NSE/BSE). Analyze this trading chart image and provide a detailed analysis in STRICT JSON format.

${userContext.symbol ? `Stock Symbol: ${userContext.symbol}` : ''}
${userContext.timeframe ? `Timeframe: ${userContext.timeframe}` : ''}

Provide response in this EXACT JSON structure (no markdown, no code blocks, just pure JSON):

{
  "symbol": "detected stock symbol or Unknown",
  "timeframe": "detected timeframe (e.g., 5min, 15min, 1H, 1D)",
  "currentPrice": "approximate current price if visible",
  "trend": {
    "direction": "Bullish / Bearish / Sideways",
    "strength": "Strong / Moderate / Weak",
    "description": "brief explanation"
  },
  "pattern": {
    "name": "chart pattern name (e.g., Ascending Triangle, Head & Shoulders)",
    "type": "Continuation / Reversal / Neutral",
    "reliability": "High / Medium / Low",
    "description": "pattern explanation"
  },
  "supportResistance": {
    "resistance1": "price level",
    "resistance2": "price level",
    "support1": "price level",
    "support2": "price level"
  },
  "indicators": {
    "rsi": "value or Not Visible",
    "macd": "signal or Not Visible",
    "movingAverages": "description or Not Visible",
    "volume": "description"
  },
  "tradeSetup": {
    "recommendation": "Buy / Sell / Hold / Wait",
    "entry": "suggested entry price",
    "target1": "first target price",
    "target2": "second target price",
    "stopLoss": "stop loss price",
    "riskReward": "e.g., 1:2.5",
    "positionSize": "suggested % of capital (e.g., 2-3%)"
  },
  "confidence": "score out of 10",
  "riskLevel": "Low / Medium / High",
  "timeHorizon": "Intraday / Swing / Positional / Long-term",
  "keyInsights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ],
  "warnings": [
    "warning 1 if any"
  ],
  "summary": "2-3 sentence overall analysis"
}

IMPORTANT: 
- Return ONLY valid JSON
- No markdown formatting
- No \`\`\`json code blocks
- Prices in Indian Rupees (₹)
- Be specific and actionable`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No response from AI');
    }

    // Clean the response (remove markdown if any)
    let cleanedResponse = textResponse.trim();
    cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');

    // Parse JSON
    const analysis = JSON.parse(cleanedResponse);

    return {
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      rawResponse: textResponse
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze chart',
      timestamp: new Date().toISOString()
    };
  }
};

// Validate image before upload
export const validateImage = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, or WebP images allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }

  return { valid: true };
};