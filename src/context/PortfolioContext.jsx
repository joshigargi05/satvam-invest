import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getQuotes, getMacroAllocationRecommendation, getTopAlgoPicks, getCloudPortfolio, syncCloudPortfolio } from '../services/api';
import { useMarket } from './MarketContext';
import { useAuth } from './AuthContext';
import { TradeResultModal, SellPositionModal } from '../components/TradeModals';

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const { market } = useMarket();
  const auth = useAuth();
  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState(null);
  const hydratedUserIdRef = useRef(null);
  
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

  // In-App Trade Action Box & Modal States (Replaces crude browser notifications/alerts)
  const [tradeResultModal, setTradeResultModal] = useState({
    isOpen: false,
    type: 'success',
    action: 'BUY',
    ticker: '',
    name: '',
    units: 1,
    price: 0,
    total: 0,
    currency: '$',
    autoExit: null,
    market: 'US',
    balanceAfter: null,
    title: '',
    message: ''
  });

  const [sellModalState, setSellModalState] = useState({
    isOpen: false,
    asset: null
  });

  const openSellModal = (asset) => {
    setSellModalState({ isOpen: true, asset });
  };

  const closeSellModal = () => {
    setSellModalState({ isOpen: false, asset: null });
  };

  const closeTradeResultModal = () => {
    setTradeResultModal(prev => ({ ...prev, isOpen: false }));
  };

  const showTradeAlert = ({ title = 'Order Notice', message = '', type = 'warning' }) => {
    setTradeResultModal({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const defaultIndianHoldings = [
    {
      ticker: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      shares: 20,
      avgPrice: 1185.00,
      currentPrice: 1209.00,
      totalValue: 24180.00,
      category: 'Energy/Conglomerate',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'TCS',
      name: 'Tata Consultancy Services',
      shares: 12,
      avgPrice: 2440.00,
      currentPrice: 2529.00,
      totalValue: 30348.00,
      category: 'IT Services',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'INFY',
      name: 'Infosys Limited',
      shares: 25,
      avgPrice: 1125.00,
      currentPrice: 1168.00,
      totalValue: 29200.00,
      category: 'IT Services',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'GOLDBEES',
      name: 'Nippon India ETF Gold BeES',
      shares: 250,
      avgPrice: 114.50,
      currentPrice: 118.13,
      totalValue: 29532.50,
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
      avgPrice: 212.50,
      currentPrice: 220.54,
      totalValue: 3308.10,
      category: 'Technology',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 8,
      avgPrice: 515.00,
      currentPrice: 531.65,
      totalValue: 4253.20,
      category: 'Technology',
      assetType: 'stock',
      bucket: 'core'
    },
    {
      ticker: 'GLD',
      name: 'SPDR Gold Trust',
      shares: 6,
      avgPrice: 372.00,
      currentPrice: 382.40,
      totalValue: 2294.40,
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

  const [autoExitHistory, setAutoExitHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('portfolioAutoExitHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // ---------------------------------------------------------------------------
  // 100% Autonomous #1 Top Conviction Compounder (Separate US & India Pods)
  // Default Mode: SEBI / SEC Compliant 1-Click GTT Order Staging + 100% Auto-Sale
  // ---------------------------------------------------------------------------
  const [topPickComplianceMode, setTopPickComplianceMode] = useState(() => {
    try {
      const saved = localStorage.getItem('topPickComplianceMode_v1');
      return saved || 'compliant_1click_gtt'; // 'compliant_1click_gtt' (default) | 'sandbox_full_auto'
    } catch (e) {
      return 'compliant_1click_gtt';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('topPickComplianceMode_v1', topPickComplianceMode);
    } catch (e) {}
  }, [topPickComplianceMode]);

  const defaultTopPickPod = (mkt = 'US') => {
    const isIndia = mkt === 'INDIA';
    const seedTicker = isIndia ? 'TCS' : 'NVDA';
    const seedName = isIndia ? 'Tata Consultancy Services' : 'NVIDIA Corporation';
    const seedPrice = isIndia ? 2529.00 : 220.54;
    const seedCapital = isIndia ? 26326.00 : 1985.57;
    const seedShares = Number((seedCapital / seedPrice).toFixed(4));
    const seedInvested = Number((seedShares * seedPrice).toFixed(2));
    const seedTarget = Number((seedPrice * 1.02).toFixed(2));
    const sym = isIndia ? '₹' : '$';
    const gttId = isIndia ? 'GTT-NSE-88412' : 'OCO-NYSE-55109';

    return {
      enabled: true,
      fundPct: 10, // Exclusive fund % (e.g. 10% of portfolio) 100% managed by Agent
      profitTargetPct: 2.0, // Profit limit % (1%, 2%, or custom %) to trigger auto-sale & re-investment
      allocatedCapital: seedInvested, // Compounds automatically after each profitable exit
      initialBaselineCapital: seedInvested,
      totalRealizedProfit: 0,
      completedCycles: 0,
      activePosition: {
        ticker: seedTicker,
        name: seedName,
        shares: seedShares,
        entryPrice: seedPrice,
        currentPrice: seedPrice,
        targetPrice: seedTarget,
        profitTargetPct: 2.0,
        investedCapital: seedInvested,
        currentValue: seedInvested,
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        convictionScore: isIndia ? 92 : 95,
        finalScore: isIndia ? 91 : 94,
        rankBadge: '#1 Top Conviction',
        sector: isIndia ? 'IT Services' : 'Semiconductors & AI',
        gttOrderId: gttId,
        gttStatus: 'ARMED_AT_BROKER',
        boughtAt: new Date().toISOString(),
        cycleNumber: 1
      },
      stagedOrder: null,
      lastCandidatePool: [],
      statusMessage: `Holding #1 ${seedTicker} — Native GTT Auto-Sell Armed at +2% (${sym}${seedTarget.toFixed(2)})`,
      lastUpdatedAt: new Date().toISOString()
    };
  };

  const [topPickAgent, setTopPickAgent] = useState(() => {
    try {
      const saved = localStorage.getItem('topPickCompounderState_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const defUS = defaultTopPickPod('US');
        const defIN = defaultTopPickPod('INDIA');
        return {
          US: {
            ...defUS,
            ...(parsed.US || {}),
            activePosition: parsed.US?.stagedOrder ? null : (parsed.US?.activePosition || defUS.activePosition),
            stagedOrder: parsed.US?.stagedOrder || null
          },
          INDIA: {
            ...defIN,
            ...(parsed.INDIA || {}),
            activePosition: parsed.INDIA?.stagedOrder ? null : (parsed.INDIA?.activePosition || defIN.activePosition),
            stagedOrder: parsed.INDIA?.stagedOrder || null
          }
        };
      }
    } catch (e) {}
    return {
      US: defaultTopPickPod('US'),
      INDIA: defaultTopPickPod('INDIA')
    };
  });

  const [topPickCycleHistory, setTopPickCycleHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('topPickCompounderHistory_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const balance = balances[market] || 0;
  const holdings = holdingsMap[market] || [];

  // Filter into Core Long-Term vs Autonomous Tactical Vault vs #1 Top Conviction Exclusive Pod
  const coreHoldings = holdings.filter(h => h.bucket !== 'agent_vault' && h.bucket !== 'top1_agent');
  const vaultHoldings = holdings.filter(h => h.bucket === 'agent_vault');
  const top1Holdings = holdings.filter(h => h.bucket === 'top1_agent');

  // Cost Basis & Performance Calculations
  const coreInvested = coreHoldings.reduce((sum, h) => sum + ((h.avgPrice || h.currentPrice) * (h.shares || 0)), 0);
  const vaultInvested = vaultHoldings.reduce((sum, h) => sum + ((h.avgPrice || h.currentPrice) * (h.shares || 0)), 0);
  const top1Invested = topPickAgent[market]?.activePosition?.investedCapital || top1Holdings.reduce((sum, h) => sum + ((h.avgPrice || h.currentPrice) * (h.shares || 0)), 0);
  const totalInvested = coreInvested + vaultInvested + top1Invested;

  const coreValue = coreHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
  const vaultValue = vaultHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
  const top1Value = topPickAgent[market]?.activePosition?.currentValue || top1Holdings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
  const totalPortfolioValue = balance + coreValue + vaultValue + top1Value;

  const corePnl = coreValue - coreInvested;
  const corePnlPct = coreInvested > 0 ? (corePnl / coreInvested) * 100 : 0;

  const vaultPnl = vaultValue - vaultInvested;
  const vaultPnlPct = vaultInvested > 0 ? (vaultPnl / vaultInvested) * 100 : 0;

  const totalPnl = (coreValue + vaultValue + top1Value) - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

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
    localStorage.setItem('portfolioAutoExitHistory', JSON.stringify(autoExitHistory));
  }, [autoExitHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('topPickCompounderState_v1', JSON.stringify(topPickAgent));
    } catch (e) {}
  }, [topPickAgent]);

  useEffect(() => {
    try {
      localStorage.setItem('topPickCompounderHistory_v1', JSON.stringify(topPickCycleHistory));
    } catch (e) {}
  }, [topPickCycleHistory]);

  // Hydrate portfolio from Cloud when user signs in on Web, Android, or iOS
  useEffect(() => {
    const userId = auth?.user?.id;
    if (!isAuthenticated || !userId || hydratedUserIdRef.current === userId) return;
    hydratedUserIdRef.current = userId;

    (async () => {
      const data = await getCloudPortfolio();
      const cloud = data?.cloudPortfolio;
      if (cloud && (cloud.US || cloud.INDIA)) {
        if (cloud.US) {
          if (typeof cloud.US.balance === 'number') {
            setBalances((prev) => ({ ...prev, US: cloud.US.balance }));
          }
          if (Array.isArray(cloud.US.holdings) && cloud.US.holdings.length > 0) {
            setHoldingsMap((prev) => ({ ...prev, US: cloud.US.holdings }));
          }
        }
        if (cloud.INDIA) {
          if (typeof cloud.INDIA.balance === 'number') {
            setBalances((prev) => ({ ...prev, INDIA: cloud.INDIA.balance }));
          }
          if (Array.isArray(cloud.INDIA.holdings) && cloud.INDIA.holdings.length > 0) {
            setHoldingsMap((prev) => ({ ...prev, INDIA: cloud.INDIA.holdings }));
          }
        }
        if (data.updatedAt) setLastCloudSyncAt(data.updatedAt);
      } else {
        // Initial push of local ledger to Cloud for this account
        await syncCloudPortfolio('US', { balance: balances.US, holdings: holdingsMap.US });
        const res = await syncCloudPortfolio('INDIA', { balance: balances.INDIA, holdings: holdingsMap.INDIA });
        if (res?.syncedAt) setLastCloudSyncAt(res.syncedAt);
      }
    })();
  }, [isAuthenticated, auth?.user?.id]);

  // Continuously sync portfolio mutations (trades, auto-exit rules, rebalances) to Cloud
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(async () => {
      const res = await syncCloudPortfolio(market, {
        balance: balances[market],
        holdings: holdingsMap[market]
      });
      if (res?.syncedAt) setLastCloudSyncAt(res.syncedAt);
    }, 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, market, balances, holdingsMap]);

  // Helper to compute normalized Auto-Exit (Take-Profit / Target Price) rule
  const buildAutoExitRule = (ruleInput, avgPrice) => {
    if (!ruleInput || !ruleInput.enabled) return null;
    const baseAvg = Number(avgPrice) > 0 ? Number(avgPrice) : 100;
    if (ruleInput.mode === 'price') {
      const tPrice = Number(Number(ruleInput.targetPrice).toFixed(2));
      if (isNaN(tPrice) || tPrice <= 0) return null;
      const tPct = Number((((tPrice - baseAvg) / baseAvg) * 100).toFixed(2));
      return {
        enabled: true,
        mode: 'price',
        targetPrice: tPrice,
        targetProfitPct: tPct,
        updatedAt: new Date().toISOString()
      };
    } else {
      const tPct = Number(Number(ruleInput.targetProfitPct ?? 10).toFixed(2));
      if (isNaN(tPct) || tPct <= -99) return null;
      const tPrice = Number((baseAvg * (1 + tPct / 100)).toFixed(2));
      return {
        enabled: true,
        mode: 'percentage',
        targetProfitPct: tPct,
        targetPrice: tPrice,
        updatedAt: new Date().toISOString()
      };
    }
  };

  // Set, update, or remove Auto-Exit rule for a specific holding
  const setAutoExitRule = (ticker, targetBucket = 'core', ruleInput = null) => {
    setHoldingsMap(prev => {
      const currentMarketHoldings = prev[market] || [];
      const updated = currentMarketHoldings.map(h => {
        if (h.ticker === ticker && (h.bucket || 'core') === (targetBucket || 'core')) {
          const normalizedRule = buildAutoExitRule(ruleInput, h.avgPrice || h.currentPrice);
          return {
            ...h,
            autoExit: normalizedRule
          };
        }
        return h;
      });
      return { ...prev, [market]: updated };
    });
    return true;
  };

  useEffect(() => {
    localStorage.setItem('vaultAutoPilot', JSON.stringify(vaultAutoPilot));
  }, [vaultAutoPilot]);

  useEffect(() => {
    localStorage.setItem('vaultDivertPct', JSON.stringify(vaultDivertPct));
  }, [vaultDivertPct]);

  // Toast notification state for live autonomous agent executions
  const [autonomousExecutionToast, setAutonomousExecutionToast] = useState(null);
  const isExecutingAutonomousRef = useRef(false);
  const lastAutoRebalanceRef = useRef(0);
  const isExecutingTopPickRef = useRef({ US: false, INDIA: false });
  const rotatedTickersHistoryRef = useRef({ US: [], INDIA: [] });
  const topPickAgentRef = useRef(topPickAgent);
  const complianceModeRef = useRef(topPickComplianceMode);
  const balancesRef = useRef(balances);
  const holdingsMapRef = useRef(holdingsMap);

  // Synchronous state + ref updater so manual button clicks never read stale ref state
  const setTopPickAgentSync = (updater) => {
    setTopPickAgent(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      topPickAgentRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    topPickAgentRef.current = topPickAgent;
  }, [topPickAgent]);

  useEffect(() => {
    complianceModeRef.current = topPickComplianceMode;
  }, [topPickComplianceMode]);

  useEffect(() => {
    balancesRef.current = balances;
  }, [balances]);

  useEffect(() => {
    holdingsMapRef.current = holdingsMap;
  }, [holdingsMap]);

  // Helper: Compute total net worth for a specific market (US or INDIA)
  const computeMarketNetWorth = (mkt) => {
    const mktCash = Number(balancesRef.current?.[mkt] || 0);
    const mktHoldings = (holdingsMapRef.current?.[mkt] || []).filter(h => h.bucket !== 'top1_agent');
    const mktHoldingsVal = mktHoldings.reduce((s, h) => s + Number(h.totalValue || 0), 0);
    const activeTop1Val = Number(
      topPickAgentRef.current?.[mkt]?.activePosition?.currentValue ||
      topPickAgentRef.current?.[mkt]?.stagedOrder?.investedCapital ||
      0
    );
    return Number((mktCash + mktHoldingsVal + activeTop1Val).toFixed(2));
  };

  // Synchronize #1 Top Conviction stock & quantity into holdingsMap[mkt] and remove sold stock
  const syncTopPickToHoldingsMap = (mkt, newPick, soldTicker = null) => {
    if (!newPick || !newPick.ticker) return;
    setHoldingsMap(prev => {
      const currentList = prev[mkt] || [];
      const updated = currentList.filter(h => {
        if (h.bucket === 'top1_agent') return false;
        if (soldTicker && h.ticker === soldTicker) return false;
        if (h.ticker === newPick.ticker) return false;
        return true;
      });

      const entryPrice = Number(newPick.entryPrice || newPick.avgPrice || newPick.price || 0);
      const currentPrice = Number(newPick.currentPrice || entryPrice);
      const shares = Number(newPick.shares || 0);
      const totalValue = Number(
        newPick.currentValue ||
        newPick.investedCapital ||
        Number((shares * currentPrice).toFixed(2))
      );

      const topPickHolding = {
        ticker: newPick.ticker,
        name: newPick.name || newPick.ticker,
        shares,
        avgPrice: entryPrice,
        currentPrice,
        totalValue,
        category: newPick.sector || newPick.category || 'High Conviction Equity',
        assetType: 'stock',
        bucket: 'top1_agent'
      };

      return {
        ...prev,
        [mkt]: [topPickHolding, ...updated]
      };
    });
  };

  // Keep holdingsMap in sync with the active or staged #1 Top Pick for both US and INDIA
  useEffect(() => {
    for (const mkt of ['US', 'INDIA']) {
      const pod = topPickAgent?.[mkt];
      const currentPick = pod?.activePosition || pod?.stagedOrder;
      const soldTicker = pod?.stagedOrder?.previousSoldTicker || null;
      if (currentPick && currentPick.ticker && Number(currentPick.shares) > 0) {
        syncTopPickToHoldingsMap(mkt, currentPick, soldTicker);
      }
    }
  }, [
    topPickAgent?.US?.activePosition?.ticker,
    topPickAgent?.US?.activePosition?.shares,
    topPickAgent?.US?.stagedOrder?.ticker,
    topPickAgent?.US?.stagedOrder?.shares,
    topPickAgent?.INDIA?.activePosition?.ticker,
    topPickAgent?.INDIA?.activePosition?.shares,
    topPickAgent?.INDIA?.stagedOrder?.ticker,
    topPickAgent?.INDIA?.stagedOrder?.shares
  ]);

  // 1-Click SEBI / SEC Compliant Approval: Executes Staged #1 Buy + Arms Native GTT / Bracket Auto-Sale Order
  const approveStagedTopPickOrder = (targetMarket = market) => {
    const mkt = targetMarket === 'INDIA' ? 'INDIA' : 'US';
    const currSym = mkt === 'US' ? '$' : '₹';
    const pod = topPickAgentRef.current?.[mkt];
    const staged = pod?.stagedOrder;
    if (!staged) return null;

    const gttPrefix = mkt === 'INDIA' ? 'GTT-NSE' : 'OCO-NYSE';
    const gttOrderId = `${gttPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const nextCycleNumber = (pod.completedCycles || 0) + 1;

    const approvedPosition = {
      ticker: staged.ticker,
      name: staged.name || staged.ticker,
      shares: staged.shares,
      entryPrice: staged.entryPrice,
      currentPrice: staged.entryPrice,
      targetPrice: staged.targetPrice,
      profitTargetPct: staged.profitTargetPct,
      investedCapital: staged.investedCapital,
      currentValue: staged.investedCapital,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      convictionScore: staged.convictionScore || 90,
      finalScore: staged.finalScore || 90,
      rankBadge: '#1 Top Conviction',
      sector: staged.sector || 'High Conviction Equity',
      gttOrderId,
      gttStatus: 'ARMED_AT_BROKER',
      boughtAt: new Date().toISOString(),
      cycleNumber: nextCycleNumber
    };

    syncTopPickToHoldingsMap(mkt, approvedPosition, staged.previousSoldTicker);

    setTopPickAgentSync(prev => ({
      ...prev,
      [mkt]: {
        ...prev[mkt],
        allocatedCapital: approvedPosition.investedCapital,
        activePosition: approvedPosition,
        stagedOrder: null,
        statusMessage: `Holding #1 ${approvedPosition.ticker} — Native GTT (${gttOrderId}) Armed at +${approvedPosition.profitTargetPct}% (${currSym}${approvedPosition.targetPrice.toFixed(2)})`,
        lastUpdatedAt: new Date().toISOString()
      }
    }));

    const approvalRecord = {
      id: `top1-gtt-approve-${Date.now()}-${mkt}`,
      timestamp: new Date().toISOString(),
      market: mkt,
      cycleNumber: nextCycleNumber,
      actionType: 'GTT_1CLICK_APPROVED',
      soldTicker: staged.previousSoldTicker || null,
      boughtTicker: approvedPosition.ticker,
      boughtName: approvedPosition.name,
      boughtShares: approvedPosition.shares,
      buyPrice: approvedPosition.entryPrice,
      nextTargetPrice: approvedPosition.targetPrice,
      targetProfitPct: approvedPosition.profitTargetPct,
      deployedCapital: approvedPosition.investedCapital,
      convictionScore: approvedPosition.convictionScore,
      gttOrderId
    };

    setTopPickCycleHistory(prev => [approvalRecord, ...prev.slice(0, 39)]);

    setAutonomousExecutionToast({
      id: Date.now(),
      title: `🛡️ [${mkt}] 1-Click Approved: Bought #1 ${approvedPosition.ticker} + Armed GTT (${gttOrderId})`,
      message: `Executed ${approvedPosition.shares} sh of ${approvedPosition.ticker} @ ${currSym}${approvedPosition.entryPrice.toFixed(2)} (${currSym}${approvedPosition.investedCapital.toLocaleString()}) with native Auto-Sale GTT armed at ${currSym}${approvedPosition.targetPrice.toFixed(2)} (+${approvedPosition.profitTargetPct}%).`,
      timestamp: new Date().toLocaleTimeString()
    });

    setTimeout(() => {
      setAutonomousExecutionToast(null);
    }, 8000);

    return approvalRecord;
  };

  // Core Autonomous Executor: Auto-Buy #1 Top Conviction OR Auto-Sell on Profit Hit & Stage/Re-Invest in Newest #1 Stock
  const executeTopPickCycleStep = async (targetMarket, options = {}) => {
    const mkt = targetMarket === 'INDIA' ? 'INDIA' : 'US';
    if (isExecutingTopPickRef.current[mkt] && !options.forceManual) return null;

    const pod = topPickAgentRef.current?.[mkt] || defaultTopPickPod(mkt);
    if (!pod || (!pod.enabled && !options.forceManual)) return null;

    try {
      isExecutingTopPickRef.current[mkt] = true;
      const currSym = mkt === 'US' ? '$' : '₹';
      const profitGoalPct = Number(options.overrideProfitPct ?? pod.profitTargetPct ?? 2.0);
      const fundPct = Number(options.overrideFundPct ?? pod.fundPct ?? 10);
      const isCompliantGttMode = complianceModeRef.current === 'compliant_1click_gtt';

      const fallbackRotationPool = mkt === 'INDIA'
        ? [
            { ticker: 'TCS', name: 'Tata Consultancy Services', price: 2529.00, finalScore: 91, sector: 'IT Services', layers: { agentConvictionScore: 92 } },
            { ticker: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 1209.00, finalScore: 90, sector: 'Energy & Conglomerate', layers: { agentConvictionScore: 90 } },
            { ticker: 'HDFCBANK', name: 'HDFC Bank Limited', price: 1742.50, finalScore: 89, sector: 'Banking & Finance', layers: { agentConvictionScore: 89 } },
            { ticker: 'INFY', name: 'Infosys Limited', price: 1168.00, finalScore: 88, sector: 'IT Services', layers: { agentConvictionScore: 88 } },
            { ticker: 'ICICIBANK', name: 'ICICI Bank Limited', price: 1285.00, finalScore: 87, sector: 'Banking & Finance', layers: { agentConvictionScore: 87 } }
          ]
        : [
            { ticker: 'NVDA', name: 'NVIDIA Corporation', price: 220.54, finalScore: 94, sector: 'Semiconductors & AI', layers: { agentConvictionScore: 95 } },
            { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 317.24, finalScore: 92, sector: 'AI & Cloud Infrastructure', layers: { agentConvictionScore: 93 } },
            { ticker: 'MSFT', name: 'Microsoft Corporation', price: 531.65, finalScore: 91, sector: 'Enterprise AI & Cloud', layers: { agentConvictionScore: 91 } },
            { ticker: 'META', name: 'Meta Platforms Inc.', price: 592.40, finalScore: 89, sector: 'AI & Digital Platforms', layers: { agentConvictionScore: 90 } },
            { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 214.80, finalScore: 88, sector: 'Cloud & E-Commerce', layers: { agentConvictionScore: 89 } }
          ];

      // Case 0: Staged Order exists and user clicked "Rotate #1 Candidate" before approving
      if (!pod.activePosition && pod.stagedOrder && options.forceRotate) {
        const prevStaged = pod.stagedOrder;
        const prevHistory = rotatedTickersHistoryRef.current[mkt] || [];
        const updatedHistory = [...prevHistory.filter(t => t !== prevStaged.ticker), prevStaged.ticker].slice(-4);
        rotatedTickersHistoryRef.current[mkt] = updatedHistory;
        const rotatedSet = new Set(updatedHistory);

        const picksRes = await getTopAlgoPicks(mkt, true, updatedHistory.join(','));
        const marketPicks = mkt === 'INDIA'
          ? (picksRes?.indiaTopPicks || picksRes?.topPicks || [])
          : (picksRes?.usTopPicks || picksRes?.topPicks || []);

        const combinedCandidates = [...marketPicks, ...(pod.lastCandidatePool || []), ...fallbackRotationPool];
        const newestTop1 =
          combinedCandidates.find(p => p && p.ticker && !rotatedSet.has(p.ticker) && Number(p.price) > 0) ||
          combinedCandidates.find(p => p && p.ticker && p.ticker !== prevStaged.ticker && Number(p.price) > 0) ||
          marketPicks[0];

        if (!newestTop1) return null;

        const newEntryPrice = Number(newestTop1.price);
        const newTargetPrice = Number((newEntryPrice * (1 + profitGoalPct / 100)).toFixed(2));
        const budget = Number(pod.allocatedCapital || prevStaged.investedCapital || 2000);
        const newShares = Number((budget / newEntryPrice).toFixed(4));
        const newInvested = Number((newShares * newEntryPrice).toFixed(2));

        const nextStagedOrder = {
          ticker: newestTop1.ticker,
          name: newestTop1.name || newestTop1.ticker,
          shares: newShares,
          entryPrice: newEntryPrice,
          targetPrice: newTargetPrice,
          profitTargetPct: profitGoalPct,
          investedCapital: newInvested,
          convictionScore: newestTop1.layers?.agentConvictionScore || Math.round(newestTop1.finalScore || 90),
          finalScore: newestTop1.finalScore || 90,
          sector: newestTop1.sector || 'High Conviction Equity',
          orderType: mkt === 'INDIA' ? 'NSE/BSE Delivery + GTT Target OCO' : 'NYSE/NASDAQ Market + OCO Take-Profit Bracket',
          previousSoldTicker: prevStaged.ticker,
          stagedReason: `Rotated Staged Candidate (${prevStaged.ticker} → ${newestTop1.ticker})`,
          stagedAt: new Date().toISOString()
        };

        // Immediately sync rotated candidate & shares to My Portfolio (holdingsMap) and remove sold stock
        syncTopPickToHoldingsMap(mkt, nextStagedOrder, prevStaged.ticker);

        setTopPickAgentSync(prev => ({
          ...prev,
          [mkt]: {
            ...prev[mkt],
            stagedOrder: nextStagedOrder,
            statusMessage: `🛡️ Staged #1 ${nextStagedOrder.ticker} (+${profitGoalPct}% GTT @ ${currSym}${newTargetPrice.toFixed(2)}) — Awaiting 1-Click Approval`,
            lastUpdatedAt: new Date().toISOString()
          }
        }));

        const stageRotateRecord = {
          id: `top1-stage-rot-${Date.now()}-${mkt}`,
          timestamp: new Date().toISOString(),
          market: mkt,
          cycleNumber: (pod.completedCycles || 0) + 1,
          actionType: 'MANUAL_ROTATE_TOP1',
          soldTicker: prevStaged.ticker,
          soldShares: prevStaged.shares,
          exitPrice: prevStaged.entryPrice,
          boughtTicker: nextStagedOrder.ticker,
          boughtName: nextStagedOrder.name,
          boughtShares: nextStagedOrder.shares,
          buyPrice: nextStagedOrder.entryPrice,
          nextTargetPrice: nextStagedOrder.targetPrice,
          deployedCapital: nextStagedOrder.investedCapital,
          convictionScore: nextStagedOrder.convictionScore
        };

        setTopPickCycleHistory(prev => [stageRotateRecord, ...prev.slice(0, 39)]);
        return stageRotateRecord;
      }

      // Case A: Active position exists and either hit profit target OR user triggered profit-hit simulation / rotation
      if (pod.activePosition && (options.triggerProfitHit || options.forceRotate)) {
        const prevPos = pod.activePosition;
        const exitPrice = options.triggerProfitHit
          ? Number(Math.max(Number(prevPos.targetPrice || 0), Number((prevPos.entryPrice * (1 + profitGoalPct / 100)).toFixed(2))))
          : Number(prevPos.currentPrice || prevPos.entryPrice);

        const saleProceeds = Number((prevPos.shares * exitPrice).toFixed(2));
        const realizedProfit = Number((saleProceeds - prevPos.investedCapital).toFixed(2));
        const achievedProfitPct = prevPos.entryPrice > 0
          ? Number((((exitPrice - prevPos.entryPrice) / prevPos.entryPrice) * 100).toFixed(2))
          : profitGoalPct;

        // Track rotated tickers history so consecutive rotations cycle through #1 -> #2 -> #3 -> #4 without ping-ponging
        const prevHistory = rotatedTickersHistoryRef.current[mkt] || [];
        const updatedHistory = [...prevHistory.filter(t => t !== prevPos.ticker), prevPos.ticker].slice(-4);
        rotatedTickersHistoryRef.current[mkt] = updatedHistory;
        const rotatedSet = new Set(updatedHistory);

        // Fetch newest #1 Top Conviction stock for this market (passing comma-separated rotation history)
        const picksRes = await getTopAlgoPicks(mkt, true, updatedHistory.join(','));
        const marketPicks = mkt === 'INDIA'
          ? (picksRes?.indiaTopPicks || picksRes?.topPicks || [])
          : (picksRes?.usTopPicks || picksRes?.topPicks || []);

        const combinedCandidates = [
          ...marketPicks,
          ...(pod.lastCandidatePool || []),
          ...fallbackRotationPool
        ];

        const newestTop1 =
          combinedCandidates.find(p => p && p.ticker && !rotatedSet.has(p.ticker) && Number(p.price) > 0) ||
          combinedCandidates.find(p => p && p.ticker && p.ticker !== prevPos.ticker && Number(p.price) > 0) ||
          marketPicks[0];
        if (!newestTop1 || !(Number(newestTop1.price) > 0)) {
          return null;
        }

        const newEntryPrice = Number(newestTop1.price);
        const newTargetPrice = Number((newEntryPrice * (1 + profitGoalPct / 100)).toFixed(2));
        const newShares = Number((saleProceeds / newEntryPrice).toFixed(4));
        const newInvestedCapital = Number((newShares * newEntryPrice).toFixed(2));
        const nextCycleNumber = (pod.completedCycles || 0) + 1;
        const newTotalProfit = Number(((pod.totalRealizedProfit || 0) + realizedProfit).toFixed(2));

        // 🛡️ COMPLIANT 1-CLICK GTT MODE (Default on Profit Target Hit):
        // 1) Auto-Sell executes 100% automatically via pre-armed Broker GTT order!
        // 2) Agent stages the newest #1 Top Conviction stock with compounded capital for 1-Click User GTT Approval!
        if (isCompliantGttMode && options.triggerProfitHit) {
          const stagedNextOrder = {
            ticker: newestTop1.ticker,
            name: newestTop1.name || newestTop1.ticker,
            shares: newShares,
            entryPrice: newEntryPrice,
            targetPrice: newTargetPrice,
            profitTargetPct: profitGoalPct,
            investedCapital: newInvestedCapital,
            convictionScore: newestTop1.layers?.agentConvictionScore || Math.round(newestTop1.finalScore || 90),
            finalScore: newestTop1.finalScore || 90,
            sector: newestTop1.sector || 'High Conviction Equity',
            orderType: mkt === 'INDIA' ? 'NSE/BSE Delivery + GTT Target OCO' : 'NYSE/NASDAQ Market + OCO Take-Profit Bracket',
            previousSoldTicker: prevPos.ticker,
            previousRealizedProfit: realizedProfit,
            previousAchievedPct: achievedProfitPct,
            stagedReason: `GTT Profit Goal Hit on ${prevPos.ticker} (+${currSym}${realizedProfit.toFixed(2)}) — Compounded Fund Ready`,
            stagedAt: new Date().toISOString()
          };

          // Sync newly staged #1 stock and quantity to My Portfolio (holdingsMap) and remove sold stock
          syncTopPickToHoldingsMap(mkt, stagedNextOrder, prevPos.ticker);

          setTopPickAgentSync(prev => ({
            ...prev,
            [mkt]: {
              ...prev[mkt],
              allocatedCapital: saleProceeds,
              totalRealizedProfit: newTotalProfit,
              completedCycles: nextCycleNumber,
              activePosition: null,
              stagedOrder: stagedNextOrder,
              lastCandidatePool: marketPicks.length > 0 ? marketPicks.slice(0, 3) : (prev[mkt]?.lastCandidatePool || []),
              statusMessage: `🎯 GTT Auto-Sold ${prevPos.ticker} (+${achievedProfitPct.toFixed(2)}%)! Staged #1 ${stagedNextOrder.ticker} — Awaiting 1-Click GTT Approval`,
              lastUpdatedAt: new Date().toISOString()
            }
          }));

          const gttHarvestRecord = {
            id: `top1-gtt-harvest-${Date.now()}-${mkt}`,
            timestamp: new Date().toISOString(),
            market: mkt,
            cycleNumber: nextCycleNumber,
            actionType: 'GTT_AUTO_SOLD_STAGED_NEXT',
            soldTicker: prevPos.ticker,
            soldName: prevPos.name,
            soldShares: prevPos.shares,
            entryPrice: prevPos.entryPrice,
            exitPrice,
            targetProfitPct: profitGoalPct,
            achievedProfitPct,
            realizedProfit,
            compoundedFundAfterSale: saleProceeds,
            boughtTicker: stagedNextOrder.ticker,
            boughtName: stagedNextOrder.name,
            boughtShares: stagedNextOrder.shares,
            buyPrice: stagedNextOrder.entryPrice,
            nextTargetPrice: stagedNextOrder.targetPrice,
            deployedCapital: stagedNextOrder.investedCapital,
            convictionScore: stagedNextOrder.convictionScore
          };

          setTopPickCycleHistory(prev => [gttHarvestRecord, ...prev.slice(0, 39)]);

          setAutonomousExecutionToast({
            id: Date.now(),
            title: `🎯 [${mkt}] GTT Auto-Sold ${prevPos.ticker} (+${achievedProfitPct.toFixed(2)}%) — Approve Next #1 (${stagedNextOrder.ticker})`,
            message: `Broker GTT (${prevPos.gttOrderId || 'ARMED'}) auto-sold ${prevPos.ticker} @ ${currSym}${exitPrice.toFixed(2)} locking +${currSym}${realizedProfit.toFixed(2)} profit! Agent staged newest #1 ${stagedNextOrder.ticker} (${currSym}${newInvestedCapital.toLocaleString()}) — click 1-Click Approve to arm next GTT.`,
            timestamp: new Date().toLocaleTimeString()
          });

          setTimeout(() => {
            setAutonomousExecutionToast(null);
          }, 8500);

          return gttHarvestRecord;
        }

        const gttPrefix = mkt === 'INDIA' ? 'GTT-NSE' : 'OCO-NYSE';
        const gttOrderId = `${gttPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;

        const nextActivePosition = {
          ticker: newestTop1.ticker,
          name: newestTop1.name || newestTop1.ticker,
          shares: newShares,
          entryPrice: newEntryPrice,
          currentPrice: newEntryPrice,
          targetPrice: newTargetPrice,
          profitTargetPct: profitGoalPct,
          investedCapital: newInvestedCapital,
          currentValue: newInvestedCapital,
          unrealizedPnl: 0,
          unrealizedPnlPct: 0,
          convictionScore: newestTop1.layers?.agentConvictionScore || Math.round(newestTop1.finalScore || 88),
          finalScore: newestTop1.finalScore || 88,
          rankBadge: '#1 Top Conviction',
          sector: newestTop1.sector || 'High Conviction Equity',
          gttOrderId,
          gttStatus: 'ARMED_AT_BROKER',
          boughtAt: new Date().toISOString(),
          cycleNumber: nextCycleNumber + 1
        };

        // Update holdingsMap[mkt] so bucket 'top1_agent' reflects the newly bought #1 Top Conviction stock and removes sold stock
        syncTopPickToHoldingsMap(mkt, nextActivePosition, prevPos.ticker);

        const statusText = options.forceRotate
          ? `Rotated #1: Sold ${prevPos.ticker} → Bought Newest #1 ${nextActivePosition.ticker} (GTT ${gttOrderId} @ +${profitGoalPct}%)`
          : `Cycle #${nextCycleNumber} Sold ${prevPos.ticker} (+${achievedProfitPct.toFixed(2)}%) → Auto-Bought #1 ${nextActivePosition.ticker}`;

        setTopPickAgentSync(prev => ({
          ...prev,
          [mkt]: {
            ...prev[mkt],
            allocatedCapital: newInvestedCapital,
            totalRealizedProfit: newTotalProfit,
            completedCycles: nextCycleNumber,
            activePosition: nextActivePosition,
            stagedOrder: null,
            lastCandidatePool: marketPicks.length > 0 ? marketPicks.slice(0, 3) : (prev[mkt]?.lastCandidatePool || []),
            statusMessage: statusText,
            lastUpdatedAt: new Date().toISOString()
          }
        }));

        const cycleRecord = {
          id: `top1-cycle-${Date.now()}-${mkt}`,
          timestamp: new Date().toISOString(),
          market: mkt,
          cycleNumber: nextCycleNumber,
          actionType: options.forceRotate ? 'MANUAL_ROTATE_TOP1' : 'PROFIT_HIT_AUTO_ROTATE',
          soldTicker: prevPos.ticker,
          soldName: prevPos.name,
          soldShares: prevPos.shares,
          entryPrice: prevPos.entryPrice,
          exitPrice,
          targetProfitPct: profitGoalPct,
          achievedProfitPct,
          realizedProfit,
          compoundedFundAfterSale: saleProceeds,
          boughtTicker: nextActivePosition.ticker,
          boughtName: nextActivePosition.name,
          boughtShares: nextActivePosition.shares,
          buyPrice: nextActivePosition.entryPrice,
          nextTargetPrice: nextActivePosition.targetPrice,
          deployedCapital: nextActivePosition.investedCapital,
          convictionScore: nextActivePosition.convictionScore
        };

        setTopPickCycleHistory(prev => [cycleRecord, ...prev.slice(0, 39)]);

        setAutonomousExecutionToast({
          id: Date.now(),
          title: options.forceRotate
            ? `🔄 [${mkt}] #1 Top Conviction Rotated: ${prevPos.ticker} → ${nextActivePosition.ticker}`
            : `🎯 [${mkt}] #1 Conviction Profit Goal Hit (+${achievedProfitPct.toFixed(2)}%) — Auto-Rotated!`,
          message: options.forceRotate
            ? `Agent exited ${prevPos.ticker} @ ${currSym}${exitPrice.toFixed(2)} and re-assigned ${currSym}${newInvestedCapital.toLocaleString()} into newest #1 Top Conviction stock ${nextActivePosition.ticker} @ ${currSym}${newEntryPrice.toFixed(2)} (Auto-Sale Armed at ${currSym}${newTargetPrice.toFixed(2)}).`
            : `Agent auto-sold ${prevPos.ticker} @ ${currSym}${exitPrice.toFixed(2)} (Profit: +${currSym}${realizedProfit.toFixed(2)}) and immediately re-deployed ${currSym}${newInvestedCapital.toLocaleString()} into newest #1 Top Conviction stock ${nextActivePosition.ticker} @ ${currSym}${newEntryPrice.toFixed(2)} (Next Goal: ${currSym}${newTargetPrice.toFixed(2)}).`,
          timestamp: new Date().toLocaleTimeString()
        });

        setTimeout(() => {
          setAutonomousExecutionToast(null);
        }, 8500);

        return cycleRecord;
      }

      // Case B: No active position yet — Auto-Buy #1 Top Conviction stock for this market
      if (!pod.activePosition) {
        const picksRes = await getTopAlgoPicks(mkt, false);
        const marketPicks = mkt === 'INDIA'
          ? (picksRes?.indiaTopPicks || picksRes?.topPicks || [])
          : (picksRes?.usTopPicks || picksRes?.topPicks || []);

        const top1 = marketPicks[0];
        if (!top1 || !(Number(top1.price) > 0)) return null;

        const mktNetWorth = computeMarketNetWorth(mkt);
        const desiredFund = pod.allocatedCapital && pod.allocatedCapital > 0
          ? Number(pod.allocatedCapital)
          : Number((mktNetWorth * (fundPct / 100)).toFixed(2));

        const availableCash = Number(balancesRef.current?.[mkt] || 0);
        const deployableCapital = availableCash > 0
          ? Math.min(desiredFund, availableCash)
          : desiredFund;

        if (deployableCapital <= 0) return null;

        const entryPrice = Number(top1.price);
        const shares = Number((deployableCapital / entryPrice).toFixed(4));
        const investedCapital = Number((shares * entryPrice).toFixed(2));
        const targetPrice = Number((entryPrice * (1 + profitGoalPct / 100)).toFixed(2));

        const initialPosition = {
          ticker: top1.ticker,
          name: top1.name || top1.ticker,
          shares,
          entryPrice,
          currentPrice: entryPrice,
          targetPrice,
          profitTargetPct: profitGoalPct,
          investedCapital,
          currentValue: investedCapital,
          unrealizedPnl: 0,
          unrealizedPnlPct: 0,
          convictionScore: top1.layers?.agentConvictionScore || Math.round(top1.finalScore || 89),
          finalScore: top1.finalScore || 89,
          rankBadge: '#1 Top Conviction',
          sector: top1.sector || 'High Conviction Equity',
          boughtAt: new Date().toISOString(),
          cycleNumber: (pod.completedCycles || 0) + 1
        };

        // Deduct exclusive fund from liquid cash balance when opening the initial #1 pod position
        if (availableCash >= investedCapital) {
          setBalances(prev => ({
            ...prev,
            [mkt]: Number(Math.max(0, (prev[mkt] || 0) - investedCapital).toFixed(2))
          }));
        }

        syncTopPickToHoldingsMap(mkt, initialPosition);

        setTopPickAgentSync(prev => ({
          ...prev,
          [mkt]: {
            ...prev[mkt],
            allocatedCapital: investedCapital,
            initialBaselineCapital: prev[mkt]?.initialBaselineCapital || investedCapital,
            activePosition: initialPosition,
            lastCandidatePool: marketPicks.slice(0, 3),
            statusMessage: `Holding #1 ${initialPosition.ticker} — Auto-Sell Armed at +${profitGoalPct}% (${currSym}${targetPrice.toFixed(2)})`,
            lastUpdatedAt: new Date().toISOString()
          }
        }));

        const buyRecord = {
          id: `top1-init-${Date.now()}-${mkt}`,
          timestamp: new Date().toISOString(),
          market: mkt,
          cycleNumber: (pod.completedCycles || 0) + 1,
          actionType: 'INITIAL_AUTO_BUY',
          soldTicker: null,
          boughtTicker: initialPosition.ticker,
          boughtName: initialPosition.name,
          boughtShares: initialPosition.shares,
          buyPrice: initialPosition.entryPrice,
          nextTargetPrice: initialPosition.targetPrice,
          targetProfitPct: profitGoalPct,
          deployedCapital: initialPosition.investedCapital,
          convictionScore: initialPosition.convictionScore
        };

        setTopPickCycleHistory(prev => [buyRecord, ...prev.slice(0, 39)]);
        return buyRecord;
      }
    } catch (err) {
      console.error(`Error in #1 Top Conviction autonomous engine (${mkt}):`, err);
    } finally {
      isExecutingTopPickRef.current[mkt] = false;
    }
    return null;
  };

  // Update Exclusive #1 Top Conviction Agent settings (fundPct, profitTargetPct, enabled) per market (US or INDIA)
  const updateTopPickAgentConfig = (targetMarket, updates = {}) => {
    const mkt = targetMarket === 'INDIA' ? 'INDIA' : 'US';
    const currSym = mkt === 'US' ? '$' : '₹';

    setTopPickAgent(prev => {
      const currentPod = prev[mkt] || defaultTopPickPod();
      const nextFundPct = updates.fundPct !== undefined
        ? Math.max(1, Math.min(80, Number(updates.fundPct) || 10))
        : currentPod.fundPct;
      const nextProfitPct = updates.profitTargetPct !== undefined
        ? Math.max(0.1, Math.min(200, Number(updates.profitTargetPct) || 1))
        : currentPod.profitTargetPct;
      const nextEnabled = updates.enabled !== undefined ? Boolean(updates.enabled) : currentPod.enabled;

      let updatedActivePos = currentPod.activePosition ? { ...currentPod.activePosition } : null;
      let nextAllocatedCapital = currentPod.allocatedCapital;
      let nextBaselineCapital = currentPod.initialBaselineCapital;

      // If fundPct was modified by user, dynamically resize exclusive capital & shares
      if (updates.fundPct !== undefined) {
        const mktNetWorth = computeMarketNetWorth(mkt);
        const newTargetCap = Number((mktNetWorth * (nextFundPct / 100)).toFixed(2));
        const oldInvested = updatedActivePos?.investedCapital || 0;
        const cashDelta = Number((oldInvested - newTargetCap).toFixed(2));

        nextAllocatedCapital = newTargetCap;
        nextBaselineCapital = newTargetCap;

        if (updatedActivePos && updatedActivePos.currentPrice > 0) {
          const resizedShares = Number((newTargetCap / updatedActivePos.currentPrice).toFixed(4));
          updatedActivePos.shares = resizedShares;
          updatedActivePos.investedCapital = Number((resizedShares * updatedActivePos.entryPrice).toFixed(2));
          updatedActivePos.currentValue = Number((resizedShares * updatedActivePos.currentPrice).toFixed(2));
          updatedActivePos.unrealizedPnl = Number((updatedActivePos.currentValue - updatedActivePos.investedCapital).toFixed(2));

          setBalances(bPrev => ({
            ...bPrev,
            [mkt]: Number(Math.max(0, (bPrev[mkt] || 0) + cashDelta).toFixed(2))
          }));

          setHoldingsMap(hPrev => ({
            ...hPrev,
            [mkt]: (hPrev[mkt] || []).map(h =>
              h.bucket === 'top1_agent'
                ? { ...h, shares: resizedShares, totalValue: updatedActivePos.currentValue }
                : h
            )
          }));
        }
      }

      // If profitTargetPct was modified by user, immediately recalculate targetPrice on active #1 stock
      if (updatedActivePos && updates.profitTargetPct !== undefined) {
        updatedActivePos.profitTargetPct = nextProfitPct;
        updatedActivePos.targetPrice = Number((updatedActivePos.entryPrice * (1 + nextProfitPct / 100)).toFixed(2));
      }

      const statusMsg = !nextEnabled
        ? 'Autonomous #1 Loop Paused by User'
        : updatedActivePos
          ? `Holding #1 ${updatedActivePos.ticker} — Auto-Sell Armed at +${nextProfitPct}% (${currSym}${updatedActivePos.targetPrice.toFixed(2)})`
          : 'Armed — Scanning #1 Top Conviction Leader';

      return {
        ...prev,
        [mkt]: {
          ...currentPod,
          enabled: nextEnabled,
          fundPct: nextFundPct,
          profitTargetPct: nextProfitPct,
          allocatedCapital: nextAllocatedCapital,
          initialBaselineCapital: nextBaselineCapital,
          activePosition: updatedActivePos,
          statusMessage: statusMsg,
          lastUpdatedAt: new Date().toISOString()
        }
      };
    });
  };

  // 1-Click Live Simulation: Hit Profit Goal -> Auto-Sell #1 Stock via GTT -> Stage (or Auto-Buy) Newest #1 Top Conviction Stock
  const simulateTopPickProfitCycle = async (targetMarket = market) => {
    const mkt = targetMarket === 'INDIA' ? 'INDIA' : 'US';
    // If a staged order is awaiting approval, approve it first so we can simulate its GTT profit hit
    if (!topPickAgentRef.current?.[mkt]?.activePosition && topPickAgentRef.current?.[mkt]?.stagedOrder) {
      approveStagedTopPickOrder(mkt);
    } else if (!topPickAgentRef.current?.[mkt]?.activePosition) {
      await executeTopPickCycleStep(mkt, { forceManual: true });
    }
    return await executeTopPickCycleStep(mkt, { triggerProfitHit: true, forceManual: true });
  };

  // Force immediate rotation to newest #1 Top Conviction stock (works on both Active Position and Staged Order)
  const forceRotateTopPickNow = async (targetMarket = market) => {
    const mkt = targetMarket === 'INDIA' ? 'INDIA' : 'US';
    if (!topPickAgentRef.current?.[mkt]?.activePosition && !topPickAgentRef.current?.[mkt]?.stagedOrder) {
      return await executeTopPickCycleStep(mkt, { forceManual: true });
    }
    return await executeTopPickCycleStep(mkt, { forceRotate: true, forceManual: true });
  };

  // AUTONOMOUS #1 TOP CONVICTION DAEMON: Manages US & INDIA separately
  useEffect(() => {
    if (!agentModeEnabled) return;

    const ensureBothMarketsArmed = async () => {
      if (
        topPickAgentRef.current?.US?.enabled &&
        !topPickAgentRef.current?.US?.activePosition &&
        !topPickAgentRef.current?.US?.stagedOrder
      ) {
        await executeTopPickCycleStep('US');
      }
      if (
        topPickAgentRef.current?.INDIA?.enabled &&
        !topPickAgentRef.current?.INDIA?.activePosition &&
        !topPickAgentRef.current?.INDIA?.stagedOrder
      ) {
        await executeTopPickCycleStep('INDIA');
      }
    };

    ensureBothMarketsArmed();
    const interval = setInterval(ensureBothMarketsArmed, 15000);
    return () => clearInterval(interval);
  }, [
    agentModeEnabled,
    topPickAgent.US.enabled,
    topPickAgent.INDIA.enabled,
    Boolean(topPickAgent.US.activePosition),
    Boolean(topPickAgent.INDIA.activePosition),
    Boolean(topPickAgent.US.stagedOrder),
    Boolean(topPickAgent.INDIA.stagedOrder)
  ]);

  // LIVE PRICE & PROFIT-GOAL AUTO-SALE + RE-INVESTMENT MONITOR FOR US & INDIA #1 TOP CONVICTION PODS
  useEffect(() => {
    if (!agentModeEnabled) return;

    const monitorTopPickPods = async () => {
      const usPos = topPickAgentRef.current?.US?.activePosition;
      const inPos = topPickAgentRef.current?.INDIA?.activePosition;
      const symbolsToPoll = [
        usPos?.ticker,
        inPos?.ticker
      ].filter(Boolean);

      if (symbolsToPoll.length === 0) return;

      const quotes = await getQuotes(symbolsToPoll.join(','));
      if (!quotes || Object.keys(quotes).length === 0) return;

      for (const mkt of ['US', 'INDIA']) {
        const pod = topPickAgentRef.current?.[mkt];
        const pos = pod?.activePosition;
        if (!pod?.enabled || !pos) continue;

        const live = quotes[pos.ticker];
        if (!live || !(Number(live.price) > 0)) continue;

        const livePrice = Number(live.price);
        const currentVal = Number((pos.shares * livePrice).toFixed(2));
        const pnl = Number((currentVal - pos.investedCapital).toFixed(2));
        const pnlPct = pos.entryPrice > 0 ? Number((((livePrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2)) : 0;

        // Check if profit goal limit is hit!
        if (livePrice >= Number(pos.targetPrice) || pnlPct >= Number(pod.profitTargetPct)) {
          await executeTopPickCycleStep(mkt, { triggerProfitHit: true });
        } else if (livePrice !== pos.currentPrice) {
          setTopPickAgent(prev => {
            const cur = prev[mkt];
            if (!cur?.activePosition || cur.activePosition.ticker !== pos.ticker) return prev;
            return {
              ...prev,
              [mkt]: {
                ...cur,
                activePosition: {
                  ...cur.activePosition,
                  currentPrice: livePrice,
                  currentValue: currentVal,
                  unrealizedPnl: pnl,
                  unrealizedPnlPct: pnlPct
                }
              }
            };
          });
        }
      }
    };

    const timer = setInterval(monitorTopPickPods, 4000);
    return () => clearInterval(timer);
  }, [agentModeEnabled]);

  // AUTONOMOUS AGENT EXECUTION DAEMON: Runs hands-free in the background
  useEffect(() => {
    if (!agentModeEnabled) return;

    const checkAndExecuteAutonomousRebalance = async () => {
      // Cooldown guard: Prevent duplicate orders within 60 seconds during testing / sessions
      const now = Date.now();
      if (now - lastAutoRebalanceRef.current < 60000) return;
      if (isExecutingAutonomousRef.current) return;

      try {
        isExecutingAutonomousRef.current = true;
        // Fetch optimal 4-layer allocation recommendation from backend
        const rec = await getMacroAllocationRecommendation({
          scenarioId: 'iran_war_ai',
          market: market
        });

        if (rec && rec.allocations && rec.allocations.length > 0) {
          // If vault is currently empty OR different from the recommended assets, execute auto-shuffle
          const hasVaultAssets = vaultHoldings.length > 0;
          
          if (!hasVaultAssets) {
            console.log("⚡ [Agent Mode Daemon] Autonomous trigger fired: No active vault assets. Executing hands-free rebalance...");
            
            const result = rebalancePortfolio({
              allocations: rec.allocations,
              scenarioName: `${rec.title} [Autonomous Agent Mode]`,
              divertPct: vaultDivertPct,
              scope: 'vault'
            });

            if (result && result.success) {
              lastAutoRebalanceRef.current = Date.now();
              const orderCount = result.auditRecord?.orders?.length || 4;
              const deployedCap = result.auditRecord?.deployedCapital || 0;
              
              setAutonomousExecutionToast({
                id: Date.now(),
                title: "⚡ Autonomous Trade Executed (Zero Intervention)",
                message: `Agent autonomously deployed ${market === 'US' ? '$' : '₹'}${deployedCap.toLocaleString()} across ${orderCount} tactical assets into Vault (${vaultDivertPct}%). Core holdings protected.`,
                timestamp: new Date().toLocaleTimeString()
              });

              // Auto-dismiss toast after 7 seconds
              setTimeout(() => {
                setAutonomousExecutionToast(null);
              }, 7000);
            }
          }
        }
      } catch (err) {
        console.error("Error in autonomous execution daemon:", err);
      } finally {
        isExecutingAutonomousRef.current = false;
      }
    };

    // Run check immediately upon enabling Agent Mode, then every 30 seconds
    checkAndExecuteAutonomousRebalance();
    const interval = setInterval(checkAndExecuteAutonomousRebalance, 30000);
    return () => clearInterval(interval);
  }, [agentModeEnabled, market, vaultDivertPct, vaultHoldings.length]);

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

  // AUTO-EXIT (TAKE-PROFIT / TARGET PRICE) LIVE EXECUTION ENGINE
  useEffect(() => {
    const currentMarketHoldings = holdingsMap[market] || [];
    const triggeredHoldings = currentMarketHoldings.filter(
      h => h.autoExit && h.autoExit.enabled && Number(h.autoExit.targetPrice) > 0 && Number(h.currentPrice) >= Number(h.autoExit.targetPrice)
    );

    if (triggeredHoldings.length === 0) return;

    const currSym = market === 'US' ? '$' : '₹';
    let totalProceeds = 0;
    const newExitRecords = [];

    triggeredHoldings.forEach(h => {
      const exitPrice = Number(h.currentPrice || h.autoExit.targetPrice);
      const proceeds = Number((h.shares * exitPrice).toFixed(2));
      const costBasis = Number((h.shares * h.avgPrice).toFixed(2));
      const profit = Number((proceeds - costBasis).toFixed(2));
      const profitPct = h.avgPrice > 0 ? Number((((exitPrice - h.avgPrice) / h.avgPrice) * 100).toFixed(2)) : 0;

      totalProceeds += proceeds;
      newExitRecords.push({
        id: 'exit-' + Date.now() + '-' + h.ticker,
        timestamp: new Date().toISOString(),
        market,
        ticker: h.ticker,
        name: h.name || h.ticker,
        shares: h.shares,
        avgPrice: h.avgPrice,
        targetPrice: h.autoExit.targetPrice,
        exitPrice,
        proceeds,
        profit,
        profitPct,
        mode: h.autoExit.mode,
        bucket: h.bucket || 'core'
      });
    });

    const triggeredSet = new Set(triggeredHoldings.map(h => `${h.ticker}__${h.bucket || 'core'}`));

    setBalances(prev => ({
      ...prev,
      [market]: Number(((prev[market] || 0) + totalProceeds).toFixed(2))
    }));

    setHoldingsMap(prev => ({
      ...prev,
      [market]: (prev[market] || []).filter(h => !triggeredSet.has(`${h.ticker}__${h.bucket || 'core'}`))
    }));

    setAutoExitHistory(prev => [...newExitRecords, ...prev.slice(0, 29)]);

    const first = newExitRecords[0];
    if (first) {
      const summaryMsg = newExitRecords.length === 1
        ? `Auto-sold ${first.shares} shares of ${first.ticker} @ ${currSym}${first.exitPrice.toFixed(2)} (Target: ${currSym}${first.targetPrice.toFixed(2)}). Realized ${first.profit >= 0 ? '+' : ''}${currSym}${first.profit.toFixed(2)} (${first.profitPct >= 0 ? '+' : ''}${first.profitPct.toFixed(2)}%)!`
        : `Auto-sold ${newExitRecords.length} positions (${newExitRecords.map(r => r.ticker).join(', ')}) for ${currSym}${totalProceeds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total proceeds!`;

      setAutonomousExecutionToast({
        id: Date.now(),
        title: `🎯 Auto-Exit Target Reached — Sold ${first.ticker}`,
        message: summaryMsg,
        timestamp: new Date().toLocaleTimeString()
      });

      setTimeout(() => {
        setAutonomousExecutionToast(null);
      }, 8000);
    }
  }, [holdingsMap, market]);

  // Generic buy asset handler supporting commodities, metals, and stocks
  const buyAsset = (params) => {
    let ticker, name, price, units, category, assetType, bucket, autoExitInput;
    
    if (typeof params === 'object') {
      ticker = params.ticker;
      name = params.name || params.ticker;
      price = Number(params.price);
      units = Number(params.units || params.shares || 1);
      category = params.category || 'Equity';
      assetType = params.assetType || 'stock';
      bucket = params.bucket || 'core'; // 'core' or 'agent_vault'
      autoExitInput = params.autoExit || null;
    } else {
      ticker = arguments[0];
      name = arguments[1] || arguments[0];
      price = Number(arguments[2]);
      units = Number(arguments[3] || 1);
      category = arguments[4] || 'Equity';
      assetType = arguments[5] || 'stock';
      bucket = 'core';
      autoExitInput = null;
    }

    if (!ticker || isNaN(price) || price <= 0 || isNaN(units) || units <= 0) {
      showTradeAlert({
        title: 'Invalid Order Parameters',
        message: 'Please ensure valid quantity and non-zero price before submitting the order.'
      });
      return false;
    }

    const targetMarket = (typeof params === 'object' && params.market)
      ? params.market
      : (isIndianTicker(ticker) ? 'INDIA' : market);
    const targetCurrency = targetMarket === 'INDIA' ? '₹' : '$';
    const currentBalance = balances[targetMarket] ?? balance;

    const totalCost = Number((price * units).toFixed(2));
    if (currentBalance < totalCost) {
      showTradeAlert({
        title: 'Insufficient Cash Balance',
        message: `Order requires ${targetCurrency}${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, but your ${targetMarket === 'INDIA' ? 'Indian (₹)' : 'US ($)'} wallet balance is ${targetCurrency}${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Please adjust order size or deposit funds.`
      });
      return false;
    }

    const balanceAfter = Number((currentBalance - totalCost).toFixed(2));
    setBalances(prev => ({
      ...prev,
      [targetMarket]: balanceAfter
    }));
    
    setHoldingsMap(prev => {
      const currentHoldings = prev[targetMarket] || [];
      const existing = currentHoldings.find(h => h.ticker === ticker && (h.bucket || 'core') === bucket);
      let newHoldings;
      
      if (existing) {
        const updatedShares = Number((existing.shares + units).toFixed(4));
        const updatedAvgPrice = Number((((existing.avgPrice * existing.shares) + totalCost) / updatedShares).toFixed(2));
        const resolvedAutoExit = autoExitInput
          ? buildAutoExitRule(autoExitInput, updatedAvgPrice)
          : (existing.autoExit?.enabled ? buildAutoExitRule(existing.autoExit, updatedAvgPrice) : null);

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
                bucket,
                autoExit: resolvedAutoExit
              } 
            : h
        );
      } else {
        const resolvedAutoExit = autoExitInput ? buildAutoExitRule(autoExitInput, price) : null;
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
            bucket,
            autoExit: resolvedAutoExit
          }
        ];
      }
      return { ...prev, [targetMarket]: newHoldings };
    });

    setTradeResultModal({
      isOpen: true,
      type: 'success',
      action: 'BUY',
      ticker,
      name: name || ticker,
      units,
      price,
      total: totalCost,
      currency: targetCurrency,
      autoExit: resolvedAutoExit,
      market: targetMarket,
      balanceAfter
    });

    return true;
  };

  // Backwards compatibility alias for stocks
  const buyStock = (ticker, name, price, shares = 1) => {
    return buyAsset({
      ticker,
      name,
      price,
      units: shares,
      category: 'Equity',
      assetType: 'stock',
      bucket: 'core'
    });
  };

  // Sell an asset (stock or commodity)
  const sellAsset = (ticker, unitsToSell, targetBucket = null) => {
    const currentMarket = market;
    const currentHoldings = holdingsMap[currentMarket] || [];
    const holding = currentHoldings.find(h => h.ticker === ticker && (!targetBucket || (h.bucket || 'core') === targetBucket));
    if (!holding) {
      showTradeAlert({
        title: 'Position Not Found',
        message: 'The selected asset could not be located in your current portfolio holdings.'
      });
      return false;
    }

    const currentPrice = holding.currentPrice || holding.avgPrice;
    const sellCount = (!unitsToSell || unitsToSell >= holding.shares) ? holding.shares : Number(unitsToSell);
    const proceeds = Number((sellCount * currentPrice).toFixed(2));
    const targetCurrency = currentMarket === 'INDIA' ? '₹' : '$';
    const oldBalance = balances[currentMarket] ?? balance;
    const newBalance = Number((oldBalance + proceeds).toFixed(2));

    setBalances(prev => ({
      ...prev,
      [currentMarket]: newBalance
    }));

    setHoldingsMap(prev => {
      const holdingsForMkt = prev[currentMarket] || [];
      let newHoldings;
      if (sellCount >= holding.shares) {
        newHoldings = holdingsForMkt.filter(h => !(h.ticker === ticker && h.bucket === holding.bucket));
      } else {
        const remainingShares = Number((holding.shares - sellCount).toFixed(4));
        newHoldings = holdingsForMkt.map(h => 
          (h.ticker === ticker && h.bucket === holding.bucket)
            ? { ...h, shares: remainingShares, totalValue: Number((remainingShares * currentPrice).toFixed(2)) }
            : h
        );
      }
      return { ...prev, [currentMarket]: newHoldings };
    });

    setSellModalState({ isOpen: false, asset: null });
    setTradeResultModal({
      isOpen: true,
      type: 'success',
      action: 'SELL',
      ticker,
      name: holding.name || ticker,
      units: sellCount,
      price: currentPrice,
      total: proceeds,
      currency: targetCurrency,
      market: currentMarket,
      balanceAfter: newBalance
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
      showTradeAlert({ title: 'Invalid Allocation', message: 'Invalid allocation plan provided.' });
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
      showTradeAlert({ title: 'Zero Portfolio Value', message: 'Portfolio value is zero. Please deposit funds first.' });
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
        showTradeAlert({ title: 'Insufficient Liquid Cash', message: 'Insufficient liquid cash to fund the Tactical Vault without liquidating core holdings.' });
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

      // Keep ALL core holdings and #1 Top Conviction exclusive pod holdings 100% untouched, replace only vault holdings!
      const top1Tickers = new Set(top1Holdings.map(h => h.ticker));
      const mergedHoldings = [
        ...top1Holdings,
        ...coreHoldings.filter(h => !top1Tickers.has(h.ticker)),
        ...newVaultHoldings.filter(h => !top1Tickers.has(h.ticker))
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
        previousCash: balance,
        remainingCash: newCashBalance,
        cashChange: Number((newCashBalance - balance).toFixed(2)),
        previousVaultValue: currentVaultValue,
        newVaultValue: deployedVaultTotal,
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

      const top1TickersFull = new Set(top1Holdings.map(h => h.ticker));
      setHoldingsMap(prev => ({
        ...prev,
        [market]: [
          ...top1Holdings,
          ...newHoldings.filter(h => !top1TickersFull.has(h.ticker))
        ]
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
        previousCash: balance,
        remainingCash,
        cashChange: Number((remainingCash - balance).toFixed(2)),
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
      top1Holdings,
      coreValue,
      vaultValue,
      top1Value,
      coreInvested,
      vaultInvested,
      top1Invested,
      totalInvested,
      corePnl,
      vaultPnl,
      totalPnl,
      corePnlPct,
      vaultPnlPct,
      totalPnlPct,
      totalPortfolioValue,
      vaultAutoPilot,
      setVaultAutoPilot,
      vaultDivertPct,
      setVaultDivertPct,
      agentModeEnabled,
      setAgentModeEnabled,
      agentSettings,
      setAgentSettings,
      topPickAgent,
      topPickCycleHistory,
      topPickComplianceMode,
      setTopPickComplianceMode,
      approveStagedTopPickOrder,
      updateTopPickAgentConfig,
      simulateTopPickProfitCycle,
      forceRotateTopPickNow,
      autonomousExecutionToast,
      setAutonomousExecutionToast,
      buyStock, 
      buyAsset, 
      sellAsset, 
      setAutoExitRule,
      autoExitHistory,
      rebalancePortfolio,
      rebalanceHistory,
      lastCloudSyncAt,
      openSellModal,
      closeSellModal,
      tradeResultModal,
      closeTradeResultModal,
      showTradeAlert
    }}>
      {children}
      <TradeResultModal
        modalState={tradeResultModal}
        onClose={closeTradeResultModal}
      />
      <SellPositionModal
        modalState={sellModalState}
        onClose={closeSellModal}
        onConfirmSell={(ticker, units, bucket) => sellAsset(ticker, units, bucket)}
      />
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
