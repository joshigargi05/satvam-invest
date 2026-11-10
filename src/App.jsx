import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom'
import * as Md from 'react-icons/md'
import * as Io5 from 'react-icons/io5'

const MdDashboard = Md.MdDashboard || (() => '📊');
const MdAutoGraph = Md.MdAutoGraph || (() => '📈');
const MdSmartToy = Md.MdSmartToy || (() => '🤖');
const MdOutlineAccountCircle = Md.MdOutlineAccountCircle || (() => '👤');
const MdCode = Md.MdCode || (() => '💻');
const MdAnalytics = Md.MdAnalytics || (() => '📊');
const IoNotificationsOutline = Io5.IoNotificationsOutline || (() => '🔔');
const MdPublic = Md.MdPublic || (() => '🌐');
const MdLogout = Md.MdLogout || (() => '🚪');
const MdStars = Md.MdStars || Md.MdWorkspacePremium || (() => '⭐');

// Context
import { AuthProvider, useAuth } from './context/AuthContext'
import { MarketProvider, useMarket } from './context/MarketContext'
import { PortfolioProvider } from './context/PortfolioContext'

// Pages
import TopStocks from './pages/TopStocks'
import Dashboard from './pages/Dashboard'
import Copilot from './pages/Copilot'
import Markets from './pages/Markets'
import DeepQuantAgent from './pages/DeepQuantAgent'
import MacroAgent from './pages/MacroAgent'
import Profile from './pages/Profile'
import AuthPage, { PinLockScreen } from './pages/AuthPage'
import GaloraLogo from './components/GaloraLogo'
import { initGoogleAnalytics, trackPageView } from './services/analytics'

function AlgoRedirect() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  if (!searchParams.has('tab')) {
    searchParams.set('tab', 'quant');
  }
  return <Navigate to={`/deep-analysis?${searchParams.toString()}`} replace />;
}

import './index.css'

import { usePortfolio } from './context/PortfolioContext'

function TopHeader() {
  const { market, setMarket } = useMarket();
  const { agentModeEnabled, setAgentModeEnabled, vaultDivertPct, lastCloudSyncAt } = usePortfolio();
  const { user, lockSession, logout, platformInfo } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="top-header">
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="live-status-dot"></span>
          <span className="text-xs uppercase font-bold tracking-widest text-muted" style={{ letterSpacing: '0.1em' }}>
            Live Stream
          </span>
        </div>

        {/* Global Autonomous Agent Mode Toggle */}
        <button
          onClick={() => setAgentModeEnabled(!agentModeEnabled)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            agentModeEnabled 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20' 
              : 'bg-slate-800 text-slate-400 border border-white/10 hover:text-white'
          }`}
          title="Toggle Autonomous Execution & Rebalance Mode"
        >
          <span className={`w-2 h-2 rounded-full ${agentModeEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
          <span>Agent Mode: {agentModeEnabled ? `ON (${vaultDivertPct}% Vault)` : 'OFF (Manual)'}</span>
        </button>

        {/* Signed-In Investor, Lock & 1-Click Sign Out */}
        {user && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-bold"
              title={`Signed in on ${platformInfo?.label || 'Web'} • Click for Security & Mobile Settings`}
            >
              <span>🛡️ {user.name.split(' ')[0]}</span>
              {lastCloudSyncAt && <span className="text-emerald-400">• ☁️ Synced</span>}
            </button>
            <button
              type="button"
              onClick={lockSession}
              className="px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
              title="Lock App Screen (4-Digit PIN / Biometrics)"
            >
              🔒 Lock
            </button>
            <button
              type="button"
              onClick={logout}
              className="logout-header-btn hidden md:inline-flex"
              title="Sign Out of Galora AI"
            >
              <MdLogout />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="market-tabs-container">
        <button 
          onClick={() => setMarket('INDIA')} 
          className={`market-tab-btn ${market === 'INDIA' ? 'active-in' : ''}`}
        >
          <span className="currency-label">₹</span>
          <span className="name">IND Stocks</span>
        </button>
        <button 
          onClick={() => setMarket('US')} 
          className={`market-tab-btn ${market === 'US' ? 'active-us' : ''}`}
        >
          <span className="currency-label">$</span>
          <span className="name">US Stocks</span>
        </button>
      </div>
    </header>
  );
}

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const navItems = [
    { path: '/', label: 'Top 3 Stocks', mobileLabel: 'Top 3', icon: <MdStars /> },
    { path: '/portfolio', label: 'My Portfolio', mobileLabel: 'Portfolio', icon: <MdDashboard /> },
    { path: '/markets', label: 'Markets', mobileLabel: 'Markets', icon: <MdAutoGraph /> },
    { path: '/macro-agent', label: 'Global Agent', mobileLabel: 'Global', icon: <MdPublic /> },
    { path: '/deep-analysis', label: 'Quant Agent', mobileLabel: 'Quant', icon: <MdAnalytics /> },
    { path: '/copilot', label: 'AI Chat', mobileLabel: 'AI Chat', icon: <MdSmartToy /> },
    { path: '/profile', label: 'Profile', mobileLabel: 'Profile', icon: <MdOutlineAccountCircle /> },
  ];

  const isItemActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/top-stocks';
    if (path === '/portfolio') return location.pathname === '/portfolio';
    if (path === '/deep-analysis') return location.pathname === '/deep-analysis' || location.pathname === '/algo';
    return location.pathname === path;
  };

  const handleResetAppData = () => {
    if (window.confirm("This will reset your local portfolio holdings, balance, AI chat history, and service workers to clear any browser cache. Proceed?")) {
      localStorage.clear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let r of registrations) r.unregister();
        });
      }
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md-hidden flex justify-between items-center p-3.5 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <GaloraLogo size={30} />
          <div>
            <h1 className="text-gradient font-bold" style={{ fontSize: '1.05rem', margin: 0, lineHeight: 1.1 }}>Galora Wealth AI</h1>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>AI-Powered Wealth Generation</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={logout}
            className="logout-header-btn"
          >
            <MdLogout />
            <span>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={handleResetAppData}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/15 text-slate-300 bg-slate-800/80"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="mobile-nav glass-panel z-50">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            end={item.path === '/'}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={() => `nav-item ${isItemActive(item.path) ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            {item.icon}
            <span>{item.mobileLabel || item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop & Tablet Nav */}
      <nav className="desktop-nav glass-panel">
        <div className="brand-header flex flex-col items-start gap-1.5 mb-8" style={{ padding: '0 0.75rem' }}>
          <div className="flex items-center gap-2.5">
            <GaloraLogo size={36} />
            <h1 className="text-gradient" style={{ fontSize: '1.35rem', margin: 0 }}>Galora Wealth AI</h1>
          </div>
          <span className="brand-subtitle" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.03em', fontWeight: '500' }}>
            AI-Powered Wealth Generation
          </span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => (
             <NavLink 
             key={item.path} 
             to={item.path} 
             end={item.path === '/'}
             onClick={(e) => {
               e.preventDefault();
               navigate(item.path);
             }}
             className={() => `nav-item ${isItemActive(item.path) ? 'active' : ''}`}
             style={{ cursor: 'pointer' }}
           >
             {item.icon}
             <span>{item.label}</span>
           </NavLink>
          ))}
        </div>

        {/* Prominent Sidebar Sign Out Button */}
        <div
          className="nav-item"
          onClick={logout}
          style={{
            marginTop: 'auto',
            marginBottom: '0.5rem',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            cursor: 'pointer',
            background: 'rgba(239, 68, 68, 0.12)'
          }}
        >
          <MdLogout />
          <span>Sign Out</span>
        </div>

        {/* System Reset Button */}
        <div 
          className="nav-item" 
          onClick={handleResetAppData}
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            color: 'var(--text-muted)', 
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <span>Reset Data</span>
        </div>
      </nav>
    </>
  );
}

