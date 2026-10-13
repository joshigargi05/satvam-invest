export const getLiveStockQuote = async (symbol) => {
  try {
    const response = await fetch(`/api/quote?symbol=${symbol}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

export const getMarketNews = async () => {
  try {
    const response = await fetch(`/api/news`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
};

export const getPortfolioNews = async (symbols) => {
  try {
    const response = await fetch(`/api/portfolio-news?symbols=${symbols}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio news:', error);
    return [];
  }
};

export const getUpcomingEarnings = async (symbols) => {
  try {
    const response = await fetch(`/api/upcoming-earnings?symbols=${symbols}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }
};

export const getQuotes = async (symbols) => {
  try {
    const response = await fetch(`/api/quotes?symbols=${symbols}`);
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return {};
  }
};

export const getPortfolioHistory = async (holdings, balance, period) => {
  try {
    const response = await fetch('/api/portfolio-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings, balance, period })
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};

export const getAlgoRecommendations = async (query) => {
  try {
    const response = await fetch('/api/algo-trading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching algo recommendations:', error);
    return null;
  }
};

export const getFundamentals = async (symbol) => {
  try {
    const response = await fetch(`/api/fundamentals?symbol=${symbol}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching fundamentals for ${symbol}:`, error);
    return null;
  }
};

export const getMacroIntelligenceStream = async () => {
  try {
    const response = await fetch('/api/macro-intelligence/stream');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching macro intelligence stream:', error);
    return null;
  }
};

export const getMacroAllocationRecommendation = async (payload) => {
  try {
    const response = await fetch('/api/macro-intelligence/recommend-allocation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching macro allocation recommendation:', error);
    return null;
  }
};

export const getCommodities = async (market = 'US') => {
  try {
    const response = await fetch(`/api/commodities?market=${market}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching commodities:', error);
    return [];
  }
};

