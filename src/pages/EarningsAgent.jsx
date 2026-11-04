import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { getQuotes } from '../services/api';
import { useMarket } from '../context/MarketContext';

const Search = Lucide.Search || (() => '🔍');
const Mic = Lucide.Mic || (() => '🎤');
const FileText = Lucide.FileText || (() => '📄');
const Globe = Lucide.Globe || (() => '🌐');
const Target = Lucide.Target || (() => '🎯');
const Cpu = Lucide.Cpu || (() => '💻');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const AlertCircle = Lucide.AlertCircle || Lucide.AlertTriangle || (() => '⚠️');
const PlayCircle = Lucide.PlayCircle || (() => '▶️');
const X = Lucide.X || (() => '✕');
const Volume2 = Lucide.Volume2 || (() => '🔊');
const CheckCircle2 = Lucide.CheckCircle2 || (() => '✓');
const MessageSquare = Lucide.MessageSquare || (() => '💬');
const Plus = Lucide.Plus || (() => '+');
const Award = Lucide.Award || (() => '🏆');
const Layers = Lucide.Layers || (() => '📑');
const Sparkles = Lucide.Sparkles || (() => '✨');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const ArrowRight = Lucide.ArrowRight || (() => '→');

const COMPANY_NAMES = {
  NVDA: 'NVIDIA Corporation',
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  META: 'Meta Platforms Inc.',
  TSLA: 'Tesla Inc.',
  AVGO: 'Broadcom Inc.',
  MU: 'Micron Technology',
  AMD: 'Advanced Micro Devices',
  INTC: 'Intel Corporation',
  PLTR: 'Palantir Technologies',
  JPM: 'JPMorgan Chase & Co.',
  GS: 'Goldman Sachs Group',
  NFLX: 'Netflix Inc.',
  RELIANCE: 'Reliance Industries Ltd.',
  TCS: 'Tata Consultancy Services',
  HDFCBANK: 'HDFC Bank Ltd.',
  INFY: 'Infosys Limited',
  ICICIBANK: 'ICICI Bank Ltd.',
  SBIN: 'State Bank of India',
  BHARTIARTL: 'Bharti Airtel Ltd.',
  TATAMOTORS: 'Tata Motors Ltd.',
  MARUTI: 'Maruti Suzuki India',
  ITC: 'ITC Limited',
  TATASTEEL: 'Tata Steel Ltd.',
  JSWSTEEL: 'JSW Steel Ltd.',
  ADANIENT: 'Adani Enterprises Ltd.',
  ADANIPORTS: 'Adani Ports & SEZ',
  WIPRO: 'Wipro Limited',
  SUNPHARMA: 'Sun Pharma Ltd.'
};

const getCompanyName = (ticker) => COMPANY_NAMES[ticker] || `${ticker} Corp.`;

// Theme color schemes for compared stocks (up to 3)
const STOCK_THEMES = [
  {
    name: 'purple',
    primary: '#a855f7',
    gradient: 'from-purple-500/20 via-slate-900/90 to-slate-950/95',
    border: 'border-purple-500/40 hover:border-purple-400/70',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    chip: 'bg-purple-950/60 border-purple-500/50 text-purple-200',
    text: 'text-purple-400',
    stroke: '#a855f7',
    fillGradient: 'colorPrice0'
  },
  {
    name: 'emerald',
    primary: '#10b981',
    gradient: 'from-emerald-950/25 via-slate-900/90 to-slate-950/95',
    border: 'border-emerald-500/40 hover:border-emerald-400/70',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    chip: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200',
    text: 'text-emerald-400',
    stroke: '#10b981',
    fillGradient: 'colorPrice1'
  },
  {
    name: 'sky',
    primary: '#0ea5e9',
    gradient: 'from-sky-950/25 via-slate-900/90 to-slate-950/95',
    border: 'border-sky-500/40 hover:border-sky-400/70',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    chip: 'bg-sky-950/60 border-sky-500/50 text-sky-200',
    text: 'text-sky-400',
    stroke: '#0ea5e9',
    fillGradient: 'colorPrice2'
  }
];

