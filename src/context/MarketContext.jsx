import React, { createContext, useContext, useState, useEffect } from 'react';

export const isIndianTicker = (ticker) => {
  if (!ticker) return false;
  const sym = String(ticker).trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  const indianTickers = new Set([
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL',
    'ITC', 'HINDUNILVR', 'LT', 'BAJFINANCE', 'HCLTECH', 'AXISBANK', 'MARUTI',
    'SUNPHARMA', 'KOTAKBANK', 'TATAMOTORS', 'ONGC', 'GOLDBEES', 'SILVERBEES',
    'CRUDEOIL', 'NATGAS', 'COPPER', 'WIPRO', 'ADANIENT', 'ADANIPORTS', 'COALINDIA',
    'NTPC', 'POWERGRID', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'JSWSTEEL', 'TATASTEEL',
    'M&M', 'BAJAJ-AUTO', 'BAJAJFINSV', 'GRASIM', 'TECHM', 'HINDALCO', 'CIPLA',
    'DRREDDY', 'EICHERMOT', 'SBILIFE', 'HDFCLIFE', 'BPCL', 'BRITANNIA', 'APOLLOHOSP',
    'DIVISLAB', 'TATACONSUM', 'HEROMOTOCO', 'ASIANPAINT', 'INDUSINDBK', 'SHRIRAMFIN',
    'BEL', 'HAL', 'TRENT'
  ]);
  return indianTickers.has(sym) || String(ticker).toUpperCase().endsWith('.NS') || String(ticker).toUpperCase().endsWith('.BO');
};

export const getTickerCurrency = (ticker, fallbackMarketCurrency = '$') => {
  if (!ticker) return fallbackMarketCurrency;
  return isIndianTicker(ticker) ? '₹' : '$';
};

const MarketContext = createContext();

export function MarketProvider({ children }) {
  const [market, setMarket] = useState(() => {
    try {
      const saved = localStorage.getItem('vestra_market');
      return (saved === 'INDIA' || saved === 'US') ? saved : 'US';
    } catch (e) {
      return 'US';
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
