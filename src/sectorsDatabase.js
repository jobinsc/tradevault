// src/sectorsDatabase.js
// Maps Indian stock symbols to their sectors

export const SECTORS = {
  'Banking & Finance': [
    'HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 
    'INDUSINDBK', 'BANKBARODA', 'PNB', 'CANBK', 'FEDERALBNK',
    'IDFCFIRSTB', 'BANDHANBNK', 'RBLBANK', 'YESBANK', 'AUBANK',
    'BAJFINANCE', 'BAJAJFINSV', 'HDFCLIFE', 'SBILIFE', 'ICICIPRULI',
    'HDFCAMC', 'CHOLAFIN', 'MUTHOOTFIN', 'MANAPPURAM', 'LICHSGFIN',
    'PFC', 'RECLTD', 'IRFC', 'SBICARD', 'IIFL', 'ICICIGI'
  ],
  
  'IT & Technology': [
    'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM', 'MPHASIS',
    'PERSISTENT', 'COFORGE', 'LTTS', 'OFSS', 'MINDTREE', 'ZENSAR',
    'HAPPSTMNDS', 'KPITTECH', 'TATATECH', 'CYIENT', 'BSOFT',
    'INTELLECT', 'NEWGEN', 'RATEGAIN', 'MASTEK', 'BIRLASOFT'
  ],
  
  'Pharma & Healthcare': [
    'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'APOLLOHOSP',
    'LUPIN', 'AUROPHARMA', 'BIOCON', 'TORNTPHARM', 'ZYDUSLIFE',
    'ALKEM', 'GLENMARK', 'IPCALAB', 'GLAND', 'LAURUSLABS',
    'FORTIS', 'MAXHEALTH', 'MEDANTA', 'NARAYANHOSP', 'METROPOLIS',
    'ABBOTINDIA', 'PFIZER', 'GLAXO', 'SANOFI', 'AJANTPHARM'
  ],
  
  'Auto & Auto Parts': [
    'MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'HEROMOTOCO',
    'EICHERMOT', 'TVSMOTOR', 'ASHOKLEY', 'ESCORTS', 'FORCEMOT',
    'MOTHERSON', 'BOSCHLTD', 'MRF', 'APOLLOTYRE', 'BALKRISIND',
    'BHARATFORG', 'EXIDEIND', 'AMARAJABAT', 'SUNDRMFAST', 'TIINDIA'
  ],
  
  'FMCG & Consumer': [
    'HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR',
    'MARICO', 'GODREJCP', 'COLPAL', 'TATACONSUM', 'UBL',
    'MCDOWELL-N', 'RADICO', 'VBL', 'EMAMILTD', 'JYOTHYLAB',
    'GILLETTE', 'PGHH', 'HONASA', 'PATANJALI', 'BAJAJCON'
  ],
  
  'Energy & Oil': [
    'RELIANCE', 'ONGC', 'IOC', 'BPCL', 'HPCL', 'GAIL',
    'PETRONET', 'OIL', 'MGL', 'IGL', 'GUJGASLTD', 'ADANIGAS',
    'CASTROLIND', 'CHENNPETRO', 'MRPL', 'AEGISCHEM'
  ],
  
  'Power & Utilities': [
    'NTPC', 'POWERGRID', 'ADANIPOWER', 'TATAPOWER', 'JSWENERGY',
    'ADANIGREEN', 'NHPC', 'SJVN', 'CESC', 'TORNTPOWER',
    'RPOWER', 'INOXWIND', 'SUZLON', 'THERMAX'
  ],
  
  'Metals & Mining': [
    'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'JINDALSTEL',
    'SAIL', 'NMDC', 'HINDZINC', 'NATIONALUM', 'MOIL',
    'COALINDIA', 'RATNAMANI', 'APLAPOLLO', 'JSL', 'WELCORP'
  ],
  
  'Cement & Construction': [
    'ULTRACEMCO', 'GRASIM', 'SHREECEM', 'AMBUJACEM', 'ACC',
    'DALBHARAT', 'RAMCOCEM', 'JKCEMENT', 'HEIDELBERG', 'INDIACEM',
    'LT', 'RVNL', 'IRCON', 'NBCC', 'HCC', 'NCC'
  ],
  
  'Telecom': [
    'BHARTIARTL', 'IDEA', 'INDUS', 'TATACOMM', 'MTNL',
    'RCOM', 'HFCL', 'STLTECH', 'GTPL', 'ROUTE'
  ],
  
  'Real Estate': [
    'DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'LODHA',
    'BRIGADE', 'SOBHA', 'PHOENIXLTD', 'MAHLIFE', 'SUNTECK',
    'IBREALEST', 'ANANTRAJ'
  ],
  
  'Chemicals': [
    'UPL', 'PIDILITIND', 'SRF', 'AARTIIND', 'DEEPAKNTR',
    'ATUL', 'NAVINFLUOR', 'PIIND', 'CLEAN', 'GHCL',
    'GUJFLUORO', 'FINEORG', 'CHAMBLFERT', 'COROMANDEL', 'GNFC'
  ],
  
  'Media & Entertainment': [
    'ZEEL', 'SUNTV', 'PVRINOX', 'NAZARA', 'TIPS', 'SAREGAMA',
    'NETWORK18', 'TV18BRDCST', 'DISHTV', 'BALAJITELE', 'RADIOCITY'
  ],
  
  'Retail & E-commerce': [
    'DMART', 'TRENT', 'ABFRL', 'PAGEIND', 'RELAXO',
    'BATAINDIA', 'VMART', 'SHOPERSTOP', 'ADITYABIRLA', 'NYKAA',
    'ZOMATO', 'PAYTM', 'POLICYBZR', 'CARTRADE', 'EASEMYTRIP'
  ],
  
  'Airlines & Logistics': [
    'INDIGO', 'SPICEJET', 'CONCOR', 'GATI', 'BLUEDART',
    'TCI', 'MAHLOG', 'DELHIVERY', 'ALLCARGO', 'VRLLOG'
  ],
  
  'Hotels & Tourism': [
    'INDHOTEL', 'CHALET', 'LEMONTREE', 'EIHOTEL', 'MAHINDHOL',
    'TAJGVK', 'ORIENTHOT', 'THOMASCOOK', 'IRCTC'
  ],
  
  'Textiles': [
    'PAGEIND', 'ARVIND', 'RTNPOWER', 'RAYMOND', 'WELSPUNIND',
    'VARDHACRLC', 'TRIDENT', 'KPRMILL', 'GOKULAGRO', 'SUTLEJTEX'
  ],
  
  'Agri & Fertilizers': [
    'UPL', 'COROMANDEL', 'CHAMBLFERT', 'GNFC', 'GSFC',
    'RCF', 'NFL', 'MADRASFERT', 'DHANUKA', 'BAYERCROP',
    'RALLIS', 'PIINDUSTRIES', 'GODREJAGRO'
  ],
  
  'Diversified/Conglomerate': [
    'ADANIENT', 'ITC', 'RELIANCE', 'LT', 'GRASIM',
    'BAJAJHLDNG', 'GODREJIND', 'ADANIPORTS', 'JSPL'
  ],
  
  'Insurance': [
    'HDFCLIFE', 'SBILIFE', 'ICICIPRULI', 'ICICIGI', 'GICRE',
    'NIACL', 'LIC', 'STARHEALTH', 'MAXLIFE'
  ]
};

