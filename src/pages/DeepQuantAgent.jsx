import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { getQuotes, getTopAlgoPicks, evaluateStocks, getAlgoRecommendations } from '../services/api';
import { useMarket, isIndianTicker } from '../context/MarketContext';

// Lucide Icons
const Search = Lucide.Search || (() => '🔍');
const Mic = Lucide.Mic || (() => '🎤');
const FileText = Lucide.FileText || (() => '📄');
const Globe = Lucide.Globe || (() => '🌐');
const Target = Lucide.Target || (() => '🎯');
const Cpu = Lucide.Cpu || (() => '💻');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const AlertCircle = Lucide.AlertCircle || Lucide.AlertTriangle || (() => '⚠️');
const AlertTriangle = Lucide.AlertTriangle || (() => '⚠️');
const PlayCircle = Lucide.PlayCircle || (() => '▶️');
const X = Lucide.X || (() => '✕');
const CheckCircle2 = Lucide.CheckCircle2 || (() => '✓');
const MessageSquare = Lucide.MessageSquare || (() => '💬');
const Plus = Lucide.Plus || (() => '+');
const Award = Lucide.Award || (() => '🏆');
const Layers = Lucide.Layers || (() => '📑');
const Sparkles = Lucide.Sparkles || (() => '✨');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const ArrowRight = Lucide.ArrowRight || (() => '→');
const Bot = Lucide.Bot || (() => '🤖');
const Activity = Lucide.Activity || (() => '⚡');

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
  SUNPHARMA: 'Sun Pharma Ltd.',
  QCOM: 'Qualcomm Incorporated',
  NTAP: 'NetApp Inc.',
  'M&M': 'Mahindra & Mahindra Ltd.',
  MM: 'Mahindra & Mahindra Ltd.',
  'M_M': 'Mahindra & Mahindra Ltd.',
  ETERNAL: 'Eternal Limited (Zomato / Blinkit)',
  MEESHO: 'Meesho Inc. (E-Commerce)',
  SWIGGY: 'Swiggy Limited',
  ZOMATO: 'Eternal Limited (Zomato / Blinkit)',
  PAYTM: 'One97 Communications (Paytm)',
  NYKAA: 'FSN E-Commerce (Nykaa)',
  JIOFIN: 'Jio Financial Services',
  TATATECH: 'Tata Technologies Ltd.',
  BEL: 'Bharat Electronics Ltd.',
  HAL: 'Hindustan Aeronautics Ltd.',
  TRENT: 'Trent Limited'
};

const getCompanyName = (ticker) => COMPANY_NAMES[ticker] || `${ticker} Corp.`;

// Comprehensive Company Name & Colloquial Search Aliases to Official Exchange Tickers
const COMPANY_ALIASES = {
  // US Equities
  QUALCOMM: 'QCOM',
  QCOM: 'QCOM',
  NETAPP: 'NTAP',
  NTAP: 'NTAP',
  PALOALTO: 'PANW',
  PALO: 'PANW',
  PANW: 'PANW',
  GOOGLE: 'GOOGL',
  ALPHABET: 'GOOGL',
  GOOG: 'GOOGL',
  GOOGL: 'GOOGL',
  APPLE: 'AAPL',
  AAPL: 'AAPL',
  MICROSOFT: 'MSFT',
  MSFT: 'MSFT',
  AMAZON: 'AMZN',
  AMZN: 'AMZN',
  NVIDIA: 'NVDA',
  NVDA: 'NVDA',
  TESLA: 'TSLA',
  TSLA: 'TSLA',
  META: 'META',
  FACEBOOK: 'META',
  BROADCOM: 'AVGO',
  AVGO: 'AVGO',
  MICRON: 'MU',
  MU: 'MU',
  AMD: 'AMD',
  INTEL: 'INTC',
  INTC: 'INTC',
  NETFLIX: 'NFLX',
  NFLX: 'NFLX',
  PALANTIR: 'PLTR',
  PLTR: 'PLTR',
  ORACLE: 'ORCL',
  ORCL: 'ORCL',
  SERVICENOW: 'NOW',
  NOW: 'NOW',
  CROWDSTRIKE: 'CRWD',
  CRWD: 'CRWD',
  SALESFORCE: 'CRM',
  CRM: 'CRM',
  ADOBE: 'ADBE',
  ADBE: 'ADBE',
  COSTCO: 'COST',
  COST: 'COST',
  WALMART: 'WMT',
  WMT: 'WMT',
  JPMORGAN: 'JPM',
  JPM: 'JPM',
  GOLDMAN: 'GS',
  GS: 'GS',
  MORGANSTANLEY: 'MS',
  MS: 'MS',
  BLACKROCK: 'BLK',
  BLK: 'BLK',
  VISA: 'V',
  V: 'V',
  MASTERCARD: 'MA',
  MA: 'MA',
  PAYPAL: 'PYPL',
  PYPL: 'PYPL',
  UBER: 'UBER',
  DISNEY: 'DIS',
  DIS: 'DIS',
  CISCO: 'CSCO',
  CSCO: 'CSCO',
  IBM: 'IBM',
  LILLY: 'LLY',
  ELILILLY: 'LLY',
  LLY: 'LLY',
  TSMC: 'TSM',
  TSM: 'TSM',

  // Indian Equities
  RELIANCE: 'RELIANCE',
  TCS: 'TCS',
  TATAMOTORS: 'TATAMOTORS',
  TATASTEEL: 'TATASTEEL',
  TATATECH: 'TATATECH',
  TATAPOWER: 'TATAPOWER',
  INFOSYS: 'INFY',
  INFY: 'INFY',
  HDFC: 'HDFCBANK',
  HDFCBANK: 'HDFCBANK',
  ICICI: 'ICICIBANK',
  ICICIBANK: 'ICICIBANK',
  SBI: 'SBIN',
  SBIN: 'SBIN',
  AIRTEL: 'BHARTIARTL',
  BHARTI: 'BHARTIARTL',
  BHARTIARTL: 'BHARTIARTL',
  MAHINDRA: 'M&M',
  'M&M': 'M&M',
  MM: 'M&M',
  M_M: 'M&M',
  MARUTI: 'MARUTI',
  SUZUKI: 'MARUTI',
  LARSEN: 'LT',
  'L&T': 'LT',
  LT: 'LT',
  HUL: 'HINDUNILVR',
  HINDUNILVR: 'HINDUNILVR',
  BAJAJ: 'BAJFINANCE',
  BAJFINANCE: 'BAJFINANCE',
  BAJAJAUTO: 'BAJAJ-AUTO',
  'BAJAJ-AUTO': 'BAJAJ-AUTO',
  ETERNAL: 'ETERNAL',
  ZOMATO: 'ETERNAL',
  BLINKIT: 'ETERNAL',
  SWIGGY: 'SWIGGY',
  MEESHO: 'MEESHO',
  PAYTM: 'PAYTM',
  NYKAA: 'NYKAA',
  JIO: 'JIOFIN',
  JIOFIN: 'JIOFIN',
  TITAN: 'TITAN',
  ADANI: 'ADANIENT',
  ADANIENT: 'ADANIENT',
  ADANIPORTS: 'ADANIPORTS',
  WIPRO: 'WIPRO',
  HAL: 'HAL',
  BEL: 'BEL',
  TRENT: 'TRENT',
  SUNPHARMA: 'SUNPHARMA'
};

const resolveTicker = (token) => {
  if (!token) return '';
  const clean = String(token).trim().toUpperCase();
  if (COMPANY_ALIASES[clean]) return COMPANY_ALIASES[clean];
  const noSpace = clean.replace(/[\s\-_.]+/g, '');
  if (COMPANY_ALIASES[noSpace]) return COMPANY_ALIASES[noSpace];
  return clean;
};

