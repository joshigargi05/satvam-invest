import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import * as Md from 'react-icons/md'
import * as Io5 from 'react-icons/io5'

const MdDashboard = Md.MdDashboard || (() => '📊');
const MdAutoGraph = Md.MdAutoGraph || (() => '📈');
const MdSmartToy = Md.MdSmartToy || (() => '🤖');
const MdOutlineAccountCircle = Md.MdOutlineAccountCircle || (() => '👤');
const MdCode = Md.MdCode || (() => '💻');
const MdAnalytics = Md.MdAnalytics || (() => '📊');
const IoNotificationsOutline = Io5.IoNotificationsOutline || (() => '🔔');

// Context
import { MarketProvider, useMarket } from './context/MarketContext'
import { PortfolioProvider } from './context/PortfolioContext'

// Pages
import Dashboard from './pages/Dashboard'
import Copilot from './pages/Copilot'
import Markets from './pages/Markets'
import AlgoTrading from './pages/AlgoTrading'
import EarningsAgent from './pages/EarningsAgent'

import './index.css'

function TopHeader() {
  const { market, setMarket } = useMarket();
  
  return (
    <header className="top-header">
      <div className="flex items-center gap-2">
        <span className="live-status-dot"></span>
        <span className="text-xs uppercase font-bold tracking-widest text-muted" style={{ letterSpacing: '0.1em' }}>
          Platform Online
        </span>
      </div>
      
      <div className="market-tabs-container">
        <button 
          onClick={() => setMarket('US')} 
          className={`market-tab-btn ${market === 'US' ? 'active-us' : ''}`}
        >
          <span className="currency-label">$</span>
          <span className="name">US Stocks</span>
        </button>
        <button 
          onClick={() => setMarket('INDIA')} 
          className={`market-tab-btn ${market === 'INDIA' ? 'active-in' : ''}`}
        >
          <span className="currency-label">₹</span>
          <span className="name">IND Stocks</span>
        </button>
      </div>
    </header>
  );
}

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Portfolio', icon: <MdDashboard /> },
    { path: '/markets', label: 'Markets', icon: <MdAutoGraph /> },
    { path: '/algo', label: 'Algo Engine', icon: <MdCode /> },
    { path: '/deep-analysis', label: 'Deep Agent', icon: <MdAnalytics /> },
    { path: '/copilot', label: 'AI Chat', icon: <MdSmartToy /> },
    { path: '/profile', label: 'Profile', icon: <MdOutlineAccountCircle /> },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-black/50 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '12px' }}>V</div>
          <h1 className="text-gradient font-bold">VestraAI</h1>
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="mobile-nav glass-panel z-50">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop Nav */}
      <nav className="desktop-nav glass-panel">
        <div className="flex flex-col items-start gap-1 mb-8" style={{ padding: '0 1rem' }}>
          <div className="flex items-center gap-2">
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'white'
            }}>V</div>
            <h1 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>VestraAI</h1>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Intelligence Platform
          </span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
             <NavLink 
             key={item.path} 
             to={item.path} 
             className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
           >
             {item.icon}
             <span>{item.label}</span>
           </NavLink>
          ))}
        </div>

        <div className="nav-item">
           <IoNotificationsOutline />
           <span>Alerts</span>
        </div>

        {/* System Reset Button */}
        <div 
          className="nav-item" 
          onClick={() => {
            if (window.confirm("This will reset your local portfolio holdings, balance, AI chat history, and service workers to clear any browser cache. Proceed?")) {
              localStorage.clear();
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  for (let r of registrations) r.unregister();
                });
              }
              window.location.href = '/';
            }
          }}
          style={{ 
            marginTop: 'auto', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: 'var(--accent-danger)', 
            cursor: 'pointer',
            background: 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <span>Reset App Data</span>
        </div>
      </nav>
    </>
  );
}

function App() {
  return (
    <MarketProvider>
      <PortfolioProvider>
        <Router>
          <div className="app-container">
            <Navigation />
            <main className="main-content md:pt-8">
              <TopHeader />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/algo" element={<AlgoTrading />} />
                <Route path="/deep-analysis" element={<EarningsAgent />} />
                <Route path="/copilot" element={<Copilot />} />
                <Route path="/profile" element={<div className="glass-panel" style={{padding: '2rem'}}><h2>Profile Settings coming soon</h2></div>} />
              </Routes>
            </main>
          </div>
        </Router>
      </PortfolioProvider>
    </MarketProvider>
  )
}

export default App
