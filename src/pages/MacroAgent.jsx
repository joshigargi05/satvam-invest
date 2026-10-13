import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';
import { getMacroIntelligenceStream, getMacroAllocationRecommendation, getCommodities } from '../services/api';

const Globe = Lucide.Globe || (() => '🌐');
const ShieldAlert = Lucide.ShieldAlert || Lucide.AlertTriangle || (() => '⚠️');
const ShieldCheck = Lucide.ShieldCheck || Lucide.Shield || (() => '🛡️');
const Cpu = Lucide.Cpu || (() => '💻');
const Flame = Lucide.Flame || (() => '🔥');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const Play = Lucide.Play || (() => '▶️');
const Pause = Lucide.Pause || (() => '⏸️');
const CheckCircle2 = Lucide.CheckCircle2 || Lucide.Check || (() => '✅');
const ArrowRight = Lucide.ArrowRight || (() => '➡️');
const Zap = Lucide.Zap || (() => '⚡');
const DollarSign = Lucide.DollarSign || (() => '💲');
const Layers = Lucide.Layers || (() => '📑');
const BarChart3 = Lucide.BarChart3 || (() => '📊');
const Sparkles = Lucide.Sparkles || (() => '✨');
const Terminal = Lucide.Terminal || (() => '💻');
const ShoppingBag = Lucide.ShoppingBag || (() => '🛍️');
const Lock = Lucide.Lock || (() => '🔒');
const Sliders = Lucide.Sliders || (() => '🎚️');
const Wallet = Lucide.Wallet || (() => '💼');
const Clock = Lucide.Clock || (() => '🕒');
const Radio = Lucide.Radio || (() => '📡');

