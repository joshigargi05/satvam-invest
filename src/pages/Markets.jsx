import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';

const Search = Lucide.Search || (() => '🔍');
const Filter = Lucide.Filter || (() => '🔍');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const Sparkles = Lucide.Sparkles || (() => '✨');
const Zap = Lucide.Zap || (() => '⚡');

import { getQuotes, searchGlobalMarkets } from '../services/api';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';
import { CrossMarketPromptModal } from '../components/TradeModals';

const defaultStocksUS = [
  // Top 50+ US Equities (S&P 500 & NASDAQ-100)
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors / AI', assetType: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. (Class A)', sector: 'Technology / AI', assetType: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Cloud / Software', assetType: 'stock' },
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Technology', assetType: 'stock' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce / Cloud', assetType: 'stock' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Social Media / AI', assetType: 'stock' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors / AI', assetType: 'stock' },
  { ticker: 'MU', name: 'Micron Technology', sector: 'Semiconductors / Memory', assetType: 'stock' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Biopharma / Healthcare', assetType: 'stock' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive / AI', assetType: 'stock' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'PLTR', name: 'Palantir Technologies', sector: 'Enterprise AI', assetType: 'stock' },
  { ticker: 'ORCL', name: 'Oracle Corp.', sector: 'Cloud / Database', assetType: 'stock' },
  { ticker: 'NOW', name: 'ServiceNow Inc.', sector: 'Enterprise Workflow AI', assetType: 'stock' },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings', sector: 'Cybersecurity', assetType: 'stock' },
  { ticker: 'PANW', name: 'Palo Alto Networks', sector: 'Cybersecurity', assetType: 'stock' },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Streaming Media', assetType: 'stock' },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Enterprise Software', assetType: 'stock' },
  { ticker: 'ADBE', name: 'Adobe Inc.', sector: 'Creative Software', assetType: 'stock' },
  { ticker: 'COST', name: 'Costco Wholesale', sector: 'Consumer Retail', assetType: 'stock' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Retail', assetType: 'stock' },
  { ticker: 'HD', name: 'Home Depot', sector: 'Home Improvement', assetType: 'stock' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Banking / Financials', assetType: 'stock' },
  { ticker: 'GS', name: 'Goldman Sachs', sector: 'Investment Banking', assetType: 'stock' },
  { ticker: 'MS', name: 'Morgan Stanley', sector: 'Investment Banking', assetType: 'stock' },
  { ticker: 'BLK', name: 'BlackRock Inc.', sector: 'Asset Management', assetType: 'stock' },
  { ticker: 'BAC', name: 'Bank of America', sector: 'Banking / Financials', assetType: 'stock' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Payments / FinTech', assetType: 'stock' },
  { ticker: 'MA', name: 'Mastercard Inc.', sector: 'Payments / FinTech', assetType: 'stock' },
  { ticker: 'AXP', name: 'American Express', sector: 'Consumer Finance', assetType: 'stock' },
  { ticker: 'PYPL', name: 'PayPal Holdings', sector: 'Digital Payments', assetType: 'stock' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', assetType: 'stock' },
  { ticker: 'ISRG', name: 'Intuitive Surgical', sector: 'Medical Robotics', assetType: 'stock' },
  { ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Biotechnology', assetType: 'stock' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', assetType: 'stock' },
  { ticker: 'MRK', name: 'Merck & Co.', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Life Sciences', assetType: 'stock' },
  { ticker: 'AMAT', name: 'Applied Materials', sector: 'Semiconductor Equip', assetType: 'stock' },
  { ticker: 'LRCX', name: 'Lam Research', sector: 'Semiconductor Equip', assetType: 'stock' },
  { ticker: 'QCOM', name: 'Qualcomm Inc.', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'TXN', name: 'Texas Instruments', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'IBM', name: 'IBM Corp.', sector: 'Enterprise Cloud / AI', assetType: 'stock' },
  { ticker: 'CSCO', name: 'Cisco Systems', sector: 'Networking', assetType: 'stock' },
  { ticker: 'GE', name: 'GE Aerospace', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'RTX', name: 'RTX Corp.', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'LMT', name: 'Lockheed Martin', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Heavy Industrials', assetType: 'stock' },
  { ticker: 'XOM', name: 'Exxon Mobil', sector: 'Energy / Oil & Gas', assetType: 'stock' },
  { ticker: 'CVX', name: 'Chevron Corp.', sector: 'Energy / Oil & Gas', assetType: 'stock' },
  { ticker: 'UBER', name: 'Uber Technologies', sector: 'Mobility / Tech', assetType: 'stock' },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', assetType: 'stock' },
  { ticker: 'KO', name: 'Coca-Cola Co.', sector: 'Beverages', assetType: 'stock' },
  { ticker: 'PEP', name: 'PepsiCo Inc.', sector: 'Beverages & Snacks', assetType: 'stock' },
  { ticker: 'MCD', name: 'McDonald\'s Corp.', sector: 'Restaurants', assetType: 'stock' },
  { ticker: 'DIS', name: 'Walt Disney Co.', sector: 'Entertainment', assetType: 'stock' },

  // Commodities & Precious Metals
  { ticker: 'GC=F', name: 'Gold Futures', sector: 'Precious Metals', assetType: 'commodity', unit: 'oz' },
  { ticker: 'GLD', name: 'SPDR Gold Trust', sector: 'Precious Metals', assetType: 'commodity', unit: 'shares' },
  { ticker: 'SI=F', name: 'Silver Futures', sector: 'Precious Metals', assetType: 'commodity', unit: 'oz' },
  { ticker: 'SLV', name: 'iShares Silver Trust', sector: 'Precious Metals', assetType: 'commodity', unit: 'shares' },
  { ticker: 'CL=F', name: 'WTI Crude Oil', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'bbl' },
  { ticker: 'BZ=F', name: 'Brent Crude Oil', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'bbl' },
  { ticker: 'USO', name: 'United States Oil Fund', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'shares' },
  { ticker: 'HG=F', name: 'Copper Futures', sector: 'Industrial Metals', assetType: 'commodity', unit: 'lbs' },
  { ticker: 'PL=F', name: 'Platinum Futures', sector: 'Precious Metals', assetType: 'commodity', unit: 'oz' },
  { ticker: 'NG=F', name: 'Natural Gas Futures', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'MMBtu' }
];

const defaultStocksIndia = [
  // All 52 Indian NSE / Nifty 50 Constituents
  { ticker: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy / Conglomerate', assetType: 'stock' },
  { ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom / 5G', assetType: 'stock' },
  { ticker: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'SBIN', name: 'State Bank of India', sector: 'PSU Banking', assetType: 'stock' },
  { ticker: 'LT', name: 'Larsen & Toubro', sector: 'Engineering & Infra', assetType: 'stock' },
  { ticker: 'ITC', name: 'ITC Limited', sector: 'FMCG / Consumer', assetType: 'stock' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG / Consumer', assetType: 'stock' },
  { ticker: 'HAL', name: 'Hindustan Aeronautics', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'BEL', name: 'Bharat Electronics', sector: 'Defense Electronics', assetType: 'stock' },
  { ticker: 'TRENT', name: 'Trent Ltd.', sector: 'Retail & Fashion', assetType: 'stock' },
  { ticker: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automotive / SUVs', assetType: 'stock' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automotive / EV', assetType: 'stock' },
  { ticker: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Automotive', assetType: 'stock' },
  { ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Two-Wheelers / EV', assetType: 'stock' },
  { ticker: 'EICHERMOT', name: 'Eicher Motors', sector: 'Motorcycles / CV', assetType: 'stock' },
  { ticker: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Two-Wheelers', assetType: 'stock' },
  { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'CIPLA', name: 'Cipla Ltd.', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'DRREDDY', name: 'Dr. Reddy\'s Labs', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'DIVISLAB', name: 'Divi\'s Laboratories', sector: 'Pharma APIs', assetType: 'stock' },
  { ticker: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', assetType: 'stock' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Consumer NBFC', assetType: 'stock' },
  { ticker: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Financial Services', assetType: 'stock' },
  { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'AXISBANK', name: 'Axis Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'SHRIRAMFIN', name: 'Shriram Finance', sector: 'Commercial NBFC', assetType: 'stock' },
  { ticker: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Life Insurance', assetType: 'stock' },
  { ticker: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Life Insurance', assetType: 'stock' },
  { ticker: 'HCLTECH', name: 'HCL Technologies', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'TECHM', name: 'Tech Mahindra', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'WIPRO', name: 'Wipro Ltd.', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'NTPC', name: 'NTPC Ltd.', sector: 'Power Utilities', assetType: 'stock' },
  { ticker: 'POWERGRID', name: 'Power Grid Corp.', sector: 'Power Transmission', assetType: 'stock' },
  { ticker: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy Upstream', assetType: 'stock' },
  { ticker: 'COALINDIA', name: 'Coal India', sector: 'Mining & Energy', assetType: 'stock' },
  { ticker: 'BPCL', name: 'Bharat Petroleum', sector: 'Oil Refining', assetType: 'stock' },
  { ticker: 'TITAN', name: 'Titan Company', sector: 'Luxury & Jewellery', assetType: 'stock' },
  { ticker: 'ADANIENT', name: 'Adani Enterprises', sector: 'Infra & Incubator', assetType: 'stock' },
  { ticker: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Ports & Logistics', assetType: 'stock' },
  { ticker: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', assetType: 'stock' },
  { ticker: 'GRASIM', name: 'Grasim Industries', sector: 'Diversified Materials', assetType: 'stock' },
  { ticker: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals & Steel', assetType: 'stock' },
  { ticker: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals & Steel', assetType: 'stock' },
  { ticker: 'HINDALCO', name: 'Hindalco Industries', sector: 'Aluminium & Copper', assetType: 'stock' },
  { ticker: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG Food', assetType: 'stock' },
  { ticker: 'BRITANNIA', name: 'Britannia Industries', sector: 'Packaged Foods', assetType: 'stock' },
  { ticker: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'Beverages & Foods', assetType: 'stock' },
  { ticker: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer Paints', assetType: 'stock' },

  // Commodities & Metals
  { ticker: 'GOLDBEES', name: 'Nippon India Gold ETF', sector: 'Precious Metals', assetType: 'commodity', unit: 'units' },
  { ticker: 'SILVERBEES', name: 'Nippon India Silver ETF', sector: 'Precious Metals', assetType: 'commodity', unit: 'units' },
  { ticker: 'CRUDEOIL', name: 'MCX Crude Oil', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'bbl' },
  { ticker: 'NATGAS', name: 'MCX Natural Gas', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'mmbtu' },
  { ticker: 'COPPER', name: 'MCX Copper', sector: 'Industrial Metals', assetType: 'commodity', unit: 'kg' }
];

export default function Markets() {
  const navigate = useNavigate();
  const { buyAsset, balance, showTradeAlert } = usePortfolio();
  const { market, setMarket, currency, getCurrency } = useMarket();
  const currentStocksList = market === 'US' ? defaultStocksUS : defaultStocksIndia;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('ALL'); // ALL, STOCKS, COMMODITIES
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyModalAsset, setBuyModalAsset] = useState(null);
  const [buyUnits, setBuyUnits] = useState('1');
  const [buyExitMode, setBuyExitMode] = useState('none'); // Default: 'none' (Manual Sell); secondary: 'percentage' | 'price'
  const [buyExitPct, setBuyExitPct] = useState('10');
  const [buyExitPrice, setBuyExitPrice] = useState('');
  const [marketToast, setMarketToast] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [crossMarketPrompt, setCrossMarketPrompt] = useState({ isOpen: false, asset: null, currentMarket: market });
  const tableRef = useRef(null);

  // Auto-scroll to results table whenever a search term is entered
  useEffect(() => {
    if (searchTerm.trim().length > 0 && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchTerm]);

  // Universal Live Search across all BSE, NSE, NYSE & NASDAQ stocks
  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setGlobalSearchResults([]);
      setSearchingGlobal(false);
      return;
    }

    setSearchingGlobal(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchGlobalMarkets(term, market);
        // Exclude symbols that already exist in our local catalog to avoid duplicates
        const existingTickers = new Set(stocks.map(s => s.ticker.toUpperCase()));
        const uniqueGlobal = results.filter(r => !existingTickers.has(r.ticker.toUpperCase()));
        setGlobalSearchResults(uniqueGlobal);
      } catch (err) {
        console.error('Error fetching global market search results:', err);
      } finally {
        setSearchingGlobal(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, market, stocks]);

  // Unified asset catalog with market tagging
  const allAvailableStocks = React.useMemo(() => {
    return currentStocksList.map(s => ({
      ...s,
      isOtherMarket: false,
      market
    }));
  }, [market, currentStocksList]);

  // Initialize stocks based on catalog
  useEffect(() => {
    setStocks(allAvailableStocks.map(s => ({
      ...s, 
      price: '...', 
      change: '...', 
      up: true, 
      rawChange: 0, 
      currentPrice: 0
    })));
  }, [allAvailableStocks]);

  const fetchLiveData = async () => {
    setLoading(true);
    const targetPool = searchTerm.trim() !== ''
      ? allAvailableStocks
      : allAvailableStocks.filter(s => !s.isOtherMarket);
    const symbols = targetPool.map(s => s.ticker).join(',');
    const quotes = await getQuotes(symbols);
    
    const updatedStocks = allAvailableStocks.map(stock => {
      const data = quotes[stock.ticker];
      const stockCurrency = getCurrency(stock.ticker);
      if (data && typeof data.price === 'number') {
        const up = data.changePct >= 0;
        return {
          ...stock,
          price: `${stockCurrency}${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: `${up ? '+' : ''}${data.changePct.toFixed(2)}%`,
          up,
          rawChange: data.changePct,
          currentPrice: data.price
        };
      }
      return { ...stock, price: 'Checking...', change: '-', up: true, rawChange: 0, currentPrice: 100 };
    });
    
    setStocks(updatedStocks);
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 3000);
    return () => clearInterval(interval);
  }, [allAvailableStocks]);

  // Cross-market asset detection: check if global search returned an asset native to the OTHER market
  const crossMarketAsset = React.useMemo(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return null;
    return globalSearchResults.find(s => s.market && s.market !== market) || null;
  }, [globalSearchResults, searchTerm, market]);

  const handleBuy = (asset) => {
    if (asset.market && asset.market !== market) {
      setCrossMarketPrompt({ isOpen: true, asset, currentMarket: market });
      return;
    }
    if (asset.currentPrice > 0) {
      setBuyModalAsset(asset);
      setBuyUnits('1');
      setBuyExitMode('none');
      setBuyExitPct('10');
      setBuyExitPrice((asset.currentPrice * 1.10).toFixed(2));
    } else {
      if (showTradeAlert) {
        showTradeAlert({
          title: 'Real-Time Price Updating',
          message: 'Please wait a moment while the live market quote for this asset is retrieved.'
        });
      } else {
        alert("Cannot buy asset: Real-time price currently updating.");
      }
    }
  };

  const handleSwitchAndBuy = (targetMarket, asset) => {
    setCrossMarketPrompt({ isOpen: false, asset: null, currentMarket: targetMarket });
    setMarket(targetMarket);
    setTimeout(() => {
      setBuyModalAsset(asset);
      setBuyUnits('1');
      setBuyExitMode('none');
      setBuyExitPct('10');
      setBuyExitPrice((asset.currentPrice * 1.10).toFixed(2));
    }, 150);
  };

  const handleConfirmMarketBuy = (e) => {
    e.preventDefault();
    if (!buyModalAsset) return;
    const units = Number(buyUnits);
    if (isNaN(units) || units <= 0) {
      if (showTradeAlert) {
        showTradeAlert({
          title: 'Invalid Units',
          message: 'Please enter a valid number of units to purchase.'
        });
      } else {
        alert("Please enter a valid number of units.");
      }
      return;
    }

    let autoExitRule = null;
    if (buyExitMode === 'percentage') {
      const pctVal = Number(buyExitPct);
      if (!isNaN(pctVal) && pctVal > -99) {
        autoExitRule = { enabled: true, mode: 'percentage', targetProfitPct: pctVal };
      }
    } else if (buyExitMode === 'price') {
      const priceVal = Number(buyExitPrice);
      if (isNaN(priceVal) || priceVal <= 0) {
        if (showTradeAlert) {
          showTradeAlert({
            title: 'Invalid Target Price',
            message: 'Please enter a valid target exit price.'
          });
        } else {
          alert("Please enter a valid target exit price.");
        }
        return;
      }
      autoExitRule = { enabled: true, mode: 'price', targetPrice: priceVal };
    }

    const success = buyAsset({
      ticker: buyModalAsset.ticker,
      name: buyModalAsset.name,
      price: buyModalAsset.currentPrice,
      units,
      category: buyModalAsset.sector,
      assetType: buyModalAsset.assetType,
      market: buyModalAsset.market || market,
      bucket: 'core',
      autoExit: autoExitRule
    });

    if (success) {
      setBuyModalAsset(null);
    }
  };

  const filteredStocks = React.useMemo(() => {
    const localMatches = stocks.filter(item => {
      // If not searching, only show assets native to the selected market tab
      if (!searchTerm.trim() && item.isOtherMarket) return false;

      const matchesSearch = item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.sector.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedTab === 'STOCKS') return item.assetType === 'stock';
      if (selectedTab === 'COMMODITIES') return item.assetType === 'commodity';
      return true;
    });

    if (!searchTerm.trim()) {
      return localMatches;
    }

    // When searching, append the live global search results from BSE/NSE/NYSE/NASDAQ
    const globalMatches = globalSearchResults.filter(item => {
      if (selectedTab === 'COMMODITIES') return item.assetType === 'commodity';
      return true;
    });

    return [...localMatches, ...globalMatches];
  }, [stocks, searchTerm, selectedTab, globalSearchResults]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Banner linking to Global Agent */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Zap size={22} />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Autonomous World Radar & Portfolio Auto-Shuffle</h4>
            <p className="text-xs text-slate-300">
              Middle East / Iran War threats & AI supercycle recommendations: 40% Chips, 30% Gold, 20% Oil, 10% E-Commerce.
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/macro-agent')}
          className="btn btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-500/20"
        >
          <Sparkles size={14} /> Open Global Agent
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-gradient text-3xl font-bold">{market === 'US' ? 'US Markets & Commodities' : 'Indian Markets & MCX'}</h1>
          <p className="text-muted text-sm">Trade equities, precious metals (Gold, Silver), and energy commodities (Crude Oil, Gas).</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div style={{ position: 'relative', flex: 1, width: '100%', minWidth: 0 }}>
            <Search 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} 
              className="text-muted" 
              size={18} 
            />
            <input 
              type="text" 
              placeholder="Search all Indian (BSE/NSE) & US (NYSE/NASDAQ) stocks, gold, oil..." 
              className="chat-input w-full"
              style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.85rem', paddingBottom: '0.85rem', minHeight: '50px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tableRef.current) {
                  tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          </div>
          <button className="btn btn-outline shrink-0" style={{ padding: '0.75rem' }} onClick={fetchLiveData}>
            <RefreshCw size={18} className={loading || searchingGlobal ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Asset Segment Switcher */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Assets ({stocks.length})
        </button>
        <button
          onClick={() => setSelectedTab('COMMODITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedTab === 'COMMODITIES'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Precious Metals & Commodities (Gold, Silver, Oil)
        </button>
        <button
          onClick={() => setSelectedTab('STOCKS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedTab === 'STOCKS'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Equities & Tech Stocks
        </button>
      </div>

      {/* Top Movers */}
      <div className="glass-panel card mb-8">
        <h3 className="mb-3 text-base font-bold">Top Movers & Commodities</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stocks.filter(s => s.currentPrice > 0).sort((a, b) => b.rawChange - a.rawChange).slice(0, 4).map((stock, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-white/5 bg-slate-900/60">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="font-bold text-white text-sm">{stock.ticker}</span>
                  <span className="text-[11px] text-muted block truncate max-w-[110px]">{stock.name}</span>
                </div>
                <span style={{ color: stock.up ? 'var(--accent-primary)' : 'var(--accent-warning)', fontSize: '0.8rem' }} className="flex items-center font-bold">
                  {stock.up ? <TrendingUp size={12} className="mr-0.5"/> : <TrendingDown size={12} className="mr-0.5"/>}
                  {stock.change}
                </span>
              </div>
              <div className="text-lg font-bold text-white mt-2">{stock.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Market Notification Banner */}
      {crossMarketAsset && (
        <div className="p-4 mb-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/95 to-blue-950/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0 mt-0.5">
              {market === 'INDIA' ? '🇺🇸' : '🇮🇳'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {market === 'INDIA' ? 'US Exchange Stock Found' : 'Indian Exchange Stock Found'}
                </span>
                <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-500/40">
                  {crossMarketAsset.ticker} • {crossMarketAsset.exchange || (market === 'INDIA' ? 'NASDAQ' : 'NSE')}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {crossMarketAsset.currency} {crossMarketAsset.price}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {market === 'INDIA'
                  ? `You are currently browsing the Indian Market (₹ INR). To trade US stocks like ${crossMarketAsset.ticker} in USD ($), please switch to US Stocks.`
                  : `You are currently browsing the US Market ($ USD). To trade Indian equities like ${crossMarketAsset.ticker} in INR (₹), please switch to Indian Stocks.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMarket(market === 'INDIA' ? 'US' : 'INDIA');
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 shrink-0 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Switch to {market === 'INDIA' ? 'US Stocks (🇺🇸 USD)' : 'Indian Stocks (🇮🇳 ₹ INR)'}</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Asset Catalog Table */}
      <div ref={tableRef} className="glass-panel overflow-x-auto rounded-xl scroll-mt-24">
        {searchTerm.trim() && (
          <div className="p-3 px-4 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs text-blue-300 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                🔍 Showing {filteredStocks.length} result{filteredStocks.length === 1 ? '' : 's'} across <strong>BSE, NSE, NYSE &amp; NASDAQ</strong> for <strong>&quot;{searchTerm}&quot;</strong>
              </span>
              {searchingGlobal && (
                <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <RefreshCw size={11} className="animate-spin" />
                  <span>Searching Global Exchanges...</span>
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setGlobalSearchResults([]);
              }}
              className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th className="p-4 text-muted font-normal text-xs uppercase tracking-wider">Asset</th>
              <th className="p-4 text-muted font-normal text-xs uppercase tracking-wider">Name</th>
              <th className="p-4 text-muted font-normal text-xs uppercase tracking-wider">Category</th>
              <th className="p-4 text-muted font-normal text-xs uppercase tracking-wider">Live Price</th>
              <th className="p-4 text-muted font-normal text-xs uppercase tracking-wider">24h Change</th>
              <th className="p-4 text-muted font-normal text-xs uppercase tracking-wider text-right">Instant Trade</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-white/5 text-sm">
                <td className="p-4 font-bold flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{
                    background: stock.assetType === 'commodity' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: stock.assetType === 'commodity' ? '#fbbf24' : '#60a5fa'
                  }}>
                    {stock.ticker.substring(0, 2)}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-bold">{stock.ticker}</span>
                    {stock.exchange && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold border ${
                        stock.exchange === 'NSE' || stock.exchange === 'BSE'
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {stock.exchange}
                      </span>
                    )}
                    {stock.isGlobalSearch && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Live Global
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-slate-300 font-medium">
                  {stock.name}
                  {stock.unit && <span className="text-xs text-muted block font-normal">per {stock.unit}</span>}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    stock.assetType === 'commodity' 
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                      : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                  }`}>
                    {stock.sector}
                  </span>
                </td>
                <td className="p-4 font-bold text-white font-mono">{stock.price}</td>
                <td className="p-4">
                  <span style={{ color: stock.up ? 'var(--accent-primary)' : 'var(--accent-warning)' }} className="flex items-center font-bold">
                    {stock.up ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                    {stock.change}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {stock.market && stock.market !== market ? (
                    <button 
                      className="btn py-1.5 px-3 text-xs font-bold border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all active:scale-95" 
                      onClick={() => handleBuy(stock)}
                      title={`This is a ${stock.market === 'INDIA' ? 'Indian (₹)' : 'US ($)'} stock. Click to switch market & buy.`}
                    >
                      Switch &amp; Buy
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary py-1.5 px-4 text-xs font-bold" 
                      onClick={() => handleBuy(stock)}
                    >
                      Buy {stock.assetType === 'commodity' ? 'Commodity' : 'Stock'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {marketToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <span>✅ {marketToast}</span>
          <button onClick={() => setMarketToast('')} className="text-slate-400 hover:text-white underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Buy Asset + Auto-Exit Configuration Modal */}
      {buyModalAsset && (() => {
        const assetCurr = buyModalAsset.currency || getCurrency(buyModalAsset.ticker);
        const livePrice = Number(buyModalAsset.currentPrice || 100);
        const qty = Number(buyUnits || 1);
        const totalOrderCost = Number((livePrice * qty).toFixed(2));
        const previewExitPrice = buyExitMode === 'percentage'
          ? Number((livePrice * (1 + (Number(buyExitPct) || 0) / 100)).toFixed(2))
          : (buyExitMode === 'price' ? Number(buyExitPrice || 0) : null);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="glass-panel p-4 sm:p-6 rounded-2xl max-w-md w-full border border-blue-500/40 shadow-2xl bg-slate-900/95 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Instant Order + Auto-Exit
                    </span>
                    {buyModalAsset.exchange && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                        {buyModalAsset.exchange}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Buy {buyModalAsset.ticker} — {buyModalAsset.name}
                  </h3>
                  <p className="text-xs text-slate-400">{buyModalAsset.sector}</p>
                </div>
                <button
                  onClick={() => setBuyModalAsset(null)}
                  className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmMarketBuy} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">Live Market Price</span>
                    <span className="text-lg font-bold text-white font-mono">
                      {assetCurr}{livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Available Cash</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {currency}{Number(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Number of {buyModalAsset.unit ? `Units (${buyModalAsset.unit})` : 'Shares'} to Buy
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={buyUnits}
                      onChange={(e) => setBuyUnits(e.target.value)}
                      className="chat-input w-full font-mono text-base py-2 px-3"
                      required
                    />
                    {[1, 5, 10, 25].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBuyUnits(String(preset))}
                        className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-white/10"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exit Strategy: Manual Sell (Default) vs Optional Auto-Exit */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Exit Strategy <span className="text-[10px] text-slate-400 font-normal">(Manual Sell is Default • Auto-Exit Optional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setBuyExitMode('none')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        buyExitMode === 'none'
                          ? 'bg-slate-800 border-white/40 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">Manual Sell</div>
                      <div className="text-[10px] text-slate-400">Default exit</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyExitMode('percentage')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        buyExitMode === 'percentage'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-300">Auto: % Profit</div>
                      <div className="text-[10px] text-slate-400">e.g. +10%</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBuyExitMode('price');
                        if (!buyExitPrice) setBuyExitPrice((livePrice * 1.10).toFixed(2));
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        buyExitMode === 'price'
                          ? 'bg-blue-500/20 border-blue-500/60 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-blue-300">Auto: Price</div>
                      <div className="text-[10px] text-slate-400">Define {assetCurr}</div>
                    </button>
                  </div>

                  {buyExitMode === 'percentage' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={buyExitPct}
                          onChange={(e) => setBuyExitPct(e.target.value)}
                          className="chat-input w-full font-mono text-sm py-1.5 px-3"
                          placeholder="10"
                          required
                        />
                        {[5, 10, 15, 20].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setBuyExitPct(String(p))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                              Number(buyExitPct) === p
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                                : 'bg-slate-800 text-slate-300 border-white/10'
                            }`}
                          >
                            +{p}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {buyExitMode === 'price' && (
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={buyExitPrice}
                      onChange={(e) => setBuyExitPrice(e.target.value)}
                      className="chat-input w-full font-mono text-sm py-1.5 px-3"
                      placeholder={(livePrice * 1.10).toFixed(2)}
                      required
                    />
                  )}
                </div>

                {/* Order Total & Auto-Exit Preview */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-300 font-medium">Estimated Order Total</span>
                    <span className="text-base font-black text-white font-mono">
                      {assetCurr}{totalOrderCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {previewExitPrice && previewExitPrice > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/10">
                      <span className="text-emerald-300 font-medium">🎯 Auto-Sell Trigger Price</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {assetCurr}{previewExitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBuyModalAsset(null)}
                    className="btn btn-outline flex-1 py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 py-2.5 text-xs font-bold shadow-lg shadow-emerald-500/20"
                    style={{ background: 'linear-gradient(135deg, #10b981, #2563eb)' }}
                  >
                    Confirm Buy Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Cross-Market Purchase Prompt Modal */}
      <CrossMarketPromptModal
        promptState={crossMarketPrompt}
        onClose={() => setCrossMarketPrompt({ isOpen: false, asset: null, currentMarket: market })}
        onSwitchAndBuy={handleSwitchAndBuy}
      />

    </div>
  );
}
