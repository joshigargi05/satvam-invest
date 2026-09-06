import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';

const Search = Lucide.Search || (() => '🔍');
const Filter = Lucide.Filter || (() => '🔍');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
import { getQuotes } from '../services/api';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';

const defaultStocksUS = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce / Tech' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive / Tech' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Technology' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { ticker: 'UBER', name: 'Uber Technologies', sector: 'Technology' },
  { ticker: 'MU', name: 'Micron Technology', sector: 'Semiconductors' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors' },
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Semiconductors' },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment / Tech' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financial' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financial' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Retail' },
  { ticker: 'DIS', name: 'Walt Disney Co.', sector: 'Entertainment' },
  { ticker: 'PYPL', name: 'PayPal Holdings', sector: 'Financial Tech' },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Software' }
];

const defaultStocksIndia = [
  { ticker: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy/Conglomerate' },
  { ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
  { ticker: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking' },
  { ticker: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecommunications' },
  { ticker: 'ITC', name: 'ITC Limited', sector: 'Consumer Goods' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'Consumer Goods' },
  { ticker: 'LT', name: 'Larsen & Toubro', sector: 'Engineering' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financial Services' },
  { ticker: 'HCLTECH', name: 'HCL Technologies', sector: 'IT Services' },
  { ticker: 'AXISBANK', name: 'Axis Bank', sector: 'Banking' },
  { ticker: 'MARUTI', name: 'Maruti Suzuki', sector: 'Automotive' },
  { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharmaceuticals' },
  { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automotive' },
  { ticker: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy' }
];

export default function Markets() {
  const { buyStock } = usePortfolio();
  const { market, currency } = useMarket();
  const currentStocksList = market === 'US' ? defaultStocksUS : defaultStocksIndia;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize stocks based on market
  useEffect(() => {
    setStocks(currentStocksList.map(s => ({...s, price: '...', change: '...', up: true, rawChange: 0, currentPrice: 0})));
  }, [market, currentStocksList]);

  const fetchLiveData = async () => {
    setLoading(true);
    const symbols = currentStocksList.map(s => s.ticker).join(',');
    const quotes = await getQuotes(symbols);
    
    const updatedStocks = currentStocksList.map(stock => {
      const data = quotes[stock.ticker];
      if (data && data.price) {
        const up = data.changePct >= 0;
        return {
          ...stock,
          price: `${currency}${data.price.toFixed(2)}`,
          change: `${up ? '+' : ''}${data.changePct.toFixed(2)}%`,
          up,
          rawChange: data.changePct,
          currentPrice: data.price
        };
      }
      return { ...stock, price: 'Error', change: '-', up: true, rawChange: 0, currentPrice: 0 };
    });
    
    setStocks(updatedStocks);
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 2000); // refresh every 2 seconds
    return () => clearInterval(interval);
  }, [market, currency, currentStocksList]);

  const handleBuy = (stock) => {
    if (stock.currentPrice > 0) {
      const shares = prompt(`How many shares of ${stock.ticker} would you like to buy?`, "1");
      if (shares && !isNaN(shares) && Number(shares) > 0) {
        buyStock(stock.ticker, stock.name, stock.currentPrice, Number(shares));
      }
    } else {
      alert("Cannot buy stock: Real-time price not available.");
    }
  };

  const filteredStocks = stocks.filter(stock => 
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-gradient">{market === 'US' ? 'US Markets' : 'Indian Markets'}</h1>
          <p className="text-muted">Explore and research top performing {market === 'US' ? 'US' : 'Indian'} stocks.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div style={{ position: 'relative', flex: 1, width: '100%', minWidth: '250px' }}>
            <Search 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} 
              className="text-muted" 
              size={18} 
            />
            <input 
              type="text" 
              placeholder="Search stocks..." 
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

      <div className="glass-panel card mb-8">
        <h3 className="mb-4">Top Movers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stocks.filter(s => s.currentPrice > 0).sort((a, b) => b.rawChange - a.rawChange).slice(0, 4).map((stock, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold">{stock.ticker}</span>
                <span style={{ color: stock.up ? 'var(--accent-primary)' : 'var(--accent-warning)', fontSize: '0.875rem' }} className="flex items-center">
                  {stock.up ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                  {stock.change}
                </span>
              </div>
              <div className="text-xl font-bold">{stock.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3>All Stocks</h3>
        <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <Filter size={16} className="mr-2" /> Filter
        </button>
      </div>

      <div className="glass-panel overflow-x-auto rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th className="p-4 text-muted font-normal">Ticker</th>
              <th className="p-4 text-muted font-normal">Company</th>
              <th className="p-4 text-muted font-normal">Sector</th>
              <th className="p-4 text-muted font-normal">Price</th>
              <th className="p-4 text-muted font-normal">24h Change</th>
              <th className="p-4 text-muted font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                <td className="p-4 font-bold">{stock.ticker}</td>
                <td className="p-4 text-muted">{stock.name}</td>
                <td className="p-4"><span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>{stock.sector}</span></td>
                <td className="p-4 font-bold">{stock.price}</td>
                <td className="p-4">
                  <span style={{ color: stock.up ? 'var(--accent-primary)' : 'var(--accent-warning)' }} className="flex items-center">
                    {stock.up ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                    {stock.change}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.875rem' }} onClick={() => handleBuy(stock)}>
                    Trade
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