function AutonomousExecutionToast() {
  const { autonomousExecutionToast, setAutonomousExecutionToast } = usePortfolio();

  if (!autonomousExecutionToast) return null;

  return (
    <div className="autonomous-toast animate-fade-in shadow-2xl">
      <div className="p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/50 backdrop-blur-md shadow-emerald-500/10 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
          <span className="text-lg">⚡</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">{autonomousExecutionToast.title}</h4>
            <span className="text-[10px] text-slate-400 font-mono">{autonomousExecutionToast.timestamp}</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed mb-2 font-normal">
            {autonomousExecutionToast.message}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Zero-Intervention Order Filled
            </span>
            <button 
              onClick={() => setAutonomousExecutionToast(null)} 
              className="text-[11px] text-slate-400 hover:text-white underline ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulatorBanner() {
  return (
    <div 
      className="mb-3 md:mb-6 px-3.5 py-2.5 md:px-6 md:py-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-950/20 to-slate-900/70 border border-amber-500/35 text-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 md:gap-4 shadow-lg animate-fade-in"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <span 
            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs shrink-0 shadow-sm"
            style={{ letterSpacing: '0.06em' }}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Simulator Platform
          </span>
          <span 
            className="inline-flex lg:hidden items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full shrink-0"
          >
            Paper Trading Sandbox
          </span>
        </div>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-200 font-normal leading-relaxed m-0">
          Galora AI operates as a <strong className="text-amber-300 font-semibold">simulation &amp; paper-trading platform</strong>. Real-time market data and quantitative AI models are live; all balances, trades, and portfolio assets use <strong className="text-white font-semibold">virtual currency</strong>.
        </p>
      </div>
      <span 
        className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3.5 py-1.5 rounded-full shrink-0 shadow-sm"
        style={{ letterSpacing: '0.06em' }}
      >
        Paper Trading Sandbox
      </span>
    </div>
  );
}

const SEO_ROUTES = {
  '/': {
    title: 'Galora AI | AI-Powered Quantitative Stock Picks & Wealth Agent',
    description: 'Discover daily Top 3 AI-ranked stocks for Indian (NSE/BSE NIFTY 50) and US (NYSE/NASDAQ) markets with 6-Month and 12-Month algorithmic price targets.',
    canonical: 'https://galora.ai/'
  },
  '/top-stocks': {
    title: 'Top 3 AI Stock Picks Today | Galora AI Quantitative Engine',
    description: 'High-conviction Top 3 stock picks powered by Galora AI 5-module ensemble and 23-feature XGBoost machine learning engine across India and US markets.',
    canonical: 'https://galora.ai/top-stocks'
  },
  '/portfolio': {
    title: 'My Portfolio & Tactical Vault | Galora AI Wealth Agent',
    description: 'Track your Core Protected holdings, Autonomous Tactical Vault, and #1 Top Pick compounding cycles with real-time P&L and GTT auto-exit rules on Galora AI.',
    canonical: 'https://galora.ai/portfolio'
  },
  '/markets': {
    title: 'Live Global Markets, Stocks & Commodities | Galora AI',
    description: 'Real-time NIFTY 50, S&P 500, NASDAQ equities, Gold, Silver, and Crude Oil prices with instant AI conviction ratings on Galora AI.',
    canonical: 'https://galora.ai/markets'
  },
  '/macro-agent': {
    title: 'Global Macro Radar & Autonomous Portfolio Agent | Galora AI',
    description: 'Autonomous geopolitical & macro intelligence radar that rotates capital across top conviction equities, precious metals, and energy hedges.',
    canonical: 'https://galora.ai/macro-agent'
  },
  '/deep-analysis': {
    title: 'Quant Agent & XGBoost Deep Stock Analysis | Galora AI',
    description: 'Institutional 4-layer quantitative stock analysis combining Macro Regime, Derivatives OI/PCR, Technical Momentum, and Fundamental Earnings.',
    canonical: 'https://galora.ai/deep-analysis'
  },
  '/copilot': {
    title: 'Galora AI Copilot | Financial Research & Fundamental Charts',
    description: 'Ask Galora AI Copilot to analyze any US or Indian stock with live multi-year revenue, profit, cash flow charts, and institutional investment theses.',
    canonical: 'https://galora.ai/copilot'
  },
  '/profile': {
    title: 'Investor Security Enclave & Multi-Device Sync | Galora AI',
    description: 'Manage your Galora AI investor profile, biometric passkeys, 4-digit trading PIN, and Cloud SQL portfolio synchronization.',
    canonical: 'https://galora.ai/profile'
  }
};

function RouteSeoManager() {
  const location = useLocation();

  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  useEffect(() => {
    const meta = SEO_ROUTES[location.pathname] || SEO_ROUTES['/'];
    document.title = meta.title;

    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', meta.description);

    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute('content', meta.title);

    const twitterTitleEl = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleEl) twitterTitleEl.setAttribute('content', meta.title);

    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute('content', meta.description);

    const ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.setAttribute('content', meta.canonical);

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.setAttribute('href', meta.canonical);

    trackPageView(location.pathname, meta.title);
  }, [location.pathname]);

  return null;
}

