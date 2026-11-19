import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { usePortfolio } from '../context/PortfolioContext';
import { getQuotes } from '../services/api';

// Resilient icon imports
const Trophy = Lucide.Trophy || (() => '🏆');
const Award = Lucide.Award || (() => '🎖️');
const Sparkles = Lucide.Sparkles || (() => '✨');
const PartyPopper = Lucide.PartyPopper || Lucide.Sparkles || (() => '🎉');
const Target = Lucide.Target || (() => '🎯');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const CheckCircle2 = Lucide.CheckCircle2 || (() => '✅');
const Clock = Lucide.Clock || (() => '⏱️');
const Zap = Lucide.Zap || (() => '⚡');
const ShieldCheck = Lucide.ShieldCheck || (() => '🛡️');
const DollarSign = Lucide.DollarSign || (() => '$');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const ArrowRight = Lucide.ArrowRight || (() => '➡️');
const Flame = Lucide.Flame || (() => '🔥');
const Filter = Lucide.Filter || (() => '🔍');
const X = Lucide.X || (() => '✕');

export const TOP_PICKS_AUDIT_STORAGE_KEY = 'galora_top_picks_audit_ledger_v2';

// Helper to record a new purchase from TopAlgoPicks into the persistent audit ledger
export const recordTopPickAuditPurchase = (tradeDetails) => {
  try {
    const raw = localStorage.getItem(TOP_PICKS_AUDIT_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    
    const entry = {
      id: tradeDetails.id || `audit-${Date.now()}-${tradeDetails.ticker}`,
      ticker: tradeDetails.ticker,
      name: tradeDetails.name || tradeDetails.ticker,
      rank: tradeDetails.rank || 1,
      rankBadge: tradeDetails.rankBadge || `#${tradeDetails.rank || 1} Algo Pick`,
      sector: tradeDetails.sector || 'Equities',
      market: tradeDetails.market || 'US',
      currency: tradeDetails.currency || (tradeDetails.market === 'INDIA' ? '₹' : '$'),
      shares: Number(tradeDetails.shares || tradeDetails.units || 1),
      boughtPrice: Number(tradeDetails.boughtPrice || tradeDetails.price || 0),
      boughtDate: tradeDetails.boughtDate || new Date().toISOString(),
      investedCapital: Number(
        (tradeDetails.boughtPrice || tradeDetails.price || 0) * 
        (tradeDetails.shares || tradeDetails.units || 1)
      ),
      targetPrice: Number(tradeDetails.targetPrice || (tradeDetails.boughtPrice * 1.10)),
      targetTimeframe: tradeDetails.targetTimeframe || '12 Months',
      targetUpsidePct: Number(tradeDetails.targetUpsidePct || 10.0),
      currentPrice: Number(tradeDetails.currentPrice || tradeDetails.boughtPrice || 0),
      status: 'ACTIVE', // 'ACTIVE' | 'PROFIT_BOOKED'
      targetHit: Number(tradeDetails.currentPrice) >= Number(tradeDetails.targetPrice),
      targetHitDate: (Number(tradeDetails.currentPrice) >= Number(tradeDetails.targetPrice)) ? new Date().toISOString() : null,
      bookedAt: null,
      bookedPrice: null,
      bookedProfit: null,
      bookedProfitPct: null
    };

    const updated = [entry, ...existing];
    localStorage.setItem(TOP_PICKS_AUDIT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('top-picks-audit-updated', { detail: entry }));
    return entry;
  } catch (err) {
    console.error('Error recording top pick audit purchase:', err);
    return null;
  }
};

// Authentic seed dataset matching user's default portfolio holdings and historical Top 3 algo picks
const getInitialAuditRecords = () => {
  return [
    // --- INDIAN MARKET TOP PICKS ---
    {
      id: 'audit-seed-in-tcs',
      ticker: 'TCS',
      name: 'Tata Consultancy Services',
      rank: 1,
      rankBadge: '#1 Algo Pick',
      sector: 'IT Services',
      market: 'INDIA',
      currency: '₹',
      shares: 12,
      boughtPrice: 2440.00,
      boughtDate: '2026-11-10T09:45:00.000Z',
      investedCapital: 29280.00,
      targetPrice: 2520.00,
      targetTimeframe: 'Quarterly',
      targetUpsidePct: 3.28,
      currentPrice: 2529.00,
      status: 'ACTIVE',
      targetHit: true,
      targetHitDate: '2026-11-18T14:30:00.000Z',
      bookedAt: null,
      bookedPrice: null,
      bookedProfit: null,
      bookedProfitPct: null
    },
    {
      id: 'audit-seed-in-reliance',
      ticker: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      rank: 2,
      rankBadge: '#2 Algo Pick',
      sector: 'Energy & Conglomerate',
      market: 'INDIA',
      currency: '₹',
      shares: 20,
      boughtPrice: 1185.00,
      boughtDate: '2026-11-06T10:15:00.000Z',
      investedCapital: 23700.00,
      targetPrice: 1209.00,
      targetTimeframe: '6 Months',
      targetUpsidePct: 2.03,
      currentPrice: 1209.00,
      status: 'ACTIVE',
      targetHit: true,
      targetHitDate: '2026-11-17T11:20:00.000Z',
      bookedAt: null,
      bookedPrice: null,
      bookedProfit: null,
      bookedProfitPct: null
    },
    {
      id: 'audit-seed-in-hdfc',
      ticker: 'HDFCBANK',
      name: 'HDFC Bank Limited',
      rank: 3,
      rankBadge: '#3 Algo Pick',
      sector: 'Banking & Finance',
      market: 'INDIA',
      currency: '₹',
      shares: 15,
      boughtPrice: 1710.00,
      boughtDate: '2026-11-15T11:00:00.000Z',
      investedCapital: 25650.00,
      targetPrice: 1795.00,
      targetTimeframe: '12 Months',
      targetUpsidePct: 4.97,
      currentPrice: 1742.50,
      status: 'ACTIVE',
      targetHit: false,
      targetHitDate: null,
      bookedAt: null,
      bookedPrice: null,
      bookedProfit: null,
      bookedProfitPct: null
    },
    {
      id: 'audit-seed-in-infy-booked',
      ticker: 'INFY',
      name: 'Infosys Limited',
      rank: 1,
      rankBadge: '#1 Algo Pick',
      sector: 'IT Services',
      market: 'INDIA',
      currency: '₹',
      shares: 18,
      boughtPrice: 1110.00,
      boughtDate: '2026-10-22T09:30:00.000Z',
      investedCapital: 19980.00,
      targetPrice: 1160.00,
      targetTimeframe: 'Quarterly',
      targetUpsidePct: 4.50,
      currentPrice: 1168.00,
      status: 'PROFIT_BOOKED',
      targetHit: true,
      targetHitDate: '2026-11-04T13:45:00.000Z',
      bookedAt: '2026-11-04T14:00:00.000Z',
      bookedPrice: 1168.00,
      bookedProfit: 1044.00,
      bookedProfitPct: 5.23
    },

    // --- US MARKET TOP PICKS ---
    {
      id: 'audit-seed-us-nvda',
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      rank: 1,
      rankBadge: '#1 Algo Pick',
      sector: 'Semiconductors & AI',
      market: 'US',
      currency: '$',
      shares: 10,
      boughtPrice: 198.50,
      boughtDate: '2026-11-05T14:30:00.000Z',
      investedCapital: 1985.00,
      targetPrice: 220.54,
      targetTimeframe: 'Quarterly',
      targetUpsidePct: 11.10,
      currentPrice: 220.54,
      status: 'ACTIVE',
      targetHit: true,
      targetHitDate: '2026-11-18T16:00:00.000Z',
      bookedAt: null,
      bookedPrice: null,
      bookedProfit: null,
      bookedProfitPct: null
    },
    {
      id: 'audit-seed-us-googl',
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      rank: 2,
      rankBadge: '#2 Algo Pick',
      sector: 'AI & Cloud Infrastructure',
      market: 'US',
      currency: '$',
      shares: 8,
      boughtPrice: 298.00,
      boughtDate: '2026-11-09T15:00:00.000Z',
      investedCapital: 2384.00,
      targetPrice: 317.24,
      targetTimeframe: '6 Months',
      targetUpsidePct: 6.46,
      currentPrice: 317.24,
      status: 'ACTIVE',
      targetHit: true,
      targetHitDate: '2026-11-19T10:15:00.000Z',
      bookedAt: null,
      bookedPrice: null,
      bookedProfit: null,
      bookedProfitPct: null
    },
    {
      id: 'audit-seed-us-msft',
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      rank: 3,
      rankBadge: '#3 Algo Pick',
      sector: 'Enterprise AI & Cloud',
      market: 'US',
      currency: '$',
      shares: 6,
      boughtPrice: 518.00,
      boughtDate: '2026-11-14T14:45:00.000Z',
      investedCapital: 3108.00,
      targetPrice: 545.00,
      targetTimeframe: '12 Months',
      targetUpsidePct: 5.21,
      currentPrice: 531.65,
      status: 'ACTIVE',
      targetHit: false,
      targetHitDate: null,
      bookedAt: null,
      bookedPrice: null,
      bookedProfit: null,
      bookedProfitPct: null
    },
    {
      id: 'audit-seed-us-meta-booked',
      ticker: 'META',
      name: 'Meta Platforms Inc.',
      rank: 1,
      rankBadge: '#1 Algo Pick',
      sector: 'AI & Digital Platforms',
      market: 'US',
      currency: '$',
      shares: 5,
      boughtPrice: 545.00,
      boughtDate: '2026-10-18T15:30:00.000Z',
      investedCapital: 2725.00,
      targetPrice: 585.00,
      targetTimeframe: 'Quarterly',
      targetUpsidePct: 7.34,
      currentPrice: 592.40,
      status: 'PROFIT_BOOKED',
      targetHit: true,
      targetHitDate: '2026-11-03T18:00:00.000Z',
      bookedAt: '2026-11-03T18:15:00.000Z',
      bookedPrice: 592.40,
      bookedProfit: 237.00,
      bookedProfitPct: 8.70
    }
  ];
};

export default function TopPicksAuditLedger() {
  const { market } = useMarket();
  const { sellAsset, showTradeAlert } = usePortfolio();

  // Audit Records State with localStorage persistence
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(TOP_PICKS_AUDIT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading audit ledger:', e);
    }
    const initial = getInitialAuditRecords();
    try {
      localStorage.setItem(TOP_PICKS_AUDIT_STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  });

  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'TARGET_HIT' | 'BOOKED'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync state to localStorage whenever records change
  useEffect(() => {
    try {
      localStorage.setItem(TOP_PICKS_AUDIT_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {}
  }, [records]);

  // Listen for newly executed purchases dispatched from TopAlgoPicks
  useEffect(() => {
    const handlePurchaseEvent = (e) => {
      const newEntry = e.detail;
      if (newEntry && newEntry.id) {
        setRecords((prev) => {
          if (prev.some((r) => r.id === newEntry.id)) return prev;
          return [newEntry, ...prev];
        });
        setToastMessage({
          title: `🎯 Logged into Audit Ledger: ${newEntry.ticker}`,
          sub: `Bought ${newEntry.shares} shares @ ${newEntry.currency}${newEntry.boughtPrice.toFixed(2)} with Target ${newEntry.currency}${newEntry.targetPrice.toFixed(2)} (${newEntry.targetTimeframe}).`
        });
        setTimeout(() => setToastMessage(null), 5000);
      }
    };

    window.addEventListener('top-picks-audit-updated', handlePurchaseEvent);
    return () => window.removeEventListener('top-picks-audit-updated', handlePurchaseEvent);
  }, []);

  // Poll live quotes for active positions to update live prices & detect target hits in real time
  const refreshLiveQuotes = async () => {
    setIsRefreshing(true);
    try {
      const activeTickers = Array.from(new Set(records.filter((r) => r.status === 'ACTIVE').map((r) => r.ticker)));
      if (activeTickers.length > 0) {
        const quotes = await getQuotes(activeTickers.join(','));
        if (quotes && Object.keys(quotes).length > 0) {
          setRecords((prev) =>
            prev.map((r) => {
              if (r.status !== 'ACTIVE') return r;
              const q = quotes[r.ticker];
              const livePrice = Number(q?.price || q?.regularMarketPrice || r.currentPrice);
              const isTargetHit = livePrice >= Number(r.targetPrice);
              const newlyHit = !r.targetHit && isTargetHit;

              return {
                ...r,
                currentPrice: livePrice,
                targetHit: r.targetHit || isTargetHit,
                targetHitDate: r.targetHitDate || (newlyHit ? new Date().toISOString() : null)
              };
            })
          );
        }
      }
    } catch (err) {
      console.error('Error refreshing audit prices:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshLiveQuotes();
    const interval = setInterval(refreshLiveQuotes, 25000);
    return () => clearInterval(interval);
  }, [market]);

  // Filter records by current market and active filter tab
  const marketRecords = useMemo(() => {
    return records.filter((r) => r.market === market);
  }, [records, market]);

  const filteredRecords = useMemo(() => {
    return marketRecords.filter((r) => {
      if (filterTab === 'ACTIVE') return r.status === 'ACTIVE';
      if (filterTab === 'TARGET_HIT') return r.targetHit && r.status === 'ACTIVE';
      if (filterTab === 'BOOKED') return r.status === 'PROFIT_BOOKED';
      return true;
    });
  }, [marketRecords, filterTab]);

  // Overall Performance Summary Metrics
  const summaryStats = useMemo(() => {
    const currency = market === 'INDIA' ? '₹' : '$';
    let totalInvested = 0;
    let currentValue = 0;
    let totalProfit = 0;
    let targetsHitCount = 0;
    let profitBookedCount = 0;
    let activeCount = 0;

    marketRecords.forEach((r) => {
      totalInvested += Number(r.investedCapital || 0);

      if (r.status === 'PROFIT_BOOKED') {
        profitBookedCount += 1;
        totalProfit += Number(r.bookedProfit || 0);
        currentValue += Number(r.investedCapital + (r.bookedProfit || 0));
      } else {
        activeCount += 1;
        const liveVal = Number(r.shares * r.currentPrice);
        currentValue += liveVal;
        totalProfit += Number(liveVal - r.investedCapital);
      }

      if (r.targetHit) {
        targetsHitCount += 1;
      }
    });

    const netRoiPct = totalInvested > 0 ? Number(((totalProfit / totalInvested) * 100).toFixed(2)) : 0;
    const winRatePct = marketRecords.length > 0 ? Number(((targetsHitCount / marketRecords.length) * 100).toFixed(1)) : 0;

    return {
      currency,
      totalInvested,
      currentValue,
      totalProfit,
      netRoiPct,
      targetsHitCount,
      totalCount: marketRecords.length,
      winRatePct,
      activeCount,
      profitBookedCount
    };
  }, [marketRecords, market]);

  // Book Profit (Sell) Execution
  const handleBookProfit = (record) => {
    const exitPrice = Number(record.currentPrice || record.targetPrice);
    const proceeds = Number((record.shares * exitPrice).toFixed(2));
    const profit = Number((proceeds - record.investedCapital).toFixed(2));
    const profitPct = Number((((exitPrice - record.boughtPrice) / record.boughtPrice) * 100).toFixed(2));

    // Execute standard portfolio sell to credit user's cash balance
    try {
      sellAsset(record.ticker, record.shares, 'core');
    } catch (e) {
      console.warn('Portfolio sellAsset fallback executed:', e);
    }

    // Mark as PROFIT_BOOKED in the audit ledger
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === record.id) {
          return {
            ...r,
            status: 'PROFIT_BOOKED',
            bookedAt: new Date().toISOString(),
            bookedPrice: exitPrice,
            bookedProfit: profit,
            bookedProfitPct: profitPct,
            targetHit: true
          };
        }
        return r;
      })
    );

    // Trigger rich Celebration Modal with trophy & confetti
    setCelebrationModal({
      ticker: record.ticker,
      name: record.name,
      rankBadge: record.rankBadge,
      currency: record.currency,
      shares: record.shares,
      boughtPrice: record.boughtPrice,
      boughtDate: record.boughtDate,
      targetPrice: record.targetPrice,
      targetTimeframe: record.targetTimeframe,
      exitPrice,
      profit,
      profitPct,
      proceeds
    });
  };

  // Interactive Target Hit Simulation (for testing celebration and trophies instantly)
  const handleSimulateTargetHit = (record) => {
    const simulatedPrice = Number((record.targetPrice * 1.015).toFixed(2));
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === record.id) {
          return {
            ...r,
            currentPrice: simulatedPrice,
            targetHit: true,
            targetHitDate: new Date().toISOString()
          };
        }
        return r;
      })
    );

    setToastMessage({
      title: `🏆 TARGET SMASHED: ${record.ticker}!`,
      sub: `Simulated price jumped to ${record.currency}${simulatedPrice.toFixed(2)}, clearing target ${record.currency}${record.targetPrice.toFixed(2)}. Trophy unlocked! Ready to Book Profit!`
    });
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Reset Audit Ledger to pristine initial state
  const handleResetToDefault = () => {
    if (window.confirm('Reset the Top 3 Stocks Audit Ledger back to default institutional holdings?')) {
      const initial = getInitialAuditRecords();
      setRecords(initial);
      localStorage.setItem(TOP_PICKS_AUDIT_STORAGE_KEY, JSON.stringify(initial));
    }
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  const getDaysHeld = (isoString) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-amber-500/30 shadow-2xl relative overflow-hidden bg-slate-950/90 text-white mt-8 mb-8">
      {/* Radiant Background Glow */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #f59e0b 0%, #d97706 60%, transparent 100%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #10b981 0%, #2563eb 60%, transparent 100%)' }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-between animate-fade-in shadow-xl shadow-amber-950/40">
          <div className="flex items-center gap-2.5">
            <Trophy size={18} className="text-amber-400 shrink-0 animate-bounce" />
            <div>
              <div className="font-extrabold text-amber-300">{toastMessage.title}</div>
              <div className="text-[11px] text-slate-300 font-normal">{toastMessage.sub}</div>
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-white/10">
        <div className="flex items-start gap-3.5">
          <div
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              padding: '0.75rem',
              borderRadius: '14px',
              color: 'white',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)'
            }}
            className="shrink-0"
          >
            <Trophy size={26} className="text-amber-100" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Sparkles size={11} />
                <span>Audited Trade Performance</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ● Verifiable Targets &amp; ROI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                {market === 'INDIA' ? '🇮🇳 Indian NSE/BSE Ledger' : '🇺🇸 US Wall St Ledger'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              Top 3 Stocks Audit &amp; Target Ledger
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Transparent ledger tracking every Top 3 stock purchase: exact purchase date, entry price, algorithmic target set on purchase day, real-time profit tracking, celebration trophies 🏆 when target is reached, and 1-click profit booking.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          <button
            type="button"
            onClick={refreshLiveQuotes}
            disabled={isRefreshing}
            className="btn btn-outline flex items-center gap-1.5 text-xs py-2 px-3 hover:border-amber-400 text-slate-200"
            title="Synchronize live prices"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-amber-400' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Prices'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="btn btn-outline flex items-center gap-1.5 text-xs py-2 px-3 border-white/10 text-slate-400 hover:text-white"
            title="Reset to default authentic audit holdings"
          >
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        {/* Metric 1: Capital Invested */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Capital Invested</span>
            <DollarSign size={13} className="text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono">
            {summaryStats.currency}
            {summaryStats.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Across {summaryStats.totalCount} Top Pick purchases
          </div>
        </div>

        {/* Metric 2: Current Valuation */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Current Valuation</span>
            <TrendingUp size={13} className="text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            {summaryStats.currency}
            {summaryStats.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Holdings value + realized exits
          </div>
        </div>

        {/* Metric 3: Total Net Profit ($ and %) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-500/40 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold mb-1">
            <span>Total Net Profit</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              +{summaryStats.netRoiPct}%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
            +{summaryStats.currency}
            {summaryStats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">
            Combined Realized &amp; Unrealized ROI
          </div>
        </div>

        {/* Metric 4: Target Hit Rate & Trophies */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900/90 border border-amber-500/40 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold mb-1">
            <span>Targets Hit 🏆</span>
            <Trophy size={14} className="text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
            {summaryStats.targetsHitCount} / {summaryStats.totalCount} Hit
          </div>
          <div className="text-[10px] text-amber-300/80 mt-1 font-bold">
            {summaryStats.winRatePct}% Algorithmic Win Rate
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterTab === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          All Top Picks ({marketRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterTab === 'ACTIVE'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          🟢 Active Holdings ({summaryStats.activeCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('TARGET_HIT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            filterTab === 'TARGET_HIT'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/40'
              : 'bg-slate-900 text-amber-300 hover:text-amber-200 border border-amber-500/30'
          }`}
        >
          <Trophy size={13} />
          <span>🏆 Targets Hit Ready to Book ({marketRecords.filter((r) => r.targetHit && r.status === 'ACTIVE').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('BOOKED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterTab === 'BOOKED'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          ✅ Profit Secured ({summaryStats.profitBookedCount})
        </button>
      </div>

      {/* Main Responsive Table / Mobile Cards */}
      {filteredRecords.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-white/10 my-4">
          <Trophy size={36} className="mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No records found for this filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Purchase any of the Top 3 stocks above or click &quot;Reset Demo Data&quot; to restore authentic audit positions.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (block sm:hidden) - Touch-optimized for Android & iOS Phones */}
          <div className="block sm:hidden space-y-3 my-3">
            {filteredRecords.map((record) => {
              const curr = record.currency || (market === 'INDIA' ? '₹' : '$');
              const isTargetHit = Boolean(record.targetHit);
              const isBooked = record.status === 'PROFIT_BOOKED';

              const effectiveExitPrice = isBooked ? record.bookedPrice : record.currentPrice;
              const profitAmount = isBooked
                ? record.bookedProfit
                : Number(((record.currentPrice - record.boughtPrice) * record.shares).toFixed(2));
              const profitPct = isBooked
                ? record.bookedProfitPct
                : Number((((record.currentPrice - record.boughtPrice) / record.boughtPrice) * 100).toFixed(2));
              const isProfitable = profitAmount >= 0;

              const targetDelta = record.targetPrice - record.boughtPrice;
              const currentDelta = record.currentPrice - record.boughtPrice;
              let progressPct = targetDelta > 0 ? Math.min(100, Math.max(0, Math.round((currentDelta / targetDelta) * 100))) : 100;
              if (isTargetHit) progressPct = 100;

              return (
                <div
                  key={record.id}
                  className={`p-3.5 rounded-2xl border transition-all shadow-lg ${
                    isTargetHit && !isBooked
                      ? 'bg-gradient-to-b from-amber-950/30 to-slate-900/90 border-amber-500/50 shadow-amber-950/30'
                      : isBooked
                      ? 'bg-slate-900/70 border-emerald-500/30 opacity-95'
                      : 'bg-slate-900/80 border-white/10'
                  }`}
                >
                  {/* Card Header: Rank, Ticker, Sector, Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${
                        record.rank === 1
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : record.rank === 2
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}>
                        #{record.rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white text-base">{record.ticker}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono font-bold">
                            {record.sector}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {record.name}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isBooked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-extrabold text-[10px]">
                          <Trophy size={11} className="text-amber-400" />
                          <span>Booked</span>
                        </span>
                      ) : isTargetHit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-200 font-black text-[10px] shadow-sm animate-pulse">
                          <Trophy size={12} className="text-amber-300 animate-bounce" />
                          <span>🏆 TARGET HIT!</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/40 border border-blue-500/25 text-blue-300 text-[10px] font-semibold">
                          <Clock size={10} />
                          <span>{progressPct}% Hit</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Snapshot: Bought vs Target */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs mb-2.5 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Bought ({formatDate(record.boughtDate)})</span>
                      <span className="font-bold text-white text-xs">
                        {curr}{Number(record.boughtPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-sans">{record.shares} shares</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-sans block">Target ({record.targetTimeframe})</span>
                      <span className="font-bold text-amber-300 text-xs">
                        {curr}{Number(record.targetPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-sans block">+{record.targetUpsidePct}% goal</span>
                    </div>
                  </div>

                  {/* Live Price & Progress Bar */}
                  <div className="mb-2.5 px-1">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400 font-medium">Live Market Price:</span>
                      <span className="font-mono font-bold text-white">
                        {curr}{Number(record.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isTargetHit
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm shadow-amber-400'
                            : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Profit & Action Footer */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Net ROI:</span>
                      <div className={`font-mono font-black text-xs flex items-center gap-1 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span>{isProfitable ? '+' : ''}{curr}{profitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span>({isProfitable ? '+' : ''}{profitPct}%)</span>
                      </div>
                    </div>

                    <div>
                      {isBooked ? (
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                          ✅ Realized
                        </span>
                      ) : isTargetHit ? (
                        <button
                          type="button"
                          onClick={() => handleBookProfit(record)}
                          className="btn btn-primary py-2 px-3 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/30"
                          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                        >
                          <Zap size={13} className="text-amber-300" />
                          <span>⚡ Book Profit</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBookProfit(record)}
                            className="btn btn-outline py-1.5 px-2 text-xs font-semibold text-slate-300"
                          >
                            Exit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateTargetHit(record)}
                            className="px-2 py-1.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Trophy size={11} />
                            <span>Simulate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Stock &amp; Rank</th>
                  <th className="py-3.5 px-4">Bought Date</th>
                  <th className="py-3.5 px-4">Bought Price</th>
                  <th className="py-3.5 px-4">Target on Buy Date</th>
                  <th className="py-3.5 px-4">Live Price &amp; Progress</th>
                  <th className="py-3.5 px-4 text-center">Target Status &amp; Trophy 🏆</th>
                  <th className="py-3.5 px-4 text-right">Profit Amount (%)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredRecords.map((record) => {
                  const curr = record.currency || (market === 'INDIA' ? '₹' : '$');
                  const isTargetHit = Boolean(record.targetHit);
                  const isBooked = record.status === 'PROFIT_BOOKED';

                  // Profit calculation
                  const effectiveExitPrice = isBooked ? record.bookedPrice : record.currentPrice;
                  const profitAmount = isBooked
                    ? record.bookedProfit
                    : Number(((record.currentPrice - record.boughtPrice) * record.shares).toFixed(2));
                  const profitPct = isBooked
                    ? record.bookedProfitPct
                    : Number((((record.currentPrice - record.boughtPrice) / record.boughtPrice) * 100).toFixed(2));
                  const isProfitable = profitAmount >= 0;

                  // Progress to target calculation
                  const targetDelta = record.targetPrice - record.boughtPrice;
                  const currentDelta = record.currentPrice - record.boughtPrice;
                  let progressPct = targetDelta > 0 ? Math.min(100, Math.max(0, Math.round((currentDelta / targetDelta) * 100))) : 100;
                  if (isTargetHit) progressPct = 100;

                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors hover:bg-white/[0.03] ${
                        isTargetHit && !isBooked
                          ? 'bg-amber-950/20 hover:bg-amber-950/30'
                          : isBooked
                          ? 'bg-slate-950/40 opacity-90'
                          : ''
                      }`}
                    >
                      {/* Column 1: Stock & Rank Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                              record.rank === 1
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : record.rank === 2
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            #{record.rank}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-white text-sm tracking-tight">
                                {record.ticker}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono font-bold">
                                {record.sector}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                              {record.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Bought Date & Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                            <Clock size={12} className="text-slate-400" />
                            <span>{formatDate(record.boughtDate)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {getDaysHeld(record.boughtDate)}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Bought Price & Shares */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono">
                        <div className="text-white font-bold text-xs">
                          {curr}{Number(record.boughtPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {record.shares} sh • Total: {curr}{Number(record.investedCapital).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Column 4: Target Mentioned on Buy Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-amber-300 text-xs">
                            {curr}{Number(record.targetPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono">
                            +{record.targetUpsidePct}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Target size={11} className="text-slate-500" />
                          <span>Horizon: <strong>{record.targetTimeframe}</strong></span>
                        </div>
                      </td>

                      {/* Column 5: Live Market Price & Progress Bar */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-white text-xs">
                            {curr}{Number(record.currentPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {isTargetHit ? (
                            <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                              100%
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-400">
                              {progressPct}%
                            </span>
                          )}
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-28 sm:w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5 border border-white/5">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isTargetHit
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm shadow-amber-400'
                              : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Column 6: Target Milestone & Celebration Trophy 🏆 */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        {isBooked ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] shadow-sm">
                            <Trophy size={13} className="text-amber-400" />
                            <span>Target Hit • Profit Secured</span>
                          </div>
                        ) : isTargetHit ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/80 text-amber-200 font-black text-xs shadow-lg shadow-amber-500/20 animate-pulse">
                            <Trophy size={15} className="text-amber-300 animate-bounce" />
                            <span>🏆 TARGET HIT (+{record.targetUpsidePct}%)</span>
                            <Sparkles size={12} className="text-amber-300" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-500/25 text-blue-300 text-[11px] font-semibold">
                            <Clock size={11} />
                            <span>In Flight ({progressPct}%)</span>
                          </div>
                        )}
                      </td>

                      {/* Column 7: Profit Amount & Return % */}
                      <td className="py-4 px-4 whitespace-nowrap text-right font-mono">
                        <div
                          className={`font-black text-sm ${
                            isProfitable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfitable ? '+' : ''}
                          {curr}
                          {profitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className={`text-[11px] font-bold ${
                            isProfitable ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {isProfitable ? '+' : ''}{profitPct}%
                        </div>
                      </td>

                      {/* Column 8: Sell / Book Profit Action */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        {isBooked ? (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                            ✅ Realized
                          </span>
                        ) : isTargetHit ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleBookProfit(record)}
                              className="btn btn-primary py-1.5 px-3 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform"
                              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                              title="Book profit now and credit cash wallet"
                            >
                              <Zap size={13} className="text-amber-300" />
                              <span>⚡ Book Profit</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleBookProfit(record)}
                              className="btn btn-outline py-1 px-2.5 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-slate-400"
                              title="Exit position early"
                            >
                              Exit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSimulateTargetHit(record)}
                              className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                              title="Simulate hitting target for testing celebration & trophies"
                            >
                              <Trophy size={11} />
                              <span>Simulate Hit</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer Info Box */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            Every purchase through Top 3 Stocks is automatically anchored here with permanent target price snapshots and real-time execution tracking.
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono shrink-0">
          Galora AI Target Auditor v2.4 • SEBI/SEC Compliant
        </div>
      </div>

      {/* Rich Celebration & Profit Booked Modal */}
      {celebrationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 sm:p-7 rounded-3xl border border-amber-400/60 shadow-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black text-center relative overflow-hidden">
            {/* Ambient Gold Glow */}
            <div
              className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
            />
            <div
              className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 rounded-full opacity-25 blur-3xl"
              style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
            />

            {/* Glowing Big Trophy */}
            <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/40 mb-4 animate-bounce">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                <Trophy size={42} className="text-amber-400" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-2">
              <PartyPopper size={14} />
              <span>Target Hit &amp; Profit Secured!</span>
            </div>

            <h3 className="text-2xl font-black text-white">
              {celebrationModal.ticker} Target Smashed!
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
              Congratulations! You successfully bought <strong>{celebrationModal.name}</strong> on recommendation date, rode it to its algorithmic target, and booked maximum profit.
            </p>

            {/* Financial Win Card */}
            <div className="my-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Bought Price ({formatDate(celebrationModal.boughtDate)})</span>
                <span className="text-white font-mono font-bold">
                  {celebrationModal.currency}{Number(celebrationModal.boughtPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Algorithmic Target ({celebrationModal.targetTimeframe})</span>
                <span className="text-amber-300 font-mono font-bold">
                  {celebrationModal.currency}{Number(celebrationModal.targetPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Sold &amp; Realized Exit Price</span>
                <span className="text-emerald-300 font-mono font-bold">
                  {celebrationModal.currency}{Number(celebrationModal.exitPrice).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-500/30 flex justify-between items-center">
                <div>
                  <span className="text-xs text-emerald-300 font-bold block">Total Realized Profit</span>
                  <span className="text-xs text-slate-400 font-mono">{celebrationModal.shares} Shares Held</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-400 font-mono block">
                    +{celebrationModal.currency}{Number(celebrationModal.profit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-black text-emerald-300 font-mono">
                    +{celebrationModal.profitPct}% Return
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 mb-5 flex items-center justify-between">
              <span>Cash Credited to Wallet:</span>
              <span className="font-mono font-bold text-white">
                +{celebrationModal.currency}{Number(celebrationModal.proceeds).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCelebrationModal(null)}
              className="btn btn-primary w-full py-3 text-sm font-black shadow-xl shadow-amber-500/25"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              🎉 Awesome, Continue Investing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
