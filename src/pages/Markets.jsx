import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Lucide from 'lucide-react';

const Search = Lucide.Search || (() => '🔍');
const Filter = Lucide.Filter || (() => '🔍');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const RefreshCw = Lucide.RefreshCw || (() => '🔄');
const Sparkles = Lucide.Sparkles || (() => '✨');
const Zap = Lucide.Zap || (() => '⚡');
const X = Lucide.X || (() => '✕');
const ArrowRight = Lucide.ArrowRight || (() => '→');

import { getQuotes, searchGlobalMarkets } from '../services/api';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';
import { CrossMarketPromptModal } from '../components/TradeModals';

const defaultStocksUS = [
  // Top 50+ US Equities (S&P 500 & NASDAQ-100)
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors / AI', assetType: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. (Class A)', sector: 'Technology / AI', assetType: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Cloud / Software', assetType: 'stock' },
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Technology', assetType: 'stock' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce / Cloud', assetType: 'stock' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Social Media / AI', assetType: 'stock' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors / AI', assetType: 'stock' },
  { ticker: 'MU', name: 'Micron Technology', sector: 'Semiconductors / Memory', assetType: 'stock' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Biopharma / Healthcare', assetType: 'stock' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive / AI', assetType: 'stock' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'PLTR', name: 'Palantir Technologies', sector: 'Enterprise AI', assetType: 'stock' },
  { ticker: 'ORCL', name: 'Oracle Corp.', sector: 'Cloud / Database', assetType: 'stock' },
  { ticker: 'NOW', name: 'ServiceNow Inc.', sector: 'Enterprise Workflow AI', assetType: 'stock' },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings', sector: 'Cybersecurity', assetType: 'stock' },
  { ticker: 'PANW', name: 'Palo Alto Networks', sector: 'Cybersecurity', assetType: 'stock' },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Streaming Media', assetType: 'stock' },
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Enterprise Software', assetType: 'stock' },
  { ticker: 'ADBE', name: 'Adobe Inc.', sector: 'Creative Software', assetType: 'stock' },
  { ticker: 'COST', name: 'Costco Wholesale', sector: 'Consumer Retail', assetType: 'stock' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Retail', assetType: 'stock' },
  { ticker: 'HD', name: 'Home Depot', sector: 'Home Improvement', assetType: 'stock' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Banking / Financials', assetType: 'stock' },
  { ticker: 'GS', name: 'Goldman Sachs', sector: 'Investment Banking', assetType: 'stock' },
  { ticker: 'MS', name: 'Morgan Stanley', sector: 'Investment Banking', assetType: 'stock' },
  { ticker: 'BLK', name: 'BlackRock Inc.', sector: 'Asset Management', assetType: 'stock' },
  { ticker: 'BAC', name: 'Bank of America', sector: 'Banking / Financials', assetType: 'stock' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Payments / FinTech', assetType: 'stock' },
  { ticker: 'MA', name: 'Mastercard Inc.', sector: 'Payments / FinTech', assetType: 'stock' },
  { ticker: 'AXP', name: 'American Express', sector: 'Consumer Finance', assetType: 'stock' },
  { ticker: 'PYPL', name: 'PayPal Holdings', sector: 'Digital Payments', assetType: 'stock' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', assetType: 'stock' },
  { ticker: 'ISRG', name: 'Intuitive Surgical', sector: 'Medical Robotics', assetType: 'stock' },
  { ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Biotechnology', assetType: 'stock' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', assetType: 'stock' },
  { ticker: 'MRK', name: 'Merck & Co.', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Life Sciences', assetType: 'stock' },
  { ticker: 'AMAT', name: 'Applied Materials', sector: 'Semiconductor Equip', assetType: 'stock' },
  { ticker: 'LRCX', name: 'Lam Research', sector: 'Semiconductor Equip', assetType: 'stock' },
  { ticker: 'QCOM', name: 'Qualcomm Inc.', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'NTAP', name: 'NetApp Inc.', sector: 'Cloud Storage & Data', assetType: 'stock' },
  { ticker: 'TXN', name: 'Texas Instruments', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Semiconductors', assetType: 'stock' },
  { ticker: 'IBM', name: 'IBM Corp.', sector: 'Enterprise Cloud / AI', assetType: 'stock' },
  { ticker: 'CSCO', name: 'Cisco Systems', sector: 'Networking', assetType: 'stock' },
  { ticker: 'GE', name: 'GE Aerospace', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'RTX', name: 'RTX Corp.', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'LMT', name: 'Lockheed Martin', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Heavy Industrials', assetType: 'stock' },
  { ticker: 'XOM', name: 'Exxon Mobil', sector: 'Energy / Oil & Gas', assetType: 'stock' },
  { ticker: 'CVX', name: 'Chevron Corp.', sector: 'Energy / Oil & Gas', assetType: 'stock' },
  { ticker: 'UBER', name: 'Uber Technologies', sector: 'Mobility / Tech', assetType: 'stock' },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', assetType: 'stock' },
  { ticker: 'KO', name: 'Coca-Cola Co.', sector: 'Beverages', assetType: 'stock' },
  { ticker: 'PEP', name: 'PepsiCo Inc.', sector: 'Beverages & Snacks', assetType: 'stock' },
  { ticker: 'MCD', name: 'McDonald\'s Corp.', sector: 'Restaurants', assetType: 'stock' },
  { ticker: 'DIS', name: 'Walt Disney Co.', sector: 'Entertainment', assetType: 'stock' },

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
  // All 52 Indian NSE / Nifty 50 Constituents
  { ticker: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy / Conglomerate', assetType: 'stock' },
  { ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom / 5G', assetType: 'stock' },
  { ticker: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'SBIN', name: 'State Bank of India', sector: 'PSU Banking', assetType: 'stock' },
  { ticker: 'LT', name: 'Larsen & Toubro', sector: 'Engineering & Infra', assetType: 'stock' },
  { ticker: 'ITC', name: 'ITC Limited', sector: 'FMCG / Consumer', assetType: 'stock' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG / Consumer', assetType: 'stock' },
  { ticker: 'HAL', name: 'Hindustan Aeronautics', sector: 'Aerospace & Defense', assetType: 'stock' },
  { ticker: 'BEL', name: 'Bharat Electronics', sector: 'Defense Electronics', assetType: 'stock' },
  { ticker: 'TRENT', name: 'Trent Ltd.', sector: 'Retail & Fashion', assetType: 'stock' },
  { ticker: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automotive / SUVs', assetType: 'stock' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automotive / EV', assetType: 'stock' },
  { ticker: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Automotive', assetType: 'stock' },
  { ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Two-Wheelers / EV', assetType: 'stock' },
  { ticker: 'EICHERMOT', name: 'Eicher Motors', sector: 'Motorcycles / CV', assetType: 'stock' },
  { ticker: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Two-Wheelers', assetType: 'stock' },
  { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'CIPLA', name: 'Cipla Ltd.', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'DRREDDY', name: 'Dr. Reddy\'s Labs', sector: 'Pharmaceuticals', assetType: 'stock' },
  { ticker: 'DIVISLAB', name: 'Divi\'s Laboratories', sector: 'Pharma APIs', assetType: 'stock' },
  { ticker: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', assetType: 'stock' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Consumer NBFC', assetType: 'stock' },
  { ticker: 'BAJAJFINSV', name: 'Bajaj Finserv', sector: 'Financial Services', assetType: 'stock' },
  { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'AXISBANK', name: 'Axis Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'INDUSINDBK', name: 'IndusInd Bank', sector: 'Private Banking', assetType: 'stock' },
  { ticker: 'SHRIRAMFIN', name: 'Shriram Finance', sector: 'Commercial NBFC', assetType: 'stock' },
  { ticker: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Life Insurance', assetType: 'stock' },
  { ticker: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Life Insurance', assetType: 'stock' },
  { ticker: 'HCLTECH', name: 'HCL Technologies', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'TECHM', name: 'Tech Mahindra', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'WIPRO', name: 'Wipro Ltd.', sector: 'IT Services', assetType: 'stock' },
  { ticker: 'NTPC', name: 'NTPC Ltd.', sector: 'Power Utilities', assetType: 'stock' },
  { ticker: 'POWERGRID', name: 'Power Grid Corp.', sector: 'Power Transmission', assetType: 'stock' },
  { ticker: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy Upstream', assetType: 'stock' },
  { ticker: 'COALINDIA', name: 'Coal India', sector: 'Mining & Energy', assetType: 'stock' },
  { ticker: 'BPCL', name: 'Bharat Petroleum', sector: 'Oil Refining', assetType: 'stock' },
  { ticker: 'TITAN', name: 'Titan Company', sector: 'Luxury & Jewellery', assetType: 'stock' },
  { ticker: 'ADANIENT', name: 'Adani Enterprises', sector: 'Infra & Incubator', assetType: 'stock' },
  { ticker: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Ports & Logistics', assetType: 'stock' },
  { ticker: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', assetType: 'stock' },
  { ticker: 'GRASIM', name: 'Grasim Industries', sector: 'Diversified Materials', assetType: 'stock' },
  { ticker: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals & Steel', assetType: 'stock' },
  { ticker: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals & Steel', assetType: 'stock' },
  { ticker: 'HINDALCO', name: 'Hindalco Industries', sector: 'Aluminium & Copper', assetType: 'stock' },
  { ticker: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG Food', assetType: 'stock' },
  { ticker: 'BRITANNIA', name: 'Britannia Industries', sector: 'Packaged Foods', assetType: 'stock' },
  { ticker: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'Beverages & Foods', assetType: 'stock' },
  { ticker: 'ASIANPAINT', name: 'Asian Paints', sector: 'Consumer Paints', assetType: 'stock' },
  { ticker: 'ETERNAL', name: 'Eternal Limited (Zomato / Blinkit)', sector: 'Food Delivery & Quick Commerce', assetType: 'stock' },
  { ticker: 'PAYTM', name: 'One97 Communications (Paytm)', sector: 'Digital Payments', assetType: 'stock' },
  { ticker: 'SWIGGY', name: 'Swiggy Limited', sector: 'Food Delivery & Quick Commerce', assetType: 'stock' },
  { ticker: 'JIOFIN', name: 'Jio Financial Services', sector: 'Financial Services', assetType: 'stock' },
  { ticker: 'TATATECH', name: 'Tata Technologies Ltd.', sector: 'EV Software & Engineering', assetType: 'stock' },
  { ticker: 'TATAPOWER', name: 'Tata Power Company', sector: 'Power & Renewable', assetType: 'stock' },

  // Commodities & Metals
  { ticker: 'GOLDBEES', name: 'Nippon India Gold ETF', sector: 'Precious Metals', assetType: 'commodity', unit: 'units' },
  { ticker: 'SILVERBEES', name: 'Nippon India Silver ETF', sector: 'Precious Metals', assetType: 'commodity', unit: 'units' },
  { ticker: 'CRUDEOIL', name: 'MCX Crude Oil', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'bbl' },
  { ticker: 'NATGAS', name: 'MCX Natural Gas', sector: 'Energy & Commodities', assetType: 'commodity', unit: 'mmbtu' },
  { ticker: 'COPPER', name: 'MCX Copper', sector: 'Industrial Metals', assetType: 'commodity', unit: 'kg' }
];

// Master searchable catalog across all US & Indian stocks + commodities
const ALL_CATALOG_STOCKS = [
  ...defaultStocksIndia.map(s => ({
    ...s,
    market: 'INDIA',
    exchange: s.ticker.includes('=F') || ['GOLDBEES', 'SILVERBEES', 'CRUDEOIL', 'NATGAS', 'COPPER'].includes(s.ticker) ? 'MCX / NSE' : 'NSE'
  })),
  ...defaultStocksUS.map(s => ({
    ...s,
    market: 'US',
    exchange: s.ticker.includes('=F') || ['GLD', 'SLV', 'USO'].includes(s.ticker)
      ? 'COMEX / NYMEX'
      : ['PLTR', 'ORCL', 'NOW', 'CRM', 'WMT', 'HD', 'JPM', 'GS', 'MS', 'BLK', 'BAC', 'V', 'MA', 'AXP', 'UNH', 'ISRG', 'ABBV', 'JNJ', 'MRK', 'TMO', 'IBM', 'GE', 'RTX', 'LMT', 'CAT', 'XOM', 'CVX', 'UBER', 'PG', 'KO', 'PEP', 'MCD', 'DIS', 'LLY', 'TSM'].includes(s.ticker)
      ? 'NYSE'
      : 'NASDAQ'
  }))
];

// Comprehensive Company Name & Colloquial Search Aliases to Official Exchange Tickers
const MARKET_ALIASES = {
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
  if (MARKET_ALIASES[clean]) return MARKET_ALIASES[clean];
  const noSpace = clean.replace(/[\s\-_.]+/g, '');
  if (MARKET_ALIASES[noSpace]) return MARKET_ALIASES[noSpace];
  return clean;
};

export default function Markets() {
  const navigate = useNavigate();
  const { buyAsset, balance, showTradeAlert } = usePortfolio();
  const { market, setMarket, currency, getCurrency } = useMarket();
  const currentStocksList = market === 'US' ? defaultStocksUS : defaultStocksIndia;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('ALL'); // ALL, STOCKS, COMMODITIES
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyModalAsset, setBuyModalAsset] = useState(null);
  const [buyUnits, setBuyUnits] = useState('1');
  const [buyExitMode, setBuyExitMode] = useState('none'); // Default: 'none' (Manual Sell); secondary: 'percentage' | 'price'
  const [buyExitPct, setBuyExitPct] = useState('10');
  const [buyExitPrice, setBuyExitPrice] = useState('');
  const [marketToast, setMarketToast] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [crossMarketPrompt, setCrossMarketPrompt] = useState({ isOpen: false, asset: null, currentMarket: market });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tableRef = useRef(null);

  // Auto-scroll to results table whenever a search term is entered
  useEffect(() => {
    if (searchTerm.trim().length > 0 && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchTerm]);

  // Universal Live Search across all BSE, NSE, NYSE & NASDAQ stocks
  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setGlobalSearchResults([]);
      setSearchingGlobal(false);
      return;
    }

    setSearchingGlobal(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchGlobalMarkets(term, market);
        // Exclude symbols that already exist in our local catalog to avoid duplicates
        const existingTickers = new Set(stocks.map(s => s.ticker.toUpperCase()));
        const uniqueGlobal = results.filter(r => !existingTickers.has(r.ticker.toUpperCase()));
        setGlobalSearchResults(uniqueGlobal);
      } catch (err) {
        console.error('Error fetching global market search results:', err);
      } finally {
        setSearchingGlobal(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, market, stocks]);

  // Unified asset catalog with market tagging
  const allAvailableStocks = React.useMemo(() => {
    return currentStocksList.map(s => ({
      ...s,
      isOtherMarket: false,
      market
    }));
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
    const targetPool = searchTerm.trim() !== ''
      ? allAvailableStocks
      : allAvailableStocks.filter(s => !s.isOtherMarket);
    const symbols = targetPool.map(s => s.ticker).join(',');
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
    if (asset.market && asset.market !== market) {
      setCrossMarketPrompt({ isOpen: true, asset, currentMarket: market });
      return;
    }
    if (asset.currentPrice > 0) {
      setBuyModalAsset(asset);
      setBuyUnits('1');
      setBuyExitMode('none');
      setBuyExitPct('10');
      setBuyExitPrice((asset.currentPrice * 1.10).toFixed(2));
    } else {
      if (showTradeAlert) {
        showTradeAlert({
          title: 'Real-Time Price Updating',
          message: 'Please wait a moment while the live market quote for this asset is retrieved.'
        });
      } else {
        alert("Cannot buy asset: Real-time price currently updating.");
      }
    }
  };

  const handleSwitchAndBuy = (targetMarket, asset) => {
    setCrossMarketPrompt({ isOpen: false, asset: null, currentMarket: targetMarket });
    setMarket(targetMarket);
    setTimeout(() => {
      setBuyModalAsset(asset);
      setBuyUnits('1');
      setBuyExitMode('none');
      setBuyExitPct('10');
      setBuyExitPrice((asset.currentPrice * 1.10).toFixed(2));
    }, 150);
  };

  const handleConfirmMarketBuy = (e) => {
    e.preventDefault();
    if (!buyModalAsset) return;
    const units = Number(buyUnits);
    if (isNaN(units) || units <= 0) {
      if (showTradeAlert) {
        showTradeAlert({
          title: 'Invalid Units',
          message: 'Please enter a valid number of units to purchase.'
        });
      } else {
        alert("Please enter a valid number of units.");
      }
      return;
    }

    let autoExitRule = null;
    if (buyExitMode === 'percentage') {
      const pctVal = Number(buyExitPct);
      if (!isNaN(pctVal) && pctVal > -99) {
        autoExitRule = { enabled: true, mode: 'percentage', targetProfitPct: pctVal };
      }
    } else if (buyExitMode === 'price') {
      const priceVal = Number(buyExitPrice);
      if (isNaN(priceVal) || priceVal <= 0) {
        if (showTradeAlert) {
          showTradeAlert({
            title: 'Invalid Target Price',
            message: 'Please enter a valid target exit price.'
          });
        } else {
          alert("Please enter a valid target exit price.");
        }
        return;
      }
      autoExitRule = { enabled: true, mode: 'price', targetPrice: priceVal };
    }

    try {
      const success = buyAsset({
        ticker: buyModalAsset.ticker,
        name: buyModalAsset.name,
        price: buyModalAsset.currentPrice,
        units,
        category: buyModalAsset.sector,
        assetType: buyModalAsset.assetType,
        market: buyModalAsset.market || market,
        bucket: 'core',
        autoExit: autoExitRule
      });

      if (success) {
        setBuyModalAsset(null);
      }
    } catch (err) {
      console.error('Error executing buy order:', err);
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchTerm(item.ticker);
    setShowSuggestions(false);
    if (item.market && item.market !== market) {
      setCrossMarketPrompt({ isOpen: true, asset: item, currentMarket: market });
    } else {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Detected alias recommendation if input differs from official ticker
  const detectedAlias = React.useMemo(() => {
    const q = searchTerm.trim().toUpperCase();
    if (!q || q.length < 2) return null;
    const resolved = resolveTicker(q);
    if (resolved && resolved !== q) {
      const match = ALL_CATALOG_STOCKS.find((s) => s.ticker === resolved);
      return {
        query: searchTerm.trim(),
        ticker: resolved,
        name: match?.name || `${resolved} Corp.`,
        market: match?.market || (['AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'TSLA', 'QCOM', 'NTAP', 'NFLX', 'PANW', 'AVGO'].includes(resolved) ? 'US' : 'INDIA'),
        exchange: match?.exchange || (match?.market === 'INDIA' ? 'NSE' : 'NASDAQ'),
        sector: match?.sector || ''
      };
    }
    return null;
  }, [searchTerm]);

  // Suggestions based on user input, matching ticker prefix, word prefix in name, or company aliases
  const suggestions = React.useMemo(() => {
    const raw = searchTerm.trim();
    if (!raw || raw.length < 1) return [];
    const q = raw.toUpperCase();
    const resolvedDirect = resolveTicker(q);

    // Merge candidates from loaded stocks (with live prices), global search results, and static catalogs
    const candidatesMap = new Map();
    stocks.forEach((s) => {
      candidatesMap.set(s.ticker.toUpperCase(), { ...s, market: s.market || market });
    });
    globalSearchResults.forEach((s) => {
      if (!candidatesMap.has(s.ticker.toUpperCase())) {
        candidatesMap.set(s.ticker.toUpperCase(), s);
      }
    });
    ALL_CATALOG_STOCKS.forEach((s) => {
      if (!candidatesMap.has(s.ticker.toUpperCase())) {
        candidatesMap.set(s.ticker.toUpperCase(), {
          ...s,
          price: s.market === 'INDIA' ? '₹...' : '$...',
          change: '-',
          up: true
        });
      }
    });

    const matches = Array.from(candidatesMap.values()).filter((item) => {
      const t = item.ticker.toUpperCase();
      const n = (item.name || '').toUpperCase();
      const sec = (item.sector || '').toUpperCase();

      // 1. Direct ticker or resolved alias match (e.g. "QCOM", "QUALCOMM", "M&M", "ETERNAL")
      if (t === resolvedDirect || t === q) return true;

      // 2. Ticker prefix match (e.g. typing "NE" matches "NETAPP", "NFLX" if ticker starts with NE)
      if (t.startsWith(q)) return true;

      // 3. Known aliases that start with the query (e.g. query "NE" matches alias "NETAPP" -> ticker "NTAP", "NETFLIX" -> "NFLX")
      const aliasMatch = Object.entries(MARKET_ALIASES).some(
        ([alias, ticker]) => ticker === t && alias.startsWith(q)
      );
      if (aliasMatch) return true;

      // 4. Any distinct word in the company name starts with the query (e.g. "NetApp Inc." starts with "NE")
      const words = n.split(/[\s(/)\-,.]+/).filter(Boolean);
      if (words.some((w) => w.startsWith(q))) return true;

      // 5. If query is 3 or more chars, allow substring match on company name or sector
      if (q.length >= 3 && (n.includes(q) || sec.includes(q))) return true;

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

        return (a.name || '').localeCompare(b.name || '');
      })
      .slice(0, 6);
  }, [searchTerm, stocks, globalSearchResults, market]);

  const filteredStocks = React.useMemo(() => {
    const raw = searchTerm.trim();
    if (!raw) {
      return stocks.filter(item => {
        if (item.isOtherMarket) return false;
        if (selectedTab === 'STOCKS') return item.assetType === 'stock';
        if (selectedTab === 'COMMODITIES') return item.assetType === 'commodity';
        return true;
      });
    }

    const q = raw.toUpperCase();
    const resolved = resolveTicker(q);

    // Merge current stocks + global search results + cross-market catalog matches
    const poolMap = new Map();
    stocks.forEach(s => poolMap.set(s.ticker.toUpperCase(), s));
    globalSearchResults.forEach(s => {
      if (!poolMap.has(s.ticker.toUpperCase())) poolMap.set(s.ticker.toUpperCase(), s);
    });

    // Also include matching stocks from the other market catalog if query matches
    ALL_CATALOG_STOCKS.forEach(s => {
      if (!poolMap.has(s.ticker.toUpperCase())) {
        const t = s.ticker.toUpperCase();
        const n = s.name.toUpperCase();
        const words = n.split(/[\s(/)\-,.]+/).filter(Boolean);
        const aliasMatch = Object.entries(MARKET_ALIASES).some(
          ([alias, ticker]) => ticker === t && (alias === q || alias.startsWith(q))
        );
        const matches = t === resolved || t === q || t.startsWith(q) || aliasMatch || words.some(w => w.startsWith(q));
        if (matches) {
          poolMap.set(t, {
            ...s,
            price: s.market === 'INDIA' ? '₹...' : '$...',
            change: '-',
            up: true,
            rawChange: 0,
            currentPrice: 0,
            isOtherMarket: s.market !== market
          });
        }
      }
    });

    const matches = Array.from(poolMap.values()).filter(item => {
      const t = item.ticker.toUpperCase();
      const n = (item.name || '').toUpperCase();
      const sec = (item.sector || '').toUpperCase();

      // 1. Direct ticker or resolved alias match
      if (t === resolved || t === q) return true;

      // 2. Ticker prefix match
      if (t.startsWith(q)) return true;

      // 3. Known alias prefix match
      const aliasMatch = Object.entries(MARKET_ALIASES).some(
        ([alias, ticker]) => ticker === t && alias.startsWith(q)
      );
      if (aliasMatch) return true;

      // 4. Any distinct word in the company name starts with query
      const words = n.split(/[\s(/)\-,.]+/).filter(Boolean);
      if (words.some(w => w.startsWith(q))) return true;

      // 5. If query >= 3 chars, allow substring match on name or sector
      if (q.length >= 3 && (n.includes(q) || sec.includes(q))) return true;

      return false;
    });

    return matches.filter(item => {
      if (selectedTab === 'STOCKS') return item.assetType === 'stock';
      if (selectedTab === 'COMMODITIES') return item.assetType === 'commodity';
      return true;
    }).sort((a, b) => {
      const aT = a.ticker.toUpperCase();
      const bT = b.ticker.toUpperCase();
      const aExact = aT === resolved || aT === q;
      const bExact = bT === resolved || bT === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aMarket = a.market === market;
      const bMarket = b.market === market;
      if (aMarket && !bMarket) return -1;
      if (!aMarket && bMarket) return 1;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [stocks, searchTerm, selectedTab, globalSearchResults, market]);

  // Cross-market asset detection: check if filtered search or global search contains an asset native to the OTHER market
  const crossMarketAsset = React.useMemo(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return null;
    return filteredStocks.find(s => s.market && s.market !== market) || globalSearchResults.find(s => s.market && s.market !== market) || null;
  }, [filteredStocks, globalSearchResults, searchTerm, market]);

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
        
        <div className="flex flex-col gap-2 w-full md:w-[480px] lg:w-[560px]">
          <div className="flex gap-3 w-full">
            <div style={{ position: 'relative', flex: 1, width: '100%', minWidth: 0 }}>
              <Search 
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} 
                className="text-slate-400 pointer-events-none" 
                size={18} 
              />
              <input 
                type="text" 
                placeholder="Search All India/US stocks" 
                className="chat-input w-full font-mono uppercase tracking-wider"
                style={{
                  paddingLeft: '3rem',
                  paddingRight: searchTerm ? '2.75rem' : '1rem',
                  paddingTop: '0.85rem',
                  paddingBottom: '0.85rem',
                  minHeight: '52px',
                  backgroundColor: 'rgba(2, 6, 23, 0.95)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.95rem'
                }}
                value={searchTerm}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (showSuggestions && suggestions.length > 0) {
                      handleSelectSuggestion(suggestions[0]);
                    } else if (tableRef.current) {
                      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    setShowSuggestions(false);
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setShowSuggestions(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.35rem',
                    color: '#94a3b8',
                    borderRadius: '8px'
                  }}
                  className="hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}

              {/* Auto-Suggest Recommendation Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
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
                    maxHeight: '380px',
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
                      <span>Matching Stocks ({suggestions.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Click to View / Trade
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {suggestions.map((item, idx) => (
                      <button
                        key={`${item.ticker}-${item.market || idx}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(item);
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
                        <div className="flex items-center gap-3 min-w-0">
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

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {item.price && item.price !== '...' && item.price !== 'Checking...' && (
                            <div className="text-right">
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                                {item.price}
                              </div>
                              {item.change && item.change !== '-' && (
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.up ? '#34d399' : '#f87171' }}>
                                  {item.change}
                                </div>
                              )}
                            </div>
                          )}
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: item.market === market ? 'rgba(139, 92, 246, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                              border: item.market === market ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)',
                              color: item.market === market ? '#d8b4fe' : '#93c5fd',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {item.market === market ? 'View' : 'Switch & Trade'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="btn btn-outline shrink-0" style={{ padding: '0.75rem', minHeight: '52px', borderRadius: '14px' }} onClick={fetchLiveData} title="Refresh live quotes">
              <RefreshCw size={18} className={loading || searchingGlobal ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Smart Auto-Resolution Recommendation Pill */}
          {detectedAlias && (
            <div className="p-2.5 px-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg shadow-purple-950/30 animate-fade-in">
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
                  handleSelectSuggestion(detectedAlias);
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shrink-0 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span>View {detectedAlias.ticker}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Asset Segment Switcher */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Assets ({stocks.length})
        </button>
        <button
          onClick={() => setSelectedTab('COMMODITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedTab === 'COMMODITIES'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Precious Metals & Commodities (Gold, Silver, Oil)
        </button>
        <button
          onClick={() => setSelectedTab('STOCKS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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

      {/* Cross-Market Notification Banner */}
      {crossMarketAsset && (
        <div className="p-4 mb-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/95 to-blue-950/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0 mt-0.5">
              {market === 'INDIA' ? '🇺🇸' : '🇮🇳'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {market === 'INDIA' ? 'US Exchange Stock Found' : 'Indian Exchange Stock Found'}
                </span>
                <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-500/40">
                  {crossMarketAsset.ticker} • {crossMarketAsset.exchange || (market === 'INDIA' ? 'NASDAQ' : 'NSE')}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {crossMarketAsset.currency} {crossMarketAsset.price}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {market === 'INDIA'
                  ? `You are currently browsing the Indian Market (₹ INR). To trade US stocks like ${crossMarketAsset.ticker} in USD ($), please switch to US Stocks.`
                  : `You are currently browsing the US Market ($ USD). To trade Indian equities like ${crossMarketAsset.ticker} in INR (₹), please switch to Indian Stocks.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMarket(market === 'INDIA' ? 'US' : 'INDIA');
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 shrink-0 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Switch to {market === 'INDIA' ? 'US Stocks (🇺🇸 USD)' : 'Indian Stocks (🇮🇳 ₹ INR)'}</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Asset Catalog Table */}
      <div ref={tableRef} className="glass-panel overflow-x-auto rounded-xl scroll-mt-24">
        {searchTerm.trim() && (
          <div className="p-3 px-4 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs text-blue-300 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                🔍 Showing {filteredStocks.length} result{filteredStocks.length === 1 ? '' : 's'} across <strong>BSE, NSE, NYSE &amp; NASDAQ</strong> for <strong>&quot;{searchTerm}&quot;</strong>
              </span>
              {searchingGlobal && (
                <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <RefreshCw size={11} className="animate-spin" />
                  <span>Searching Global Exchanges...</span>
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setGlobalSearchResults([]);
              }}
              className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}
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
                <td className="p-4 font-bold flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{
                    background: stock.assetType === 'commodity' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: stock.assetType === 'commodity' ? '#fbbf24' : '#60a5fa'
                  }}>
                    {stock.ticker.substring(0, 2)}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-bold">{stock.ticker}</span>
                    {stock.exchange && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold border ${
                        stock.exchange === 'NSE' || stock.exchange === 'BSE'
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {stock.exchange}
                      </span>
                    )}
                    {stock.isGlobalSearch && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Live Global
                      </span>
                    )}
                  </div>
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
                  {stock.market && stock.market !== market ? (
                    <button 
                      className="btn py-1.5 px-3 text-xs font-bold border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all active:scale-95" 
                      onClick={() => handleBuy(stock)}
                      title={`This is a ${stock.market === 'INDIA' ? 'Indian (₹)' : 'US ($)'} stock. Click to switch market & buy.`}
                    >
                      Switch &amp; Buy
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary py-1.5 px-4 text-xs font-bold" 
                      onClick={() => handleBuy(stock)}
                    >
                      Buy {stock.assetType === 'commodity' ? 'Commodity' : 'Stock'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {marketToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <span>✅ {marketToast}</span>
          <button onClick={() => setMarketToast('')} className="text-slate-400 hover:text-white underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Buy Asset + Auto-Exit Configuration Modal */}
      {buyModalAsset && (() => {
        const assetCurr = buyModalAsset.currency || getCurrency(buyModalAsset.ticker);
        const livePrice = Number(buyModalAsset.currentPrice || 100);
        const qty = Number(buyUnits || 1);
        const totalOrderCost = Number((livePrice * qty).toFixed(2));
        const previewExitPrice = buyExitMode === 'percentage'
          ? Number((livePrice * (1 + (Number(buyExitPct) || 0) / 100)).toFixed(2))
          : (buyExitMode === 'price' ? Number(buyExitPrice || 0) : null);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="glass-panel p-4 sm:p-6 rounded-2xl max-w-md w-full border border-blue-500/40 shadow-2xl bg-slate-900/95 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Instant Order + Auto-Exit
                    </span>
                    {buyModalAsset.exchange && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                        {buyModalAsset.exchange}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Buy {buyModalAsset.ticker} — {buyModalAsset.name}
                  </h3>
                  <p className="text-xs text-slate-400">{buyModalAsset.sector}</p>
                </div>
                <button
                  onClick={() => setBuyModalAsset(null)}
                  className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmMarketBuy} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">Live Market Price</span>
                    <span className="text-lg font-bold text-white font-mono">
                      {assetCurr}{livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Available Cash</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {currency}{Number(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Number of {buyModalAsset.unit ? `Units (${buyModalAsset.unit})` : 'Shares'} to Buy
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={buyUnits}
                      onChange={(e) => setBuyUnits(e.target.value)}
                      className="chat-input w-full font-mono text-base py-2 px-3"
                      required
                    />
                    {[1, 5, 10, 25].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBuyUnits(String(preset))}
                        className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-white/10"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exit Strategy: Manual Sell (Default) vs Optional Auto-Exit */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Exit Strategy <span className="text-[10px] text-slate-400 font-normal">(Manual Sell is Default • Auto-Exit Optional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setBuyExitMode('none')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        buyExitMode === 'none'
                          ? 'bg-slate-800 border-white/40 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">Manual Sell</div>
                      <div className="text-[10px] text-slate-400">Default exit</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuyExitMode('percentage')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        buyExitMode === 'percentage'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-300">Auto: % Profit</div>
                      <div className="text-[10px] text-slate-400">e.g. +10%</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBuyExitMode('price');
                        if (!buyExitPrice) setBuyExitPrice((livePrice * 1.10).toFixed(2));
                      }}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        buyExitMode === 'price'
                          ? 'bg-blue-500/20 border-blue-500/60 text-white'
                          : 'bg-slate-900/60 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-blue-300">Auto: Price</div>
                      <div className="text-[10px] text-slate-400">Define {assetCurr}</div>
                    </button>
                  </div>

                  {buyExitMode === 'percentage' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={buyExitPct}
                          onChange={(e) => setBuyExitPct(e.target.value)}
                          className="chat-input w-full font-mono text-sm py-1.5 px-3"
                          placeholder="10"
                          required
                        />
                        {[5, 10, 15, 20].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setBuyExitPct(String(p))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                              Number(buyExitPct) === p
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                                : 'bg-slate-800 text-slate-300 border-white/10'
                            }`}
                          >
                            +{p}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {buyExitMode === 'price' && (
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={buyExitPrice}
                      onChange={(e) => setBuyExitPrice(e.target.value)}
                      className="chat-input w-full font-mono text-sm py-1.5 px-3"
                      placeholder={(livePrice * 1.10).toFixed(2)}
                      required
                    />
                  )}
                </div>

                {/* Order Total & Auto-Exit Preview */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-300 font-medium">Estimated Order Total</span>
                    <span className="text-base font-black text-white font-mono">
                      {assetCurr}{totalOrderCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {previewExitPrice && previewExitPrice > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/10">
                      <span className="text-emerald-300 font-medium">🎯 Auto-Sell Trigger Price</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {assetCurr}{previewExitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBuyModalAsset(null)}
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
        );
      })()}

      {/* Cross-Market Purchase Prompt Modal */}
      <CrossMarketPromptModal
        promptState={crossMarketPrompt}
        onClose={() => setCrossMarketPrompt({ isOpen: false, asset: null, currentMarket: market })}
        onSwitchAndBuy={handleSwitchAndBuy}
      />

    </div>
  );
}