export default function MacroAgent() {
  const { 
    balance, 
    holdings, 
    coreHoldings,
    vaultHoldings,
    coreValue,
    vaultValue,
    totalPortfolioValue,
    vaultAutoPilot,
    setVaultAutoPilot,
    vaultDivertPct,
    setVaultDivertPct,
    agentModeEnabled,
    setAgentModeEnabled,
    buyAsset, 
    rebalancePortfolio, 
    rebalanceHistory 
  } = usePortfolio();

  const { market, currency } = useMarket();

  // State for World Intelligence Stream
  const [intelStream, setIntelStream] = useState([]);
  const [macroIndices, setMacroIndices] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loadingStream, setLoadingStream] = useState(true);

  // State for Commodities Desk
  const [commodities, setCommodities] = useState([]);
  const [activeCommodityFilter, setActiveCommodityFilter] = useState('ALL');
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [commodityTradeUnits, setCommodityTradeUnits] = useState(1);
  const [tradeTargetBucket, setTradeTargetBucket] = useState('agent_vault'); // 'agent_vault' or 'core'
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState('');

  // State for Agent Allocation Recommendation
  const [selectedScenario, setSelectedScenario] = useState('iran_war_ai');
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);

  // Capital Divergence & Portfolio Scope Controls (User Choice!)
  // e.g. 20% of total portfolio into Tactical Vault vs 100% full portfolio
  const [divertPct, setDivertPct] = useState(vaultDivertPct || 20);
  const [rebalanceScope, setRebalanceScope] = useState('vault'); // 'vault' (protects long term) or 'full' (all assets)

  // Auto-Shuffle Execution & Modal State
  const [showShuffleConfirmModal, setShowShuffleConfirmModal] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleStep, setShuffleStep] = useState('');
  const [shuffleSuccessReceipt, setShuffleSuccessReceipt] = useState(null);

  const scrollContainerRef = useRef(null);
  const isHoveredRef = useRef(false);

  // Calculate Diverted Capital vs Protected Core Capital
  const effectiveDivertPct = rebalanceScope === 'vault' ? divertPct : 100;
  const capitalToDeploy = rebalanceScope === 'vault' 
    ? Number((totalPortfolioValue * (divertPct / 100)).toFixed(2))
    : totalPortfolioValue;
  const protectedCoreCapital = rebalanceScope === 'vault'
    ? Number((totalPortfolioValue - capitalToDeploy).toFixed(2))
    : 0;

  // Load Macro Stream & Commodities on mount
  useEffect(() => {
    loadStreamData();
    loadCommoditiesData();

    const interval = setInterval(() => {
      loadCommoditiesData();
    }, 4000);
    return () => clearInterval(interval);
  }, [market]);

  // Load Recommendation when scenario changes
  useEffect(() => {
    loadRecommendation(selectedScenario);
  }, [selectedScenario, market]);

  const loadStreamData = async () => {
    setLoadingStream(true);
    const data = await getMacroIntelligenceStream();
    if (data) {
      setIntelStream(data.stream || []);
      setMacroIndices(data.macroIndices || null);
      setTelemetryLogs(data.telemetryLogs || []);
    }
    setLoadingStream(false);
  };

  const mapTickerToMarket = (ticker, currentMarket) => {
    if (currentMarket !== 'INDIA') return ticker;
    const inMap = {
      'AMZN': 'RELIANCE',
      'GOOGL': 'TCS',
      'MSFT': 'INFY',
      'NVDA': 'TCS',
      'MU': 'INFY',
      'CL=F': 'CRUDEOIL',
      'BZ=F': 'RELIANCE',
      'GC=F': 'GOLDBEES',
      'SI=F': 'SILVERBEES',
      'HG=F': 'COPPER',
      'PL=F': 'GOLDBEES',
      'TSM': 'TCS'
    };
    return inMap[ticker] || ticker;
  };

  const loadCommoditiesData = async () => {
    const list = await getCommodities(market);
    if (list && list.length > 0) {
      setCommodities(list);
    }
  };

  const loadRecommendation = async (scenarioId) => {
    setLoadingRec(true);
    const res = await getMacroAllocationRecommendation({
      scenarioId,
      market
    });
    if (res) {
      setRecommendation(res);
    }
    setLoadingRec(false);
  };

  // Continuous Auto-Scroll simulation with smooth reset and pause at boundaries
  useEffect(() => {
    if (!isAutoScrolling) return;

    let timeoutId = null;
    let isPausedAtBoundary = false;

    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el || isPausedAtBoundary || isHoveredRef.current) return;

      // If content doesn't overflow, do not scroll
      if (el.scrollHeight <= el.clientHeight + 10) return;

      // Check if scrolled near the bottom
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
        isPausedAtBoundary = true;
        // Pause for 2.5 seconds at the bottom so user can read the final items
        timeoutId = setTimeout(() => {
          if (!scrollContainerRef.current) {
            isPausedAtBoundary = false;
            return;
          }
          // Smoothly glide back to the top
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });

          // Wait for smooth scroll animation to reach the top before resuming
          timeoutId = setTimeout(() => {
            isPausedAtBoundary = false;
          }, 1200);
        }, 2500);
        return;
      }

      el.scrollTop += 1;
    }, 45);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAutoScrolling]);

  // Reset scroll position when category changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeCategory]);

  // Execute Commodity Buy
  const handleBuyCommodity = (e) => {
    e.preventDefault();
    if (!selectedCommodity) return;

    const units = parseFloat(commodityTradeUnits);
    if (isNaN(units) || units <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const price = selectedCommodity.price;
    const success = buyAsset({
      ticker: selectedCommodity.ticker,
      name: selectedCommodity.name,
      price: price,
      units: units,
      category: selectedCommodity.category,
      assetType: 'commodity',
      bucket: tradeTargetBucket
    });

    if (success) {
      const bucketLabel = tradeTargetBucket === 'agent_vault' ? 'Tactical Vault' : 'Core Long-Term Portfolio';
      setTradeSuccessMsg(`Successfully acquired ${units} ${selectedCommodity.unit} of ${selectedCommodity.name} into ${bucketLabel}!`);
      setTimeout(() => setTradeSuccessMsg(''), 4000);
      setSelectedCommodity(null);
      setCommodityTradeUnits(1);
    }
  };

  // 1-Click Instant Auto-Shuffle Execution
  const handleExecuteShuffle = () => {
    if (!recommendation || !recommendation.allocations) return;

    setIsShuffling(true);
    setShuffleStep(`Isolating ${rebalanceScope === 'vault' ? `Tactical Vault (${divertPct}%)` : 'Full Portfolio'} and protecting Core holdings...`);

    setTimeout(() => {
      setShuffleStep("Routing real-time limit orders across Gold, Oil, Chip/Memory, and E-Commerce...");
      
      setTimeout(() => {
        setShuffleStep("Finalizing tactical asset weights and synchronizing portfolio ledger...");
        
        setTimeout(() => {
          const result = rebalancePortfolio({
            allocations: recommendation.allocations,
            scenarioName: recommendation.title,
            divertPct: divertPct,
            scope: rebalanceScope,
            enableAutoPilot: vaultAutoPilot
          });

          setIsShuffling(false);
          setShowShuffleConfirmModal(false);

          if (result && result.success) {
            setShuffleSuccessReceipt(result.auditRecord);
          }
        }, 700);
      }, 700);
    }, 600);
  };

  const filteredStream = activeCategory === 'ALL' 
    ? intelStream 
    : intelStream.filter(item => item.category.toUpperCase().includes(activeCategory));

  const filteredCommodities = activeCommodityFilter === 'ALL'
    ? commodities
    : commodities.filter(c => c.category.toUpperCase().includes(activeCommodityFilter));

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="live-status-dot" style={{ backgroundColor: '#10b981' }}></span>
            <span style={{ 
              fontSize: '0.75rem', 
              letterSpacing: '0.12em', 
              textTransform: 'uppercase', 
              fontWeight: '700', 
              color: 'var(--accent-primary)',
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              Autonomous World Intelligence Agent
            </span>
          </div>
          <h1 className="text-gradient text-3xl font-bold">Global Macro Radar & Autonomous Tactical Vault</h1>
          <p className="text-muted text-sm max-w-3xl">
            Continuously monitors Iran War developments, oil supply bottlenecks, and AI computing supercycles.
            Divert a custom allocation (e.g. 20%) into a dedicated Tactical Vault managed autonomously by the agent—while keeping your core long-term portfolio completely protected.
          </p>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadStreamData()} 
            className="btn btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
          >
            <RefreshCw size={14} /> Refresh Wire
          </button>
          <button 
            onClick={() => setShowShuffleConfirmModal(true)} 
            className="btn btn-primary flex items-center gap-1.5 text-sm py-2 px-4 shadow-lg shadow-blue-500/20"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <Zap size={16} /> Auto-Shuffle ({rebalanceScope === 'vault' ? `${divertPct}% Vault` : '100%'})
          </button>
        </div>
      </div>

      {/* DUAL BUCKET PORTFOLIO STATUS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Core Long-Term Portfolio (Protected) */}
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Long-Term Core Portfolio</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                  Protected 🛡️
                </span>
              </div>
              <p className="text-[11px] text-muted">Never touched by automated rebalances</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white font-mono">
              {currency}{coreValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-emerald-400">{coreHoldings.length} assets held</span>
          </div>
        </div>

        {/* Global Agent Tactical Vault */}
        <div className="glass-panel p-4 rounded-xl border border-blue-500/30 bg-blue-950/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Global Agent Tactical Vault</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                  {vaultAutoPilot ? 'Auto-Pilot Active' : 'Manual'}
                </span>
              </div>
              <p className="text-[11px] text-muted">Allocated {divertPct}% for tactical rotation</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-300 font-mono">
              {currency}{vaultValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-blue-400">{vaultHoldings.length} tactical assets</span>
          </div>
        </div>

        {/* Liquid Cash & Total Net Worth */}
        <div className="glass-panel p-4 rounded-xl border border-purple-500/30 bg-purple-950/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Wallet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Total Liquid & Power</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-muted">Total Net Worth: {currency}{totalPortfolioValue.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white font-mono">
              {currency}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-muted">Unallocated Cash</span>
          </div>
        </div>
      </div>

      {/* 4-LAYER AUTONOMOUS AGENT MODE COCKPIT */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/70 via-slate-900 to-purple-950/40 shadow-2xl mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              agentModeEnabled 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                : 'bg-slate-800 border-white/10 text-slate-400'
            }`}>
              <Zap size={24} className={agentModeEnabled ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-bold text-white">Autonomous Agent Decision Cockpit</h3>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  agentModeEnabled 
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border border-white/10'
                }`}>
                  {agentModeEnabled ? '● Fully Autonomous Execution Armed' : '○ Manual Approval Required'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Agent continuously combines 4 institutional layers: Macro Regime (25%) + Derivatives OI (25%) + Technical Quant (30%) + Earnings Sentiment (20%).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAgentModeEnabled(!agentModeEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                agentModeEnabled 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${agentModeEnabled ? 'bg-slate-950' : 'bg-slate-500'}`}></span>
              <span>{agentModeEnabled ? 'Agent Mode: ENABLED' : 'Enable Agent Mode'}</span>
            </button>
          </div>
        </div>

        {/* 4 Multi-Factor Layers Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="flex justify-between items-center text-muted text-[10px] uppercase font-bold mb-1">
              <span>Layer 1: Macro & Regime</span>
              <span className="text-blue-400 font-mono">25% Wgt</span>
            </div>
            <div className="text-sm font-bold text-white mb-0.5">Geopolitical & Fed / RBI</div>
            <p className="text-[11px] text-slate-300">Monitors CPI, Middle East conflict, rates & sovereign reserves.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="flex justify-between items-center text-muted text-[10px] uppercase font-bold mb-1">
              <span>Layer 2: Derivatives & OI</span>
              <span className="text-purple-400 font-mono">25% Wgt</span>
            </div>
            <div className="text-sm font-bold text-white mb-0.5">Options Gamma & PCR</div>
            <p className="text-[11px] text-slate-300">Tracks dealer gamma hedging, Max Pain strikes & open contract buildup.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="flex justify-between items-center text-muted text-[10px] uppercase font-bold mb-1">
              <span>Layer 3: Quant Momentum</span>
              <span className="text-amber-400 font-mono">30% Wgt</span>
            </div>
            <div className="text-sm font-bold text-white mb-0.5">VWAP, RSI & Breakouts</div>
            <p className="text-[11px] text-slate-300">Evaluates 50/200 EMA crossovers, Cumulative Volume Delta (CVD) & volatility.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10">
            <div className="flex justify-between items-center text-muted text-[10px] uppercase font-bold mb-1">
              <span>Layer 4: Fundamentals</span>
              <span className="text-emerald-400 font-mono">20% Wgt</span>
            </div>
            <div className="text-sm font-bold text-white mb-0.5">Earnings & Transcripts</div>
            <p className="text-[11px] text-slate-300">LLM NLP analysis of management guidance, Capex and analyst revisions.</p>
          </div>
        </div>
      </div>

      {/* Global Threat & Macro Gauges */}
      {macroIndices && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel p-4 flex flex-col justify-between" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Geopolitical Tension Index</span>
              <ShieldAlert size={16} color="#ef4444" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold text-danger">{macroIndices.geopoliticalRiskIndex}</span>
              <span className="text-xs text-muted"> / 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full" style={{ width: `${macroIndices.geopoliticalRiskIndex}%` }}></div>
            </div>
            <span className="text-[11px] text-red-400 mt-2 font-medium">Critical • Middle East & Hormuz Alert</span>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="flex items-center justify-between text-muted text-xs">
              <span>AI Evolution Vector</span>
              <Cpu size={16} color="#8b5cf6" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold" style={{ color: '#a78bfa' }}>{macroIndices.aiEvolutionVector}</span>
              <span className="text-xs text-muted"> / 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${macroIndices.aiEvolutionVector}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}></div>
            </div>
            <span className="text-[11px] text-purple-400 mt-2 font-medium">Exponential • HBM & Compute Crunch</span>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Commodity Supercycle</span>
              <Flame size={16} color="#f59e0b" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold text-amber-400">{macroIndices.commoditySupercycleGauge}</span>
              <span className="text-xs text-muted"> / 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${macroIndices.commoditySupercycleGauge}%` }}></div>
            </div>
            <span className="text-[11px] text-amber-400 mt-2 font-medium">Expansion • Crude & Metals Supply Gap</span>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="flex items-center justify-between text-muted text-xs">
              <span>Gold Reserve Accumulation</span>
              <Sparkles size={16} color="#10b981" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-bold text-emerald-400">{macroIndices.stagflationHedgeScore}</span>
              <span className="text-xs text-muted"> / 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: `${macroIndices.stagflationHedgeScore}%` }}></div>
            </div>
            <span className="text-[11px] text-emerald-400 mt-2 font-medium">Extreme Flight-To-Safety Hedge</span>
          </div>
        </div>
      )}

      {/* Trade Success Toast */}
      {tradeSuccessMsg && (
        <div className="p-4 mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <span className="font-semibold text-sm">{tradeSuccessMsg}</span>
        </div>
      )}

      {/* Rebalance Success Toast */}
      {shuffleSuccessReceipt && (
        <div className="p-5 mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-200 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={22} className="text-emerald-400" />
              <h3 className="font-bold text-lg text-white">Portfolio Successfully Auto-Shuffled!</h3>
            </div>
            <span className="text-xs text-muted">Filled: {new Date(shuffleSuccessReceipt.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-sm text-slate-300 mb-3">
            Strategy: <strong className="text-blue-300">{shuffleSuccessReceipt.scenarioName}</strong>. 
            {shuffleSuccessReceipt.scope === 'vault' ? (
              <span>
                {' '}Diverted <strong>{shuffleSuccessReceipt.divertPct}%</strong> ({currency}{shuffleSuccessReceipt.deployedCapital?.toLocaleString()}) into the Tactical Vault. 
                <strong className="text-emerald-300 ml-1">Core Long-Term Holdings ({currency}{shuffleSuccessReceipt.coreCapitalProtected?.toLocaleString()}) Remain 100% Intact 🛡️</strong>.
              </span>
            ) : (
              <span>
                {' '}Full Portfolio Rebalance ({currency}{shuffleSuccessReceipt.deployedCapital?.toLocaleString()}).
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {shuffleSuccessReceipt.orders?.map((o, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white">{o.ticker}</span>
                  <span className="text-blue-400 font-semibold">{o.pct}%</span>
                </div>
                <span className="text-[11px] text-muted truncate">{o.name}</span>
                <span className="text-[11px] text-emerald-400 mt-1 font-mono">
                  {o.units} units @ {currency}{o.fillPrice?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: Full-Width Autonomous World Intelligence Stream & Cognition Wire */}
      <div className="glass-panel p-6 mb-8">
        
        {/* Live Scanner Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={22} className="text-blue-400" />
              <h3 className="font-bold text-2xl text-white">Live Autonomous Intelligence Stream</h3>
            </div>
            <p className="text-sm text-muted">
              Continuously ingesting defense satellite telemetry, Persian Gulf shipping wires, central bank reserve reports, and AI infrastructure backlogs.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                isAutoScrolling 
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' 
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              {isAutoScrolling ? <Pause size={14} /> : <Play size={14} />}
              <span>{isAutoScrolling ? 'Auto-Scroll ON' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 text-xs">
          {[
            { id: 'ALL', label: 'All Global Intel' },
            { id: 'GEOPOLITICS', label: '🛡️ Geopolitics & War' },
            { id: 'AI', label: '💻 AI & Semis' },
            { id: 'METALS', label: '✨ Metals & Reserves' },
            { id: 'COMMODITIES', label: '🔥 Energy & Commodities' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30' 
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Live Scrolling Wire Cards - 2-Column Responsive Grid with Generous Padding */}
        <div 
          ref={scrollContainerRef}
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2" 
          style={{ 
            maxHeight: '620px', 
            overflowY: 'auto', 
            paddingBottom: '1rem' 
          }}
        >
          {loadingStream ? (
            <div className="col-span-full py-20 text-center text-muted text-sm">
              <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3"></div>
              <p>Agent scanning global satellite & news networks...</p>
            </div>
          ) : filteredStream.map((item) => {
            const isGeo = item.category.toUpperCase().includes('GEOPOLITICS');
            const isAI = item.category.toUpperCase().includes('AI');
            const isMetals = item.category.toUpperCase().includes('METALS');
            
            return (
              <div 
                key={item.id} 
                className="p-6 rounded-2xl border border-white/10 bg-slate-900/85 hover:bg-slate-900/95 transition-all shadow-xl flex flex-col justify-between"
                style={{
                  minHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-3 mb-3.5" style={{ marginBottom: '0.875rem' }}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                        isGeo ? 'bg-red-500/15 text-red-300 border-red-500/30' :
                        isAI ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                        isMetals ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                        'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}>
                        {item.category}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-400 border border-white/5">
                        {item.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Clock size={12} className="text-slate-500" />
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 className="text-base md:text-lg font-bold text-white mb-2.5 leading-snug tracking-tight" style={{ marginBottom: '0.625rem', lineHeight: '1.4' }}>
                    {item.headline}
                  </h4>

                  {/* Summary */}
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed font-normal" style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                    {item.summary}
                  </p>

                  {/* Autonomous Verdict Banner */}
                  <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs md:text-sm text-blue-200 leading-relaxed mb-4 flex items-start gap-3 shadow-inner" style={{ padding: '1rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                      <Zap size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-bold uppercase tracking-wider mb-1.5" style={{ marginBottom: '0.375rem' }}>
                        Autonomous Strategic Verdict:
                      </div>
                      <div className="text-blue-100/95 text-xs md:text-sm font-normal leading-relaxed" style={{ lineHeight: '1.6' }}>
                        {item.agentVerdict}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impact Assets Footer */}
                <div 
                  className="pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 mt-2"
                  style={{
                    paddingTop: '0.875rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginTop: 'auto'
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="text-xs text-muted font-medium" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Impact Assets:</span>
                    {item.impactAssets.map(rawSym => {
                      const sym = mapTickerToMarket(rawSym, market);
                      return (
                        <span 
                          key={sym} 
                          className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-white/10 shadow-sm"
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            padding: '0.25rem 0.625rem',
                            borderRadius: '0.5rem',
                            backgroundColor: '#1e293b',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255, 255, 255, 0.12)'
                          }}
                        >
                          {sym}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSelectedScenario(isGeo ? 'iran_war_ai' : isAI ? 'ai_supercycle' : 'stagflation_resource')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline ml-auto"
                    style={{
                      fontSize: '0.75rem',
                      color: '#60a5fa',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      marginLeft: 'auto',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Align Strategy</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Agent Telemetry Live Console */}
        <div 
          className="mt-6 p-4 rounded-2xl bg-black/90 border border-emerald-500/25 font-mono text-xs text-emerald-400 shadow-2xl"
          style={{
            marginTop: '2rem',
            padding: '1.25rem',
            borderRadius: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontFamily: 'monospace',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div 
            className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-500/15"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <div className="flex items-center gap-2 text-emerald-300 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6ee7b7', fontWeight: 700, fontSize: '0.85rem' }}>
              <Terminal size={15} />
              <span>Agent Telemetry & Web Scraping Terminal</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 animate-pulse font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#34d399', fontSize: '0.75rem' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }}></span>
              <span>LIVE COGNITION WIRE</span>
            </div>
          </div>
          <div 
            className="space-y-1.5 text-slate-300 max-h-24 overflow-y-auto pr-1"
            style={{
              maxHeight: '130px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}
          >
            {telemetryLogs.map((log, i) => (
              <p 
                key={i} 
                className="text-emerald-400/90 leading-relaxed font-mono text-[11px] hover:text-white transition-colors"
                style={{
                  color: 'rgba(52, 211, 153, 0.95)',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  margin: 0
                }}
              >
                {log}
              </p>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 2: Commodities & Metals Desk (Full-Width Spacious Trading Floor) */}
      <div className="glass-panel p-6 mb-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Flame size={24} className="text-amber-400" />
              <h2 className="text-2xl font-bold text-white">Commodities & Precious Metals Desk</h2>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Direct Trading Floor
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Acquire physical gold bullion, silver trusts, crude oil barrels, copper, and platinum into your <strong>⚡ Tactical Vault</strong> or <strong>🛡️ Long-Term Core</strong>.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: 'All Commodities' },
              { id: 'PRECIOUS', label: '🥇 Precious Metals' },
              { id: 'ENERGY', label: '🛢️ Energy & Petroleum' },
              { id: 'INDUSTRIAL', label: '⚡ Industrial Metals' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCommodityFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeCommodityFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-extrabold'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spacious 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCommodities.map((comm) => {
            const isGold = comm.ticker.includes('GC') || comm.ticker.includes('GLD');
            const isSilver = comm.ticker.includes('SI') || comm.ticker.includes('SLV');
            const isOil = comm.ticker.includes('CL') || comm.ticker.includes('BZ') || comm.ticker.includes('USO');
            const isCopper = comm.ticker.includes('HG') || comm.ticker.includes('COPPER');
            const isPlat = comm.ticker.includes('PL');
            const isGas = comm.ticker.includes('NG');

            const emblemIcon = isGold ? '🥇' : isSilver ? '🥈' : isOil ? '🛢️' : isCopper ? '⚡' : isPlat ? '💎' : isGas ? '💨' : '📦';
            const badgeColor = isGold ? 'from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/30' :
                               isSilver ? 'from-slate-400/20 to-slate-200/10 text-slate-200 border-slate-400/30' :
                               isOil ? 'from-rose-500/20 to-red-500/10 text-rose-300 border-rose-500/30' :
                               isCopper ? 'from-orange-500/20 to-amber-600/10 text-orange-300 border-orange-500/30' :
                               'from-blue-500/20 to-cyan-500/10 text-blue-300 border-blue-500/30';

            return (
              <div 
                key={comm.ticker}
                className="p-5 rounded-2xl border border-white/10 bg-slate-900/80 hover:bg-slate-900/95 hover:border-amber-500/40 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Icon Emblem, Ticker & Category */}
                  <div className="flex items-center justify-between mb-3.5 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-white/10 flex items-center justify-center text-xl shadow-inner shrink-0">
                        {emblemIcon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-base text-white tracking-wide font-mono truncate">
                          {comm.ticker}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 truncate">
                          {comm.category}
                        </div>
                      </div>
                    </div>

                    {/* Change % Badge */}
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 shrink-0 ${
                      comm.up 
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-red-500/15 text-red-300 border border-red-500/30'
                    }`}>
                      {comm.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{comm.up ? '+' : ''}{comm.changePct?.toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Name & Unit Subtitle */}
                  <h4 className="font-bold text-base text-white mb-1 group-hover:text-amber-400 transition-colors">
                    {comm.name}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {comm.description || `Benchmark physical trading contract quoted per ${comm.unit}.`}
                  </p>
                </div>

                {/* Bottom Row: Large Clear Price & Trade Button with explicit stacked layout */}
                <div className="pt-4 border-t border-white/10 flex items-end justify-between mt-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Live Quote ({comm.unit}):
                    </div>
                    <div className="text-xl font-extrabold text-white font-mono tracking-tight leading-tight">
                      {currency}{comm.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCommodity(comm);
                      setCommodityTradeUnits(1);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5 hover:scale-105 shrink-0"
                  >
                    <ShoppingBag size={14} />
                    <span>Trade</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dedicated Interactive Commodity Trade Modal */}
        {selectedCommodity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="glass-panel p-6 max-w-lg w-full border border-amber-500/40 rounded-2xl animate-fade-in shadow-2xl">
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Flame size={22} className="text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Acquire {selectedCommodity.name}</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedCommodity(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 mb-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-blue-400">{selectedCommodity.ticker}</span>
                  <h4 className="text-base font-bold text-white">{selectedCommodity.name}</h4>
                  <span className="text-xs text-muted">{selectedCommodity.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted block">Market Price</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {currency}{selectedCommodity.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 block">per {selectedCommodity.unit}</span>
                </div>
              </div>

              <form onSubmit={handleBuyCommodity}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      Units to Acquire ({selectedCommodity.unit})
                    </label>
                    <input 
                      type="number"
                      step="any"
                      min="0.01"
                      value={commodityTradeUnits}
                      onChange={(e) => setCommodityTradeUnits(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      Destination Bucket
                    </label>
                    <select
                      value={tradeTargetBucket}
                      onChange={(e) => setTradeTargetBucket(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-amber-400"
                    >
                      <option value="agent_vault">⚡ Global Agent Tactical Vault</option>
                      <option value="core">🛡️ Core Long-Term Portfolio</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-1.5 text-xs text-slate-300 mb-5">
                  <div className="flex justify-between items-center">
                    <span>Estimated Total Cost:</span>
                    <strong className="text-white font-mono text-sm">
                      {currency}{(Number(selectedCommodity.price || 0) * Number(commodityTradeUnits || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Available Cash Buying Power:</span>
                    <span className="font-mono">{currency}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedCommodity(null)}
                    className="btn btn-outline py-2.5 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary py-2.5 px-6 text-sm font-bold flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
                  >
                    <DollarSign size={16} /> Confirm Acquisition
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>

      {/* SECTION 3: Agent Allocation Recommendation & Capital Divergence Desk */}
      <div className="glass-panel p-6 mb-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={20} className="text-purple-400" />
              <h2 className="text-xl font-bold text-white">Autonomous Portfolio Allocation Recommendation</h2>
            </div>
            <p className="text-xs text-muted">
              Select an intelligence scenario. Choose how much capital you want to divert into the Global Agent Tactical Vault, keeping your core portfolio intact.
            </p>
          </div>

          {/* Quick Catalyst Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedScenario('iran_war_ai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedScenario === 'iran_war_ai'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldAlert size={14} className="text-red-400" />
              <span>Iran War & AI Evolution Split</span>
            </button>

            <button
              onClick={() => setSelectedScenario('ai_supercycle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedScenario === 'ai_supercycle'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Cpu size={14} className="text-purple-400" />
              <span>AI Compute Supercycle</span>
            </button>

            <button
              onClick={() => setSelectedScenario('stagflation_resource')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedScenario === 'stagflation_resource'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Flame size={14} className="text-amber-400" />
              <span>Stagflation Resource Shield</span>
            </button>
          </div>
        </div>

        {/* CAPITAL DIVERGENCE & PORTFOLIO PROTECTION SELECTOR */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-500/30 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sliders size={18} className="text-blue-400" />
                <h3 className="font-bold text-white text-base">Capital Divergence & Protection Scope</h3>
              </div>
              <p className="text-xs text-slate-300">
                Decide how much of your total portfolio ({currency}{totalPortfolioValue.toLocaleString()}) to allocate into this tactical strategy.
              </p>
            </div>

            {/* Scope Switcher: Vault vs Full */}
            <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => setRebalanceScope('vault')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  rebalanceScope === 'vault'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck size={14} />
                <span>Tactical Vault (Keep Long-Term Intact)</span>
              </button>
              <button
                onClick={() => setRebalanceScope('full')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  rebalanceScope === 'full'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap size={14} />
                <span>Full Portfolio (100%)</span>
              </button>
            </div>
          </div>

          {rebalanceScope === 'vault' ? (
            <div className="space-y-4 pt-2 border-t border-white/5">
              
              {/* Divergence Percent Buttons & Slider */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className="text-xs font-semibold text-slate-300 shrink-0">Divert Allocation %:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[10, 20, 30, 40, 50].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDivertPct(pct)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        divertPct === pct 
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pct}% {pct === 20 ? '(Recommended)' : ''}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-48 ml-auto">
                  <input 
                    type="range"
                    min="5"
                    max="70"
                    step="5"
                    value={divertPct}
                    onChange={(e) => setDivertPct(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-blue-400 w-10 text-right">{divertPct}%</span>
                </div>
              </div>

              {/* Status Banner: Core Protected vs Vault Diverted */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-blue-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Global Agent Tactical Capital</span>
                      <span className="text-[11px] text-blue-300 font-mono">Diverting {divertPct}% of Total</span>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-blue-400 font-mono">
                    {currency}{capitalToDeploy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Long-Term Core Portfolio</span>
                      <span className="text-[11px] text-emerald-300 font-mono">100% Protected & Untouched</span>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    {currency}{protectedCoreCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Auto-Pilot Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  <div>
                    <span className="font-bold text-white">Autonomous Agent Auto-Pilot</span>
                    <span className="text-muted block text-[11px]">
                      Allow Global Agent to continuously adjust this Tactical Vault as geopolitical events evolve.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setVaultAutoPilot(!vaultAutoPilot)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    vaultAutoPilot 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {vaultAutoPilot ? '● AUTO-PILOT ON' : 'PAUSED'}
                </button>
              </div>

            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 mt-2 flex items-center justify-between">
              <span>Full 100% Rebalance will reallocate all existing holdings ({currency}{totalPortfolioValue.toLocaleString()}) into the target strategy.</span>
              <span className="font-bold text-white">Full Deploy: {currency}{totalPortfolioValue.toLocaleString()}</span>
            </div>
          )}

        </div>

        {loadingRec ? (
          <div className="py-16 text-center text-muted">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm">Synthesizing macro thesis and calculating asset weights...</p>
          </div>
        ) : recommendation && (
          <div className="space-y-6">
            
            {/* Catalyst Rationale Banner */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[11px] text-purple-400 font-bold uppercase tracking-wider block mb-1">
                  Active Intelligence Catalyst: {recommendation.title}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">{recommendation.thesis}</p>
              </div>

              <div className="shrink-0 flex items-center gap-4 text-right">
                <div>
                  <span className="text-[11px] text-muted block">Risk Profile</span>
                  <span className="text-xs font-bold text-amber-400">{recommendation.macroRiskScore}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted block">Alpha Potential</span>
                  <span className="text-xs font-bold text-emerald-400">{recommendation.expectedAlpha}</span>
                </div>
              </div>
            </div>

            {/* Proportional Split Bar Visualizer */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-slate-300">
                  Target Asset Allocation ({rebalanceScope === 'vault' ? `Tactical Vault ${divertPct}% ($${capitalToDeploy.toLocaleString()})` : 'Full 100%'})
                </span>
                <span className="text-muted">Target Weights: 100% of Deployed Capital</span>
              </div>
              
              <div className="w-full h-8 rounded-xl overflow-hidden flex shadow-inner bg-slate-800">
                {recommendation.allocations.map((group, idx) => {
                  const colors = [
                    'linear-gradient(135deg, #3b82f6, #1d4ed8)', // blue for chips
                    'linear-gradient(135deg, #f59e0b, #d97706)', // gold/amber
                    'linear-gradient(135deg, #ef4444, #b91c1c)', // crude/red
                    'linear-gradient(135deg, #10b981, #047857)', // green for e-comm
                  ];
                  return (
                    <div 
                      key={idx}
                      style={{ 
                        width: `${group.categoryPct}%`, 
                        background: colors[idx % colors.length] 
                      }}
                      className="h-full flex items-center justify-center text-white text-xs font-bold px-2 truncate transition-all duration-500"
                      title={`${group.category}: ${group.categoryPct}%`}
                    >
                      {group.categoryPct}% {group.category}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Cards for Each Sector with Named Underlying Tickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendation.allocations.map((group, idx) => {
                const borderColors = ['border-blue-500/40', 'border-amber-500/40', 'border-red-500/40', 'border-emerald-500/40'];
                const badgeBgs = ['bg-blue-500/10 text-blue-300', 'bg-amber-500/10 text-amber-300', 'bg-red-500/10 text-red-300', 'bg-emerald-500/10 text-emerald-300'];
                
                return (
                  <div key={idx} className={`p-4 rounded-xl border ${borderColors[idx % 4]} bg-slate-900/60 flex flex-col justify-between`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${badgeBgs[idx % 4]}`}>
                          {group.category}
                        </span>
                        <span className="text-base font-extrabold text-white">{group.categoryPct}%</span>
                      </div>

                      <div className="space-y-2.5 mt-3">
                        {group.assets.map((asset, aIdx) => {
                          const dollarAlloc = (capitalToDeploy * (asset.pct / 100));
                          const estUnits = (dollarAlloc / asset.price).toFixed(asset.assetType === 'commodity' ? 3 : 2);
                          
                          return (
                            <div key={aIdx} className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <div className="font-extrabold text-sm text-white font-mono tracking-tight">{asset.ticker}</div>
                                  <div className="text-xs text-slate-400 font-medium">{asset.name}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-bold text-blue-400">{asset.pct}%</div>
                                  <div className="text-[11px] text-slate-300 font-mono">{currency}{asset.price.toFixed(2)}</div>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                                <span>Value: <strong className="text-white font-mono">{currency}{dollarAlloc.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
                                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">~{estUnits} units</span>
                              </div>
                              <p className="text-[11px] text-slate-400 italic leading-relaxed pt-0.5">{asset.rationale}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prompt for Instant Shuffling Action */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-slate-900/40 border border-blue-500/30 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Zap size={20} className="text-amber-400" />
                  Ready to Execute Auto-Shuffle?
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {rebalanceScope === 'vault' ? (
                    <span>
                      Diverts <strong>{divertPct}% ({currency}{capitalToDeploy.toLocaleString()})</strong> into the Tactical Vault. 
                      Your remaining <strong>{currency}{protectedCoreCapital.toLocaleString()}</strong> Long-Term holdings remain completely protected and untouched.
                    </span>
                  ) : (
                    <span>
                      Reallocates your entire <strong>{currency}{totalPortfolioValue.toLocaleString()}</strong> portfolio.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowShuffleConfirmModal(true)}
                  className="btn btn-primary px-6 py-3 text-sm font-bold flex items-center gap-2 shadow-xl shadow-blue-500/30 hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #10b981, #2563eb)' }}
                >
                  <Sparkles size={18} />
                  Auto-Shuffle {rebalanceScope === 'vault' ? `${divertPct}% Vault` : 'Portfolio'} Now
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {showShuffleConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel p-6 max-w-xl w-full border border-blue-500/40 rounded-2xl animate-fade-in shadow-2xl">
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Zap size={22} className="text-amber-400" />
                <h3 className="text-lg font-bold text-white">Confirm Autonomous Portfolio Shuffle</h3>
              </div>
              {!isShuffling && (
                <button 
                  onClick={() => setShowShuffleConfirmModal(false)}
                  className="text-muted hover:text-white text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {isShuffling ? (
              <div className="py-10 text-center">
                <div className="inline-block animate-spin w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
                <h4 className="font-bold text-white text-base mb-1">Executing Real-Time Rebalancing...</h4>
                <p className="text-xs text-blue-300 font-mono animate-pulse">{shuffleStep}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-200 mb-4 leading-relaxed">
                  The Autonomous Agent will execute the <strong>{recommendation?.title}</strong> allocation with the following configuration:
                </p>

                {/* Scope Summary Badge */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 mb-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Rebalance Scope:</span>
                    <strong className="text-white font-semibold">
                      {rebalanceScope === 'vault' ? `Tactical Vault (${divertPct}%)` : 'Full Portfolio (100%)'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Capital to Allocate:</span>
                    <strong className="text-blue-400 font-mono text-sm">{currency}{capitalToDeploy.toLocaleString()}</strong>
                  </div>
                  {rebalanceScope === 'vault' && (
                    <div className="flex justify-between items-center text-emerald-400 pt-1 border-t border-white/5">
                      <span>Long-Term Core Holdings:</span>
                      <strong className="font-mono text-sm">Protected ({currency}{protectedCoreCapital.toLocaleString()}) 🛡️</strong>
                    </div>
                  )}
                </div>

                {/* Breakdown of Orders */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 space-y-2 mb-4 text-xs">
                  <span className="text-[11px] text-muted uppercase font-bold tracking-wider block mb-1">Target Asset Split:</span>
                  {recommendation?.allocations.map((group, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                      <span className="font-semibold text-slate-300">
                        • {group.category} ({group.assets.map(a => a.ticker).join(', ')})
                      </span>
                      <span className="font-bold text-blue-400">
                        {group.categoryPct}% ({currency}{(capitalToDeploy * (group.categoryPct / 100)).toLocaleString()})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-5 flex items-start gap-2">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>
                    When you confirm <strong>"YES"</strong>, the agent will instantly purchase the designated units of Gold, Oil, NVDA, MU, and AMZN at live prices.
                    {rebalanceScope === 'vault' ? ' Your long-term core holdings will remain untouched.' : ''}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setShowShuffleConfirmModal(false)}
                    className="btn btn-outline py-2.5 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleExecuteShuffle}
                    className="btn btn-primary py-2.5 px-6 text-sm font-bold flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    <CheckCircle2 size={16} />
                    YES, Auto-Shuffle Now
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Audit History of Past Rebalancings */}
      {rebalanceHistory && rebalanceHistory.length > 0 && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-blue-400" />
            <h3 className="font-bold text-base text-white">Autonomous Rebalance Execution Audit Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-muted border-b border-white/5">
                  <th className="py-2.5 px-3">Execution Timestamp</th>
                  <th className="py-2.5 px-3">Strategy Scenario</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 px-3">Deployed Capital</th>
                  <th className="py-2.5 px-3">Core Protected</th>
                  <th className="py-2.5 px-3">Orders Filled</th>
                </tr>
              </thead>
              <tbody>
                {rebalanceHistory.slice(0, 5).map((log, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 font-mono">
                    <td className="py-2.5 px-3 text-slate-300">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-blue-300">{log.scenarioName}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.scope === 'vault' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {log.scope === 'vault' ? `Vault (${log.divertPct}%)` : 'Full'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-bold">{currency}{log.deployedCapital?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-emerald-400">
                      {log.coreCapitalProtected ? `${currency}${log.coreCapitalProtected.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      {log.orders?.map(o => `${o.ticker} (${o.pct}%)`).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
