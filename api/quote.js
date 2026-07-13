// api/quote.js
// Vercel Serverless Function to proxy Yahoo Finance quote summary (fundamentals)

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(400).json({ error: 'Symbol required' });
  }

  const modules = 'summaryDetail,defaultKeyStatistics,financialData,assetProfile,price';
  const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`;

  try {
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo returned ${response.status}`);
    }

    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    
    return res.status(200).json(data);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: error.message,
      symbol: symbol,
    });
  }
}