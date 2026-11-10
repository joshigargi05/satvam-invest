import React, { createContext, useContext, useState, useEffect } from 'react';

const indianTickersSet = new Set([
  // Core Nifty 50 Constituents
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL',
  'ITC', 'HINDUNILVR', 'LT', 'BAJFINANCE', 'HCLTECH', 'AXISBANK', 'MARUTI',
  'SUNPHARMA', 'KOTAKBANK', 'TATAMOTORS', 'ONGC', 'GOLDBEES', 'SILVERBEES',
  'CRUDEOIL', 'NATGAS', 'COPPER', 'WIPRO', 'ADANIENT', 'ADANIPORTS', 'COALINDIA',
  'NTPC', 'POWERGRID', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'JSWSTEEL', 'TATASTEEL',
  'M&M', 'BAJAJ-AUTO', 'BAJAJFINSV', 'GRASIM', 'TECHM', 'HINDALCO', 'CIPLA',
  'DRREDDY', 'EICHERMOT', 'SBILIFE', 'HDFCLIFE', 'BPCL', 'BRITANNIA', 'APOLLOHOSP',
  'DIVISLAB', 'TATACONSUM', 'HEROMOTOCO', 'ASIANPAINT', 'INDUSINDBK', 'SHRIRAMFIN',
  'BEL', 'HAL', 'TRENT',
  // Indian Tech, Consumer, Unlisted & Emerging Growth Leaders
  'MEESHO', 'SWIGGY', 'ZOMATO', 'PAYTM', 'NYKAA', 'JIOFIN', 'TATATECH',
  'OLA', 'OLAELEC', 'ZEPTO', 'GROWW', 'ZERODHA', 'POLICYBZR', 'DELHIVERY',
  'CARTRADE', 'MAPMYINDIA', 'KALYANKJIL', 'SUZLON', 'IREDA', 'RVNL', 'IRFC',
  'NHPC', 'SJVN'
]);

const knownUSTickersSet = new Set([
  'AAPL', 'MSFT', 'AMZN', 'NVDA', 'TSLA', 'GOOGL', 'GOOG', 'META', 'AVGO', 'LLY',
  'ORCL', 'COST', 'UNH', 'UBER', 'MU', 'AMD', 'INTC', 'NFLX', 'PLTR', 'JPM',
  'GS', 'V', 'MA', 'BAC', 'MS', 'BLK', 'AXP', 'XOM', 'CVX', 'WMT', 'HD', 'PG',
  'JNJ', 'ABBV', 'MRK', 'TMO', 'ISRG', 'KO', 'PEP', 'MCD', 'DIS', 'PYPL', 'CRM',
  'NOW', 'PANW', 'CRWD', 'ADBE', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AMAT', 'LRCX',
  'GE', 'CAT', 'RTX', 'LMT', 'TSM'
]);

export const isIndianTicker = (ticker) => {
  if (!ticker) return false;
  const sym = String(ticker).trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  return indianTickersSet.has(sym) || String(ticker).toUpperCase().endsWith('.NS') || String(ticker).toUpperCase().endsWith('.BO');
};

export const getTickerCurrency = (ticker, fallbackMarketCurrency = '$') => {
  if (!ticker) return fallbackMarketCurrency;
  const sym = String(ticker).trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  if (indianTickersSet.has(sym) || String(ticker).toUpperCase().endsWith('.NS') || String(ticker).toUpperCase().endsWith('.BO')) {
    return '₹';
  }
  if (knownUSTickersSet.has(sym)) {
    return '$';
  }
  // For custom or unlisted tickers, inherit the active market currency rather than defaulting to USD
  return fallbackMarketCurrency || (sym.endsWith('.NS') ? '₹' : '$');
};

const MarketContext = createContext();

export function MarketProvider({ children }) {
  const [market, setMarket] = useState(() => {
    try {
      const saved = localStorage.getItem('vestra_market');
      return (saved === 'INDIA' || saved === 'US') ? saved : 'INDIA';
    } catch (e) {
      return 'INDIA';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vestra_market', market);
    } catch (e) {}
  }, [market]);

  // Define market base currency symbol
  const currency = market === 'US' ? '$' : '₹';

  const getCurrency = (ticker) => {
    if (!ticker) return currency;
    return getTickerCurrency(ticker, currency);
  };

  return (
    <MarketContext.Provider value={{ market, setMarket, currency, getCurrency, isIndianTicker, getTickerCurrency }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}
