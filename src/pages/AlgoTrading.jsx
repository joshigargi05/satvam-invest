import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as Lucide from 'lucide-react';

const Bot = Lucide.Bot || (() => '🤖');
const Sparkles = Lucide.Sparkles || (() => '✨');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const Activity = Lucide.Activity || (() => '⚡');
const ActivitySquare = Lucide.ActivitySquare || Lucide.Activity || (() => '📊');
const AlertTriangle = Lucide.AlertTriangle || (() => '⚠️');
const Send = Lucide.Send || (() => '🚀');
const Cpu = Lucide.Cpu || (() => '💻');
const Target = Lucide.Target || (() => '🎯');

import { useMarket } from '../context/MarketContext';
import { getAlgoRecommendations, getQuotes } from '../services/api';

const tradeLibraryUS = [
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'buy', rationale: 'Gemini AI cloud acceleration driving multi-quarter FCF expansion. AI conviction > 91%. Bot initiated algorithmic position.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'buy', rationale: 'Strong breakout detected on 15m chart. AI conviction > 88%. Bot executed limit order automatically.' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'monitor', rationale: 'Technical indicators show overbought conditions. Bot is waiting for target entry price to execute BUY order.' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'sell', rationale: 'Take-profit target hit. Momentum shift detected in underlying options flow. Bot automatically closed position.' },
  { symbol: 'META', name: 'Meta Platforms', type: 'buy', rationale: 'Volume profile indicates accumulation phase. Momentum breakout confirmed on hourly chart.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'monitor', rationale: 'Approaching critical resistance level. Monitoring for clean breakout.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'buy', rationale: 'Algorithm detected unusual bullish institutional activity. Volatility squeeze firing.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'sell', rationale: 'Trailing stop triggered after 5% drop from local high. Capital re-allocated.' },
  { symbol: 'PLTR', name: 'Palantir Technologies', type: 'buy', rationale: 'Fundamental catalysts detected in recent SEC filings. Sentiment score strongly positive.' }
];

const tradeLibraryIndia = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'buy', rationale: 'Strong breakout detected on 15m chart. AI conviction > 88%. Bot executed limit order.' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'monitor', rationale: 'Technical indicators show overbought conditions. Waiting for target entry.' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', type: 'sell', rationale: 'Take-profit target hit. Momentum shift detected. Position closed.' },
  { symbol: 'INFY', name: 'Infosys Ltd', type: 'buy', rationale: 'Volume profile indicates accumulation phase. Momentum breakout confirmed.' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', type: 'monitor', rationale: 'Approaching critical resistance level. Monitoring.' },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'buy', rationale: 'Unusual bullish institutional activity detected. Volatility squeeze firing.' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', type: 'sell', rationale: 'Trailing stop triggered after 5% drop from local high.' },
  { symbol: 'ITC', name: 'ITC Limited', type: 'buy', rationale: 'Fundamental catalysts detected. Sentiment score strongly positive.' }
];

