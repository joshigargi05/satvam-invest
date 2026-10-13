import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';

const Search = Lucide.Search || (() => '🔍');
const Filter = Lucide.Filter || (() => '🔍');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const Sparkles = Lucide.Sparkles || (() => '✨');
const Zap = Lucide.Zap || (() => '⚡');

import { getQuotes } from '../services/api';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';

const defaultStocksUS = [
  // Equities
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', assetType: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', assetType: 'stock' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce / Tech', assetType: 'stock' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive / Tech', assetType: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. (Class A)', sector: 'Technology', assetType: 'stock' },
  { ticker: 'GOOG', name: 'Alphabet Inc. (Class C)', sector: 'Technology', assetType: 'stock' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Technology', assetType: 'stock' },
  { ticker: 'MU', name: 'Micron Technology', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financial', assetType: 'stock' },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Software', assetType: 'stock' },
  
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
  // Equities
  { ticker: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy/Conglomerate', assetType: 'stock' },
  { ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', assetType: 'stock' },
  { ticker: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', assetType: 'stock' },
  { ticker: 'SBIN', name: 'State Bank of India', sector: 'Banking', assetType: 'stock' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecommunications', assetType: 'stock' },
  { ticker: 'ITC', name: 'ITC Limited', sector: 'Consumer Goods', assetType: 'stock' },
  { ticker: 'LT', name: 'Larsen & Toubro', sector: 'Engineering', assetType: 'stock' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automotive', assetType: 'stock' },
  { ticker: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', assetType: 'stock' },
  
  // Commodities & Metals
  { ticker: 'GOLDBEES', name: 'Nippon India Gold ETF', sector: 'Precious Metals', assetType: 'commodity', unit: 'units' },
  { ticker: 'SILVERBEES', name: 'Nippon India Silver ETF', sector: 'Precious Metals', assetType: 'commodity', unit: 'units' },
  { ticker: 'CRUDEOIL', name: 'MCX Crude Oil', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'bbl' },
  { ticker: 'NATGAS', name: 'MCX Natural Gas', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'mmbtu' },
  { ticker: 'COPPER', name: 'MCX Copper', sector: 'Industrial Metals', assetType: 'commodity', unit: 'kg' }
];

export default function Markets() {
  const navigate = useNavigate();
  const { buyAsset } = usePortfolio();
  const { market, currency, getCurrency } = useMarket();
  const currentStocksList = market === 'US' ? defaultStocksUS : defaultStocksIndia;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('ALL'); // ALL, STOCKS, COMMODITIES
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Unified asset catalog with market tagging
  const allAvailableStocks = React.useMemo(() => {
    const list = currentStocksList.map(s => ({ ...s, isOtherMarket: false }));
    const otherList = market === 'US' ? defaultStocksIndia : defaultStocksUS;
    otherList.forEach(s => {
      if (!list.some(existing => existing.ticker === s.ticker)) {
        list.push({ ...s, isOtherMarket: true });
      }
    });
    return list;
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
    const symbols = allAvailableStocks.map(s => s.ticker).join(',');
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

  const handleBuy = (asset) => {
    if (asset.currentPrice > 0) {
      const unitPrompt = asset.unit ? ` (${asset.unit})` : ' shares';
      const inputUnits = prompt(`How many units${unitPrompt} of ${asset.name} (${asset.ticker}) would you like to buy?`, "1");
      if (inputUnits && !isNaN(inputUnits) && Number(inputUnits) > 0) {
        const units = Number(inputUnits);
        const success = buyAsset({
          ticker: asset.ticker,
          name: asset.name,
          price: asset.currentPrice,
          units: units,
          category: asset.sector,
          assetType: asset.assetType
        });
        if (success) {
          alert(`Successfully purchased ${units} unit(s) of ${asset.ticker}! Check your Portfolio dashboard.`);
        }
      }
    } else {
      alert("Cannot buy asset: Real-time price currently updating.");
    }
  };

  const filteredStocks = stocks.filter(item => {
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
          <div style={{ position: 'relative', flex: 1, width: '100%', minWidth: '240px' }}>
            <Search 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} 
              className="text-muted" 
              size={18} 
            />
            <input 
              type="text" 
              placeholder="Search stocks, gold, oil..." 
              className="chat-input w-full"
              style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{ padding: '0.75rem' }} onClick={fetchLiveData}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Asset Segment Switcher */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setSelectedTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Assets ({stocks.length})
        </button>
        <button
          onClick={() => setSelectedTab('COMMODITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedTab === 'COMMODITIES'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Precious Metals & Commodities (Gold, Silver, Oil)
        </button>
        <button
          onClick={() => setSelectedTab('STOCKS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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

      {/* Asset Catalog Table */}
      <div className="glass-panel overflow-x-auto rounded-xl">
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
                <td className="p-4 font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{
                    background: stock.assetType === 'commodity' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: stock.assetType === 'commodity' ? '#fbbf24' : '#60a5fa'
                  }}>
                    {stock.ticker.substring(0, 2)}
                  </div>
                  <span>{stock.ticker}</span>
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
                  <button 
                    className="btn btn-primary py-1.5 px-4 text-xs font-bold" 
                    onClick={() => handleBuy(stock)}
                  >
                    Buy {stock.assetType === 'commodity' ? 'Commodity' : 'Stock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
