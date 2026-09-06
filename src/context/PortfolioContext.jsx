import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getQuotes } from '../services/api';
import { useMarket } from './MarketContext';

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const { market } = useMarket();
  
  // Keep separate balances and holdings per market
  const [balances, setBalances] = useState(() => {
    try {
      const savedUS = localStorage.getItem('portfolioBalance_US');
      const savedIN = localStorage.getItem('portfolioBalance_INDIA');
      
      const usVal = parseFloat(savedUS);
      const inVal = parseFloat(savedIN);
      
      return {
        US: (savedUS && !isNaN(usVal)) ? usVal : 10000.00,
        INDIA: (savedIN && !isNaN(inVal)) ? inVal : 150000.00
      };
    } catch (e) {
      console.error(e);
      return { US: 10000.00, INDIA: 150000.00 };
    }
  });

  const [holdingsMap, setHoldingsMap] = useState(() => {
    try {
      const savedUS = localStorage.getItem('portfolioHoldings_US');
      const savedIN = localStorage.getItem('portfolioHoldings_INDIA');
      const usParsed = savedUS && savedUS !== 'undefined' && savedUS !== 'null' ? JSON.parse(savedUS) : [];
      const inParsed = savedIN && savedIN !== 'undefined' && savedIN !== 'null' ? JSON.parse(savedIN) : [];
      return {
        US: Array.isArray(usParsed) ? usParsed : [],
        INDIA: Array.isArray(inParsed) ? inParsed : []
      };
    } catch (e) {
      console.error(e);
      return { US: [], INDIA: [] };
    }
  });

  const balance = balances[market];
  const holdings = holdingsMap[market];

  // Save to local storage when state changes
  useEffect(() => {
    localStorage.setItem('portfolioBalance_US', balances.US);
    localStorage.setItem('portfolioBalance_INDIA', balances.INDIA);
  }, [balances]);

  useEffect(() => {
    localStorage.setItem('portfolioHoldings_US', JSON.stringify(holdingsMap.US));
    localStorage.setItem('portfolioHoldings_INDIA', JSON.stringify(holdingsMap.INDIA));
  }, [holdingsMap]);

  // Poll live prices for holdings
  useEffect(() => {
    if (holdings.length === 0) return;

    const fetchPrices = async () => {
      const symbols = holdings.map(h => h.ticker).join(',');
      const quotes = await getQuotes(symbols);
      
      if (Object.keys(quotes).length > 0) {
        setHoldingsMap(prev => {
          const currentMarketHoldings = prev[market].map(h => {
            const liveData = quotes[h.ticker];
            if (liveData && liveData.price) {
              return {
                ...h,
                currentPrice: liveData.price,
                totalValue: liveData.price * h.shares
              };
            }
            return h;
          });
          return { ...prev, [market]: currentMarketHoldings };
        });
      }
    };

    // Initial fetch
    fetchPrices();

    // Poll every 2 seconds
    const interval = setInterval(fetchPrices, 2000);
    return () => clearInterval(interval);
  }, [holdings.length, market]); // Re-bind on market change

  const buyStock = (ticker, name, price, shares = 1) => {
    const totalCost = price * shares;
    if (balance < totalCost) {
      alert("Insufficient funds to buy this stock!");
      return;
    }

    setBalances(prev => ({
      ...prev,
      [market]: prev[market] - totalCost
    }));
    
    setHoldingsMap(prev => {
      const currentHoldings = prev[market];
      const existing = currentHoldings.find(h => h.ticker === ticker);
      let newHoldings;
      
      if (existing) {
        newHoldings = currentHoldings.map(h => 
          h.ticker === ticker 
            ? { ...h, shares: h.shares + shares, totalValue: (h.shares + shares) * price, currentPrice: price } 
            : h
        );
      } else {
        newHoldings = [...currentHoldings, { ticker, name, shares, avgPrice: price, currentPrice: price, totalValue: price * shares }];
      }
      return { ...prev, [market]: newHoldings };
    });

    alert(`Successfully bought ${shares} share(s) of ${ticker}!`);
  };

  return (
    <PortfolioContext.Provider value={{ balance, holdings, buyStock }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
