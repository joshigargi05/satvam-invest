import React, { createContext, useState, useContext, useEffect } from 'react';

const MarketContext = createContext();

export function MarketProvider({ children }) {
  const [market, setMarket] = useState('US'); // 'US' | 'INDIA'

  // Define currency symbol
  const currency = market === 'US' ? '$' : '₹';

  return (
    <MarketContext.Provider value={{ market, setMarket, currency }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}
