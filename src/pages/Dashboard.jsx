import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as Lucide from 'lucide-react';

const Wallet = Lucide.Wallet || (() => '💼');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const PieChart = Lucide.PieChart || (() => '📊');
const Activity = Lucide.Activity || (() => '⚡');
const Calendar = Lucide.Calendar || (() => '📅');
const ExternalLink = Lucide.ExternalLink || (() => '🔗');
const Clock = Lucide.Clock || (() => '🕒');
const Zap = Lucide.Zap || (() => '⚡');
const Sparkles = Lucide.Sparkles || (() => '✨');
const Target = Lucide.Target || (() => '🎯');
const CheckCircle2 = Lucide.CheckCircle2 || (() => '✅');
const X = Lucide.X || (() => '✕');
import { usePortfolio } from '../context/PortfolioContext';
import { getPortfolioNews, getMarketNews, getUpcomingEarnings, getPortfolioHistory } from '../services/api';
import { useMarket } from '../context/MarketContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    balance, 
    holdings, 
    coreHoldings = [], 
    vaultHoldings = [], 
    coreValue = 0, 
    vaultValue = 0, 
    coreInvested = 0,
    vaultInvested = 0,
    totalInvested = 0,
    corePnl = 0,
    vaultPnl = 0,
    totalPnl = 0,
    corePnlPct = 0,
    vaultPnlPct = 0,
    totalPnlPct = 0,
    vaultAutoPilot = true,
    vaultDivertPct = 20,
    agentModeEnabled,
    setAgentModeEnabled,
    sellAsset,
    setAutoExitRule,
    autoExitHistory = []
  } = usePortfolio();
  const { market, currency } = useMarket();
  const [holdingsFilter, setHoldingsFilter] = useState('ALL'); // 'ALL', 'CORE', 'VAULT'
  const [autoExitModalAsset, setAutoExitModalAsset] = useState(null);
  const [exitMode, setExitMode] = useState('manual'); // Default: 'manual' | Secondary: 'percentage' | 'price'
  const [exitProfitPct, setExitProfitPct] = useState('10');
  const [exitTargetPrice, setExitTargetPrice] = useState('');
  const [autoExitToast, setAutoExitToast] = useState('');

  const openAutoExitModal = (asset) => {
    setAutoExitModalAsset(asset);
    const avg = Number(asset.avgPrice || asset.currentPrice || 100);
    if (asset.autoExit?.enabled) {
      setExitMode(asset.autoExit.mode || 'percentage');
      setExitProfitPct(String(asset.autoExit.targetProfitPct ?? 10));
      setExitTargetPrice(String(asset.autoExit.targetPrice ?? (avg * 1.1).toFixed(2)));
    } else {
      setExitMode('manual');
      setExitProfitPct('10');
      setExitTargetPrice((avg * 1.10).toFixed(2));
    }
  };

  const handleSaveAutoExit = (e) => {
    e.preventDefault();
    if (!autoExitModalAsset) return;
    const avg = Number(autoExitModalAsset.avgPrice || autoExitModalAsset.currentPrice || 100);

    if (exitMode === 'manual') {
      setAutoExitRule(autoExitModalAsset.ticker, autoExitModalAsset.bucket || 'core', null);
      setAutoExitToast(`Manual Sell (Default) active for ${autoExitModalAsset.ticker}. Auto-Exit disabled.`);
    } else if (exitMode === 'percentage') {
      const pctVal = Number(exitProfitPct);
      if (isNaN(pctVal) || pctVal <= -99) {
        alert('Please enter a valid profit percentage (e.g., 10 for +10% profit).');
        return;
      }
      const computedPrice = Number((avg * (1 + pctVal / 100)).toFixed(2));
      setAutoExitRule(autoExitModalAsset.ticker, autoExitModalAsset.bucket || 'core', {
        enabled: true,
        mode: 'percentage',
        targetProfitPct: pctVal,
        targetPrice: computedPrice
      });
      setAutoExitToast(`🎯 Secondary Auto-Exit armed for ${autoExitModalAsset.ticker}: Sell at ${currency}${computedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pctVal >= 0 ? '+' : ''}${pctVal}% target)`);
    } else {
      const priceVal = Number(exitTargetPrice);
      if (isNaN(priceVal) || priceVal <= 0) {
        alert('Please enter a valid target sell price.');
        return;
      }
      const impliedPct = Number((((priceVal - avg) / avg) * 100).toFixed(2));
      setAutoExitRule(autoExitModalAsset.ticker, autoExitModalAsset.bucket || 'core', {
        enabled: true,
        mode: 'price',
        targetPrice: priceVal,
        targetProfitPct: impliedPct
      });
      setAutoExitToast(`🎯 Secondary Auto-Exit armed for ${autoExitModalAsset.ticker}: Sell at ${currency}${priceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${impliedPct >= 0 ? '+' : ''}${impliedPct}%)`);
    }

    setTimeout(() => setAutoExitToast(''), 5500);
    setAutoExitModalAsset(null);
  };

  const handleDisableAutoExit = (asset) => {
    setAutoExitRule(asset.ticker, asset.bucket || 'core', null);
    setAutoExitToast(`Auto-Exit rule removed for ${asset.ticker}.`);
    setTimeout(() => setAutoExitToast(''), 4000);
    if (autoExitModalAsset && autoExitModalAsset.ticker === asset.ticker) {
      setAutoExitModalAsset(null);
    }
  };
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [period, setPeriod] = useState('ALL');
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [news, setNews] = useState([]);
  const [marketNews, setMarketNews] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Fetch true historical data
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingChart(true);

      let queryPeriod = period;
      if (period === 'CUSTOM') {
        if (!dateRange.start || !dateRange.end) {
          setLoadingChart(false);
          return;
        }
        queryPeriod = dateRange;
      }

      // If no holdings, just render a flatline chart of their balance
      if (holdings.length === 0) {
        const fakeData = [
          { name: 'Start', value: balance },
          { name: 'Now', value: balance }
        ];
        setChartData(fakeData);
        setLoadingChart(false);
        return;
      }

      const history = await getPortfolioHistory(holdings, balance, queryPeriod);
      if (history && history.length > 0) {
        setChartData(history);
      }
      setLoadingChart(false);
    };

    // Slight debounce so we don't spam if they type in custom dates
    const timer = setTimeout(() => {
      fetchHistory();
    }, 500);
    return () => clearTimeout(timer);
  }, [holdings.length, balance, period, dateRange]);

  const holdingTickers = holdings.map(h => h.ticker).join(',');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        if (holdings.length > 0) {
          const symbols = holdings.map(h => h.ticker).join(',');
          const [newsData, earningsData] = await Promise.all([
            getPortfolioNews(symbols),
            getUpcomingEarnings(symbols)
          ]);
          setNews(newsData);
          setEarnings(earningsData);
        }
        const globalNews = await getMarketNews();
        setMarketNews(globalNews);
      } catch (err) {
        console.error("Failed to load news", err);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, [holdingTickers]);

  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalPortfolioValue = balance + totalHoldingsValue;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-gradient">My Portfolio</h1>
          <p className="text-muted">Welcome back! Here's how your {market === 'US' ? 'US' : 'Indian'} investments are doing.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/')}
            className="btn btn-outline flex items-center gap-1.5 text-sm"
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d' }}
          >
            <span>⭐ Top 3 Stocks</span>
          </button>
          <button 
            onClick={() => navigate('/macro-agent')}
            className="btn btn-outline flex items-center gap-2 text-sm"
            style={{ borderColor: 'rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.1)' }}
          >
            <Sparkles size={16} className="text-blue-400" />
            <span>Global Macro Agent</span>
          </button>
          <button className="btn btn-primary">
            Deposit Funds
          </button>
        </div>
      </div>

      {/* Total Portfolio Value / Net Worth & Quick Stats (Top of Portfolio Page) */}
      <div className="dashboard-grid mb-6">
        {/* Main Chart Card */}
        <div className="glass-panel card col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-muted text-sm font-medium">Total Portfolio Value</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 font-mono">
                  Net Worth
                </span>
              </div>
              <h2 className="text-4xl font-bold">{currency}{totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <p className="flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                  <TrendingUp size={14} /> +{currency}{(market === 'US' ? 3950.80 : 325400.50).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (All Time)
                </p>
                <span className="text-slate-600">•</span>
                <span className="text-muted">
                  Holdings: <strong className="text-slate-200 font-mono">{currency}{totalHoldingsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-muted">
                  Unallocated Cash: <strong className="text-emerald-400 font-mono">{currency}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {showDatePicker && (
                <div className="flex items-center gap-2 animate-fade-in" style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent border-none text-white outline-none text-sm" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                  <span className="text-muted">to</span>
                  <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent border-none text-white outline-none text-sm" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
              )}
              <button
                className={`btn ${showDatePicker ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  if (!showDatePicker) setPeriod('CUSTOM');
                }}
              >
                <Calendar size={14} className="mr-1" /> Custom
              </button>
              <button
                className={`btn ${period === '1W' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => { setPeriod('1W'); setShowDatePicker(false); }}
              >
                1W
              </button>
              <button
                className={`btn ${period === '1M' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => { setPeriod('1M'); setShowDatePicker(false); }}
              >
                1M
              </button>
              <button
                className={`btn ${period === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => { setPeriod('ALL'); setShowDatePicker(false); }}
              >
                ALL
              </button>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%', position: 'relative' }}>
            {loadingChart && (
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(4px)', borderRadius: '12px' }}>
                <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${currency}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel card flex items-center gap-4">
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-primary)' }}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Buying Power (Liquid Cash)</p>
              <p className="text-xl font-bold font-mono text-emerald-400">{currency}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="glass-panel card flex items-center gap-4">
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', color: '#6366f1' }}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Active AI Alerts</p>
              <p className="text-xl font-bold">{market === 'US' ? '3' : '5'} Notifications</p>
            </div>
          </div>

          <div className="glass-panel card flex items-center gap-4">
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-warning)' }}>
              <PieChart size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Top Sector</p>
              <p className="text-xl font-bold">{market === 'US' ? 'Technology' : 'Financials'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous AI Portfolio Engine Banner */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-purple-950/40 to-slate-900 border border-blue-500/30 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Zap size={22} className={agentModeEnabled ? "text-emerald-400 animate-pulse" : "text-blue-400"} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-bold text-white text-sm">
                Autonomous AI Portfolio Engine
              </h4>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                agentModeEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400 border border-white/10'
              }`}>
                {agentModeEnabled ? `● Agent Mode Active (${vaultDivertPct}% Vault Protected)` : '○ Manual Portfolio Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Continuously monitoring global market conditions, institutional liquidity flows, and corporate momentum. Core holdings remain 100% protected.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0 w-full sm:w-auto sm:justify-end">
          <button 
            onClick={() => setAgentModeEnabled(!agentModeEnabled)}
            className={`btn text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 transition-all ${
              agentModeEnabled 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                : 'bg-slate-800 text-slate-300 border border-white/10 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${agentModeEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
            {agentModeEnabled ? 'Agent Mode: ON' : 'Enable Agent Mode'}
          </button>
          
          <button 
            onClick={() => navigate('/macro-agent')}
            className="btn btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/25"
            style={{ background: 'linear-gradient(135deg, #10b981, #2563eb)' }}
          >
            <Sparkles size={14} /> Review AI Portfolio Shuffle &rarr;
          </button>
        </div>
      </div>

      {/* LINEAR PROFIT / LOSS BREAKDOWN FOR BOTH MODES */}
      <div className="glass-panel p-6 rounded-2xl mb-6 border border-white/10 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              Profit & Loss Performance: Manual Core vs. Autonomous Agent Mode
            </h3>
            <p className="text-xs text-slate-300">
              Live linear breakdown tracking invested cost basis against current unrealized returns across both portfolios.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Original Invested
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Profit
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Loss
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mode 1: Manual / Core Long-Term Portfolio */}
          <div className="p-4 rounded-xl bg-slate-900/85 border border-white/5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Manual Mode • Long-Term Core (Protected)
                </span>
                <h4 className="text-sm font-bold text-white mt-1.5">Core Portfolio Holdings</h4>
              </div>
              <div className="text-right">
                <span className={`text-base font-black font-mono ${corePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {corePnl >= 0 ? '+' : ''}{currency}{corePnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`block text-xs font-bold font-mono ${corePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({corePnlPct >= 0 ? '+' : ''}{corePnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Linear Progress Bar: Original Cost vs Gain/Loss */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-white/10 flex">
                {/* Original Cost Basis Segment */}
                <div 
                  className="h-full bg-slate-600 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (coreInvested / Math.max(1, coreValue, coreInvested)) * 100)}%` }}
                  title={`Original Invested: ${currency}${coreInvested.toFixed(2)}`}
                ></div>
                {/* Profit (Green) or Loss (Red) Segment */}
                {corePnl >= 0 ? (
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-500 shadow-sm shadow-emerald-400/50" 
                    style={{ width: `${Math.min(40, (corePnl / Math.max(1, coreInvested)) * 100)}%` }}
                    title={`Net Profit: +${currency}${corePnl.toFixed(2)}`}
                  ></div>
                ) : (
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500 shadow-sm shadow-rose-500/50" 
                    style={{ width: `${Math.min(40, (Math.abs(corePnl) / Math.max(1, coreInvested)) * 100)}%` }}
                    title={`Net Loss: -${currency}${Math.abs(corePnl).toFixed(2)}`}
                  ></div>
                )}
              </div>

              {/* Numerical Linear Indicator Footnote */}
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
                <span>Original: <strong className="text-white">{currency}{coreInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span>Current Value: <strong className="text-white">{currency}{coreValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          </div>

          {/* Mode 2: Autonomous Agent Mode / Tactical Vault */}
          <div className="p-4 rounded-xl bg-slate-900/85 border border-blue-500/30 space-y-3 shadow-inner">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Agent Mode • Tactical Vault ({vaultDivertPct}%)
                </span>
                <h4 className="text-sm font-bold text-white mt-1.5">Autonomous Tactical Positions</h4>
              </div>
              <div className="text-right">
                <span className={`text-base font-black font-mono ${vaultPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {vaultPnl >= 0 ? '+' : ''}{currency}{vaultPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`block text-xs font-bold font-mono ${vaultPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({vaultPnlPct >= 0 ? '+' : ''}{vaultPnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Linear Progress Bar: Original Cost vs Gain/Loss */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-white/10 flex">
                {/* Original Cost Basis Segment */}
                <div 
                  className="h-full bg-slate-600 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (vaultInvested / Math.max(1, vaultValue, vaultInvested)) * 100)}%` }}
                  title={`Original Invested: ${currency}${vaultInvested.toFixed(2)}`}
                ></div>
                {/* Profit (Green) or Loss (Red) Segment */}
                {vaultPnl >= 0 ? (
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-500 shadow-sm shadow-emerald-400/50" 
                    style={{ width: `${Math.min(40, (vaultPnl / Math.max(1, vaultInvested)) * 100)}%` }}
                    title={`Net Profit: +${currency}${vaultPnl.toFixed(2)}`}
                  ></div>
                ) : (
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500 shadow-sm shadow-rose-500/50" 
                    style={{ width: `${Math.min(40, (Math.abs(vaultPnl) / Math.max(1, vaultInvested)) * 100)}%` }}
                    title={`Net Loss: -${currency}${Math.abs(vaultPnl).toFixed(2)}`}
                  ></div>
                )}
              </div>

              {/* Numerical Linear Indicator Footnote */}
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
                <span>Original: <strong className="text-white">{currency}{vaultInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span>Current Value: <strong className="text-white">{currency}{vaultValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Bucket Allocation Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Long-Term Core Portfolio</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Protected
                </span>
              </div>
              <p className="text-xs text-muted">Core wealth holdings isolated from automated shuffles</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white font-mono">
              {currency}{coreValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-emerald-400">{coreHoldings.length} holdings</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-blue-500/30 bg-blue-950/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Global Agent Tactical Vault</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  {vaultAutoPilot ? 'Auto-Pilot Active' : 'Manual'}
                </span>
              </div>
              <p className="text-xs text-muted">Managed autonomously by Global Macro Agent</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-blue-300 font-mono">
              {currency}{vaultValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/macro-agent')}>
              {vaultHoldings.length} tactical assets • Manage ➔
            </span>
          </div>
        </div>
      </div>

      {/* Your Holdings Section with Bucket Filters */}
      <div style={{ marginTop: '2.5rem' }}></div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold">Your Portfolio Holdings</h3>
          <p className="text-xs text-muted">Filter holdings between protected long-term investments and agent tactical allocations.</p>
        </div>

        {/* Bucket Segment Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setHoldingsFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
              holdingsFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setHoldingsFilter('CORE')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              holdingsFilter === 'CORE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🛡️ Core Protected</span>
            <span>({coreHoldings.length})</span>
          </button>
          <button
            onClick={() => setHoldingsFilter('VAULT')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              holdingsFilter === 'VAULT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡ Tactical Vault</span>
            <span>({vaultHoldings.length})</span>
          </button>
        </div>
      </div>

      {autoExitToast && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{autoExitToast}</span>
          </div>
          <button onClick={() => setAutoExitToast('')} className="text-slate-400 hover:text-white text-[11px] underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="glass-panel overflow-x-auto rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th className="p-4 text-muted font-normal text-sm">Asset</th>
              <th className="p-4 text-muted font-normal text-sm">Portfolio Bucket</th>
              <th className="p-4 text-muted font-normal text-sm">Class</th>
              <th className="p-4 text-muted font-normal text-sm">Units / Shares</th>
              <th className="p-4 text-muted font-normal text-sm">Avg Price</th>
              <th className="p-4 text-muted font-normal text-sm">Current Price</th>
              <th className="p-4 text-muted font-normal text-sm">Total Value</th>
              <th className="p-4 text-muted font-normal text-sm">Performance</th>
              <th className="p-4 text-muted font-normal text-sm text-right">Action (Manual Default)</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-6 text-center text-muted">
                  No holdings yet. Go to <strong className="text-white cursor-pointer" onClick={() => navigate('/macro-agent')}>Global Agent</strong> to auto-shuffle or <strong className="text-white cursor-pointer" onClick={() => navigate('/markets')}>Markets</strong> to buy stocks & commodities!
                </td>
              </tr>
            ) : (
              holdings
                .filter(asset => {
                  if (holdingsFilter === 'CORE') return (asset.bucket || 'core') !== 'agent_vault' && asset.bucket !== 'top1_agent';
                  if (holdingsFilter === 'VAULT') return asset.bucket === 'agent_vault' || asset.bucket === 'top1_agent';
                  return true;
                })
                .map((asset, index) => {
                  const performance = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
                  const isPositive = performance >= 0;
                  const formattedShares = typeof asset.shares === 'number' 
                    ? (asset.shares % 1 === 0 ? asset.shares : Number(asset.shares.toFixed(4))) 
                    : asset.shares;
                  const isCommodity = asset.assetType === 'commodity' || asset.ticker.includes('=');
                  const isVaultHolding = asset.bucket === 'agent_vault';
                  const hasAutoExit = Boolean(asset.autoExit && asset.autoExit.enabled && asset.autoExit.targetPrice > 0);
                  const distToTargetPct = hasAutoExit && asset.currentPrice > 0
                    ? (((asset.autoExit.targetPrice - asset.currentPrice) / asset.currentPrice) * 100)
                    : null;

                  return (
                    <tr key={index} className="hover:bg-white/5 transition-colors text-sm" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td className="p-4 font-bold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-lg shrink-0" style={{ 
                            background: isCommodity 
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                              : 'linear-gradient(135deg, var(--accent-primary) 0%, rgba(99, 102, 241, 0.8) 100%)' 
                          }}>
                            {asset.ticker.substring(0, 2)}
                          </div>
                          <div>
                            <span className="text-sm font-bold block">{asset.ticker}</span>
                            <span className="text-[11px] text-muted">{asset.name || asset.ticker}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          asset.bucket === 'top1_agent'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : isVaultHolding 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {asset.bucket === 'top1_agent' ? '🏆 #1 Top Pick' : isVaultHolding ? '⚡ Tactical Vault' : '🛡️ Long-Term Core'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isCommodity ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {asset.category || (isCommodity ? 'Commodity' : 'Equity')}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono font-bold text-white whitespace-nowrap">{formattedShares}</td>
                      <td className="p-4 text-muted text-sm whitespace-nowrap">{currency}{(asset.avgPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-4 text-sm font-bold whitespace-nowrap" style={{ color: isPositive ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                        <div className="flex items-center gap-1.5">
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {currency}{(asset.currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-sm whitespace-nowrap">{currency}{(asset.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-4 font-bold text-sm whitespace-nowrap" style={{ color: isPositive ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                        {isPositive ? '+' : ''}{(isNaN(performance) ? 0 : performance).toFixed(2)}%
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Primary Default Action: Manual Sell */}
                          <button 
                            onClick={() => {
                              if (window.confirm(`Liquidate position in ${asset.ticker}?`)) {
                                sellAsset(asset.ticker, null, asset.bucket);
                              }
                            }}
                            className="text-xs font-bold text-red-400 transition-all"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '64px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              background: 'rgba(239, 68, 68, 0.08)'
                            }}
                          >
                            Sell
                          </button>

                          {/* Secondary Optional Action: Auto-Exit */}
                          {hasAutoExit ? (
                            <div className="inline-flex items-center gap-1" style={{ height: '32px' }}>
                              <button
                                onClick={() => openAutoExitModal(asset)}
                                className="text-[11px] font-bold text-emerald-300 font-mono transition-all"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  minWidth: '115px',
                                  height: '32px',
                                  padding: '0 0.6rem',
                                  borderRadius: '8px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}
                                title={distToTargetPct !== null && distToTargetPct > 0 ? `${distToTargetPct.toFixed(1)}% away from auto-sell • Click to edit` : 'Click to edit Auto-Exit'}
                              >
                                🎯 {currency}{Number(asset.autoExit.targetPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({asset.autoExit.targetProfitPct >= 0 ? '+' : ''}{Number(asset.autoExit.targetProfitPct).toFixed(0)}%)
                              </button>
                              <button
                                onClick={() => handleDisableAutoExit(asset)}
                                className="text-slate-400 transition-colors"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  background: 'rgba(15, 23, 42, 0.7)'
                                }}
                                title="Revert to Manual Sell (Default)"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAutoExitModal(asset)}
                              className="text-[11px] text-slate-300 transition-all"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                minWidth: '115px',
                                height: '32px',
                                padding: '0 0.65rem',
                                borderRadius: '8px',
                                background: 'rgba(30, 41, 59, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.12)'
                              }}
                              title="Optional: Set secondary Auto-Exit target (% profit or price)"
                            >
                              <Target size={12} className="text-emerald-400" />
                              <span>Auto-Exit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Auto-Exit Executions Log */}
      {autoExitHistory.filter(item => item.market === market).length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <span>🎯 Recent Auto-Exit (Take-Profit) Executions</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Automatically liquidated &amp; credited to Cash Balance
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {autoExitHistory
              .filter(item => item.market === market)
              .slice(0, 3)
              .map(record => (
                <div key={record.id} className="p-3 rounded-lg bg-slate-900/90 border border-white/10 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{record.ticker}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Sold @ {currency}{Number(record.exitPrice).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {record.shares} units • Target {currency}{Number(record.targetPrice).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className={`font-bold ${record.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {record.profit >= 0 ? '+' : ''}{currency}{Number(record.profit).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-300">
                      ({record.profitPct >= 0 ? '+' : ''}{Number(record.profitPct).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Auto-Exit (Take-Profit / Target Price) Configuration Modal */}
      {autoExitModalAsset && (() => {
        const avg = Number(autoExitModalAsset.avgPrice || autoExitModalAsset.currentPrice || 100);
        const live = Number(autoExitModalAsset.currentPrice || avg);
        const shares = Number(autoExitModalAsset.shares || 1);
        const currentReturnPct = avg > 0 ? (((live - avg) / avg) * 100) : 0;

        const previewTargetPrice = exitMode === 'percentage'
          ? Number((avg * (1 + (Number(exitProfitPct) || 0) / 100)).toFixed(2))
          : Number((Number(exitTargetPrice) || 0).toFixed(2));

        const previewProfitPct = avg > 0
          ? Number((((previewTargetPrice - avg) / avg) * 100).toFixed(2))
          : 0;

        const estimatedProceeds = Number((shares * previewTargetPrice).toFixed(2));
        const estimatedNetProfit = Number((shares * (previewTargetPrice - avg)).toFixed(2));
        const willExecuteImmediately = exitMode !== 'manual' && previewTargetPrice > 0 && live >= previewTargetPrice;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="glass-panel p-4 sm:p-6 rounded-2xl max-w-md w-full border border-emerald-500/40 shadow-2xl bg-slate-900/95 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                    Exit Strategy • Manual Sell is Default
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">
                    Configure Exit for {autoExitModalAsset.ticker}
                  </h3>
                  <p className="text-xs text-slate-400">{autoExitModalAsset.name}</p>
                </div>
                <button
                  onClick={() => setAutoExitModalAsset(null)}
                  className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAutoExit} className="space-y-4">
                {/* Position Snapshot */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/90 border border-white/10 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Units Held</span>
                    <span className="text-sm font-bold text-white font-mono">{shares}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Avg Buy Price</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {currency}{avg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Live Price</span>
                    <span className={`text-sm font-bold font-mono ${currentReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currency}{live.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Exit Mode Switcher: Manual Sell (Default) vs Secondary Auto-Exit Options */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Select Exit Mode <span className="text-[10px] text-slate-400 font-normal">(Manual Default • Auto-Exit Secondary)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setExitMode('manual')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        exitMode === 'manual'
                          ? 'bg-slate-800 border-white/50 text-white shadow-md'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">Manual Sell</div>
                      <div className="text-[10px] text-slate-400">Default mode</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExitMode('percentage');
                        if (!exitProfitPct) setExitProfitPct('10');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        exitMode === 'percentage'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-300">Auto: % Profit</div>
                      <div className="text-[10px] text-slate-400">e.g. +10% gain</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExitMode('price');
                        if (!exitTargetPrice || Number(exitTargetPrice) <= 0) {
                          setExitTargetPrice((avg * (1 + (Number(exitProfitPct) || 10) / 100)).toFixed(2));
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        exitMode === 'price'
                          ? 'bg-blue-500/20 border-blue-500/60 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-blue-300">Auto: Price</div>
                      <div className="text-[10px] text-slate-400">Define {currency} price</div>
                    </button>
                  </div>
                </div>

                {/* Input Section based on Mode */}
                {exitMode === 'manual' ? (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2.5">
                    <div className="text-xs font-bold text-white">
                      Manual Sell is Active (Default)
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your position in <strong>{autoExitModalAsset.ticker}</strong> will stay in your portfolio until you manually click the primary <strong>Sell</strong> button. Choose one of the secondary tabs above only if you want to arm an automatic take-profit trigger.
                    </p>
                  </div>
                ) : exitMode === 'percentage' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Target Profit Percentage (%)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.5"
                          value={exitProfitPct}
                          onChange={(e) => {
                            setExitProfitPct(e.target.value);
                            const v = Number(e.target.value);
                            if (!isNaN(v)) {
                              setExitTargetPrice((avg * (1 + v / 100)).toFixed(2));
                            }
                          }}
                          className="chat-input w-full font-mono text-base py-2 px-3 pr-8"
                          placeholder="10"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[5, 10, 15, 20, 25, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setExitProfitPct(String(pct));
                            setExitTargetPrice((avg * (1 + pct / 100)).toFixed(2));
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            Number(exitProfitPct) === pct
                              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                          }`}
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Target Exit Price ({currency})
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={exitTargetPrice}
                          onChange={(e) => {
                            setExitTargetPrice(e.target.value);
                            const p = Number(e.target.value);
                            if (!isNaN(p) && avg > 0) {
                              setExitProfitPct((((p - avg) / avg) * 100).toFixed(2));
                            }
                          }}
                          className="chat-input w-full font-mono text-base py-2 px-3"
                          placeholder={(avg * 1.1).toFixed(2)}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Avg +5%', val: (avg * 1.05).toFixed(2) },
                        { label: 'Avg +10%', val: (avg * 1.10).toFixed(2) },
                        { label: 'Avg +20%', val: (avg * 1.20).toFixed(2) },
                        { label: 'Live +5%', val: (live * 1.05).toFixed(2) }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setExitTargetPrice(preset.val);
                            setExitProfitPct((((Number(preset.val) - avg) / avg) * 100).toFixed(2));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-white/10"
                        >
                          {preset.label} ({currency}{preset.val})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Trigger Summary Box (only shown when a secondary Auto-Exit option is selected) */}
                {exitMode !== 'manual' && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/35 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Auto-Sell Trigger Price</span>
                      <span className="text-sm font-black text-white font-mono">
                        {currency}{previewTargetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className={`ml-1.5 text-xs ${previewProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({previewProfitPct >= 0 ? '+' : ''}{previewProfitPct.toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Estimated Total Proceeds</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {currency}{estimatedProceeds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/10">
                      <span className="text-slate-300 font-medium">Locked-In Net Profit</span>
                      <span className={`font-black font-mono ${estimatedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {estimatedNetProfit >= 0 ? '+' : ''}{currency}{estimatedNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {willExecuteImmediately && (
                  <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] leading-relaxed">
                    ⚡ <strong>Immediate Execution Notice:</strong> Live price ({currency}{live.toFixed(2)}) has already reached or exceeded your target ({currency}{previewTargetPrice.toFixed(2)}). Saving will immediately execute the sale!
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-2">
                  {autoExitModalAsset.autoExit?.enabled && exitMode !== 'manual' && (
                    <button
                      type="button"
                      onClick={() => handleDisableAutoExit(autoExitModalAsset)}
                      className="btn btn-outline py-2.5 px-3 text-xs font-bold text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
                    >
                      Revert to Manual
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAutoExitModalAsset(null)}
                    className="btn btn-outline flex-1 py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 py-2.5 text-xs font-bold shadow-lg shadow-emerald-500/20"
                    style={{ background: 'linear-gradient(135deg, #10b981, #2563eb)' }}
                  >
                    {exitMode === 'manual' ? 'Keep Manual Sell (Default)' : (willExecuteImmediately ? 'Execute Auto-Sell Now' : 'Save Auto-Exit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Live Financial News Section */}
      <div style={{ marginTop: '2rem' }}></div>
      <h3 className="flex items-center gap-2 text-xl font-bold" style={{ marginBottom: '1.5rem' }}>
        Live Financial News
        <span className="flex items-center gap-1 shadow-lg shadow-emerald-500/20" style={{ fontSize: '0.70rem', padding: '3px 10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Feed
        </span>
      </h3>

      {loadingNews ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl flex flex-col items-center justify-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="font-medium tracking-wide">Fetching global financial news...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl">
          <p>No recent news available.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {news.map((item, index) => {
            const date = new Date(item.datetime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-primary"
                style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--glass-border)', minHeight: '140px' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate mr-2" style={{ color: 'var(--accent-primary)' }}>{item.source}</span>
                  {item.impactTicker && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: item.impactChangePct >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }}>
                      <span className="text-[10px] font-bold">{item.impactTicker}</span>
                      <span className="text-[10px] font-bold" style={{ color: item.impactChangePct >= 0 ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                        {item.impactChangePct >= 0 ? '+' : ''}{item.impactChangePct.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {!item.impactTicker && <ExternalLink size={12} className="text-muted shrink-0" />}
                </div>

                <h4 className="text-sm font-bold mb-4 flex-1" style={{
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'var(--text-primary)'
                }}>
                  {(item.headline || '').replace(` - ${item.source}`, '')}
                </h4>

                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mt-auto pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <Clock size={10} />
                  <span>{date}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Trending Market Opportunities Section */}
      <div style={{ marginTop: '4rem' }}></div>
      <h3 className="flex items-center gap-2 text-xl font-bold" style={{ marginBottom: '1.5rem' }}>
        Trending Market Opportunities
        <span className="flex items-center gap-1 shadow-lg shadow-blue-500/20" style={{ fontSize: '0.70rem', padding: '3px 10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
          <Activity size={10} />
          Global
        </span>
      </h3>

      {loadingNews ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl flex flex-col items-center justify-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="font-medium tracking-wide">Fetching global opportunities...</p>
        </div>
      ) : marketNews.length === 0 ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl">
          <p>No trending opportunities available.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {marketNews.map((item, index) => {
            const date = new Date(item.datetime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-primary"
                style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--glass-border)', minHeight: '140px' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate mr-2" style={{ color: '#3b82f6' }}>{item.source}</span>
                  <ExternalLink size={12} className="text-muted shrink-0" />
                </div>

                <h4 className="text-sm font-bold mb-4 flex-1" style={{
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'var(--text-primary)'
                }}>
                  {(item.headline || '').replace(` - ${item.source}`, '')}
                </h4>

                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mt-auto pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <Clock size={10} />
                  <span>{date}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Upcoming Financial Results Section */}
      <div style={{ marginTop: '4rem' }}></div>
      <h3 className="flex items-center gap-2 text-xl font-bold" style={{ marginBottom: '1.5rem' }}>
        Upcoming Financial Results
        <span className="flex items-center gap-1 shadow-lg shadow-purple-500/20" style={{ fontSize: '0.70rem', padding: '3px 10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
          <Calendar size={10} />
          Earnings
        </span>
      </h3>

      {loadingNews ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl flex flex-col items-center justify-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="font-medium tracking-wide">Fetching upcoming results...</p>
        </div>
      ) : earnings.length === 0 ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl">
          <p>No upcoming earnings found for your holdings.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-x-auto rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th className="p-4 text-muted font-normal text-sm">Company</th>
                <th className="p-4 text-muted font-normal text-sm">Earnings Date</th>
                <th className="p-4 text-muted font-normal text-sm">Expected EPS</th>
                <th className="p-4 text-muted font-normal text-sm">Expected Rev</th>
                <th className="p-4 text-muted font-normal text-sm text-right">Market Impact</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((item, index) => {
                const dateObj = new Date(item.earningsDate);
                const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const isPositive = item.changePct >= 0;

                // Format revenue estimate to billions/millions
                let revStr = 'N/A';
                if (item.revEstimate) {
                  if (item.revEstimate >= 1e9) {
                    revStr = `$${(item.revEstimate / 1e9).toFixed(2)}B`;
                  } else if (item.revEstimate >= 1e6) {
                    revStr = `$${(item.revEstimate / 1e6).toFixed(2)}M`;
                  }
                }

                return (
                  <tr key={index} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td className="p-4 font-bold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #a855f7 0%, rgba(99, 102, 241, 0.8) 100%)' }}>
                        {item.ticker.substring(0, 1)}
                      </div>
                      <span className="text-sm font-bold">{item.ticker}</span>
                    </td>
                    <td className="p-4 text-sm font-medium">{dateStr}</td>
                    <td className="p-4 text-sm">{item.epsEstimate ? `$${item.epsEstimate.toFixed(2)}` : 'N/A'}</td>
                    <td className="p-4 text-sm">{revStr}</td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }}>
                        <span className="text-xs font-bold" style={{ color: isPositive ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                          {isPositive ? '+' : ''}{item.changePct.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
