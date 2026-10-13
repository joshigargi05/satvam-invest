import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const defaultIndianHoldings = [
    {
      ticker: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      shares: 20,
      avgPrice: 1290.00,
      currentPrice: 1313.00,
      totalValue: 26260.00,
      category: 'Energy/Conglomerate',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'TCS',
      name: 'Tata Consultancy Services',
      shares: 12,
      avgPrice: 2210.00,
      currentPrice: 2245.00,
      totalValue: 26940.00,
      category: 'IT Services',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'INFY',
      name: 'Infosys Limited',
      shares: 25,
      avgPrice: 1195.00,
      currentPrice: 1221.80,
      totalValue: 30545.00,
      category: 'IT Services',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'GOLDBEES',
      name: 'Nippon India ETF Gold BeES',
      shares: 250,
      avgPrice: 67.50,
      currentPrice: 69.40,
      totalValue: 17350.00,
      category: 'Precious Metals',
      assetType: 'commodity',
      bucket: 'agent_vault'
    }
  ];

  const defaultUSHoldings = [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      shares: 15,
      avgPrice: 210.50,
      currentPrice: 216.34,
      totalValue: 3245.10,
      category: 'Technology',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 8,
      avgPrice: 420.00,
      currentPrice: 426.39,
      totalValue: 3411.12,
      category: 'Technology',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'GLD',
      name: 'SPDR Gold Trust',
      shares: 6,
      avgPrice: 242.00,
      currentPrice: 247.10,
      totalValue: 1482.60,
      category: 'Precious Metals',
      assetType: 'commodity',
      bucket: 'agent_vault'
    }
  ];

  const [holdingsMap, setHoldingsMap] = useState(() => {
    try {
      const savedUS = localStorage.getItem('portfolioHoldings_US');
      const savedIN = localStorage.getItem('portfolioHoldings_INDIA');
      const usParsed = savedUS && savedUS !== 'undefined' && savedUS !== 'null' ? JSON.parse(savedUS) : null;
      const inParsed = savedIN && savedIN !== 'undefined' && savedIN !== 'null' ? JSON.parse(savedIN) : null;
      return {
        US: Array.isArray(usParsed) && usParsed.length > 0 ? usParsed : defaultUSHoldings,
        INDIA: Array.isArray(inParsed) && inParsed.length > 0 ? inParsed : defaultIndianHoldings
      };
    } catch (e) {
      console.error(e);
      return { US: defaultUSHoldings, INDIA: defaultIndianHoldings };
    }
  });

  // 4-Layer Autonomous Agent Mode Settings
  const [agentModeEnabled, setAgentModeEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('agentModeEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [agentSettings, setAgentSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('agentModeSettings');
      return saved ? JSON.parse(saved) : {
        maxAllocationPct: 20, // default max 20% capital in autonomous vault
        riskLevel: 'Moderate', // 'Conservative' | 'Moderate' | 'Aggressive'
        minConvictionThreshold: 70, // only execute if 4-layer conviction >= 70
        autoExecution: true, // execute without manual popup prompt
        weights: {
          macro: 25,
          derivatives: 25,
          technical: 30,
          fundamental: 20
        }
      };
    } catch (e) {
      return {
        maxAllocationPct: 20,
        riskLevel: 'Moderate',
        minConvictionThreshold: 70,
        autoExecution: true,
        weights: { macro: 25, derivatives: 25, technical: 30, fundamental: 20 }
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agentModeEnabled', JSON.stringify(agentModeEnabled));
    } catch (e) {}
  }, [agentModeEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('agentModeSettings', JSON.stringify(agentSettings));
    } catch (e) {}
  }, [agentSettings]);

  // Autonomous Tactical Vault Settings
  const [vaultAutoPilot, setVaultAutoPilot] = useState(() => {
    try {
      const saved = localStorage.getItem('vaultAutoPilot');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [vaultDivertPct, setVaultDivertPct] = useState(() => {
    try {
      const saved = localStorage.getItem('vaultDivertPct');
      return saved ? parseFloat(saved) : 20.0;
    } catch (e) {
      return 20.0;
    }
  });

  const [rebalanceHistory, setRebalanceHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolioRebalanceHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const balance = balances[market] || 0;
  const holdings = holdingsMap[market] || [];

  // Filter into Core Long-Term vs Autonomous Tactical Vault
  const coreHoldings = holdings.filter(h => h.bucket !== 'agent_vault');
  const vaultHoldings = holdings.filter(h => h.bucket === 'agent_vault');

  const coreValue = coreHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
  const vaultValue = vaultHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
  const totalPortfolioValue = balance + coreValue + vaultValue;

  // Save to local storage when state changes
  useEffect(() => {
    localStorage.setItem('portfolioBalance_US', balances.US);
    localStorage.setItem('portfolioBalance_INDIA', balances.INDIA);
  }, [balances]);

  useEffect(() => {
    localStorage.setItem('portfolioHoldings_US', JSON.stringify(holdingsMap.US));
    localStorage.setItem('portfolioHoldings_INDIA', JSON.stringify(holdingsMap.INDIA));
  }, [holdingsMap]);

  useEffect(() => {
    localStorage.setItem('portfolioRebalanceHistory', JSON.stringify(rebalanceHistory));
  }, [rebalanceHistory]);

  useEffect(() => {
    localStorage.setItem('vaultAutoPilot', JSON.stringify(vaultAutoPilot));
  }, [vaultAutoPilot]);

  useEffect(() => {
    localStorage.setItem('vaultDivertPct', JSON.stringify(vaultDivertPct));
  }, [vaultDivertPct]);

  // Poll live prices for holdings
  useEffect(() => {
    if (holdings.length === 0) return;

    const fetchPrices = async () => {
      const symbols = holdings.map(h => h.ticker).join(',');
      const quotes = await getQuotes(symbols);
      
      if (Object.keys(quotes).length > 0) {
        setHoldingsMap(prev => {
          const currentMarketHoldings = (prev[market] || []).map(h => {
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

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, [holdings.length, market]);

  // Generic buy asset handler supporting commodities, metals, and stocks
  const buyAsset = (params) => {
    let ticker, name, price, units, category, assetType, bucket;
    
    if (typeof params === 'object') {
      ticker = params.ticker;
      name = params.name || params.ticker;
      price = Number(params.price);
      units = Number(params.units || params.shares || 1);
      category = params.category || 'Equity';
      assetType = params.assetType || 'stock';
      bucket = params.bucket || 'core'; // 'core' or 'agent_vault'
    } else {
      ticker = arguments[0];
      name = arguments[1] || arguments[0];
      price = Number(arguments[2]);
      units = Number(arguments[3] || 1);
      category = arguments[4] || 'Equity';
      assetType = arguments[5] || 'stock';
      bucket = 'core';
    }

    if (!ticker || isNaN(price) || price <= 0 || isNaN(units) || units <= 0) {
      alert("Invalid order parameters.");
      return false;
    }

    const totalCost = Number((price * units).toFixed(2));
    if (balance < totalCost) {
      alert(`Insufficient funds! Required: $${totalCost.toFixed(2)}, Available: $${balance.toFixed(2)}`);
      return false;
    }

    setBalances(prev => ({
      ...prev,
      [market]: Number((prev[market] - totalCost).toFixed(2))
    }));
    
    setHoldingsMap(prev => {
      const currentHoldings = prev[market] || [];
      const existing = currentHoldings.find(h => h.ticker === ticker && (h.bucket || 'core') === bucket);
      let newHoldings;
      
      if (existing) {
        const updatedShares = Number((existing.shares + units).toFixed(4));
        const updatedAvgPrice = Number((((existing.avgPrice * existing.shares) + totalCost) / updatedShares).toFixed(2));
        newHoldings = currentHoldings.map(h => 
          (h.ticker === ticker && (h.bucket || 'core') === bucket)
            ? { 
                ...h, 
                shares: updatedShares, 
                avgPrice: updatedAvgPrice,
                currentPrice: price,
                totalValue: Number((updatedShares * price).toFixed(2)),
                category: category || h.category,
                assetType: assetType || h.assetType,
                bucket
              } 
            : h
        );
      } else {
        newHoldings = [
          ...currentHoldings, 
          { 
            ticker, 
            name, 
            shares: Number(units.toFixed(4)), 
            avgPrice: price, 
            currentPrice: price, 
            totalValue: totalCost,
            category,
            assetType,
            bucket
          }
        ];
      }
      return { ...prev, [market]: newHoldings };
    });

    return true;
  };

  // Backwards compatibility alias for stocks
  const buyStock = (ticker, name, price, shares = 1) => {
    const success = buyAsset({
      ticker,
      name,
      price,
      units: shares,
      category: 'Equity',
      assetType: 'stock',
      bucket: 'core'
    });
    if (success) {
      alert(`Successfully bought ${shares} share(s) of ${ticker}!`);
    }
  };

  // Sell an asset (stock or commodity)
  const sellAsset = (ticker, unitsToSell, targetBucket = null) => {
    const holding = holdings.find(h => h.ticker === ticker && (!targetBucket || (h.bucket || 'core') === targetBucket));
    if (!holding) {
      alert("Asset not found in holdings.");
      return false;
    }

    const currentPrice = holding.currentPrice || holding.avgPrice;
    const sellCount = (!unitsToSell || unitsToSell >= holding.shares) ? holding.shares : Number(unitsToSell);
    const proceeds = Number((sellCount * currentPrice).toFixed(2));

    setBalances(prev => ({
      ...prev,
      [market]: Number((prev[market] + proceeds).toFixed(2))
    }));

    setHoldingsMap(prev => {
      const currentHoldings = prev[market] || [];
      let newHoldings;
      if (sellCount >= holding.shares) {
        newHoldings = currentHoldings.filter(h => !(h.ticker === ticker && h.bucket === holding.bucket));
      } else {
        const remainingShares = Number((holding.shares - sellCount).toFixed(4));
        newHoldings = currentHoldings.map(h => 
          (h.ticker === ticker && h.bucket === holding.bucket)
            ? { ...h, shares: remainingShares, totalValue: Number((remainingShares * currentPrice).toFixed(2)) }
            : h
        );
      }
      return { ...prev, [market]: newHoldings };
    });

    return true;
  };

  // Autonomous Portfolio Rebalancing Engine
  // Supports:
  // 1) Diverting custom % (e.g. 20%) into Global Agent Tactical Vault while KEEPING Long-Term Core Intact!
  // 2) Full 100% Portfolio Rebalance
  const rebalancePortfolio = ({ 
    allocations, 
    scenarioName = 'Autonomous Rebalancing', 
    divertPct = 20, 
    scope = 'vault', // 'vault' (protects long term) or 'full' (all assets)
    customCapital = null,
    enableAutoPilot = null
  }) => {
    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      alert("Invalid allocation plan provided.");
      return false;
    }

    if (enableAutoPilot !== null) {
      setVaultAutoPilot(enableAutoPilot);
    }
    setVaultDivertPct(divertPct);

    // Flatten allocations if grouped by categories
    let flatItems = [];
    allocations.forEach(group => {
      if (group.assets && Array.isArray(group.assets)) {
        group.assets.forEach(asset => {
          flatItems.push({
            ...asset,
            category: group.category || asset.category
          });
        });
      } else if (group.ticker) {
        flatItems.push(group);
      }
    });

    if (flatItems.length === 0) return false;

    const currentCoreValue = coreHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
    const currentVaultValue = vaultHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
    const totalNetWorth = balance + currentCoreValue + currentVaultValue;

    if (totalNetWorth <= 0) {
      alert("Portfolio value is zero. Please deposit funds first.");
      return false;
    }

    if (scope === 'vault') {
      // 🛡️ DEDICATED TACTICAL VAULT MODE: Long-Term Core Portfolio Remains 100% INTACT!
      // Calculate capital to divert (e.g. 20% of total portfolio)
      const targetVaultCapital = customCapital !== null 
        ? Math.min(customCapital, totalNetWorth)
        : Number((totalNetWorth * (divertPct / 100)).toFixed(2));

      // Available capital for tactical vault = current cash balance + existing vault holdings value
      const maxAvailableForVault = balance + currentVaultValue;
      const actualVaultCapital = Math.min(targetVaultCapital, maxAvailableForVault);

      if (actualVaultCapital <= 0) {
        alert("Insufficient liquid cash to fund the Tactical Vault without liquidating core holdings.");
        return false;
      }

      // Build new tactical vault positions
      let deployedVaultTotal = 0;
      const newVaultHoldings = [];
      const executionLogs = [];

      flatItems.forEach(item => {
        const pct = Number(item.pct || item.targetPct || 0);
        if (pct > 0) {
          const dollarAllocation = actualVaultCapital * (pct / 100);
          const price = Number(item.price) > 0 ? Number(item.price) : 100.0;
          const units = Number((dollarAllocation / price).toFixed(4));
          const positionValue = Number((units * price).toFixed(2));
          
          deployedVaultTotal += positionValue;

          newVaultHoldings.push({
            ticker: item.ticker,
            name: item.name || item.ticker,
            shares: units,
            avgPrice: price,
            currentPrice: price,
            totalValue: positionValue,
            category: item.category || 'Asset',
            assetType: item.assetType || (item.ticker.includes('=') ? 'commodity' : 'stock'),
            bucket: 'agent_vault'
          });

          executionLogs.push({
            ticker: item.ticker,
            name: item.name || item.ticker,
            pct,
            units,
            fillPrice: price,
            capital: positionValue,
            category: item.category,
            bucket: 'agent_vault'
          });
        }
      });

      // Updated cash balance: previous balance + old vault value - new deployed vault capital
      const newCashBalance = Math.max(0, Number((balance + currentVaultValue - deployedVaultTotal).toFixed(2)));

      // Keep ALL core holdings 100% untouched, replace only vault holdings!
      const mergedHoldings = [
        ...coreHoldings,
        ...newVaultHoldings
      ];

      setBalances(prev => ({
        ...prev,
        [market]: newCashBalance
      }));

      setHoldingsMap(prev => ({
        ...prev,
        [market]: mergedHoldings
      }));

      const auditRecord = {
        id: 'reb-' + Date.now(),
        timestamp: new Date().toISOString(),
        scenarioName: `${scenarioName} (Tactical Vault ${divertPct}%)`,
        scope: 'vault',
        divertPct,
        market,
        totalCapital: totalNetWorth,
        deployedCapital: deployedVaultTotal,
        coreCapitalProtected: currentCoreValue,
        remainingCash: newCashBalance,
        orders: executionLogs,
        autoPilotActive: vaultAutoPilot
      };

      setRebalanceHistory(prev => [auditRecord, ...prev.slice(0, 19)]);

      return {
        success: true,
        scope: 'vault',
        divertPct,
        coreProtected: true,
        coreCapitalProtected: currentCoreValue,
        auditRecord,
        newHoldings: mergedHoldings,
        remainingCash: newCashBalance
      };

    } else {
      // FULL PORTFOLIO REBALANCE MODE (100%)
      const capitalToDeploy = customCapital ? Math.min(customCapital, totalNetWorth) : totalNetWorth;
      let deployedTotal = 0;
      const newHoldings = [];
      const executionLogs = [];

      flatItems.forEach(item => {
        const pct = Number(item.pct || item.targetPct || 0);
        if (pct > 0) {
          const dollarAllocation = capitalToDeploy * (pct / 100);
          const price = Number(item.price) > 0 ? Number(item.price) : 100.0;
          const units = Number((dollarAllocation / price).toFixed(4));
          const positionValue = Number((units * price).toFixed(2));
          
          deployedTotal += positionValue;
          
          newHoldings.push({
            ticker: item.ticker,
            name: item.name || item.ticker,
            shares: units,
            avgPrice: price,
            currentPrice: price,
            totalValue: positionValue,
            category: item.category || 'Asset',
            assetType: item.assetType || (item.ticker.includes('=') ? 'commodity' : 'stock'),
            bucket: 'core'
          });

          executionLogs.push({
            ticker: item.ticker,
            name: item.name || item.ticker,
            pct,
            units,
            fillPrice: price,
            capital: positionValue,
            category: item.category
          });
        }
      });

      const remainingCash = Math.max(0, Number((totalNetWorth - deployedTotal).toFixed(2)));

      setBalances(prev => ({
        ...prev,
        [market]: remainingCash
      }));

      setHoldingsMap(prev => ({
        ...prev,
        [market]: newHoldings
      }));

      const auditRecord = {
        id: 'reb-' + Date.now(),
        timestamp: new Date().toISOString(),
        scenarioName: `${scenarioName} (Full Portfolio 100%)`,
        scope: 'full',
        divertPct: 100,
        market,
        totalCapital: totalNetWorth,
        deployedCapital: deployedTotal,
        remainingCash,
        orders: executionLogs
      };

      setRebalanceHistory(prev => [auditRecord, ...prev.slice(0, 19)]);

      return {
        success: true,
        scope: 'full',
        auditRecord,
        newHoldings,
        remainingCash
      };
    }
  };

  return (
    <PortfolioContext.Provider value={{ 
      balance, 
      holdings, 
      coreHoldings,
      vaultHoldings,
      coreValue,
      vaultValue,
      totalPortfolioValue,
      vaultAutoPilot,
      setVaultAutoPilot,
      vaultDivertPct,
      setVaultDivertPct,
      agentModeEnabled,
      setAgentModeEnabled,
      agentSettings,
      setAgentSettings,
      buyStock, 
      buyAsset, 
      sellAsset, 
      rebalancePortfolio,
      rebalanceHistory 
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