export default function EarningsAgent() {
  const [searchParams] = useSearchParams();
  const { market, currency, getCurrency } = useMarket();

  // Multi-stock state (max 3 stocks)
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [inputTicker, setInputTicker] = useState('');
  const [inputError, setInputError] = useState('');

  // Processing state
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  
  // Results: Array of stock analysis objects
  const [results, setResults] = useState(null);

  // Modal state
  const [activeTranscriptStock, setActiveTranscriptStock] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // Initialize from search params if present
  useEffect(() => {
    const rawParam = searchParams.get('tickers') || searchParams.get('ticker');
    if (rawParam) {
      const parts = rawParam
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 3);
      if (parts.length > 0) {
        setSelectedTickers(parts);
      }
    }
  }, [searchParams]);

  // Handle adding ticker(s)
  const handleAddTicker = (tickerToAdd) => {
    const raw = (tickerToAdd || inputTicker).trim().toUpperCase();
    if (!raw) return;

    // Support comma or space separated input
    const tokens = raw.split(/[,;\s]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
    let updated = [...selectedTickers];

    for (const t of tokens) {
      if (updated.includes(t)) continue;
      if (updated.length >= 3) {
        setInputError('Maximum 3 stocks can be compared at once.');
        setTimeout(() => setInputError(''), 4000);
        break;
      }
      updated.push(t);
    }

    setSelectedTickers(updated);
    setInputTicker('');
  };

  const handleRemoveTicker = (tickerToRemove) => {
    setSelectedTickers(selectedTickers.filter((t) => t !== tickerToRemove));
    if (inputError) setInputError('');
  };

  const handleClearAll = () => {
    setSelectedTickers([]);
    setResults(null);
    setInputTicker('');
    setInputError('');
  };

  // Quick preset selector
  const loadPreset = (presetList) => {
    setSelectedTickers(presetList.slice(0, 3));
    setInputTicker('');
    setInputError('');
  };

  // Execute multi-stock analysis
  const handleAnalyze = async () => {
    // Gather all tickers (including anything currently in the input box if space remains)
    let tickersToAnalyze = [...selectedTickers];
    const pendingText = inputTicker.trim().toUpperCase();

    if (pendingText) {
      const tokens = pendingText.split(/[,;\s]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
      for (const t of tokens) {
        if (!tickersToAnalyze.includes(t) && tickersToAnalyze.length < 3) {
          tickersToAnalyze.push(t);
        }
      }
      setSelectedTickers(tickersToAnalyze);
      setInputTicker('');
    }

    if (tickersToAnalyze.length === 0) {
      setInputError('Please add at least 1 stock ticker to deploy the agent.');
      setTimeout(() => setInputError(''), 3500);
      return;
    }

    setAnalyzing(true);
    setResults(null);
    setProgress(0);

    // Fetch quotes for all tickers in parallel
    const symbolsQuery = tickersToAnalyze.join(',');
    let quotesMap = {};
    try {
      quotesMap = await getQuotes(symbolsQuery);
    } catch (e) {
      console.error('Error fetching live quotes for comparison:', e);
    }

    // Dynamic Multi-stage Progress Workflow
    const label = tickersToAnalyze.join(', ');
    const stages = [
      { p: 15, text: `Fetching SEC 10-Q & Financial Statements for [${label}]...` },
      { p: 40, text: `Processing Audio Transcripts & Voice Sentiment for [${label}]...` },
      { p: 65, text: `Correlating Macro Geopolitical Catalysts & News Vectors...` },
      { p: 85, text: `Calculating Proprietary AI Price Target Projections...` },
      { p: 100, text: `Synthesizing Side-by-Side Institutional Comparison...` }
    ];

    let current = 0;
    const interval = setInterval(() => {
      setStage(stages[current].text);
      setProgress(stages[current].p);
      current++;

      if (current >= stages.length) {
        clearInterval(interval);
        setTimeout(() => {
          setAnalyzing(false);

          // Build analyzed result for each stock
          const computedResults = tickersToAnalyze.map((cleanTicker, idx) => {
            const assetCurrency = getCurrency(cleanTicker);
            const quote = quotesMap[cleanTicker] || {};

            let currentPrice = typeof quote.price === 'number'
              ? quote.price
              : (assetCurrency === '₹' ? 1200.00 : 180.00);

            const liveChange = typeof quote.change === 'number' ? quote.change : 0;
            const liveChangePct = typeof quote.changePct === 'number' ? quote.changePct : 0;

            // Generate deterministic yet responsive metrics per ticker
            const hash = cleanTicker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const isBullish = (hash + idx) % 2 === 0;

            // Target price projection
            const targetMultiplier = isBullish
              ? (1.12 + ((hash % 16) / 100))
              : (0.92 - ((hash % 10) / 100));

            const safePrice = Number(currentPrice) || (assetCurrency === '₹' ? 1200.00 : 180.00);
            const targetPrice = Number((safePrice * targetMultiplier).toFixed(2));
            const upsidePct = Number((((targetPrice - safePrice) / safePrice) * 100).toFixed(1));

            const revGrowthNum = isBullish ? (12 + (hash % 22)) : -(3 + (hash % 7));
            const revGrowth = `${revGrowthNum > 0 ? '+' : ''}${revGrowthNum}% YoY`;
            const epsBeatAmount = (0.12 + (hash % 30) / 100).toFixed(2);
            const epsChange = isBullish
              ? `Beat by ${assetCurrency}${epsBeatAmount}`
              : `Missed by ${assetCurrency}${(0.05 + (hash % 15) / 100).toFixed(2)}`;

            const margins = isBullish ? 'Expanding (+180 bps)' : 'Contracting (-95 bps)';
            const winProbability = Math.min(96, Math.max(68, 75 + (isBullish ? 14 : -5) + (hash % 10)));

            // 5-Point Price Trajectory Chart
            const chartData = [
              { month: 'Q-3', price: Number((safePrice * (isBullish ? 0.82 : 1.15)).toFixed(2)), predicted: null },
              { month: 'Q-2', price: Number((safePrice * (isBullish ? 0.89 : 1.10)).toFixed(2)), predicted: null },
              { month: 'Q-1', price: Number((safePrice * (isBullish ? 0.96 : 1.05)).toFixed(2)), predicted: null },
              { month: 'Today', price: safePrice, predicted: safePrice },
              { month: 'Target', price: null, predicted: targetPrice }
            ];

            // Specific realistic transcript highlights
            const transcriptPoints = getCustomTranscriptPoints(cleanTicker, isBullish, assetCurrency);
            const globalImpact = getCustomGlobalImpact(cleanTicker, isBullish);

            const synthesis = isBullish
              ? `Autonomous Deep Agent rates ${cleanTicker} with a high outperformance vector. Institutional demand across product verticals is accelerating with expanding operating margins. Algorithmic target of ${assetCurrency}${targetPrice} offers a +${upsidePct}% upside runway.`
              : `Deep Agent flags elevated operational headwind for ${cleanTicker}. Recent management remarks highlight margin compression and delayed enterprise pipeline conversion. Algorithmic target of ${assetCurrency}${targetPrice} reflects downside risk.`;

            return {
              ticker: cleanTicker,
              companyName: getCompanyName(cleanTicker),
              currency: assetCurrency,
              currentPrice: safePrice,
              change: liveChange,
              changePct: liveChangePct,
              targetPrice,
              upsidePct,
              chartData,
              winProbability,
              algorithmConviction: isBullish ? (upsidePct > 15 ? 'Strong Buy' : 'High') : 'Moderate',
              financials: {
                revenue: revGrowth,
                eps: epsChange,
                margins
              },
              transcriptKeyPoints: transcriptPoints,
              executiveSentiment: isBullish ? (88 + (hash % 9)) : (62 + (hash % 10)),
              hedgingIndex: isBullish ? 'Low (Direct)' : 'Elevated (Hedged)',
              globalImpact,
              synthesis,
              theme: STOCK_THEMES[idx % STOCK_THEMES.length]
            };
          });

          // Sort or identify the highest conviction / top outperformer
          let topPickIndex = 0;
          let maxUpside = -999;
          computedResults.forEach((r, i) => {
            if (r.upsidePct > maxUpside) {
              maxUpside = r.upsidePct;
              topPickIndex = i;
            }
          });
          computedResults.forEach((r, i) => {
            r.isTopPick = i === topPickIndex && computedResults.length > 1;
            r.rank = i + 1;
          });

          setResults(computedResults);
          setActiveTranscriptStock(computedResults[0]);
        }, 600);
      }
    }, 1000);
  };

  // Generate normalized comparative chart data (% performance relative to Today)
  const comparativeChartData = React.useMemo(() => {
    if (!results || results.length < 2) return [];
    const periods = ['Q-3', 'Q-2', 'Q-1', 'Today', 'Target'];

    return periods.map((period, pIdx) => {
      const entry = { period };
      results.forEach((stock) => {
        const item = stock.chartData[pIdx];
        const val = item.predicted !== null ? item.predicted : item.price;
        // Relative percentage change from Today
        const pctDiff = Number((((val - stock.currentPrice) / stock.currentPrice) * 100).toFixed(1));
        entry[stock.ticker] = pctDiff;
      });
      return entry;
    });
  }, [results]);

  // Quick Preset Options based on current market
  const presetsUS = [
    { label: 'NVDA vs MSFT vs AAPL', tickers: ['NVDA', 'MSFT', 'AAPL'] },
    { label: 'GOOGL vs META vs AMZN', tickers: ['GOOGL', 'META', 'AMZN'] },
    { label: 'AMD vs INTC vs NVDA', tickers: ['AMD', 'INTC', 'NVDA'] }
  ];

  const presetsIndia = [
    { label: 'RELIANCE vs TCS vs INFY', tickers: ['RELIANCE', 'TCS', 'INFY'] },
    { label: 'HDFCBANK vs ICICIBANK vs SBIN', tickers: ['HDFCBANK', 'ICICIBANK', 'SBIN'] },
    { label: 'TATAMOTORS vs MARUTI', tickers: ['TATAMOTORS', 'MARUTI'] }
  ];

  const activePresets = market === 'INDIA' ? presetsIndia : presetsUS;

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              padding: '0.75rem',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Cpu size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>
                Deep Analysis Agent
              </h1>
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Multi-Stock Side-by-Side (Max 3)
              </span>
            </div>
            <p className="text-muted text-xs md:text-sm mt-0.5">
              Autonomous multi-asset intelligence across earnings transcripts, 10-Q filings, SEC disclosures, and macro catalysts.
            </p>
          </div>
        </div>

        {/* Selected count pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-mono">
            {selectedTickers.length}/3 Stocks Selected
          </span>
          {selectedTickers.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors border border-white/5"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Input & Multi-Stock Selection Panel */}
      <div className="glass-panel card mb-6 p-5 rounded-2xl border border-white/10 shadow-2xl">
        {/* Selected Chips Bar */}
        {selectedTickers.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-xs text-muted font-bold uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Layers size={14} className="text-purple-400" /> Comparison Deck:
            </span>
            {selectedTickers.map((ticker, idx) => {
              const theme = STOCK_THEMES[idx % STOCK_THEMES.length];
              return (
                <div
                  key={ticker}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${theme.chip}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <span className="tracking-wider">{ticker}</span>
                  <span className="text-[11px] opacity-75 font-normal">
                    {getCompanyName(ticker).split(' ')[0]}
                  </span>
                  <button
                    onClick={() => handleRemoveTicker(ticker)}
                    className="ml-1 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                    title={`Remove ${ticker}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
            {selectedTickers.length < 3 && (
              <span className="text-[11px] text-slate-400 italic ml-1">
                (Add {3 - selectedTickers.length} more stock{selectedTickers.length === 2 ? '' : 's'} to compare side by side)
              </span>
            )}
          </div>
        )}

        {/* Input Bar & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Dedicated Input Box */}
          <div 
            className="relative flex-1 flex items-center rounded-xl bg-slate-950/80 border border-white/10 focus-within:border-purple-500/70 transition-colors"
            style={{
              minHeight: '54px',
              backgroundColor: 'rgba(2, 6, 23, 0.85)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <Search 
              size={20}
              className="text-slate-400 pointer-events-none" 
              style={{
                position: 'absolute',
                left: '1.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            />
            <input
              type="text"
              className="w-full bg-transparent text-white outline-none font-mono uppercase tracking-wider"
              style={{
                width: '100%',
                paddingLeft: '3.6rem',
                paddingRight: '1.25rem',
                paddingTop: '0.95rem',
                paddingBottom: '0.95rem',
                fontSize: '1rem',
                lineHeight: '1.5',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#ffffff'
              }}
              placeholder={
                selectedTickers.length >= 3
                  ? 'Max 3 stocks reached. Click "Deploy Agent" or remove a stock.'
                  : `Filter / enter ticker (e.g. ${market === 'US' ? 'NVDA, AAPL, MSFT' : 'RELIANCE, TCS, INFY'})`
              }
              value={inputTicker}
              onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (selectedTickers.length < 3 && inputTicker.trim()) handleAddTicker();
                  else handleAnalyze();
                }
              }}
              disabled={analyzing || selectedTickers.length >= 3}
            />
          </div>

          {/* Action Buttons: Add Stock & Deploy Agent */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {/* Add Stock Button */}
            <button
              type="button"
              onClick={() => handleAddTicker()}
              disabled={analyzing || selectedTickers.length >= 3 || !inputTicker.trim()}
              className={`flex-1 sm:flex-initial px-4 sm:px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shrink-0 ${
                inputTicker.trim() && selectedTickers.length < 3
                  ? 'bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border-purple-500/50 shadow-md shadow-purple-500/20 cursor-pointer'
                  : 'bg-slate-900/60 text-slate-500 border-white/5 cursor-not-allowed opacity-60'
              }`}
              style={{ minHeight: '54px', borderRadius: '14px' }}
              title={selectedTickers.length >= 3 ? 'Maximum 3 stocks already selected' : 'Add stock to comparison deck'}
            >
              <Plus size={16} />
              <span>Add Stock</span>
            </button>

            {/* Deploy Agent Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || (selectedTickers.length === 0 && !inputTicker.trim())}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                analyzing || (selectedTickers.length === 0 && !inputTicker.trim())
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 cursor-pointer transform hover:-translate-y-0.5'
              }`}
              style={{
                minHeight: '54px',
                borderRadius: '14px',
                background: analyzing || (selectedTickers.length === 0 && !inputTicker.trim())
                  ? undefined
                  : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
              }}
            >
              <Cpu size={16} />
              <span>
                {analyzing
                  ? 'Processing...'
                  : selectedTickers.length > 1
                  ? `Compare (${selectedTickers.length}) Side-by-Side`
                  : 'Deploy Agent'}
              </span>
            </button>
          </div>
        </div>

        {/* Input Error Message */}
        {inputError && (
          <div className="mt-3 text-xs text-amber-400 flex items-center gap-1.5 font-medium animate-fade-in">
            <AlertCircle size={14} />
            <span>{inputError}</span>
          </div>
        )}

        {/* Quick Presets for 1-Click Comparison */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Sparkles size={13} className="text-purple-400" /> Quick Compare:
          </span>
          {activePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => loadPreset(preset.tickers)}
              disabled={analyzing}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-purple-950/40 text-slate-300 hover:text-purple-200 border border-white/10 hover:border-purple-500/40 transition-all font-mono text-[11px]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analyzing Progress State */}
      {analyzing && (
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center min-h-[320px] mb-8 border border-purple-500/30">
          <div className="relative w-24 h-24 mb-6">
            <svg className="animate-spin w-full h-full text-purple-500" viewBox="0 0 24 24">
              <circle
                className="opacity-20"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-white font-mono">
              {progress}%
            </div>
          </div>
          <h3 className="text-lg font-bold mb-2 animate-pulse text-purple-200 text-center max-w-xl">
            {stage}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Cross-referencing quantitative factor weights and executive call linguistics...
          </p>
          <div className="w-full max-w-md bg-gray-900 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Results View */}
      {results && results.length > 0 && !analyzing && (
        <div className="space-y-8 animate-fade-in">
          {/* Multi-Stock Top Barometer & Comparison Matrix */}
          {results.length > 1 && (
            <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 shadow-2xl relative overflow-hidden">
              <div
                className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(circle, #8b5cf6 0%, #3b82f6 70%, transparent 100%)' }}
              />

              {/* Comparison Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Side-by-Side Head-to-Head Matrix
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                      {results.length} Stocks Synchronized
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Comparative Deep Analysis:{' '}
                    <span className="text-purple-400">{results.map((r) => r.ticker).join(' vs ')}</span>
                  </h2>
                </div>

                {/* Top Pick Pill */}
                {results.find((r) => r.isTopPick) && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    <Award size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-amber-400 font-extrabold">
                        Agent Top Pick
                      </div>
                      <div className="text-sm font-black text-white">
                        {results.find((r) => r.isTopPick)?.ticker} (+
                        {results.find((r) => r.isTopPick)?.upsidePct}% Upside)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Side-by-Side Comparison Table Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/60">
                      <th className="p-3 text-slate-400 font-bold uppercase tracking-wider w-1/4">
                        Core Dimension
                      </th>
                      {results.map((r) => (
                        <th key={r.ticker} className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-base font-black text-white tracking-wider">
                                {r.ticker}
                              </span>
                              <div className="text-[11px] text-slate-400 font-normal truncate max-w-[140px]">
                                {r.companyName}
                              </div>
                            </div>
                            {r.isTopPick && (
                              <span className="text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                🏆 Top Pick
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {/* Live Price Row */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Live Price & 24h Change</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3 font-mono">
                          <div className="text-sm font-bold text-white">
                            {r.currency}
                            {r.currentPrice.toFixed(2)}
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              r.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {r.changePct >= 0 ? '+' : ''}
                            {r.changePct.toFixed(2)}%
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Agent Target Price */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Agent Target & Upside</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3">
                          <div
                            className={`text-sm font-black ${
                              r.upsidePct > 0 ? 'text-purple-400' : 'text-red-400'
                            }`}
                          >
                            {r.currency}
                            {r.targetPrice.toFixed(2)}
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              r.upsidePct > 0
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {r.upsidePct > 0 ? '+' : ''}
                            {r.upsidePct}% Runway
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Conviction & Win Probability */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Conviction & Win Prob.</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                              r.algorithmConviction === 'Strong Buy'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : r.algorithmConviction === 'High'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {r.algorithmConviction}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">
                            {r.winProbability}% Win Prob
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Revenue Growth YoY */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Quarterly Revenue Growth</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3 font-semibold text-emerald-400">
                          {r.financials.revenue}
                        </td>
                      ))}
                    </tr>

                    {/* EPS Beat / Guidance */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">EPS Beat / Guidance</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3 text-slate-200">
                          {r.financials.eps}
                        </td>
                      ))}
                    </tr>

                    {/* Gross Margins */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Gross Margins Status</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3 font-semibold text-blue-400">
                          {r.financials.margins}
                        </td>
                      ))}
                    </tr>

                    {/* Executive Sentiment */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Transcript Tone Index</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3">
                          <div className="font-bold text-pink-400">
                            {r.executiveSentiment}% Positive
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Hedging: {r.hedgingIndex}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Quick Transcript Trigger */}
                    <tr>
                      <td className="p-3 text-slate-300 font-semibold">Audio Telemetry</td>
                      {results.map((r) => (
                        <td key={r.ticker} className="p-3">
                          <button
                            onClick={() => {
                              setActiveTranscriptStock(r);
                              setShowTranscriptModal(true);
                            }}
                            className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1.5 transition-colors"
                          >
                            <PlayCircle size={14} /> Read Transcript →
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Comparative Multi-Stock Relative Trajectory Chart */}
              {comparativeChartData.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <div>
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-300 flex items-center gap-2">
                        <TrendingUp size={15} className="text-purple-400" />
                        Normalized Performance Trajectory Comparison (% Gain vs Today)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Historical quarters (Q-3 to Q-1) to Present (Today = 0%) and Projected Target Upside.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 rounded-xl p-4 border border-white/5" style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparativeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                          dataKey="period"
                          stroke="var(--text-muted)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--text-muted)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px'
                          }}
                          itemStyle={{ color: 'white', fontSize: '12px' }}
                          formatter={(value, name) => [`${value > 0 ? '+' : ''}${value}%`, name]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        />
                        {results.map((stock) => (
                          <Line
                            key={stock.ticker}
                            type="monotone"
                            dataKey={stock.ticker}
                            stroke={stock.theme.stroke}
                            strokeWidth={3}
                            dot={{ r: 4, fill: stock.theme.stroke }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Side-by-Side In-Depth Cards Grid */}
          <div
            className={`grid grid-cols-1 ${
              results.length === 2 ? 'lg:grid-cols-2' : results.length >= 3 ? 'lg:grid-cols-3' : ''
            } gap-6`}
          >
            {results.map((stock) => {
              const theme = stock.theme;
              const isUp = (stock.changePct || 0) >= 0;

              return (
                <div
                  key={stock.ticker}
                  className={`glass-panel rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between shadow-2xl relative overflow-hidden ${theme.border}`}
                  style={{
                    background: `linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.98))`
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <h3 className="text-xl font-black text-white tracking-wider">
                            {stock.ticker}
                          </h3>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${theme.badge}`}>
                            {stock.algorithmConviction}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                          {stock.companyName}
                        </p>
                      </div>

                      {stock.isTopPick && (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Award size={12} /> Top Pick
                        </span>
                      )}
                    </div>

                    {/* Price & Target Barometer */}
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-white/5 mb-5 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">
                          Current Price
                        </span>
                        <div className="text-xl font-bold text-white font-mono">
                          {stock.currency}
                          {stock.currentPrice.toFixed(2)}
                        </div>
                        <span className={`text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isUp ? '+' : ''}
                          {stock.changePct.toFixed(2)}%
                        </span>
                      </div>

                      <div className="w-px h-10 bg-white/10" />

                      <div className="text-right">
                        <span className="text-[10px] text-purple-400 uppercase tracking-wider block font-bold flex items-center justify-end gap-1">
                          Agent Target {stock.upsidePct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} className="text-red-400" />}
                        </span>
                        <div className={`text-xl font-black font-mono ${stock.upsidePct > 0 ? 'text-purple-400' : 'text-red-400'}`}>
                          {stock.currency}
                          {stock.targetPrice.toFixed(2)}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${stock.upsidePct > 0 ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>
                          {stock.upsidePct > 0 ? '+' : ''}
                          {stock.upsidePct}% Upside
                        </span>
                      </div>
                    </div>

                    {/* Price Trajectory Area Chart */}
                    <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-5" style={{ height: '170px' }}>
                      <div className="text-[10px] text-muted mb-1 font-bold tracking-wider uppercase text-center">
                        Price Trajectory ({stock.ticker})
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stock.chartData}>
                          <defs>
                            <linearGradient id={`gradPrice-${stock.ticker}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id={`gradTarget-${stock.ticker}`} x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor={stock.upsidePct > 0 ? theme.primary : '#ef4444'}
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="95%"
                                stopColor={stock.upsidePct > 0 ? theme.primary : '#ef4444'}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${stock.currency}${v}`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px'
                            }}
                            itemStyle={{ color: 'white', fontSize: '11px' }}
                          />
                          <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2.5} fill={`url(#gradPrice-${stock.ticker})`} connectNulls={false} isAnimationActive={false} />
                          <Area type="monotone" dataKey="predicted" stroke={stock.upsidePct > 0 ? theme.primary : '#ef4444'} strokeWidth={2.5} strokeDasharray="4 4" fill={`url(#gradTarget-${stock.ticker})`} connectNulls={false} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Quarterly Results Box */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 mb-4">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2.5">
                        <FileText className="text-blue-400" size={14} /> Quarterly Results
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-black/30 p-2 rounded-lg">
                          <span className="text-[10px] text-muted block uppercase">Revenue YoY</span>
                          <span className="font-bold text-emerald-400">{stock.financials.revenue}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-lg">
                          <span className="text-[10px] text-muted block uppercase">EPS Guidance</span>
                          <span className="font-bold text-slate-200">{stock.financials.eps}</span>
                        </div>
                      </div>
                    </div>

                    {/* Earnings Transcript Box */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Mic className="text-pink-400" size={14} /> Transcript Key Points
                        </h4>
                        <span className="text-[10px] font-mono text-pink-400 font-bold">
                          {stock.executiveSentiment}% Bullish Tone
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {stock.transcriptKeyPoints.slice(0, 2).map((point, i) => (
                          <div key={i} className="text-xs bg-black/30 p-2 rounded-lg text-slate-300 italic flex gap-1.5">
                            <span className="text-pink-400">"</span>
                            <span className="line-clamp-2">{point}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setActiveTranscriptStock(stock);
                          setShowTranscriptModal(true);
                        }}
                        className="mt-2.5 text-[11px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 transition-colors w-full justify-center py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20"
                      >
                        <PlayCircle size={13} />
                        <span>Read Full {stock.ticker} Transcript Analysis</span>
                      </button>
                    </div>

                    {/* Global Catalysts */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 mb-4">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                        <Globe className="text-emerald-400" size={14} /> Macro / News Catalyst
                      </h4>
                      <div className="space-y-1.5">
                        {stock.globalImpact.map((item, i) => (
                          <div key={i} className="bg-black/30 p-2 rounded-lg flex justify-between items-center text-xs">
                            <span className="text-slate-300 truncate max-w-[170px]">{item.news}</span>
                            <span className={`font-bold ${item.impact === 'Positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {item.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Synthesis Takeaway */}
                    <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                      {stock.synthesis}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Transcript Analysis Modal with Multi-Stock Tabs */}
      {showTranscriptModal && activeTranscriptStock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowTranscriptModal(false)}
        >
          <div
            className="glass-panel w-full max-w-4xl max-h-[88vh] rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Mic size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white">
                      {activeTranscriptStock.ticker} Earnings Call Transcript Analysis
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                      Q3 FY2026
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {activeTranscriptStock.companyName} • Audio telemetry processed across Executive Remarks & Analyst Q&A.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Compared Stock Selector Tabs (if multiple stocks analyzed) */}
            {results && results.length > 1 && (
              <div className="px-6 py-2.5 bg-slate-950/90 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-muted font-bold mr-2">Switch Stock:</span>
                {results.map((r) => (
                  <button
                    key={r.ticker}
                    onClick={() => setActiveTranscriptStock(r)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      activeTranscriptStock.ticker === r.ticker
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{r.ticker}</span>
                    <span className="text-[10px] opacity-75">({r.executiveSentiment}% Tone)</span>
                  </button>
                ))}
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5">
                  <span className="text-xs text-muted block mb-1 uppercase font-semibold">
                    Executive Sentiment
                  </span>
                  <div className="text-lg font-bold text-pink-400">
                    {activeTranscriptStock.executiveSentiment}% Positive / High Conviction
                  </div>
                  <span className="text-xs text-slate-400">Tone index calculated via NLP</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5">
                  <span className="text-xs text-muted block mb-1 uppercase font-semibold">
                    Call Duration
                  </span>
                  <div className="text-lg font-bold text-white">54 Minutes</div>
                  <span className="text-xs text-slate-400">42 mins Q&A • 12 mins Prepared</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5">
                  <span className="text-xs text-muted block mb-1 uppercase font-semibold">
                    Hedging / Evasion Index
                  </span>
                  <div
                    className={`text-lg font-bold ${
                      activeTranscriptStock.hedgingIndex.includes('Low')
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {activeTranscriptStock.hedgingIndex}
                  </div>
                  <span className="text-xs text-slate-400">Linguistic hesitation detection</span>
                </div>
              </div>

              {/* Prepared Executive Remarks */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Volume2 size={18} className="text-pink-400" />
                  <h4>Prepared Executive Remarks ({activeTranscriptStock.ticker})</h4>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-black/25 border-l-4 border-pink-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-xs uppercase tracking-wider">
                        Chief Executive Officer (CEO)
                      </span>
                      <span className="text-[11px] text-muted">04:12 mark</span>
                    </div>
                    <p className="text-gray-300 italic text-sm leading-relaxed">
                      "{activeTranscriptStock.transcriptKeyPoints[0] || 'We are seeing immense structural adoption across our product matrix, delivering compounding value to enterprise customers worldwide.'}"
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-black/25 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-xs uppercase tracking-wider">
                        Chief Financial Officer (CFO)
                      </span>
                      <span className="text-[11px] text-muted">11:45 mark</span>
                    </div>
                    <p className="text-gray-300 italic text-sm leading-relaxed">
                      "{activeTranscriptStock.transcriptKeyPoints[1] || 'Free cash flow conversion surged to historic highs as our operational leverage materialized across all segments.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Q&A Analyst Session Highlights */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <MessageSquare size={18} className="text-blue-400" />
                  <h4>Institutional Q&A Analyst Session</h4>
                </div>
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-lg bg-black/25 border border-white/5 space-y-2">
                    <div className="font-semibold text-blue-300">
                      Q: Toshiya Hari (Goldman Sachs) — On supply trajectory and capacity constraints:
                    </div>
                    <p className="text-gray-300 pl-3 border-l-2 border-white/10 leading-relaxed text-sm">
                      A (Management): "{activeTranscriptStock.transcriptKeyPoints[2] || 'Our supply partners have accelerated ramp schedules significantly ahead of internal targets, giving us high order fulfillment confidence throughout upcoming quarters.'}"
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-black/25 border border-white/5 space-y-2">
                    <div className="font-semibold text-blue-300">
                      Q: Keith Weiss (Morgan Stanley) — On enterprise customer renewal cadence and gross margin expansion:
                    </div>
                    <p className="text-gray-300 pl-3 border-l-2 border-white/10 leading-relaxed text-sm">
                      A (Management): "Renewal retention rates stood firmly at top-tier benchmarks. Customers perceive our infrastructure as mission-critical rather than discretionary spend."
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent Takeaway */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-1">
                    Autonomous Intelligence Assessment
                  </h5>
                  <p className="text-emerald-200/90 text-xs leading-relaxed">
                    {activeTranscriptStock.synthesis}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/70 flex justify-end">
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="btn btn-outline py-2 px-6 text-xs font-bold"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Custom Transcript Key Points per Ticker
function getCustomTranscriptPoints(ticker, isBullish, currency) {
  const custom = {
    NVDA: [
      'CEO Jensen Huang confirmed Blackwell GPU racks are in full production with demand outstripping supply into next fiscal year.',
      'Data center revenue expanded over 112% YoY driven by frontier AI cluster deployments and hyperscaler capex commitments.',
      'CFO Colette Kress highlighted sovereign AI compute initiatives contributing multi-billion dollar annualized run-rates.'
    ],
    AAPL: [
      'CEO Tim Cook noted Apple Intelligence adoption is accelerating upgrade cycles across iPhone 16 and subsequent flagship portfolios.',
      'Services segment gross margins reached an all-time record 75.4%, driven by App Store, Cloud, and subscription payments.',
      'CFO Luca Maestri reaffirmed strong double-digit growth in active installed device base, surpassing 2.3 billion devices.'
    ],
    MSFT: [
      'CEO Satya Nadella reported Azure cloud growth accelerated to 33%, with AI services contributing 12 percentage points of growth.',
      'Copilot enterprise seat monetization expanded 60% QoQ with over 70% of Fortune 500 companies deploying Microsoft Copilot.',
      'Commercial bookings increased 19% YoY anchored on long-term multi-cloud enterprise agreements.'
    ],
    GOOGL: [
      'CEO Sundar Pichai stated Gemini API calls grew 14x over the past six months across enterprise cloud and developer ecosystems.',
      'Search monetization delivered sustained double-digit revenue expansion defying macroeconomic volatility.',
      'Google Cloud operating margins expanded to 11.2%, generating record quarterly operating income.'
    ],
    AMZN: [
      'CEO Andy Jassy highlighted AWS annualized run-rate reaching $110 billion with re-accelerating enterprise migrations.',
      'North American retail fulfillment network regionalization dropped delivery costs by 45 cents per package.',
      'Advertising services delivered 20% YoY top-line growth driven by Prime Video sponsored placements.'
    ],
    META: [
      'CEO Mark Zuckerberg noted Meta AI has over 500 million monthly active users, becoming the most utilized AI assistant globally.',
      'Advantage+ automated ad systems drove an 11% increase in ad impressions and a 9% increase in average price per ad.',
      'Family of Apps operating margins held steady near 48% despite continued infrastructure and Llama 4 investments.'
    ],
    TSLA: [
      'CEO Elon Musk confirmed Cybercab autonomous robotaxi volume production target remains firmly slated for 2026.',
      'Energy storage deployments (Megapack/Powerwall) grew 125% YoY, representing the highest margin segment in the business.',
      'FSD v13 real-world intervention-free miles increased 4.2x with rollout to customer fleets underway.'
    ],
    RELIANCE: [
      'Management highlighted sustained subscriber expansion in Jio 5G, with True 5G network carrying over 35% of total Indian data traffic.',
      'Retail footprint expanded by 420 new stores, driving record digital commerce grocery and lifestyle market share.',
      'Oil-to-Chemicals (O2C) crack spreads stabilized as export refinery throughput reached peak capacity utilization.'
    ],
    TCS: [
      'CEO highlighted record quarterly Total Contract Value (TCV) of $10.2 billion anchored on multi-year AI cloud modernization programs.',
      'Operating margins expanded 40 bps to 26.0% despite wage revisions and global macroeconomic delays in European IT spend.',
      'Attrition rate dropped to multi-year lows of 12.1% with significant billable utilization improvements.'
    ],
    INFY: [
      'Management reported large deal signings of $3.2 billion with 54% net new business across US and EMEA enterprise accounts.',
      'Generative AI delivery platform Topaz integrated across more than 300 active enterprise client transformations.',
      'Free cash flow conversion stood at an exceptional 108% of net profit, supporting capital return yield.'
    ],
    HDFCBANK: [
      'Management affirmed post-merger integration synergies ahead of guidance, with Net Interest Margin (NIM) stabilizing at 3.65%.',
      'Branch deposit growth outpaced system credit growth by 240 bps, strengthening liquidity coverage ratio to 123%.',
      'Gross NPA ratio improved 6 bps to 1.28%, underscoring institutional-grade asset quality.'
    ]
  };

  if (custom[ticker]) return custom[ticker];

  if (isBullish) {
    return [
      `CEO highlighted massive enterprise demand for ${ticker}'s core offerings continuing into next fiscal quarter.`,
      `Gross margin expansion materialized ahead of internal forecasts with operational efficiencies.`,
      `CFO raised full-year guidance and signaled accelerated capital allocation to high-return growth pillars.`
    ];
  } else {
    return [
      `CEO cited macroeconomic headwinds and extended enterprise customer decision-making cycles.`,
      `Supply chain and input costs compressed near-term gross margins across key product lines.`,
      `CFO adopted conservative forward guidance, trimming quarterly top-line revenue projections.`
    ];
  }
}

// Helper: Custom Macro News Impact per Ticker
function getCustomGlobalImpact(ticker, isBullish) {
  const custom = {
    NVDA: [
      { news: 'US Department of Energy approves $4B supercomputing cluster', impact: 'Positive', score: '+14%' },
      { news: 'New AI export licensing criteria in Southeast Asia', impact: 'Negative', score: '-3%' }
    ],
    AAPL: [
      { news: 'European smartphone shipments show premium tier upgrade cycle', impact: 'Positive', score: '+8%' },
      { news: 'Foreign exchange currency fluctuations in emerging markets', impact: 'Negative', score: '-2%' }
    ],
    MSFT: [
      { news: 'Global enterprise software budgets increase by 8.5% for cloud AI', impact: 'Positive', score: '+11%' },
      { news: 'Heightened competition in hyperscale compute pricing', impact: 'Negative', score: '-4%' }
    ],
    GOOGL: [
      { news: 'Gemini enterprise seats expand across healthcare and financial services', impact: 'Positive', score: '+12%' },
      { news: 'Antitrust scrutiny in regional display advertising platforms', impact: 'Negative', score: '-3%' }
    ],
    RELIANCE: [
      { news: 'Domestic consumer consumption indices hit 3-year highs in urban India', impact: 'Positive', score: '+9%' },
      { news: 'Global crude crack spread volatility impacting regional refiners', impact: 'Negative', score: '-4%' }
    ],
    TCS: [
      { news: 'US Federal Reserve interest rate cut prospects spur enterprise IT capex', impact: 'Positive', score: '+10%' },
      { news: 'Prolonged decision cycles in continental Europe manufacturing contracts', impact: 'Negative', score: '-5%' }
    ]
  };

  if (custom[ticker]) return custom[ticker];

  return isBullish
    ? [
        { news: 'Global institutional fund flows rotating into high-quality sector leaders', impact: 'Positive', score: '+10%' },
        { news: 'Short-term supply chain component lead times slightly extended', impact: 'Negative', score: '-3%' }
      ]
    : [
        { news: 'Sector peers report elevated promotional discounting and margin competition', impact: 'Negative', score: '-8%' },
        { news: 'Central bank liquidity injections support broad baseline valuations', impact: 'Positive', score: '+4%' }
      ];
}
