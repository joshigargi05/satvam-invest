import { apiFetch } from './platform';

export const getLiveStockQuote = async (symbol) => {
  try {
    const response = await apiFetch(`/api/quote?symbol=${symbol}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

export const getMarketNews = async () => {
  try {
    const response = await apiFetch(`/api/news`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
};

export const getPortfolioNews = async (symbols) => {
  try {
    const response = await apiFetch(`/api/portfolio-news?symbols=${encodeURIComponent(symbols)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio news:', error);
    return [];
  }
};

export const getUpcomingEarnings = async (symbols) => {
  try {
    const response = await apiFetch(`/api/upcoming-earnings?symbols=${encodeURIComponent(symbols)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }
};

export const getQuotes = async (symbols, market = '') => {
  try {
    const marketParam = market ? `&market=${encodeURIComponent(market)}` : '';
    const response = await apiFetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}${marketParam}`);
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return {};
  }
};

export const searchGlobalMarkets = async (query, market = '') => {
  if (!query || query.trim().length < 2) return [];
  try {
    const marketParam = market ? `&market=${encodeURIComponent(market)}` : '';
    const response = await apiFetch(`/api/market-search?q=${encodeURIComponent(query.trim())}${marketParam}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching global markets:', error);
    return [];
  }
};

export const getPortfolioHistory = async (holdings, balance, period) => {
  try {
    const response = await apiFetch('/api/portfolio-history', {
      method: 'POST',
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
    const response = await apiFetch('/api/algo-trading', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching algo recommendations:', error);
    return null;
  }
};

export const getTopAlgoPicks = async (market = 'US', forceRefresh = false, rotateAfterTicker = '') => {
  try {
    const rotateParam = rotateAfterTicker ? `&rotateAfterTicker=${encodeURIComponent(rotateAfterTicker)}` : '';
    const url = `/api/algo-top-picks?market=${market}${forceRefresh ? '&forceRefresh=true' : ''}${rotateParam}`;
    const response = await apiFetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching top algo picks:', error);
    return null;
  }
};

export const evaluateStocks = async (tickers, market = '') => {
  try {
    const symbols = Array.isArray(tickers) ? tickers.join(',') : tickers;
    const marketParam = market ? `&market=${encodeURIComponent(market)}` : '';
    const response = await apiFetch(`/api/evaluate-stocks?tickers=${encodeURIComponent(symbols)}${marketParam}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error evaluating stocks:', error);
    return null;
  }
};

export const getFundamentals = async (symbol) => {
  try {
    const response = await apiFetch(`/api/fundamentals?symbol=${symbol}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching fundamentals for ${symbol}:`, error);
    return null;
  }
};

export const getMacroIntelligenceStream = async (force = false) => {
  try {
    const url = force ? '/api/macro-intelligence/stream?force=true' : '/api/macro-intelligence/stream';
    const response = await apiFetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching macro intelligence stream:', error);
    return null;
  }
};

export const getMacroAllocationRecommendation = async (payload) => {
  try {
    const response = await apiFetch('/api/macro-intelligence/recommend-allocation', {
      method: 'POST',
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
    const response = await apiFetch(`/api/commodities?market=${market}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching commodities:', error);
    return [];
  }
};

export const getMLModelStatus = async () => {
  try {
    const response = await apiFetch('/api/ml-model-status');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching ML model status:', error);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Cloud Portfolio Sync & Multi-Platform Release APIs
// ---------------------------------------------------------------------------

export const getCloudPortfolio = async () => {
  try {
    const response = await apiFetch('/api/user/portfolio');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const syncCloudPortfolio = async (market, portfolioState) => {
  try {
    const response = await apiFetch('/api/user/portfolio', {
      method: 'PUT',
      body: JSON.stringify({ market, portfolioState })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const getMobileReleaseManifest = async () => {
  try {
    const response = await apiFetch('/api/mobile/release-manifest');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Algo Target Milestones & Celebration APIs
// ---------------------------------------------------------------------------

export const getTargetMilestonesHistory = async (market = null) => {
  try {
    const url = market ? `/api/algo-targets/history?market=${market}` : '/api/algo-targets/history';
    const response = await apiFetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching target milestones history:', error);
    return null;
  }
};

export const getUnreadCelebration = async (market = null) => {
  try {
    const url = market ? `/api/algo-targets/celebration?market=${market}` : '/api/algo-targets/celebration';
    const response = await apiFetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching unread celebration:', error);
    return null;
  }
};

export const ackCelebration = async (id) => {
  try {
    const response = await apiFetch(`/api/algo-targets/celebration/${id}/ack`, {
      method: 'POST'
    });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.error('Error acknowledging celebration:', error);
    return false;
  }
};

export const simulateTargetHit = async (ticker, timeframe = 'Quarterly') => {
  try {
    const response = await apiFetch('/api/algo-targets/simulate-hit', {
      method: 'POST',
      body: JSON.stringify({ ticker, timeframe })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};
