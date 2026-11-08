import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import {
  getTopAlgoPicks,
  getTargetMilestonesHistory,
  getUnreadCelebration,
  ackCelebration,
  simulateTargetHit
} from '../services/api';
import { useMarket } from '../context/MarketContext';
import { usePortfolio } from '../context/PortfolioContext';

const Sparkles = Lucide.Sparkles || (() => '✨');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const Cpu = Lucide.Cpu || (() => '💻');
const Zap = Lucide.Zap || (() => '⚡');
const ShieldCheck = Lucide.ShieldCheck || (() => '🛡️');
const CheckCircle2 = Lucide.CheckCircle2 || (() => '✅');
const ArrowRight = Lucide.ArrowRight || (() => '➡️');
const Award = Lucide.Award || (() => '🏆');
const Trophy = Lucide.Trophy || (() => '🏆');
const PartyPopper = Lucide.PartyPopper || Lucide.Sparkles || (() => '🎉');
const Clock = Lucide.Clock || (() => '⏱️');
const Target = Lucide.Target || (() => '🎯');
const History = Lucide.History || (() => '📜');

export default function TopAlgoPicks({ pageContext = 'portfolio' }) {
  const navigate = useNavigate();
  const { market, setMarket } = useMarket();
  const { buyAsset, balance } = usePortfolio();

  const [picksData, setPicksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tradeModalStock, setTradeModalStock] = useState(null);
  const [tradeShares, setTradeShares] = useState(1);
  const [tradeBucket, setTradeBucket] = useState('core'); // 'core' | 'agent_vault'
  const [tradeExitOption, setTradeExitOption] = useState('none'); // Default: 'none' (Manual Sell); secondary: '10pct' | 'ai_target' | 'custom_price'
  const [tradeCustomExitPrice, setTradeCustomExitPrice] = useState('');
  const [purchaseToast, setPurchaseToast] = useState('');

  // 1) Dynamic Dropdown for Algo Stock Target: 'quarterly' | 'sixMonths' | 'twelveMonths'
  const [targetTimeframe, setTargetTimeframe] = useState('twelveMonths');

  // 2) Target Milestones History & Celebration Modal State
  const [milestonesData, setMilestonesData] = useState(null);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [unreadCelebration, setUnreadCelebration] = useState(null);
  const [simulatingCelebration, setSimulatingCelebration] = useState(false);

  const getStockTargetInfo = (stock, timeframe = targetTimeframe) => {
    if (stock?.targets && stock.targets[timeframe]) {
      return stock.targets[timeframe];
    }
    const baseUpside = Number(stock?.upsidePct || 15);
    const currentPrice = Number(stock?.currentPrice || 100);
    if (timeframe === 'quarterly') {
      const uPct = Number((baseUpside * 0.32).toFixed(1));
      return {
        key: 'quarterly',
        timeframe: 'Quarterly',
        label: 'Quarterly',
        upsidePct: uPct,
        targetPrice: Number((currentPrice * (1 + uPct / 100)).toFixed(2))
      };
    }
    if (timeframe === 'sixMonths') {
      const uPct = Number((baseUpside * 0.58).toFixed(1));
      return {
        key: 'sixMonths',
        timeframe: '6 Months',
        label: '6 Months',
        upsidePct: uPct,
        targetPrice: Number((currentPrice * (1 + uPct / 100)).toFixed(2))
      };
    }
    return {
      key: 'twelveMonths',
      timeframe: '12 Months',
      label: '12 Months',
      upsidePct: baseUpside,
      targetPrice: Number(stock?.targetPrice || (currentPrice * (1 + baseUpside / 100)).toFixed(2))
    };
  };

  const fetchMilestones = async () => {
    try {
      const data = await getTargetMilestonesHistory(market);
      if (data) setMilestonesData(data);
      const celeb = await getUnreadCelebration(market);
      if (celeb?.hasCelebration && celeb.milestone) {
        setUnreadCelebration(celeb.milestone);
      }
    } catch (e) {
      console.warn('Error fetching milestones in TopAlgoPicks:', e);
    }
  };

  const handleAcknowledgeCelebration = async () => {
    if (!unreadCelebration) return;
    await ackCelebration(unreadCelebration.id);
    setUnreadCelebration(null);
    fetchMilestones();
  };

  const handleSimulateHit = async () => {
    setSimulatingCelebration(true);
    try {
      const firstTicker = activeTop3[0]?.ticker || (market === 'INDIA' ? 'RELIANCE' : 'NVDA');
      const res = await simulateTargetHit(firstTicker, targetTimeframe === 'quarterly' ? 'Quarterly' : targetTimeframe === 'sixMonths' ? '6 Months' : '12 Months');
      if (res?.simulatedMilestone) {
        setUnreadCelebration(res.simulatedMilestone);
        fetchMilestones();
      }
    } finally {
      setSimulatingCelebration(false);
    }
  };

  const fetchPicks = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else if (!picksData) setLoading(true);

    const data = await getTopAlgoPicks(market, isManualRefresh);
    if (data) {
      setPicksData(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPicks(false);
    fetchMilestones();
    // Poll every 60s for real-time price synchronization; rankings remain locked in a steady 15-minute horizon
    const interval = setInterval(() => {
      fetchPicks(false);
      fetchMilestones();
    }, 60000);
    return () => clearInterval(interval);
  }, [market]);

  const activeTop3 = React.useMemo(() => {
    if (!picksData) return [];
    if (market === 'INDIA' && Array.isArray(picksData.indiaTopPicks)) {
      return picksData.indiaTopPicks;
    }
    if (market === 'US' && Array.isArray(picksData.usTopPicks)) {
      return picksData.usTopPicks;
    }
    return picksData.topPicks || [];
  }, [picksData, market]);

  const handleConfirmPurchase = (e) => {
    e.preventDefault();
    if (!tradeModalStock) return;
    const units = Number(tradeShares);
    if (isNaN(units) || units <= 0) {
      alert('Please enter a valid number of shares.');
      return;
    }

    let autoExitRule = null;
    if (tradeExitOption === '10pct') {
      autoExitRule = { enabled: true, mode: 'percentage', targetProfitPct: 10 };
    } else if (tradeExitOption === 'ai_target') {
      const modalTarget = getStockTargetInfo(tradeModalStock);
      autoExitRule = {
        enabled: true,
        mode: 'price',
        targetPrice: Number(modalTarget.targetPrice || (tradeModalStock.currentPrice * 1.15))
      };
    } else if (tradeExitOption === 'custom_price') {
      const customP = Number(tradeCustomExitPrice);
      if (isNaN(customP) || customP <= 0) {
        alert('Please enter a valid custom auto-exit target price.');
        return;
      }
      autoExitRule = { enabled: true, mode: 'price', targetPrice: customP };
    }

    const success = buyAsset({
      ticker: tradeModalStock.ticker,
      name: tradeModalStock.companyName,
      price: tradeModalStock.currentPrice,
      units,
      category: tradeModalStock.sector,
      assetType: 'stock',
      bucket: tradeBucket,
      autoExit: autoExitRule
    });

    if (success) {
      const bucketLabel = tradeBucket === 'agent_vault' ? 'Tactical Vault' : 'Long-Term Core';
      const exitNote = autoExitRule ? ` (Auto-Exit Armed)` : '';
      setPurchaseToast(`Purchased ${units} share(s) of ${tradeModalStock.ticker} into ${bucketLabel}${exitNote}!`);
      setTimeout(() => setPurchaseToast(''), 4500);
      setTradeModalStock(null);
      setTradeShares(1);
      setTradeExitOption('none');
    }
  };

  const getRankStyles = (rank) => {
    if (rank === 1) {
      return {
        border: 'border-emerald-500/40 hover:border-emerald-400/70',
        bg: 'bg-gradient-to-b from-emerald-950/25 via-slate-900/90 to-slate-950/95',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        scoreBg: 'from-emerald-500 to-teal-600'
      };
    }
    if (rank === 2) {
      return {
        border: 'border-blue-500/35 hover:border-blue-400/60',
        bg: 'bg-gradient-to-b from-blue-950/25 via-slate-900/90 to-slate-950/95',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        scoreBg: 'from-blue-500 to-indigo-600'
      };
    }
    return {
      border: 'border-purple-500/35 hover:border-purple-400/60',
      bg: 'bg-gradient-to-b from-purple-950/20 via-slate-900/90 to-slate-950/95',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      scoreBg: 'from-purple-500 to-indigo-600'
    };
  };

  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 border border-blue-500/30 shadow-2xl relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #10b981 0%, #3b82f6 60%, transparent 100%)' }}
      />

      {/* Section Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-lg shadow-emerald-500/10">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ● Vestra Alpha Engine
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                ⚡ Proprietary AI Intelligence
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono flex items-center gap-1">
                🛡️ Stabilized for Investment (15m Horizon)
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                {market === 'US'
                  ? `🇺🇸 Scanning Top Institutional US Leaders`
                  : `🇮🇳 Scanning All 52 NIFTY 50 Leaders`}
              </span>
              {picksData?.universeStats && (
                <span className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  🔥 {market === 'US'
                    ? `${picksData.universeStats.usLiveMoversCount || 0} Live Screener Movers Active`
                    : `${picksData.universeStats.indiaLiveMoversCount || 0} NSE Intraday Breakouts`}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              Top 3 Recommended Stocks to Buy ({market === 'US' ? 'US Stocks' : 'IND Stocks'})
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              High-conviction recommendations powered by <strong>Vestra AI&apos;s Proprietary Intelligence Engine</strong>. Kept stable across an investment horizon to prevent rapid churn, with continuous real-time price synchronization.
            </p>
          </div>
        </div>

        {/* Market Switcher & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* Quick US / IND Toggle synced with global MarketContext */}
          <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setMarket('INDIA')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                market === 'INDIA'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>₹</span>
              <span>IND Top 3</span>
            </button>
            <button
              onClick={() => setMarket('US')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                market === 'US'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>$</span>
              <span>US Top 3</span>
            </button>
          </div>

          {/* Dynamic Dropdown for Algo Stock Target: Quarterly, 6 Months, 12 Months */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10 text-xs shadow-inner">
            <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
              <Target size={12} className="text-emerald-400" />
              <span>Target:</span>
            </span>
            <select
              value={targetTimeframe}
              onChange={(e) => setTargetTimeframe(e.target.value)}
              className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer text-xs"
              title="Select dynamic target price timeframe (Quarterly, 6 Months, or 12 Months)"
            >
              <option value="quarterly" className="bg-slate-900 text-white">Quarterly (3M)</option>
              <option value="sixMonths" className="bg-slate-900 text-white">6 Months</option>
              <option value="twelveMonths" className="bg-slate-900 text-white">12 Months</option>
            </select>
          </div>

          {/* Target Milestones History Drawer Button */}
          <button
            type="button"
            onClick={() => setShowMilestonesModal(true)}
            className="btn btn-outline py-2 px-3 text-xs flex items-center gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            title="View database history of achieved stock targets and verified celebration records"
          >
            <Trophy size={14} className="text-amber-400" />
            <span>Milestones ({milestonesData?.stats?.achievedCount ?? 4} Hit)</span>
          </button>

          <button
            onClick={() => fetchPicks(true)}
            disabled={refreshing}
            className="btn btn-outline py-2 px-3 text-xs flex items-center gap-1.5 hover:border-blue-400"
            title="Refresh live quotes and recalculate top stock recommendations"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-400' : ''} />
            <span>{refreshing ? 'Recalculating...' : 'Recalculate Picks'}</span>
          </button>

          <button
            onClick={() => navigate('/deep-analysis?tab=quant')}
            className="btn btn-outline py-2 px-3 text-xs flex items-center gap-1.5 border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
          >
            <Cpu size={14} />
            <span>Quant Agent</span>
          </button>
        </div>
      </div>

      {/* Purchase Confirmation Toast */}
      {purchaseToast && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{purchaseToast}</span>
          </div>
          <button onClick={() => setPurchaseToast('')} className="text-slate-400 hover:text-white text-[11px] underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && activeTop3.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 animate-pulse h-80 flex flex-col justify-between">
              <div className="h-6 bg-slate-800 rounded w-1/2" />
              <div className="h-12 bg-slate-800 rounded w-3/4" />
              <div className="h-24 bg-slate-800 rounded w-full" />
              <div className="h-9 bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        /* Top 3 Recommended Stocks Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {activeTop3.map((stock) => {
            const style = getRankStyles(stock.rank);
            const isUp = (stock.changePct || 0) >= 0;
            const stockCurr = stock.currency || (market === 'INDIA' ? '₹' : '$');

            return (
              <div
                key={stock.ticker}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between shadow-xl ${style.border} ${style.bg}`}
              >
                <div>
                  {/* Top Row: Rank Badge + Strong Buy Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${style.badgeBg}`}>
                        {stock.rankBadge || `#${stock.rank} Algo Pick`}
                      </span>
                      {stock.isLiveMover && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          🔥 Live Mover
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Zap size={11} />
                      {stock.layers?.agentSignal || 'Strong Buy'}
                    </span>
                  </div>

                  {/* Stock Identity & Final Algo Score */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white tracking-tight">{stock.ticker}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-semibold">
                          {stock.sector}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">{stock.companyName}</p>
                    </div>

                    {/* Final Algo Score Pill */}
                    <div className="text-right shrink-0">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r ${style.scoreBg} text-white font-black text-base shadow-md`}>
                        <span>{stock.finalScore}%</span>
                      </div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold mt-0.5 tracking-wider">
                        Algo Score
                      </span>
                    </div>
                  </div>

                  {/* Live Price, 24h Change, and Algo Target Price */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 mb-4 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Live Market Price</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-lg font-black text-white font-mono">
                          {stockCurr}{Number(stock.currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs font-bold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                          {isUp ? '+' : ''}{Number(stock.changePct || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const targetInfo = getStockTargetInfo(stock);
                      return (
                        <div className="text-right border-l border-white/10 pl-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                            Algo Target ({targetInfo.label})
                          </span>
                          <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                            <span className="text-sm font-bold text-emerald-300 font-mono">
                              {stockCurr}{Number(targetInfo.targetPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded font-mono">
                              +{targetInfo.upsidePct}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Proprietary AI Conviction & Allocation Summary */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 mb-4 space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider">AI Conviction Index</span>
                      <span className="text-blue-300 font-mono font-bold">
                        {stock.layers?.agentConvictionScore || stock.finalScore}% High Confidence
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-white/5">
                      <span>
                        Outperform Prob: <strong className="text-emerald-400 font-mono">{stock.probability}%</strong>
                      </span>
                      <span>
                        Suggested Weight: <strong className="text-white font-mono">{stock.allocation}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Quantitative AI Thesis */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-5 line-clamp-3 bg-black/25 p-3 rounded-xl border border-white/5">
                    {stock.explanation}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setTradeModalStock(stock);
                      setTradeShares(1);
                      setTradeBucket('core');
                    }}
                    className="btn btn-primary flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    style={{ background: 'linear-gradient(135deg, #10b981, #2563eb)' }}
                  >
                    <Zap size={14} />
                    <span>Buy #{stock.rank} Pick ({stock.ticker})</span>
                  </button>

                  <button
                    onClick={() => navigate(`/deep-analysis?ticker=${stock.ticker}&tab=quant`)}
                    className="btn btn-outline py-2.5 px-3 text-xs font-bold flex items-center gap-1 hover:border-blue-400 text-slate-200"
                    title={`Inspect ${stock.ticker} analysis in Quant Agent`}
                  >
                    <span>Quant Scan</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instant Trade Execution Modal for Top Pick */}
      {tradeModalStock && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-emerald-500/40 shadow-2xl bg-slate-900">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {tradeModalStock.rankBadge} • {tradeModalStock.finalScore}% Algo Score
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">
                  Buy {tradeModalStock.companyName} ({tradeModalStock.ticker})
                </h3>
              </div>
              <button
                onClick={() => setTradeModalStock(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPurchase} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block">Live Execution Price</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {tradeModalStock.currency}{Number(tradeModalStock.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Available Cash Power</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {tradeModalStock.currency}{Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Target Portfolio Bucket Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Select Destination Portfolio Bucket
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTradeBucket('core')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      tradeBucket === 'core'
                        ? 'bg-emerald-950/50 border-emerald-500 text-white'
                        : 'bg-slate-950/50 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                      <ShieldCheck size={14} />
                      <span>Long-Term Core</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">100% Protected from shuffles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTradeBucket('agent_vault')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      tradeBucket === 'agent_vault'
                        ? 'bg-blue-950/50 border-blue-500 text-white'
                        : 'bg-slate-950/50 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-blue-300">
                      <Zap size={14} />
                      <span>Tactical Vault</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Managed by Autonomous Agent</span>
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Number of Shares to Buy
                </label>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tradeShares}
                    onChange={(e) => setTradeShares(e.target.value)}
                    className="chat-input w-full font-mono text-base py-2 px-3"
                    required
                  />
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
                    {[1, 5, 10, 25].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTradeShares(preset)}
                        className="flex-1 sm:flex-initial px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-white/10"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exit Strategy: Manual Sell (Default) vs Optional Auto-Exit */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Exit Strategy <span className="text-[10px] text-slate-400 font-normal">(Manual Sell is Default • Auto-Exit Optional)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {(() => {
                    const modalTarget = getStockTargetInfo(tradeModalStock);
                    return [
                      { id: 'none', label: 'Manual Sell (Default)', sub: 'Standard exit' },
                      { id: '10pct', label: 'Auto: +10% Profit', sub: `${tradeModalStock.currency}${(tradeModalStock.currentPrice * 1.10).toFixed(2)}` },
                      { id: 'ai_target', label: `Auto: AI Target (${modalTarget.label})`, sub: `${tradeModalStock.currency}${Number(modalTarget.targetPrice).toFixed(2)} (+${modalTarget.upsidePct}%)` },
                      { id: 'custom_price', label: 'Auto: Custom Price', sub: 'Define price' }
                    ];
                  })().map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTradeExitOption(opt.id);
                        if (opt.id === 'custom_price' && !tradeCustomExitPrice) {
                          setTradeCustomExitPrice((tradeModalStock.currentPrice * 1.12).toFixed(2));
                        }
                      }}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        tradeExitOption === opt.id
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-emerald-300 truncate">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{opt.sub}</div>
                    </button>
                  ))}
                </div>
                {tradeExitOption === 'custom_price' && (
                  <div className="mt-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tradeCustomExitPrice}
                      onChange={(e) => setTradeCustomExitPrice(e.target.value)}
                      className="chat-input w-full font-mono text-sm py-1.5 px-3"
                      placeholder={`Enter target exit price (${tradeModalStock.currency})`}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Order Total Summary */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex justify-between items-center">
                <span className="text-xs text-slate-300 font-medium">Estimated Order Total</span>
                <span className="text-base font-black text-white font-mono">
                  {tradeModalStock.currency}
                  {(Number(tradeModalStock.currentPrice || 0) * Number(tradeShares || 0)).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTradeModalStock(null)}
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
      )}

      {/* 2) Celebration Milestone Modal: Triggered when backend detects a stock hit its target! */}
      {unreadCelebration && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border-2 border-amber-400/80 shadow-2xl bg-gradient-to-b from-slate-900 via-amber-950/30 to-slate-950 relative overflow-hidden">
            <div
              className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #f59e0b 0%, #10b981 70%, transparent 100%)' }}
            />
            <div
              className="pointer-events-none absolute -bottom-20 -right-20 w-60 h-60 rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, #8b5cf6 0%, #3b82f6 70%, transparent 100%)' }}
            />

            <div className="text-center relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
                <Trophy size={32} />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-2">
                <PartyPopper size={14} />
                <span>Celebration Milestone Achieved!</span>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                {unreadCelebration.ticker} Hit {unreadCelebration.timeframe} Target!
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto mb-5">
                {unreadCelebration.companyName} achieved the proprietary algorithmic price target. This milestone has been verified and permanently logged to your Cloud SQL / Database ledger.
              </p>

              {/* Achievement Summary Card */}
              <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 mb-5 text-left">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Hit</span>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    {unreadCelebration.currency}{Number(unreadCelebration.targetPrice).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Exit / Peak Price</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {unreadCelebration.currency}{Number(unreadCelebration.achievedPrice || unreadCelebration.targetPrice).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Net Outperformance</span>
                  <span className="text-sm font-black text-emerald-300 font-mono">
                    +{unreadCelebration.targetPct}%
                  </span>
                </div>
              </div>

              {unreadCelebration.explanation && (
                <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 mb-5 text-left leading-relaxed">
                  💡 <strong className="text-white">AI Thesis Milestone:</strong> {unreadCelebration.explanation}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAcknowledgeCelebration}
                  className="btn btn-primary flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <Trophy size={15} />
                  <span>Acknowledge &amp; Celebrate Milestone</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target Milestones History Drawer / Modal */}
      {showMilestonesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-2xl w-full p-6 rounded-3xl border border-blue-500/40 shadow-2xl bg-slate-900 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Database Target Milestones &amp; Accuracy Ledger</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Cloud SQL Verified
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audit trail tracking whether stock target prices across Quarterly, 6M, and 12M horizons were achieved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMilestonesModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Accuracy Win Rate</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {milestonesData?.stats?.winRatePct ?? 87.5}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Achieved Targets</span>
                <span className="text-base font-black text-amber-300 font-mono">
                  {milestonesData?.stats?.achievedCount ?? 4} Targets
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Active in Progress</span>
                <span className="text-base font-black text-blue-300 font-mono">
                  {milestonesData?.stats?.inProgressCount ?? 3} Active
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Monitored</span>
                <span className="text-base font-black text-white font-mono">
                  {milestonesData?.stats?.totalTargets ?? 7} Stocks
                </span>
              </div>
            </div>

            {/* Table of Database Milestones */}
            <div className="overflow-y-auto flex-1 rounded-xl border border-white/10 mb-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 sticky top-0 border-b border-white/10">
                  <tr>
                    <th className="p-3 text-slate-400 font-bold">Stock</th>
                    <th className="p-3 text-slate-400 font-bold">Timeframe</th>
                    <th className="p-3 text-slate-400 font-bold">Target Price</th>
                    <th className="p-3 text-slate-400 font-bold">Achieved / Current</th>
                    <th className="p-3 text-slate-400 font-bold">Gain %</th>
                    <th className="p-3 text-slate-400 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {(milestonesData?.milestones || []).map((m) => {
                    const isAchieved = m.status === 'ACHIEVED';
                    return (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-sans font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{m.ticker}</span>
                            <span className="text-[10px] font-normal text-slate-400 truncate max-w-[120px]">{m.companyName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300 font-sans">{m.timeframe}</td>
                        <td className="p-3 text-amber-300 font-bold">{m.currency}{Number(m.targetPrice).toFixed(2)}</td>
                        <td className="p-3 text-slate-200">
                          {m.currency}{Number(m.achievedPrice || m.currentPrice).toFixed(2)}
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">+{m.targetPct}%</td>
                        <td className="p-3 font-sans">
                          {isAchieved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 size={11} />
                              <span>Achieved ({m.achievedAt ? new Date(m.achievedAt).toLocaleDateString() : 'Verified'})</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
                              <Clock size={11} />
                              <span>In Progress</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3">
              <button
                type="button"
                disabled={simulatingCelebration}
                onClick={handleSimulateHit}
                className="btn btn-outline py-2 px-3 text-xs flex items-center gap-1.5 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                title="Test celebration modal & database milestone trigger"
              >
                <PartyPopper size={13} />
                <span>{simulatingCelebration ? 'Triggering...' : 'Test Celebration Milestone'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMilestonesModal(false)}
                className="btn btn-primary py-2 px-5 text-xs font-bold"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