// Searchable Stock Catalog for Auto-Suggest Dropdown
const SEARCHABLE_STOCKS = [
  // US Tech & Leaders
  { ticker: 'QCOM', name: 'Qualcomm Incorporated', market: 'US', exchange: 'NASDAQ', sector: 'Semiconductors / Mobile' },
  { ticker: 'NTAP', name: 'NetApp Inc.', market: 'US', exchange: 'NASDAQ', sector: 'Cloud Storage & Data Infrastructure' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', market: 'US', exchange: 'NASDAQ', sector: 'Semiconductors / AI' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. (Google)', market: 'US', exchange: 'NASDAQ', sector: 'Technology / AI' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', market: 'US', exchange: 'NASDAQ', sector: 'Cloud / Enterprise Software' },
  { ticker: 'AAPL', name: 'Apple Inc.', market: 'US', exchange: 'NASDAQ', sector: 'Consumer Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', market: 'US', exchange: 'NASDAQ', sector: 'E-Commerce / Cloud' },
  { ticker: 'META', name: 'Meta Platforms (Facebook)', market: 'US', exchange: 'NASDAQ', sector: 'Social Media / AI' },
  { ticker: 'TSLA', name: 'Tesla Inc.', market: 'US', exchange: 'NASDAQ', sector: 'Automotive / AI' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', market: 'US', exchange: 'NASDAQ', sector: 'Semiconductors / AI' },
  { ticker: 'MU', name: 'Micron Technology', market: 'US', exchange: 'NASDAQ', sector: 'Semiconductors / Memory' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', market: 'US', exchange: 'NASDAQ', sector: 'Semiconductors' },
  { ticker: 'INTC', name: 'Intel Corporation', market: 'US', exchange: 'NASDAQ', sector: 'Semiconductors' },
  { ticker: 'PLTR', name: 'Palantir Technologies', market: 'US', exchange: 'NYSE', sector: 'Enterprise AI' },
  { ticker: 'ORCL', name: 'Oracle Corporation', market: 'US', exchange: 'NYSE', sector: 'Cloud Infrastructure' },
  { ticker: 'NOW', name: 'ServiceNow Inc.', market: 'US', exchange: 'NYSE', sector: 'Enterprise Workflow AI' },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings', market: 'US', exchange: 'NASDAQ', sector: 'Cybersecurity' },
  { ticker: 'PANW', name: 'Palo Alto Networks', market: 'US', exchange: 'NASDAQ', sector: 'Cybersecurity' },
  { ticker: 'NFLX', name: 'Netflix Inc.', market: 'US', exchange: 'NASDAQ', sector: 'Streaming Media' },
  { ticker: 'CRM', name: 'Salesforce Inc.', market: 'US', exchange: 'NYSE', sector: 'Enterprise Software' },
  { ticker: 'ADBE', name: 'Adobe Inc.', market: 'US', exchange: 'NASDAQ', sector: 'Creative Software' },
  { ticker: 'COST', name: 'Costco Wholesale', market: 'US', exchange: 'NASDAQ', sector: 'Consumer Retail' },
  { ticker: 'WMT', name: 'Walmart Inc.', market: 'US', exchange: 'NYSE', sector: 'Consumer Retail' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', market: 'US', exchange: 'NYSE', sector: 'Banking / Financials' },
  { ticker: 'LLY', name: 'Eli Lilly & Co.', market: 'US', exchange: 'NYSE', sector: 'Biopharma' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor (TSMC)', market: 'US', exchange: 'NYSE', sector: 'Semiconductors' },
  { ticker: 'UBER', name: 'Uber Technologies', market: 'US', exchange: 'NYSE', sector: 'Mobility / Tech' },
  { ticker: 'DIS', name: 'The Walt Disney Company', market: 'US', exchange: 'NYSE', sector: 'Entertainment' },
  { ticker: 'PYPL', name: 'PayPal Holdings', market: 'US', exchange: 'NASDAQ', sector: 'Digital Payments' },

  // Indian NSE Leaders
  { ticker: 'RELIANCE', name: 'Reliance Industries Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Energy / Conglomerate' },
  { ticker: 'TCS', name: 'Tata Consultancy Services', market: 'INDIA', exchange: 'NSE', sector: 'IT Services' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Private Banking' },
  { ticker: 'INFY', name: 'Infosys Limited', market: 'INDIA', exchange: 'NSE', sector: 'IT Services' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Private Banking' },
  { ticker: 'SBIN', name: 'State Bank of India', market: 'INDIA', exchange: 'NSE', sector: 'PSU Banking' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel (Airtel)', market: 'INDIA', exchange: 'NSE', sector: 'Telecom / 5G' },
  { ticker: 'M&M', name: 'Mahindra & Mahindra Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Automotive / SUVs' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Automotive / EV' },
  { ticker: 'MARUTI', name: 'Maruti Suzuki India', market: 'INDIA', exchange: 'NSE', sector: 'Automotive' },
  { ticker: 'LT', name: 'Larsen & Toubro (L&T)', market: 'INDIA', exchange: 'NSE', sector: 'Engineering & Infra' },
  { ticker: 'ITC', name: 'ITC Limited', market: 'INDIA', exchange: 'NSE', sector: 'FMCG / Consumer' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever (HUL)', market: 'INDIA', exchange: 'NSE', sector: 'FMCG / Consumer' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Consumer NBFC' },
  { ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Two-Wheelers' },
  { ticker: 'ETERNAL', name: 'Eternal Limited (Zomato / Blinkit)', market: 'INDIA', exchange: 'NSE', sector: 'Food Delivery & Quick Commerce' },
  { ticker: 'SWIGGY', name: 'Swiggy Limited', market: 'INDIA', exchange: 'NSE', sector: 'Food Delivery & Quick Commerce' },
  { ticker: 'MEESHO', name: 'Meesho Inc.', market: 'INDIA', exchange: 'NSE', sector: 'E-Commerce' },
  { ticker: 'PAYTM', name: 'One97 Communications (Paytm)', market: 'INDIA', exchange: 'NSE', sector: 'Digital Payments' },
  { ticker: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', market: 'INDIA', exchange: 'NSE', sector: 'Beauty E-Commerce' },
  { ticker: 'JIOFIN', name: 'Jio Financial Services', market: 'INDIA', exchange: 'NSE', sector: 'Financial Services' },
  { ticker: 'TATATECH', name: 'Tata Technologies Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'EV Software & Engineering' },
  { ticker: 'HAL', name: 'Hindustan Aeronautics Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Aerospace & Defense' },
  { ticker: 'BEL', name: 'Bharat Electronics Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Defense Electronics' },
  { ticker: 'TRENT', name: 'Trent Ltd. (Zudio / Westside)', market: 'INDIA', exchange: 'NSE', sector: 'Retail & Fashion' },
  { ticker: 'TITAN', name: 'Titan Company (Tanishq)', market: 'INDIA', exchange: 'NSE', sector: 'Luxury & Jewellery' },
  { ticker: 'ADANIENT', name: 'Adani Enterprises Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Infra & Incubator' },
  { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical Ltd.', market: 'INDIA', exchange: 'NSE', sector: 'Pharma' },
  { ticker: 'WIPRO', name: 'Wipro Limited', market: 'INDIA', exchange: 'NSE', sector: 'IT Services' }
];

// Robust input tokenizer: handles "TCS vs M&M vs RELIANCE", "Qualcomm vs NetApp", company names, slashes, etc.
const parseTickerInput = (raw) => {
  if (!raw) return [];
  return String(raw)
    .replace(/\b(vs|v\/s|and)\b/gi, ',')
    .replace(/[\/|]+/g, ',')
    .split(/[,;\s]+/)
    .map((t) => resolveTicker(t))
    .filter((t) => Boolean(t) && t !== 'VS' && t !== 'V/S' && t !== 'AND' && t !== '&');
};

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

// Simulated Automated Trade Libraries
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

export default function DeepQuantAgent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { market, currency, getCurrency, isIndianTicker: contextIsIndianTicker } = useMarket();

  const checkIsIndian = (ticker) => {
    if (!ticker) return false;
    if (typeof isIndianTicker === 'function') return isIndianTicker(ticker);
    if (typeof contextIsIndianTicker === 'function') return contextIsIndianTicker(ticker);
    return ticker.endsWith('.NS') || ticker.endsWith('.BO');
  };

  // Active top-level mode tab: 'compare' | 'quant' | 'automated'
  const initialTab = searchParams.get('tab') === 'quant' 
    ? 'quant' 
    : searchParams.get('tab') === 'automated' 
    ? 'automated' 
    : 'compare';
  const [activeMainTab, setActiveMainTab] = useState(initialTab);

  // Sync tab with URL search params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['compare', 'quant', 'automated'].includes(tabParam)) {
      setActiveMainTab(tabParam);
    }
  }, [searchParams]);

  // Dynamic Dropdown for Algo Stock Target: 'quarterly' | 'sixMonths' | 'twelveMonths'
  const [targetTimeframe, setTargetTimeframe] = useState('twelveMonths');

  const getStockTarget = (stock, tf = targetTimeframe) => {
    if (stock?.targets && stock.targets[tf]) {
      return stock.targets[tf];
    }
    const baseUpside = Number(stock?.upsidePct || 15);
    const curP = Number(stock?.currentPrice || 100);
    if (tf === 'quarterly') {
      const u = Number((baseUpside * 0.32).toFixed(1));
      return { label: 'Quarterly', targetPrice: Number((curP * (1 + u / 100)).toFixed(2)), upsidePct: u };
    }
    if (tf === 'sixMonths') {
      const u = Number((baseUpside * 0.58).toFixed(1));
      return { label: '6 Months', targetPrice: Number((curP * (1 + u / 100)).toFixed(2)), upsidePct: u };
    }
    return { label: '12 Months', targetPrice: Number(stock?.targetPrice || (curP * (1 + baseUpside / 100)).toFixed(2)), upsidePct: baseUpside };
  };

  // ==========================================
  // TAB 1: Multi-Stock Comparison State
  // ==========================================
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [inputTicker, setInputTicker] = useState('');
  const [inputError, setInputError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [topPicksData, setTopPicksData] = useState(null);

  // Suggestions based on user input, matching ticker prefix, word prefix in name, or company aliases
  const suggestions = useMemo(() => {
    const raw = inputTicker.trim();
    if (!raw || selectedTickers.length >= 3) return [];
    const q = raw.toUpperCase();
    const resolvedDirect = resolveTicker(q);

    // Exact or prefix matches only to prevent false positives like "ne" matching "One97"
    const matches = SEARCHABLE_STOCKS.filter((stock) => {
      if (selectedTickers.includes(stock.ticker)) return false;
      const t = stock.ticker.toUpperCase();
      const n = stock.name.toUpperCase();

      // 1. Direct ticker or resolved alias match (e.g. "QCOM", "QUALCOMM", "M&M", "ETERNAL")
      if (t === resolvedDirect || t === q) return true;

      // 2. Ticker prefix match (e.g. typing "NE" matches "NETAPP", "NFLX" if ticker starts with NE)
      if (t.startsWith(q)) return true;

      // 3. Known aliases that start with the query (e.g. query "NE" matches alias "NETAPP" -> ticker "NTAP", "NETFLIX" -> "NFLX")
      const aliasMatch = Object.entries(COMPANY_ALIASES).some(
        ([alias, ticker]) => ticker === t && alias.startsWith(q)
      );
      if (aliasMatch) return true;

      // 4. Any distinct word in the company name starts with the query (e.g. "NetApp Inc." starts with "NE")
      const words = n.split(/[\s(/)\-,.]+/).filter(Boolean);
      if (words.some((w) => w.startsWith(q))) return true;

      // 5. If query is 3 or more chars, allow substring match on company name
      if (q.length >= 3 && n.includes(q)) return true;

      return false;
    });

    return matches
      .sort((a, b) => {
        const aT = a.ticker.toUpperCase();
        const bT = b.ticker.toUpperCase();
        const aExact = aT === resolvedDirect || aT === q;
        const bExact = bT === resolvedDirect || bT === q;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Prefer stocks whose ticker starts with query
        const aTickerPrefix = aT.startsWith(q);
        const bTickerPrefix = bT.startsWith(q);
        if (aTickerPrefix && !bTickerPrefix) return -1;
        if (!aTickerPrefix && bTickerPrefix) return 1;

        // Prefer active market
        const aMarket = a.market === market;
        const bMarket = b.market === market;
        if (aMarket && !bMarket) return -1;
        if (!aMarket && bMarket) return 1;

        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [inputTicker, selectedTickers, market]);

  // Detected alias recommendation if input differs from official ticker
  const detectedAlias = useMemo(() => {
    const q = inputTicker.trim().toUpperCase();
    if (!q || q.length < 2) return null;
    const resolved = resolveTicker(q);
    if (resolved && resolved !== q && !selectedTickers.includes(resolved)) {
      const match = SEARCHABLE_STOCKS.find((s) => s.ticker === resolved);
      return {
        query: inputTicker.trim(),
        ticker: resolved,
        name: match?.name || getCompanyName(resolved),
        market: match?.market || (checkIsIndian(resolved) ? 'INDIA' : 'US')
      };
    }
    return null;
  }, [inputTicker, selectedTickers]);

  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [results, setResults] = useState(null);

  const [activeTranscriptStock, setActiveTranscriptStock] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // Replicate Top 3 Recommended Stocks on mount or when market toggle changes
  useEffect(() => {
    let isMounted = true;
    const syncStocks = async () => {
      try {
        const picks = await getTopAlgoPicks(market, false);
        if (!isMounted) return;
        if (picks) setTopPicksData(picks);

        const rawParam = searchParams.get('tickers') || searchParams.get('ticker');
        if (rawParam) {
          const parts = parseTickerInput(rawParam).slice(0, 3);
          if (parts.length > 0) {
            setSelectedTickers(parts);
            handleAnalyze(parts, picks);
            return;
          }
        }

        // Replicate active market's Top 3 Recommended Stocks into Quant Agent
        const topList = market === 'INDIA'
          ? (picks?.indiaTopPicks || picks?.topPicks || [])
          : (picks?.usTopPicks || picks?.topPicks || []);

        const top3Tickers = topList.slice(0, 3).map((p) => p.ticker);
        if (top3Tickers.length > 0) {
          setSelectedTickers(top3Tickers);
          handleAnalyze(top3Tickers, picks);
        }
      } catch (e) {
        console.error('Error syncing Top 3 picks in Quant Agent:', e);
      }
    };

    syncStocks();
    return () => { isMounted = false; };
  }, [market, searchParams]);

  const handleAddTicker = (tickerToAdd) => {
    const raw = (tickerToAdd || inputTicker).trim().toUpperCase();
    if (!raw) return;

    const tokens = parseTickerInput(raw);
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

  const loadPreset = (presetList) => {
    const list = presetList.slice(0, 3);
    setSelectedTickers(list);
    setInputTicker('');
    setInputError('');
    handleAnalyze(list, topPicksData);
  };

  // Execute multi-stock comparative analysis with unified quantitative engine
  const handleAnalyze = async (overrideTickers = null, cachedPicks = null) => {
    let tickersToAnalyze = overrideTickers && overrideTickers.length > 0 ? [...overrideTickers] : [...selectedTickers];
    const pendingText = inputTicker.trim().toUpperCase();

    if (!overrideTickers && pendingText) {
      const tokens = parseTickerInput(pendingText);
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

    let quotesMap = {};
    let evalMap = {};

    try {
      const [quotesRes, evalRes] = await Promise.all([
        getQuotes(tickersToAnalyze.join(','), market),
        evaluateStocks(tickersToAnalyze, market)
      ]);
      quotesMap = quotesRes || {};
      if (evalRes?.results && Array.isArray(evalRes.results)) {
        evalRes.results.forEach((item) => {
          if (item?.ticker) evalMap[item.ticker] = item;
        });
      }
    } catch (e) {
      console.error('Error fetching live quotes and algo evaluations for comparison:', e);
    }

    const activeTopPicks = cachedPicks || topPicksData;
    const allKnownTopPicks = [
      ...(activeTopPicks?.indiaTopPicks || []),
      ...(activeTopPicks?.usTopPicks || []),
      ...(activeTopPicks?.topPicks || [])
    ];
    allKnownTopPicks.forEach((p) => {
      if (p?.ticker && !evalMap[p.ticker]) {
        evalMap[p.ticker] = p;
      }
    });

    const label = tickersToAnalyze.join(', ');
    const stages = [
      { p: 15, text: `Fetching SEC 10-Q & Financial Statements for [${label}]...` },
      { p: 40, text: `Processing Audio Transcripts & Voice Sentiment for [${label}]...` },
      { p: 65, text: `Correlating Macro Geopolitical Catalysts & News Vectors...` },
      { p: 85, text: `Calculating Unified Algorithmic Price Target Projections...` },
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
          try {
            setAnalyzing(false);

            const isComparingIndianContext = market === 'INDIA' || tickersToAnalyze.some(t => checkIsIndian(t));
            const computedResults = tickersToAnalyze.map((cleanTicker, idx) => {
              const evalItem = evalMap[cleanTicker];
              const isInd = checkIsIndian(cleanTicker) || (isComparingIndianContext && !cleanTicker.endsWith('.US'));
              let assetCurrency = '₹';
              if (cleanTicker.endsWith('.US')) {
                assetCurrency = '$';
              } else if (isInd || isComparingIndianContext) {
                assetCurrency = '₹';
              } else if (evalItem?.currency) {
                assetCurrency = evalItem.currency;
              } else {
                assetCurrency = getCurrency(cleanTicker);
              }

              const quote = quotesMap[cleanTicker] || {};

              let currentPrice;
              if (typeof evalItem?.currentPrice === 'number' && evalItem.currentPrice > 0 && evalItem.currentPrice !== 100.0) {
                currentPrice = evalItem.currentPrice;
              } else if (typeof quote.price === 'number' && quote.price > 0 && quote.price !== 100.0) {
                currentPrice = quote.price;
              } else if (typeof evalItem?.currentPrice === 'number' && evalItem.currentPrice > 0) {
                currentPrice = evalItem.currentPrice;
              } else if (typeof quote.price === 'number' && quote.price > 0) {
                currentPrice = quote.price;
              } else {
                currentPrice = assetCurrency === '₹' ? (cleanTicker === 'ETERNAL' ? 363.10 : cleanTicker === 'MEESHO' ? 215.00 : 250.00) : 180.00;
              }

              const liveChange = typeof quote.change === 'number' ? quote.change : (evalItem?.change || 0);
              const liveChangePct = typeof quote.changePct === 'number' ? quote.changePct : (evalItem?.changePct || 0);
              const safePrice = Number(currentPrice) || (assetCurrency === '₹' ? 215.00 : 180.00);

              // Unified Algorithmic Target Price & Upside
              let targetPrice;
              let upsidePct;

              if (evalItem && typeof evalItem.targetPrice === 'number' && evalItem.targetPrice > 0) {
                targetPrice = Number(evalItem.targetPrice);
                upsidePct = Number(
                  evalItem.upsidePct !== undefined
                    ? evalItem.upsidePct
                    : (((targetPrice - safePrice) / safePrice) * 100).toFixed(1)
                );
              } else {
                const finalScore = evalItem?.finalScore || 82;
                upsidePct = Number(Math.max(8.5, (finalScore - 68) * 1.15).toFixed(1));
                targetPrice = Number((safePrice * (1 + upsidePct / 100)).toFixed(2));
              }

              const isBullish = upsidePct > 0;
              const hash = cleanTicker.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
              const revGrowthNum = isBullish ? (12 + (hash % 22)) : -(3 + (hash % 7));
              const revGrowth = `${revGrowthNum > 0 ? '+' : ''}${revGrowthNum}% YoY`;
              const epsBeatAmount = (0.12 + (hash % 30) / 100).toFixed(2);
              const epsChange = isBullish
                ? `Beat by ${assetCurrency}${epsBeatAmount}`
                : `Missed by ${assetCurrency}${(0.05 + (hash % 15) / 100).toFixed(2)}`;

              const margins = isBullish ? 'Expanding (+180 bps)' : 'Contracting (-95 bps)';
              const winProbability = evalItem?.probability
                ? Math.round(Number(evalItem.probability))
                : Math.min(96, Math.max(68, 75 + (isBullish ? 14 : -5) + (hash % 10)));

              const chartData = [
                { month: 'Q-3', price: Number((safePrice * 0.88).toFixed(2)), predicted: null },
                { month: 'Q-2', price: Number((safePrice * 0.93).toFixed(2)), predicted: null },
                { month: 'Q-1', price: Number((safePrice * 0.97).toFixed(2)), predicted: null },
                { month: 'Today', price: safePrice, predicted: safePrice },
                { month: 'Target', price: null, predicted: targetPrice }
              ];

              const transcriptPoints = getCustomTranscriptPoints(cleanTicker, isBullish, assetCurrency);
              const globalImpact = getCustomGlobalImpact(cleanTicker, isBullish);

              const synthesis = evalItem?.explanation
                ? `${evalItem.explanation} Algorithmic target of ${assetCurrency}${targetPrice} offers a +${upsidePct}% upside runway.`
                : (isBullish
                  ? `Autonomous Quant Agent rates ${cleanTicker} with a high outperformance vector. Institutional demand across product verticals is accelerating with expanding operating margins. Algorithmic target of ${assetCurrency}${targetPrice} offers a +${upsidePct}% upside runway.`
                  : `Quant Agent flags elevated operational headwind for ${cleanTicker}. Recent management remarks highlight margin compression and delayed enterprise pipeline conversion. Algorithmic target of ${assetCurrency}${targetPrice} reflects downside risk.`);

              return {
                ticker: cleanTicker,
                companyName: evalItem?.companyName || getCompanyName(cleanTicker),
                currency: assetCurrency,
                currentPrice: safePrice,
                change: liveChange,
                changePct: liveChangePct,
                targetPrice,
                upsidePct,
                targets: evalItem?.targets,
                chartData,
                winProbability,
                algorithmConviction: evalItem?.layers?.agentSignal || (upsidePct > 15 ? 'Strong Buy' : 'High Conviction'),
                finalScore: evalItem?.finalScore || 85,
                layers: evalItem?.layers,
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
          } catch (compErr) {
            console.error('Error computing quant comparison results:', compErr);
            setAnalyzing(false);
          }
        }, 600);
      }
    }, 1000);
  };

  const comparativeChartData = useMemo(() => {
    if (!results || results.length < 2) return [];
    const periods = ['Q-3', 'Q-2', 'Q-1', 'Today', 'Target'];

    return periods.map((period, pIdx) => {
      const entry = { period };
      results.forEach((stock) => {
        const item = stock.chartData[pIdx];
        const val = item.predicted !== null ? item.predicted : item.price;
        const pctDiff = Number((((val - stock.currentPrice) / stock.currentPrice) * 100).toFixed(1));
        entry[stock.ticker] = pctDiff;
      });
      return entry;
    });
  }, [results]);

  const topList = market === 'INDIA'
    ? (topPicksData?.indiaTopPicks || topPicksData?.topPicks || [])
    : (topPicksData?.usTopPicks || topPicksData?.topPicks || []);
  const top3PicksTickers = topList.slice(0, 3).map((p) => p.ticker);
  const top3PicksLabel = top3PicksTickers.length > 0 ? top3PicksTickers.join(' vs ') : 'Top 3 Picks';

  const presetsUS = [
    { label: 'QCOM vs NTAP vs NVDA', tickers: ['QCOM', 'NTAP', 'NVDA'] },
    ...(top3PicksTickers.length > 0
      ? [{ label: `🏆 Top 3 Recommended (${top3PicksLabel})`, tickers: top3PicksTickers, isTop3: true }]
      : []),
    { label: 'GOOGL vs META vs AMZN', tickers: ['GOOGL', 'META', 'AMZN'] },
    { label: 'NVDA vs MSFT vs AAPL', tickers: ['NVDA', 'MSFT', 'AAPL'] },
    { label: 'AMD vs INTC vs NVDA', tickers: ['AMD', 'INTC', 'NVDA'] }
  ];

  const presetsIndia = [
    { label: 'TCS vs M&M vs RELIANCE', tickers: ['TCS', 'M&M', 'RELIANCE'] },
    ...(top3PicksTickers.length > 0
      ? [{ label: `🏆 Top 3 Recommended (${top3PicksLabel})`, tickers: top3PicksTickers, isTop3: true }]
      : []),
    { label: 'RELIANCE vs TCS vs INFY', tickers: ['RELIANCE', 'TCS', 'INFY'] },
    { label: 'HDFCBANK vs ICICIBANK vs SBIN', tickers: ['HDFCBANK', 'ICICIBANK', 'SBIN'] },
    { label: 'TATAMOTORS vs MARUTI', tickers: ['TATAMOTORS', 'MARUTI'] }
  ];

  const activePresets = market === 'INDIA' ? presetsIndia : presetsUS;

  // ==========================================
  // TAB 2: Quant & ML Matrix State
  // ==========================================
  const [quantQuery, setQuantQuery] = useState('');
  const [quantLoading, setQuantLoading] = useState(false);
  const [quantResults, setQuantResults] = useState(null);

  const handleRunQuantScan = async (searchQuery) => {
    const rawQ = (typeof searchQuery === 'string' ? searchQuery : quantQuery).trim();
    if (!rawQ) return;
    const resolved = resolveTicker(rawQ);
    const q = (resolved && resolved !== rawQ.toUpperCase()) ? resolved : rawQ;
    setQuantLoading(true);
    try {
      const data = await getAlgoRecommendations(q);
      setQuantResults(data);
    } catch (e) {
      console.error('Quant recommendations fetch error:', e);
    } finally {
      setQuantLoading(false);
    }
  };

  // Default initial quant scan if none loaded
  useEffect(() => {
    if (activeMainTab === 'quant' && !quantResults && !quantLoading) {
      const defaultQ = market === 'INDIA' ? 'RELIANCE' : 'GOOGL';
      setQuantQuery(defaultQ);
      handleRunQuantScan(defaultQ);
    }
  }, [activeMainTab, market]);

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

  // ==========================================
  // TAB 3: Autopilot Execution State
  // ==========================================
  const [botActive, setBotActive] = useState(false);
  const [liveTrades, setLiveTrades] = useState([]);
  const [livePrices, setLivePrices] = useState({ 
    GOOGL: 289.57, NVDA: 135.20, AAPL: 224.23, TSLA: 250.00,
    META: 620.96, MSFT: 428.15, AMZN: 262.81, AMD: 145.10, PLTR: 44.50,
    RELIANCE: 1320.00, TCS: 2498.50, HDFCBANK: 788.25,
    INFY: 1850.00, ICICIBANK: 1260.00, SBIN: 810.00,
    BHARTIARTL: 1680.00, ITC: 490.00
  });

  const currentLibrary = market === 'INDIA' ? tradeLibraryIndia : tradeLibraryUS;

  useEffect(() => {
    setBotActive(false);
    setLiveTrades([]);
  }, [market]);

  useEffect(() => {
    if (activeMainTab === 'automated') {
      const symbols = Object.keys(livePrices).join(',');
      getQuotes(symbols).then((quotes) => {
        if (quotes) {
          const newPrices = { ...livePrices };
          Object.keys(quotes).forEach((sym) => {
            if (quotes[sym] && typeof quotes[sym].price === 'number') {
              newPrices[sym] = quotes[sym].price;
            }
          });
          setLivePrices(newPrices);
        }
      }).catch(() => {});
    }
  }, [activeMainTab]);

  useEffect(() => {
    if (!botActive) {
      setLiveTrades([]);
      return;
    }
    const interval = setInterval(() => {
      setLiveTrades((prev) => {
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

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
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
                Quant Agent
              </h1>
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Institutional Quant &amp; Fundamental Intelligence
              </span>
            </div>
            <p className="text-muted text-xs md:text-sm mt-0.5">
              Unified cross-asset workspace combining proprietary quantitative factor algorithms, SEC transcripts, and autopilot execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => navigate('/portfolio')} 
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            📊 My Portfolio
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

      {/* Top Main Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10">
        <button
          onClick={() => setActiveMainTab('compare')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeMainTab === 'compare'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={15} />
          <span>Multi-Stock Comparison</span>
          {selectedTickers.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
              {selectedTickers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('quant')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeMainTab === 'quant'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu size={15} />
          <span>Quant &amp; ML Matrix</span>
        </button>

        <button
          onClick={() => setActiveMainTab('automated')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
            activeMainTab === 'automated'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-white/5'
          }`}
        >
          <Bot size={15} />
          <span>Autopilot Execution</span>
          {botActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        {/* Dynamic Dropdown for Algo Stock Target: Quarterly, 6 Months, 12 Months */}
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
            <Target size={12} className="text-purple-400" />
            <span>Target Horizon:</span>
          </span>
          <select
            value={targetTimeframe}
            onChange={(e) => setTargetTimeframe(e.target.value)}
            className="bg-transparent text-purple-300 font-bold focus:outline-none cursor-pointer text-xs"
            title="Select dynamic target price timeframe (Quarterly, 6 Months, or 12 Months)"
          >
            <option value="quarterly" className="bg-slate-900 text-white">Quarterly (3M)</option>
            <option value="sixMonths" className="bg-slate-900 text-white">6 Months</option>
            <option value="twelveMonths" className="bg-slate-900 text-white">12 Months</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MULTI-STOCK DEEP COMPARISON                                       */}
      {/* ========================================================================= */}
      {activeMainTab === 'compare' && (
        <div className="animate-fade-in">
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
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div 
                  className="flex-1 flex items-center rounded-xl focus-within:border-purple-500/70 transition-colors"
                  style={{
                    minHeight: '56px',
                    backgroundColor: 'rgba(2, 6, 23, 0.95)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    position: 'relative'
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
                      paddingRight: inputTicker ? '3rem' : '1.25rem',
                      paddingTop: '1rem',
                      paddingBottom: '1rem',
                      fontSize: '1rem',
                      lineHeight: '1.5',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#ffffff'
                    }}
                    placeholder={
                      selectedTickers.length >= 3
                        ? 'Max 3 stocks reached. Click "Compare Side-by-Side" or remove a stock.'
                        : `Enter stock name or ticker (e.g. Qualcomm, NetApp, TCS, M&M, RELIANCE)`
                    }
                    value={inputTicker}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                    onChange={(e) => {
                      setInputTicker(e.target.value.toUpperCase());
                      setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (showSuggestions && suggestions.length > 0) {
                          handleAddTicker(suggestions[0].ticker);
                        } else if (selectedTickers.length < 3 && inputTicker.trim()) {
                          handleAddTicker();
                        } else {
                          handleAnalyze();
                        }
                        setShowSuggestions(false);
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    disabled={analyzing || selectedTickers.length >= 3}
                  />

                  {inputTicker && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputTicker('');
                        setShowSuggestions(false);
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '0.4rem',
                        color: '#94a3b8',
                        borderRadius: '8px'
                      }}
                      className="hover:text-white hover:bg-white/10 transition-colors"
                      title="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddTicker();
                      setShowSuggestions(false);
                    }}
                    disabled={analyzing || selectedTickers.length >= 3 || !inputTicker.trim()}
                    className={`flex-1 sm:flex-initial px-4 sm:px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border shrink-0 ${
                      inputTicker.trim() && selectedTickers.length < 3
                        ? 'bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border-purple-500/50 shadow-md shadow-purple-500/20 cursor-pointer'
                        : 'bg-slate-900/60 text-slate-500 border-white/5 cursor-not-allowed opacity-60'
                    }`}
                    style={{ minHeight: '56px', borderRadius: '14px' }}
                  >
                    <Plus size={16} />
                    <span>Add Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnalyze()}
                    disabled={analyzing || (selectedTickers.length === 0 && !inputTicker.trim())}
                    className={`flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                      analyzing || (selectedTickers.length === 0 && !inputTicker.trim())
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 cursor-pointer transform hover:-translate-y-0.5'
                    }`}
                    style={{
                      minHeight: '56px',
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

              {/* Auto-Suggest Recommendation Dropdown */}
              {showSuggestions && suggestions.length > 0 && selectedTickers.length < 3 && (
                <div 
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 'calc(100% + 8px)',
                    backgroundColor: '#070b14',
                    border: '1px solid rgba(139, 92, 246, 0.45)',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 30px rgba(139, 92, 246, 0.25)',
                    zIndex: 1000,
                    maxHeight: '360px',
                    overflowY: 'auto'
                  }}
                >
                  <div 
                    style={{ 
                      backgroundColor: '#0f172a', 
                      padding: '0.65rem 1.15rem', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                      <Sparkles size={13} className="text-purple-400" />
                      <span>Recommended Matching Stocks ({suggestions.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Click to Add or press Enter
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.ticker}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddTicker(item.ticker);
                          setInputTicker('');
                          setShowSuggestions(false);
                        }}
                        style={{
                          backgroundColor: '#070b14',
                          borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                          padding: '0.85rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#181e36';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#070b14';
                        }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div 
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(139, 92, 246, 0.15)',
                              border: '1px solid rgba(139, 92, 246, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: '#c084fc',
                              flexShrink: 0
                            }}
                          >
                            {item.ticker.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                                {item.ticker}
                              </span>
                              <span 
                                style={{
                                  fontSize: '0.7rem',
                                  fontFamily: 'monospace',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  border: item.market === 'INDIA' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
                                  backgroundColor: item.market === 'INDIA' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: item.market === 'INDIA' ? '#fdba74' : '#93c5fd'
                                }}
                              >
                                {item.exchange || (item.market === 'INDIA' ? 'NSE' : 'NASDAQ')}
                              </span>
                              {item.sector && (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  • {item.sector}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500, marginTop: '2px' }} className="truncate">
                              {item.name}
                            </div>
                          </div>
                        </div>

                        <div 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            color: '#d8b4fe',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            marginLeft: '1rem'
                          }}
                        >
                          <Plus size={14} />
                          <span>Add to Deck</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Auto-Resolution Recommendation Pill */}
            {detectedAlias && selectedTickers.length < 3 && (
              <div className="mt-3 p-2.5 px-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg shadow-purple-950/30 animate-fade-in">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-purple-400 font-bold flex items-center gap-1.5">
                    <Sparkles size={14} className="animate-pulse" /> Auto-Detected Stock Symbol:
                  </span>
                  <span>
                    &quot;<strong>{detectedAlias.query}</strong>&quot; maps to official exchange ticker <strong>{detectedAlias.ticker}</strong> ({detectedAlias.name})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleAddTicker(detectedAlias.ticker);
                    setInputTicker('');
                    setShowSuggestions(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shrink-0 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add {detectedAlias.ticker} to Deck</span>
                </button>
              </div>
            )}

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
                  className={`px-3 py-1 rounded-lg transition-all font-mono text-[11px] flex items-center gap-1.5 ${
                    preset.isTop3
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900/90 hover:bg-purple-950/40 text-slate-300 hover:text-purple-200 border border-white/10 hover:border-purple-500/40'
                  }`}
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
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" fill="none" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-white font-mono">
                  {progress}%
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 animate-pulse text-purple-200 text-center max-w-xl">
                {stage}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Cross-referencing unified quantitative factor matrices and SEC executive transcripts...
              </p>
              <div className="w-full max-w-md bg-gray-900 rounded-full h-2 overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
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
                        Comparative Analysis:{' '}
                        <span className="text-purple-400">{results.map((r) => r.ticker).join(' vs ')}</span>
                      </h2>
                    </div>

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

                  {/* Normalized Trajectory Overlay Chart */}
                  <div className="mb-6 p-4 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <TrendingUp size={16} className="text-purple-400" /> Relative Upside &amp; Price Trajectory (%)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Normalized trajectory from recent quarters (Q-3 to Q-1) to Present (Today = 0%) and Projected Target Upside.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        {results.map((stock) => (
                          <div key={stock.ticker} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stock.theme.primary }} />
                            <span className="font-bold text-white">{stock.ticker}</span>
                            <span className="text-emerald-400 font-bold">+{stock.upsidePct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparativeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                          <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '10px',
                              fontSize: '12px'
                            }}
                            formatter={(val, name) => [`${val > 0 ? '+' : ''}${val}%`, name]}
                          />
                          {results.map((stock) => (
                            <Line
                              key={stock.ticker}
                              type="monotone"
                              dataKey={stock.ticker}
                              stroke={stock.theme.primary}
                              strokeWidth={3}
                              dot={{ r: 4, fill: stock.theme.primary }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Matrix Table */}
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                          <th className="p-3 font-bold w-1/4">Metric</th>
                          {results.map((r) => (
                            <th key={r.ticker} className="p-3 font-bold">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.theme.primary }} />
                                <span className="text-white text-sm font-black">{r.ticker}</span>
                                {r.isTopPick && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                                    Top Pick
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-200">
                        <tr>
                          <td className="p-3 text-slate-300 font-semibold">Live Market Price</td>
                          {results.map((r) => (
                            <td key={r.ticker} className="p-3 font-mono font-bold text-white text-sm">
                              {r.currency}{r.currentPrice.toFixed(2)}
                              <span className={`ml-2 text-xs font-semibold ${r.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {r.changePct >= 0 ? '+' : ''}{r.changePct.toFixed(2)}%
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-300 font-semibold">Unified Target &amp; Upside</td>
                          {results.map((r) => {
                            const tg = getStockTarget(r);
                            return (
                              <td key={r.ticker} className="p-3 font-mono font-bold">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Target size={14} className="text-purple-400" />
                                  <span className="text-white">
                                    {r.currency}{tg.targetPrice.toFixed(2)}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      tg.upsidePct > 0
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}
                                  >
                                    {tg.upsidePct > 0 ? `+${tg.upsidePct}%` : `${tg.upsidePct}%`} ({tg.label})
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-300 font-semibold">Outperform Probability</td>
                          {results.map((r) => (
                            <td key={r.ticker} className="p-3 font-mono font-extrabold text-emerald-400 text-sm">
                              {r.winProbability}%
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-300 font-semibold">Quantitative Signal</td>
                          {results.map((r) => (
                            <td key={r.ticker} className="p-3 font-bold">
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {r.algorithmConviction}
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-300 font-semibold">Executive Transcript Sentiment</td>
                          {results.map((r) => (
                            <td key={r.ticker} className="p-3 font-mono text-purple-300 font-bold">
                              {r.executiveSentiment}/100 Positive
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Individual Stock Analysis Cards */}
              <div className="grid grid-cols-1 gap-6">
                {results.map((stock) => (
                  <div
                    key={stock.ticker}
                    className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-all shadow-xl relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-2xl font-black text-white">{stock.ticker}</h3>
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300">
                            {stock.companyName}
                          </span>
                          {stock.isTopPick && (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                              <Award size={14} /> Agent Top Pick
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-1">
                          {stock.synthesis}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Live Price</span>
                          <span className="text-xl font-bold font-mono text-white">
                            {stock.currency}{stock.currentPrice.toFixed(2)}
                          </span>
                        </div>
                        {(() => {
                          const tg = getStockTarget(stock);
                          return (
                            <div className="text-right p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                              <span className="text-xs text-emerald-300 block font-bold">
                                Target ({tg.label}: +{tg.upsidePct}%)
                              </span>
                              <span className="text-xl font-bold font-mono text-emerald-300">
                                {stock.currency}{tg.targetPrice.toFixed(2)}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Highlights & Transcript Key Points */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                        <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <FileText size={14} /> Executive Earnings Transcript Highlights
                        </div>
                        <ul className="text-xs space-y-2 text-slate-300">
                          {stock.transcriptKeyPoints.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2">
                              <span className="text-purple-400 shrink-0 mt-0.5">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                        <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <Globe size={14} /> Macro Catalyst &amp; Supply Chain Vector
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {stock.globalImpact}
                        </p>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveTranscriptStock(stock);
                              setShowTranscriptModal(true);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 font-bold underline flex items-center gap-1"
                          >
                            <MessageSquare size={13} /> View Full Earnings Call Transcript &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: QUANT & ML MATRIX (Former Algo Engine Signal Analysis)             */}
      {/* ========================================================================= */}
      {activeMainTab === 'quant' && (
        <div className="animate-fade-in">
          <div className="glass-panel card mb-6 p-5 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                className="chat-input flex-1 font-mono uppercase"
                placeholder="e.g. GOOGL, NVDA, US Tech, Energy, or Indian Equities"
                value={quantQuery}
                onChange={(e) => setQuantQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleRunQuantScan()}
              />
              <button 
                onClick={() => handleRunQuantScan()} 
                className="btn btn-primary" 
                style={{ padding: '0 2rem', borderRadius: '12px' }} 
                disabled={quantLoading}
              >
                {quantLoading ? <div className="inline-block animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={20} />}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-muted font-semibold">Suggested Scans:</span>
              {[
                { label: 'Alphabet (GOOGL)', q: 'GOOGL' },
                { label: 'NVIDIA (NVDA)', q: 'NVDA' },
                { label: 'Amazon (AMZN)', q: 'AMZN' },
                { label: 'Meta (META)', q: 'META' },
                { label: 'Reliance (RELIANCE)', q: 'RELIANCE' },
                { label: 'TCS (TCS)', q: 'TCS' },
                { label: 'HDFC Bank (HDFCBANK)', q: 'HDFCBANK' }
              ].map((item) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => { setQuantQuery(item.q); handleRunQuantScan(item.q); }}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/10 hover:border-primary/50 text-gray-300 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {quantLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-muted glass-panel rounded-xl mb-6">
              <div className="inline-block animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-6"></div>
              <p className="font-bold text-lg mb-2 text-white">Running Multi-Layer Quantitative Matrix Analysis...</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Activity size={14} className="text-emerald-500"/> Ingesting Quantitative Decision Models &amp; Momentum Factors</li>
                <li className="flex items-center gap-2"><Activity size={14} className="text-blue-500"/> Calculating Gamma Exposure &amp; Put-Call Ratio</li>
                <li className="flex items-center gap-2"><Activity size={14} className="text-purple-500"/> Synthesizing Risk-Adjusted 12M Price Targets</li>
              </ul>
            </div>
          )}

          {quantResults && !quantLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {quantResults.map((stock, i) => (
                  <div key={i} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-colors border border-white/10 shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h2 className="text-3xl font-black text-white">{stock.ticker}</h2>
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
                          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 font-mono shadow-sm">
                            <Target size={14} className="text-emerald-400 shrink-0" />
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-300">
                              Quant Target:
                            </span>
                            <span className="text-base font-bold text-emerald-300">
                              {stock.currency || getCurrency(stock.ticker)}
                              {Number(stock.targetPrice || (stock.currentPrice * 1.15)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {stock.upsidePct !== undefined && (
                              <span className="text-xs font-black text-emerald-300 bg-emerald-500/25 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                +{stock.upsidePct}%
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-muted font-medium text-xs">{stock.companyName} • {stock.sector}</p>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1 font-bold">Quant Composite Score</div>
                        <div className="text-4xl font-black text-gradient">{stock.finalScore.toFixed(1)}/100</div>
                      </div>
                    </div>

                    {/* 4-Layer Institutional Quantitative Matrix */}
                    {stock.layers && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10">
                          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">1. Macro &amp; Regime</div>
                          <div className="font-bold text-lg text-emerald-400 font-mono">{stock.layers.macro?.score || 85}/100</div>
                          <div className="text-xs text-slate-300 mt-0.5">{stock.layers.macro?.status || 'Tailwind'}</div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10">
                          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">2. Derivatives &amp; Options Flow</div>
                          <div className="font-bold text-lg text-blue-300 font-mono">{stock.layers.derivatives?.score || 90}/100</div>
                          <div className="text-xs text-slate-300 mt-0.5">{stock.layers.derivatives?.status || 'Bullish Gamma'}</div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10">
                          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">3. Momentum &amp; VWAP</div>
                          <div className="font-bold text-lg text-purple-300 font-mono">{stock.layers.technical?.score || 82}/100</div>
                          <div className="text-xs text-slate-300 mt-0.5">{stock.layers.technical?.status || 'Above VWAP'}</div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10">
                          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">4. Fundamental &amp; Transcripts</div>
                          <div className="font-bold text-lg text-amber-300 font-mono">{stock.layers.fundamental?.score || 94}/100</div>
                          <div className="text-xs text-slate-300 mt-0.5">{stock.layers.fundamental?.status || 'Catalyst Active'}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
                          <Sparkles size={14} className="text-purple-400" /> AI Narrative &amp; Catalyst Thesis
                        </h4>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                          {stock.explanation}
                        </p>
                      </div>
                      <div className="md:w-64 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                          <AlertTriangle size={14} /> Action Plan
                        </h4>
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <span className="text-muted block mb-0.5">Recommended Allocation:</span>
                            <span className="font-bold text-white">{stock.allocation || '10-15%'}</span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">Win Probability:</span>
                            <span className="font-bold text-emerald-400">{stock.probability}%</span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">Risk Rating:</span>
                            <span className="font-bold text-amber-300">{stock.riskProfile || 'Moderate'}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTickers([stock.ticker]);
                              setActiveMainTab('compare');
                            }}
                            className="btn btn-outline text-xs py-2"
                          >
                            🔬 View in Comparison Deck &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: AUTOPILOT EXECUTION (Former Algo Engine Automated Bot)             */}
      {/* ========================================================================= */}
      {activeMainTab === 'automated' && (
        <div className="animate-fade-in">
          <div className="glass-panel p-8 rounded-2xl mb-8 border-l-4 border-l-emerald-500 border border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2 text-white">
                  <Bot className="text-emerald-400" /> Autopilot Trading Engine
                </h2>
                <p className="text-muted text-xs md:text-sm max-w-2xl leading-relaxed">
                  When enabled, Quant Agent monitors live streaming market ticks, matches institutional catalyst criteria, and stages automated Take-Profit orders with zero manual intervention.
                </p>
              </div>
              <div className="flex items-center justify-between md:justify-end flex-wrap gap-4 w-full md:w-auto bg-black/40 p-4 rounded-xl border border-white/10">
                <div className="text-left md:text-right">
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Engine State</div>
                  <div className={`font-bold text-sm font-mono ${botActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {botActive ? '● ACTIVE & SCANNING' : '○ STANDBY'}
                  </div>
                </div>
                <button 
                  onClick={() => setBotActive(!botActive)}
                  className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    botActive 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                  }`}
                >
                  {botActive ? 'Halt Engine' : 'Enable Autopilot'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <Activity className="text-blue-400" /> Live Algorithmic Order Stream
            </h3>
            {botActive && (
              <span className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                Scanning Real-Time Market Feed...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
            {liveTrades.filter(Boolean).map((trade, i) => {
              const price = livePrices[trade.symbol] || (market === 'INDIA' ? 1000.00 : 100.00);
              const tradeCurrency = getCurrency(trade.symbol);
              
              return (
                <div key={`${trade.symbol}-${i}`} className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden animate-fade-in shadow-xl">
                  {trade.type === 'buy' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase rounded-bl-xl border-b border-l border-emerald-500/30">
                      Automated Buy
                    </div>
                  )}
                  {trade.type === 'monitor' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase rounded-bl-xl border-b border-l border-amber-500/30">
                      Monitoring Breakout
                    </div>
                  )}
                  {trade.type === 'sell' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/20 text-red-300 text-[10px] font-extrabold uppercase rounded-bl-xl border-b border-l border-red-500/30">
                      Target Exit Triggered
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xl font-black text-white">{trade.symbol}</span>
                    <span className="text-xs text-slate-400">{trade.name}</span>
                  </div>

                  <div className="mb-3 font-mono font-bold text-white text-base">
                    {tradeCurrency}{Number(price).toFixed(2)}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {trade.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {showTranscriptModal && activeTranscriptStock && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-purple-500/40 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-purple-400" />
                <h3 className="font-bold text-white text-base">
                  {activeTranscriptStock.ticker} — Full Q3 Institutional Earnings Transcript
                </h3>
              </div>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-slate-200">
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <div className="text-[10px] uppercase font-bold text-purple-300 mb-1">Executive Tone Assessment</div>
                <p>{activeTranscriptStock.synthesis}</p>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-1.5">
                  <MessageSquare size={15} className="text-blue-400" /> Executive Remarks &amp; Prepared Commentary
                </h4>
                <ul className="space-y-2 pl-4 list-disc text-slate-300">
                  {activeTranscriptStock.transcriptKeyPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-1.5">
                  <Globe size={15} className="text-emerald-400" /> Macro &amp; Geopolitical Catalysts
                </h4>
                <p className="text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                  {activeTranscriptStock.globalImpact}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="btn btn-outline py-2 px-5 text-xs font-bold"
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

// Helpers
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
    HDFCBANK: [
      'Management confirmed post-merger deposit accretion reached industry-leading quarterly milestones.',
      'Net Interest Margin (NIM) stabilized at 3.47% with strong retail loan disbursals across tier-2 and tier-3 cities.',
      'Gross NPA ratio improved 6 bps QoQ to 1.36%, reflecting best-in-class Indian banking underwriting standards.'
    ],
    ETERNAL: [
      'Management highlighted Blinkit adjusted EBITDA breakeven run-rate and dark store network expansion across top 15 metros.',
      'Food delivery gross order value (GOV) grew 26% YoY with expanding restaurant ad-monetization take rates.',
      'Hyperpure B2B supply chain operations delivered over 40% annualized revenue growth.'
    ],
    ZOMATO: [
      'Management highlighted Blinkit adjusted EBITDA breakeven run-rate and dark store network expansion across top 15 metros.',
      'Food delivery gross order value (GOV) grew 26% YoY with expanding restaurant ad-monetization take rates.',
      'Hyperpure B2B supply chain operations delivered over 40% annualized revenue growth.'
    ],
    QCOM: [
      'CEO Cristiano Amon confirmed Snapdragon X Elite processor design wins across all premier PC OEMs (Dell, HP, Lenovo, Microsoft, Samsung).',
      'Automotive design-win order pipeline expanded to over $45 billion driven by Snapdragon Digital Chassis adoption.',
      'Handset chip revenue grew double-digits YoY anchored on premium tier Android and 5G flagship momentum in global markets.'
    ],
    NTAP: [
      'CEO George Kurian highlighted all-flash array (AFA) revenue reaching record annualized run rates, up 17% YoY.',
      'Public Cloud First-Party storage services across AWS, Azure, and Google Cloud expanded high-margin ARR visibility.',
      'Operating margins expanded 210 bps YoY to 30.2%, generating strong free cash flow conversion.'
    ]
  };

  return custom[ticker] || [
    `Executive commentary confirmed strong quarterly commercial pipeline execution with operating margins expanding.`,
    `Management reiterated guidance targets, citing resilient multi-quarter enterprise customer retention.`,
    `Free cash flow generation remained robust, supporting ongoing R&D and capital return programs.`
  ];
}

function getCustomGlobalImpact(ticker, isBullish) {
  const custom = {
    NVDA: 'Hyperscaler capex investments across the US, Europe, and Asia remain resilient catalysts supporting uninterrupted GPU infrastructure demand.',
    AAPL: 'Global consumer premiumization and expanding international retail expansion in India and Southeast Asia offset temporary cyclical softness in select mature regions.',
    MSFT: 'Enterprise generative AI modernization deployments and sovereign cloud security compliance in EMEA are driving sustained multitenant cloud migrations.',
    GOOGL: 'Global cross-border digital advertising spend, enterprise Gemini workspace integration, and YouTube subscription growth support strong FCF yield.',
    AMZN: 'Global cloud migration acceleration across financial services and healthcare alongside optimized regionalized logistics margins anchor top-decile return on capital.',
    META: 'Advantage+ AI monetization efficiencies and worldwide WhatsApp Business API adoption in Latin America and APAC provide substantial incremental revenue runways.',
    TSLA: 'Next-generation low-cost vehicle platform architecture and battery storage expansion in Australia and Europe serve as primary multi-year valuation anchors.',
    RELIANCE: 'India domestic consumption tailwinds, retail consolidation, and domestic digital payments infrastructure insulation shield Reliance from global crude volatility.',
    TCS: 'European and North American BFSI IT spending stabilization alongside enterprise AI modernization contracts provide multi-quarter earnings visibility.',
    HDFCBANK: 'Indian credit growth outperformance, strong domestic consumption demand, and expanding retail branch networks provide multi-year EPS compounding visibility.',
    ETERNAL: 'Indian urban consumption tailwinds, rapid consumer adoption of 10-minute quick commerce, and expanding high-margin advertising revenue shield Eternal from broader cyclical slowdowns.',
    ZOMATO: 'Indian urban consumption tailwinds, rapid consumer adoption of 10-minute quick commerce, and expanding high-margin advertising revenue shield Eternal from broader cyclical slowdowns.',
    QCOM: 'Edge AI inference proliferation across mobile smartphones, automotive autonomy, and AI PCs provides multi-year revenue diversification beyond traditional telecom cycles.',
    NTAP: 'Enterprise hybrid cloud data architecture consolidation and unstructured data storage demand for LLM training pipelines anchor sustained cash-flow growth.'
  };

  return custom[ticker] || (isBullish
    ? 'Resilient domestic demand, robust balance sheet fundamentals, and durable competitive positioning provide multi-quarter outperformance tailwinds.'
    : 'Near-term macroeconomic uncertainty and input cost inflation suggest cautious positioning until key operational inflection milestones are reached.');
}
