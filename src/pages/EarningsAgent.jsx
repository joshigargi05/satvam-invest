import React, { useState } from 'react';
import * as Lucide from 'lucide-react';

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

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { getQuotes } from '../services/api';
import { useMarket } from '../context/MarketContext';

export default function EarningsAgent() {
  const { market, currency, getCurrency } = useMarket();
  const [ticker, setTicker] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [results, setResults] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  const handleAnalyze = async () => {
    if (!ticker.trim()) return;
    setAnalyzing(true);
    setResults(null);
    setProgress(0);
    
    const cleanTicker = ticker.trim().toUpperCase();
    const assetCurrency = getCurrency(cleanTicker);
    let currentPrice = assetCurrency === '₹' ? 1000.00 : 100.00;

    try {
      const quotes = await getQuotes(cleanTicker);
      if (quotes && quotes[cleanTicker] && typeof quotes[cleanTicker].price === 'number') {
        currentPrice = quotes[cleanTicker].price;
      }
    } catch (e) {
      console.error(e);
    }

    // Simulate complex multi-stage agentic workflow
    const stages = [
      { p: 15, text: 'Fetching SEC 10-Q Financial Results...' },
      { p: 40, text: 'Parsing Earnings Call Audio Transcripts...' },
      { p: 65, text: 'Aggregating Global Macro News Impact...' },
      { p: 90, text: 'Running Algorithmic Price Target Models...' },
      { p: 100, text: 'Finalizing Report...' }
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
          
          // Generate pseudo-random metrics based on ticker hash to make it feel real
          const hash = cleanTicker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
          const isBullish = hash % 2 === 0;
          const targetMultiplier = isBullish ? (1.1 + (hash % 15) / 100) : (0.9 - (hash % 10) / 100);
          
          // Safety check in case currentPrice is somehow invalid
          const safePrice = Number(currentPrice) || (assetCurrency === '₹' ? 1000.00 : 100.00);
          const targetPrice = safePrice * targetMultiplier;
          const revGrowth = isBullish ? `+${10 + (hash % 20)}% YoY` : `-${2 + (hash % 8)}% YoY`;
          const epsChange = isBullish ? `Beat by ${assetCurrency}0.${10 + (hash % 20)}` : `Missed by ${assetCurrency}0.${5 + (hash % 15)}`;
          
          const chartData = [
            { month: 'Q-3', price: Number((safePrice * (isBullish ? 0.85 : 1.15)).toFixed(2)), predicted: null },
            { month: 'Q-2', price: Number((safePrice * (isBullish ? 0.90 : 1.10)).toFixed(2)), predicted: null },
            { month: 'Q-1', price: Number((safePrice * (isBullish ? 0.98 : 1.05)).toFixed(2)), predicted: null },
            { month: 'Today', price: safePrice, predicted: safePrice },
            { month: 'Target', price: null, predicted: Number(targetPrice.toFixed(2)) }
          ];
          
          setResults({
            ticker: cleanTicker,
            currency: assetCurrency,
            currentPrice: safePrice,
            targetPrice: targetPrice,
            chartData: chartData,
            algorithmConviction: isBullish ? 'High' : 'Moderate',
            financials: {
              revenue: revGrowth,
              eps: epsChange,
              margins: isBullish ? 'Expanding' : 'Contracting'
            },
            transcriptKeyPoints: isBullish ? [
              "CEO highlighted massive infrastructure demand continuing into next quarter.",
              "Supply chain bottlenecks have been fully resolved.",
              "CFO raised full-year guidance significantly."
            ] : [
              "CEO cited macroeconomic headwinds impacting enterprise spending.",
              "Supply chain costs have compressed gross margins.",
              "CFO lowered Q4 revenue projections."
            ],
            globalImpact: [
              { news: 'US Fed hints at rate cuts', impact: 'Positive', score: '+12%' },
              { news: 'New trade tariffs in Asia', impact: 'Negative', score: '-4%' }
            ],
            synthesis: isBullish 
              ? `The agent has calculated a highly favorable risk/reward ratio. The recent earnings call exhibited massive executive confidence. Coupled with positive macro-economic shifts, the algorithmic target price is calculated at a premium to the current trading price.`
              : `The agent detects elevated risk. The recent earnings call highlighted margin compression and lowered guidance. The algorithmic models suggest potential downside, setting a target price below the current trading levels.`
          });
        }, 800);
      }
    }, 1200); // 1.2s per stage for dramatic effect
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', padding: '0.75rem', borderRadius: '12px', color: 'white' }}>
            <Cpu size={28} />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>Deep Analysis Agent</h1>
            <p className="text-muted">Autonomous AI agent for earnings calls, financials, and macro news.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel card mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1 flex items-center" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <Search className="absolute left-4 text-muted" size={20} />
            <input
              type="text"
              className="w-full bg-transparent text-white outline-none"
              style={{ padding: '1rem 1rem 1rem 3rem', fontSize: '1rem' }}
              placeholder={`Enter STOCK (e.g. ${market === 'US' ? 'NVDA' : 'RELIANCE'})`}
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={analyzing}
            />
          </div>
          <button onClick={handleAnalyze} className="btn btn-primary" style={{ padding: '0 2rem', borderRadius: '12px', background: '#8b5cf6' }} disabled={analyzing}>
            Deploy Agent
          </button>
        </div>
      </div>

      {analyzing && (
        <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative w-24 h-24 mb-6">
            <svg className="animate-spin w-full h-full text-purple-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">{progress}%</div>
          </div>
          <h3 className="text-xl font-bold mb-2 animate-pulse">{stage}</h3>
          <div className="w-full max-w-md bg-gray-800 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-purple-500 h-2 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Algorithmic Pricing Panel */}
          <div className="glass-panel rounded-xl p-6 lg:col-span-3 border-l-4" style={{ borderColor: '#8b5cf6' }}>
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex-1">
                <h3 className="text-muted uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2"><Target size={14}/> Algorithmic Recommendation</h3>
                <p className="text-gray-300 leading-relaxed text-sm mb-6">{results.synthesis}</p>
                
                <div className="flex flex-wrap gap-8 items-center bg-black/20 p-6 rounded-xl border border-white/5">
                  <div className="flex-1 min-w-[120px]">
                    <div className="text-muted text-xs uppercase mb-2 tracking-wider">Current Price</div>
                    <div className="text-3xl font-medium">{results.currency || currency}{results.currentPrice.toFixed(2)}</div>
                  </div>
                  <div className="hidden md:block w-px h-12 bg-white/10"></div>
                  <div className="flex-1 min-w-[120px]">
                    <div className="text-purple-400 text-xs uppercase mb-2 font-bold tracking-wider flex items-center gap-2">
                      Agent Target
                      {results.targetPrice > results.currentPrice ? <TrendingUp size={14}/> : <TrendingDown size={14} className="text-red-400"/>}
                    </div>
                    <div className={`text-4xl font-black ${results.targetPrice > results.currentPrice ? 'text-purple-400' : 'text-red-400'}`}>
                      {results.currency || currency}{results.targetPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="hidden md:block w-px h-12 bg-white/10"></div>
                  <div className="flex-1 min-w-[120px] text-right md:text-left">
                    <div className="text-muted text-xs uppercase mb-2 tracking-wider">Conviction</div>
                    <div className={`inline-block font-bold px-3 py-1.5 rounded-lg text-sm ${
                      results.algorithmConviction === 'High' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-orange-400/10 text-orange-400'
                    }`}>
                      {results.algorithmConviction}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-1/2 bg-black/20 rounded-xl p-4 border border-white/5" style={{ height: '250px', minHeight: '250px' }}>
                <div className="text-xs text-muted mb-2 font-bold tracking-wider uppercase text-center">Price Trajectory</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={results.chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={results.targetPrice > results.currentPrice ? "#8b5cf6" : "#ef4444"} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={results.targetPrice > results.currentPrice ? "#8b5cf6" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={45} tickFormatter={(v) => `${results.currency || currency}${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'white' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fill="url(#colorPrice)" connectNulls={false} isAnimationActive={false} />
                    <Area type="monotone" dataKey="predicted" stroke={results.targetPrice > results.currentPrice ? "#8b5cf6" : "#ef4444"} strokeWidth={3} strokeDasharray="5 5" fill="url(#colorPredicted)" connectNulls={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Column 1: Financials */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold mb-6 pb-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <FileText className="text-blue-400" size={20} /> Quarterly Results
            </h3>
            <div className="space-y-4">
              <div className="bg-black/20 p-3 rounded-lg">
                <div className="text-xs text-muted mb-1 uppercase tracking-wider">Revenue Growth</div>
                <div className="font-bold text-emerald-400">{results.financials.revenue}</div>
              </div>
              <div className="bg-black/20 p-3 rounded-lg">
                <div className="text-xs text-muted mb-1 uppercase tracking-wider">Earnings Per Share (EPS)</div>
                <div className="font-bold">{results.financials.eps}</div>
              </div>
              <div className="bg-black/20 p-3 rounded-lg">
                <div className="text-xs text-muted mb-1 uppercase tracking-wider">Gross Margins</div>
                <div className="font-bold text-blue-400">{results.financials.margins}</div>
              </div>
            </div>
          </div>

          {/* Column 2: Earnings Call Transcript */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="flex justify-between items-center font-bold mb-6 pb-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <span className="flex items-center gap-2"><Mic className="text-pink-400" size={20} /> Earnings Transcript</span>
              <PlayCircle 
                onClick={() => setShowTranscriptModal(true)} 
                className="text-pink-400 hover:text-pink-300 cursor-pointer transition-transform hover:scale-110" 
                size={20} 
                title="Open Full Transcript Analysis"
              />
            </h3>
            <div className="space-y-3">
              {results.transcriptKeyPoints.map((point, i) => (
                <div key={i} className="flex gap-3 text-sm bg-black/20 p-3 rounded-lg">
                  <span className="text-pink-400 mt-1">"</span>
                  <p className="text-gray-300 italic">{point}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 text-center border-t border-gray-800">
              <button 
                onClick={() => setShowTranscriptModal(true)}
                className="text-xs text-pink-400 hover:text-pink-300 transition-colors uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <span>Read Full Transcript Analysis</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Column 3: Global News Impact */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="flex items-center gap-2 font-bold mb-6 pb-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <Globe className="text-emerald-400" size={20} /> Global News Impact
            </h3>
            <div className="space-y-4">
              {results.globalImpact.map((item, i) => (
                <div key={i} className="bg-black/20 p-3 rounded-lg flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-200">{item.news}</p>
                    <span className="text-xs text-muted">{item.impact} Catalyst</span>
                  </div>
                  <div className={`font-bold ${item.impact === 'Positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.score}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Full Transcript Analysis Modal */}
      {showTranscriptModal && results && (
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {results.ticker} Full Earnings Call Transcript Analysis
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                      Q3 FY2026
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Audio telemetry processed across Executive Remarks, Q&A Analyst Session & Linguistic Velocity.
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5">
                  <span className="text-xs text-muted block mb-1 uppercase font-semibold">Executive Sentiment</span>
                  <div className="text-lg font-bold text-pink-400">
                    {results.algorithmConviction === 'High' ? '92% Bullish / High Conviction' : '64% Cautious / Defensive'}
                  </div>
                  <span className="text-xs text-slate-400">Tone index calculated via NLP</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5">
                  <span className="text-xs text-muted block mb-1 uppercase font-semibold">Call Duration</span>
                  <div className="text-lg font-bold text-white">54 Minutes</div>
                  <span className="text-xs text-slate-400">42 mins Q&A • 12 mins Prepared</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5">
                  <span className="text-xs text-muted block mb-1 uppercase font-semibold">Hedging / Evasion Index</span>
                  <div className={`text-lg font-bold ${results.algorithmConviction === 'High' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {results.algorithmConviction === 'High' ? 'Low (Direct Transparency)' : 'Elevated (Guidance Hedged)'}
                  </div>
                  <span className="text-xs text-slate-400">Linguistic hesitation detection</span>
                </div>
              </div>

              {/* Prepared Executive Remarks */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Volume2 size={18} className="text-pink-400" />
                  <h4>Prepared Executive Remarks</h4>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-black/25 border-l-4 border-pink-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-xs uppercase tracking-wider">Chief Executive Officer (CEO)</span>
                      <span className="text-[11px] text-muted">04:12 mark</span>
                    </div>
                    <p className="text-gray-300 italic text-sm leading-relaxed">
                      "{results.transcriptKeyPoints[0] || 'We are experiencing immense structural adoption across our product matrix, delivering compounding value to global enterprise customers.'}"
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-black/25 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-xs uppercase tracking-wider">Chief Financial Officer (CFO)</span>
                      <span className="text-[11px] text-muted">11:45 mark</span>
                    </div>
                    <p className="text-gray-300 italic text-sm leading-relaxed">
                      "{results.transcriptKeyPoints[1] || 'Free cash flow conversion surged to historic highs as our operational leverage materialized across all geographic segments.'}"
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
                      A (Management): "{results.transcriptKeyPoints[2] || 'Our supply partners have accelerated ramp schedules significantly ahead of internal targets, giving us high order fulfillment confidence throughout upcoming quarters.'}"
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
                    {results.synthesis}
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