// Function to find sector for a given stock symbol
export const getSectorForSymbol = (symbol) => {
  if (!symbol) return 'Others';
  
  const cleanSymbol = symbol.toUpperCase().trim().replace('.NS', '').replace('.BO', '');
  
  for (const [sector, stocks] of Object.entries(SECTORS)) {
    if (stocks.includes(cleanSymbol)) {
      return sector;
    }
  }
  
  return 'Others';
};

// Get all sector names
export const getAllSectors = () => {
  return ['All', ...Object.keys(SECTORS), 'Others'];
};

// Get sector color for badges
export const getSectorColor = (sector) => {
  const colors = {
    'Banking & Finance': '#3b82f6',      // Blue
    'IT & Technology': '#8b5cf6',        // Purple
    'Pharma & Healthcare': '#10b981',    // Green
    'Auto & Auto Parts': '#f59e0b',      // Orange
    'FMCG & Consumer': '#ec4899',        // Pink
    'Energy & Oil': '#ef4444',           // Red
    'Power & Utilities': '#eab308',      // Yellow
    'Metals & Mining': '#78716c',        // Stone
    'Cement & Construction': '#a3a3a3',  // Gray
    'Telecom': '#06b6d4',                // Cyan
    'Real Estate': '#d946ef',            // Fuchsia
    'Chemicals': '#84cc16',              // Lime
    'Media & Entertainment': '#f97316',  // Orange
    'Retail & E-commerce': '#14b8a6',    // Teal
    'Airlines & Logistics': '#0ea5e9',   // Sky
    'Hotels & Tourism': '#a855f7',       // Purple
    'Textiles': '#e11d48',               // Rose
    'Agri & Fertilizers': '#65a30d',     // Green
    'Diversified/Conglomerate': '#7c3aed', // Violet
    'Insurance': '#0891b2',              // Cyan
    'Others': '#6b7280'                  // Gray
  };
  return colors[sector] || '#6b7280';
};