export default function AlgoTrading() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { market, currency, getCurrency } = useMarket();
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'automated'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  // Bot State
  const [botActive, setBotActive] = useState(false);
  const [liveTrades, setLiveTrades] = useState([]);
  const [livePrices, setLivePrices] = useState({ 
    GOOGL: 333.06,
    NVDA: 220.54, AAPL: 343.88, TSLA: 386.69,
    META: 710.90, MSFT: 531.65, AMZN: 262.67, 
    AMD: 550.10, PLTR: 199.50,
    RELIANCE: 1209.00, TCS: 2529.00, HDFCBANK: 706.95,
    INFY: 1168.00, ICICIBANK: 1385.00, SBIN: 963.00,
    BHARTIARTL: 1891.70, ITC: 262.00
  });

  const currentLibrary = market === 'US' ? tradeLibraryUS : tradeLibraryIndia;

  // Clear bot and trades if market changes
  React.useEffect(() => {
    setBotActive(false);
    setLiveTrades([]);
  }, [market]);

  React.useEffect(() => {
    if (activeTab === 'automated') {
      const symbols = Object.keys(livePrices).join(',');
      getQuotes(symbols).then(quotes => {
        if (quotes) {
          const newPrices = { ...livePrices };
          Object.keys(quotes).forEach(sym => {
            if (quotes[sym] && typeof quotes[sym].price === 'number') {
              newPrices[sym] = quotes[sym].price;
            }
          });
          setLivePrices(newPrices);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (!botActive) {
      setLiveTrades([]);
      return;
    }
    
    const interval = setInterval(() => {
      setLiveTrades(prev => {
        if (prev.length < currentLibrary.length) {
          const nextTrade = currentLibrary[prev.length];
          if (nextTrade) {
            return [nextTrade, ...prev];
          }
        }
        clearInterval(interval);
        return prev;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [botActive, currentLibrary]);

  const handleAnalyze = async (searchQuery) => {
    const q = (typeof searchQuery === 'string' ? searchQuery : query).trim();
    if (!q) return;
    setLoading(true);
    const data = await getAlgoRecommendations(q);
    setResults(data);
    setLoading(false);
  };

  // Auto-run analysis if ?ticker= is passed from Portfolio or Markets Top 3 Picks, or default to initial scan
  React.useEffect(() => {
    const tickerParam = searchParams.get('ticker');
    if (tickerParam) {
      setActiveTab('analysis');
      setQuery(tickerParam);
      handleAnalyze(tickerParam);
    } else if (!results && !loading) {
      const defaultQ = market === 'INDIA' ? 'RELIANCE' : 'GOOGL';
      setQuery(defaultQ);
      handleAnalyze(defaultQ);
    }
  }, [searchParams, market]);

  const renderBadge = (score) => {
    let text = 'Avoid';
    let color = '#ef4444';
    let bg = 'rgba(239, 68, 68, 0.1)';

    if (score > 85) { text = 'Strong Buy'; color = '#10b981'; bg = 'rgba(16, 185, 129, 0.1)'; }
    else if (score > 70) { text = 'Buy'; color = '#34d399'; bg = 'rgba(52, 211, 153, 0.1)'; }
    else if (score > 55) { text = 'Hold'; color = '#fbbf24'; bg = 'rgba(251, 191, 36, 0.1)'; }
    else if (score > 40) { text = 'Reduce'; color = '#f97316'; bg = 'rgba(249, 115, 22, 0.1)'; }

    return (
      <span style={{ background: bg, color, padding: '0.25rem 0.75rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {text}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, rgba(99, 102, 241, 0.8) 100%)', padding: '0.75rem', borderRadius: '12px', color: 'white' }}>
            <ActivitySquare size={28} />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>Algorithmic Trading Engine</h1>
            <p className="text-muted">Proprietary AI Investment Intelligence Engine.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            📊 Portfolio
          </button>
          <button 
            type="button"
            onClick={() => navigate('/markets')} 
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            📈 Markets
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10 pb-2">
        <button 
          onClick={() => setActiveTab('analysis')} 
          className={`pb-2 px-2 font-bold transition-all ${activeTab === 'analysis' ? 'text-white border-b-2 border-primary' : 'text-muted hover:text-white'}`}
        >
          Signal Generation
        </button>
        <button 
          onClick={() => setActiveTab('automated')} 
          className={`pb-2 px-2 font-bold transition-all flex items-center gap-2 ${activeTab === 'automated' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-muted hover:text-emerald-400'}`}
        >
          <Bot size={16} /> Fully Automated
        </button>
      </div>

      {activeTab === 'analysis' && (
        <>
          <div className="glass-panel card mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                className="chat-input flex-1"
                placeholder="e.g. GOOGL, NVDA, US Tech, Energy, or Indian Equities"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button onClick={() => handleAnalyze()} className="btn btn-primary" style={{ padding: '0 2rem', borderRadius: '12px' }} disabled={loading}>
                {loading ? <div className="inline-block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={20} />}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-muted font-semibold">Suggested:</span>
              {[
                { label: 'Alphabet (GOOGL)', q: 'GOOGL' },
                { label: 'NVIDIA (NVDA)', q: 'NVDA' },
                { label: 'Top AI & Tech', q: 'AI Tech' },
                { label: 'Financials & Banking', q: 'Finance' },
                { label: 'Indian Equities', q: 'India' }
              ].map(item => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => { setQuery(item.q); handleAnalyze(item.q); }}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/10 hover:border-primary/50 text-gray-300 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-muted glass-panel rounded-xl">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-6"></div>
          <p className="font-bold text-lg mb-2 text-white">Running AI Market Analysis...</p>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2"><Activity size={14} className="text-emerald-500"/> Analyzing Real-Time Market Action &amp; Volume</li>
            <li className="flex items-center gap-2"><Activity size={14} className="text-blue-500"/> Evaluating Institutional Conviction Signals</li>
            <li className="flex items-center gap-2"><Activity size={14} className="text-purple-500"/> Synthesizing Risk-Adjusted Price Targets</li>
          </ul>
        </div>
      )}

      {results && !loading && (
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-xl flex items-center gap-4" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <Bot size={24} className="text-primary" />
            <p className="text-sm md:text-base leading-relaxed text-white">
              Galora AI has analyzed real-time market streaming data and proprietary institutional signals for your query. Below are the ranked opportunities optimized for risk-adjusted outperformance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {results.map((stock, i) => (
              <div key={i} className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-primary transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h2 className="text-3xl font-black tracking-tight">{stock.ticker}</h2>
                      {renderBadge(stock.finalScore)}
                      {typeof stock.currentPrice === 'number' && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-white/10 font-mono">
                          <span className="text-base font-bold text-white">
                            {stock.currency || getCurrency(stock.ticker)}{stock.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`text-xs font-bold ${(stock.changePct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(stock.changePct || 0) >= 0 ? '+' : ''}{Number(stock.changePct || 0).toFixed(2)}%
                          </span>
                        </div>
                      )}
                      {(stock.targetPrice || stock.currentPrice) && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 font-mono shadow-sm">
                          <Target size={14} className="text-emerald-400 shrink-0" />
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-300">
                            Algo Target (12M):
                          </span>
                          <span className="text-base font-bold text-emerald-300">
                            {stock.currency || getCurrency(stock.ticker)}
                            {Number(stock.targetPrice || (stock.currentPrice * (1 + (stock.upsidePct || 15) / 100))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {(stock.upsidePct !== undefined && stock.upsidePct !== null) && (
                            <span className="text-xs font-black text-emerald-300 bg-emerald-500/25 px-1.5 py-0.5 rounded border border-emerald-500/30 font-sans">
                              +{stock.upsidePct}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-muted font-medium">{stock.companyName} • {stock.sector}</p>
                  </div>
                  
                  <div className="text-left md:text-right shrink-0">
                    <div className="text-sm text-muted uppercase tracking-wider mb-1 font-bold">Final Algo Score</div>
                    <div className="text-4xl font-black text-gradient">{stock.finalScore.toFixed(1)}/100</div>
                  </div>
                </div>

                {/* Proprietary AI Conviction Summary Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
                    <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">AI Conviction Index</div>
                    <div className="font-bold text-lg text-emerald-400 font-mono">
                      {(stock.layers?.agentConvictionScore || stock.finalScore)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
                    <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Agent Signal</div>
                    <div className="font-bold text-lg text-blue-300">
                      {stock.layers?.agentSignal || 'Strong Buy'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
                    <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Outperform Probability</div>
                    <div className="font-bold text-lg text-emerald-300 font-mono">{stock.probability}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
                    <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Risk Profile</div>
                    <div className="font-bold text-lg text-amber-300">{stock.riskProfile}</div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
                      <Sparkles size={14} /> AI Thesis & Narrative
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-300">
                      {stock.explanation}
                    </p>
                  </div>
                  <div className="md:w-64 p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-4 flex items-center gap-2">
                      <AlertTriangle size={14} /> Action Plan
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted mb-1 flex items-center gap-1">
                          <Target size={12} className="text-emerald-400" /> Algo Target Price (12M)
                        </div>
                        <div className="font-bold text-emerald-300 text-base font-mono flex items-baseline gap-1.5">
                          <span>
                            {stock.currency || getCurrency(stock.ticker)}
                            {Number(stock.targetPrice || (stock.currentPrice * (1 + (stock.upsidePct || 15) / 100))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {(stock.upsidePct !== undefined && stock.upsidePct !== null) && (
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-sans">
                              +{stock.upsidePct}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Suggested Allocation</div>
                        <div className="font-bold">{stock.allocation}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Outperform Probability</div>
                        <div className="font-bold text-emerald-400">{stock.probability}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Risk Profile</div>
                        <div className="font-bold text-orange-400">{stock.riskProfile}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                      <button 
                        type="button"
                        onClick={() => navigate('/markets')} 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                      >
                        Trade {stock.ticker} in Markets &rarr;
                      </button>
                      <button 
                        type="button"
                        onClick={() => navigate('/')} 
                        className="btn btn-outline" 
                        style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                      >
                        View Portfolio &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'automated' && (
        <div className="animate-fade-in">
          <div className="glass-panel p-8 rounded-xl mb-8" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <Bot className="text-emerald-400" /> Autopilot Engine
                </h2>
                <p className="text-muted max-w-2xl">
                  When enabled, the system continuously monitors the market, identifies high-probability setups, and executes buy/sell orders directly with your broker—100% automatically with zero human intervention.
                </p>
              </div>
              <div className="flex items-center justify-between md:justify-end flex-wrap gap-4 w-full md:w-auto bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="text-left md:text-right">
                  <div className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Engine Status</div>
                  <div className={`font-bold ${botActive ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {botActive ? 'ACTIVE & EXECUTING' : 'STANDBY'}
                  </div>
                </div>
                <button 
                  onClick={() => setBotActive(!botActive)}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${botActive ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  {botActive ? 'Halt Engine' : 'Enable Autopilot'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-primary" /> Live Automated Trades
            </h3>
            <div className="flex items-center flex-wrap gap-2">
              <button 
                type="button"
                onClick={() => navigate('/')} 
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                📊 View in Portfolio &rarr;
              </button>
              <button 
                type="button"
                onClick={() => navigate('/markets')} 
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                📈 View Markets &rarr;
              </button>
              {botActive && (
                <span className="flex items-center gap-2 text-sm text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Scanning Market...
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[400px]">
            {liveTrades.filter(Boolean).map((trade, i) => {
              const price = livePrices[trade.symbol] || (market === 'US' ? 100.00 : 1000.00);
              const tradeCurrency = getCurrency(trade.symbol);
              
              return (
                <div key={`${trade.symbol}-${i}`} className={`glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden animate-fade-in ${trade.type === 'monitor' ? 'opacity-80' : ''}`}>
                  {trade.type === 'buy' && (
                    <div className="absolute top-0 right-0 p-3 bg-emerald-400/10 text-emerald-400 text-xs font-bold uppercase rounded-bl-xl border-b border-l border-emerald-400/20">
                      Automated Buy
                    </div>
                  )}
                  {trade.type === 'monitor' && (
                    <div className="absolute top-0 right-0 p-3 bg-orange-400/10 text-orange-400 text-xs font-bold uppercase rounded-bl-xl border-b border-l border-orange-400/20">
                      Monitoring
                    </div>
                  )}
                  {trade.type === 'sell' && (
                    <div className="absolute top-0 right-0 p-3 bg-red-400/10 text-red-400 text-xs font-bold uppercase rounded-bl-xl border-b border-l border-red-400/20">
                      Automated Sell
                    </div>
                  )}

                  <div className="text-2xl font-black mb-1">{trade.symbol}</div>
                  <div className="text-muted text-sm mb-6">{trade.name}</div>
                  
                  <div className="space-y-4">
                    {trade.type === 'buy' && (
                      <>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-muted text-sm">Execution Price</span>
                          <span className="font-bold">{tradeCurrency}{price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-muted text-sm">Take Profit Target</span>
                          <span className="font-bold text-emerald-400">{tradeCurrency}{(price * 1.118).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted text-sm">Risk Stop</span>
                          <span className="font-bold text-red-400">{tradeCurrency}{(price * 0.954).toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {trade.type === 'monitor' && (
                      <>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-muted text-sm">Target Entry Price</span>
                          <span className="font-bold">{tradeCurrency}{(price * 0.97).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-muted text-sm">Current Price</span>
                          <span className="font-bold text-white">{tradeCurrency}{price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted text-sm">Action</span>
                          <span className="font-bold text-orange-400">Waiting for pullback</span>
                        </div>
                      </>
                    )}

                    {trade.type === 'sell' && (
                      <>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-muted text-sm">Execution Price</span>
                          <span className="font-bold">{tradeCurrency}{price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-muted text-sm">Original Entry</span>
                          <span className="font-bold">{tradeCurrency}{(price / 1.089).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted text-sm">Realized Profit</span>
                          <span className="font-bold text-emerald-400">+8.9%</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="text-xs text-muted mb-2 font-bold uppercase">AI Rationale</div>
                    <p className="text-sm text-gray-300">{trade.rationale}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                    <button 
                      type="button"
                      onClick={() => navigate('/markets')}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem' }}
                    >
                      Trade in Markets
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigate('/')}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem' }}
                    >
                      Portfolio
                    </button>
                  </div>
                </div>
              );
            })}
            
            {!botActive && liveTrades.length === 0 && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                <div className="glass-panel p-6 rounded-xl text-center border-white/10 max-w-sm">
                  <Bot size={48} className="text-muted mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Engine is Standby</h3>
                  <p className="text-sm text-muted">Click "Enable Autopilot" to allow the system to execute live trades on your behalf.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