function AppShell() {
  const { isAuthenticated, isLocked, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-[#030712]">
        <div className="mb-3 animate-pulse">
          <GaloraLogo size={48} />
        </div>
        <p className="text-xs text-slate-400 font-mono">Initializing Galora AI Security Enclave...</p>
      </div>
    );
  }

  const isBlurred = !isAuthenticated || isLocked;

  return (
    <div className="relative min-h-screen w-full bg-[#030712] overflow-x-hidden">
      <RouteSeoManager />
      {/* Background Home Page / Portfolio Dashboard (Deeply blurred when unauthenticated, smoothly sharp upon login) */}
      <div
        className={`app-container ${isBlurred ? 'app-container-blurred' : 'app-container-clear'}`}
      >
        <Navigation />
        <main className="main-content md:pt-6">
          <SimulatorBanner />
          <TopHeader />
          <AutonomousExecutionToast />
          <Routes>
            <Route path="/" element={<TopStocks />} />
            <Route path="/top-stocks" element={<TopStocks />} />
            <Route path="/portfolio" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/macro-agent" element={<MacroAgent />} />
            <Route path="/algo" element={<AlgoRedirect />} />
            <Route path="/deep-analysis" element={<DeepQuantAgent />} />
            <Route path="/copilot" element={<Copilot />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>

      {/* Auth Page Modal Overlay (Displays over the blurred background) */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
          <AuthPage />
        </div>
      )}

      {/* PIN Lock Screen Overlay */}
      {isAuthenticated && isLocked && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
          <PinLockScreen />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        <PortfolioProvider>
          <Router>
            <AppShell />
          </Router>
        </PortfolioProvider>
      </MarketProvider>
    </AuthProvider>
  )
}

export default App
