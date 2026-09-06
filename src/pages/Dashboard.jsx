import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as Lucide from 'lucide-react';

const Wallet = Lucide.Wallet || (() => '💼');
const TrendingUp = Lucide.TrendingUp || (() => '📈');
const TrendingDown = Lucide.TrendingDown || (() => '📉');
const PieChart = Lucide.PieChart || (() => '📊');
const Activity = Lucide.Activity || (() => '⚡');
const Calendar = Lucide.Calendar || (() => '📅');
const ExternalLink = Lucide.ExternalLink || (() => '🔗');
const Clock = Lucide.Clock || (() => '🕒');
import { usePortfolio } from '../context/PortfolioContext';
import { getPortfolioNews, getMarketNews, getUpcomingEarnings, getPortfolioHistory } from '../services/api';

import { useMarket } from '../context/MarketContext';

export default function Dashboard() {
  const { balance, holdings } = usePortfolio();
  const { market, currency } = useMarket();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [period, setPeriod] = useState('ALL');
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [news, setNews] = useState([]);
  const [marketNews, setMarketNews] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Fetch true historical data
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingChart(true);

      let queryPeriod = period;
      if (period === 'CUSTOM') {
        if (!dateRange.start || !dateRange.end) {
          setLoadingChart(false);
          return;
        }
        queryPeriod = dateRange;
      }

      // If no holdings, just render a flatline chart of their balance
      if (holdings.length === 0) {
        const fakeData = [
          { name: 'Start', value: balance },
          { name: 'Now', value: balance }
        ];
        setChartData(fakeData);
        setLoadingChart(false);
        return;
      }

      const history = await getPortfolioHistory(holdings, balance, queryPeriod);
      if (history && history.length > 0) {
        setChartData(history);
      }
      setLoadingChart(false);
    };

    // Slight debounce so we don't spam if they type in custom dates
    const timer = setTimeout(() => {
      fetchHistory();
    }, 500);
    return () => clearTimeout(timer);
  }, [holdings.length, balance, period, dateRange]);

  const holdingTickers = holdings.map(h => h.ticker).join(',');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        if (holdings.length > 0) {
          const symbols = holdings.map(h => h.ticker).join(',');
          const [newsData, earningsData] = await Promise.all([
            getPortfolioNews(symbols),
            getUpcomingEarnings(symbols)
          ]);
          setNews(newsData);
          setEarnings(earningsData);
        }
        const globalNews = await getMarketNews();
        setMarketNews(globalNews);
      } catch (err) {
        console.error("Failed to load news", err);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, [holdingTickers]);

  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalPortfolioValue = balance + totalHoldingsValue;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-gradient">Portfolio Overview</h1>
          <p className="text-muted">Welcome back! Here's how your {market === 'US' ? 'US' : 'Indian'} investments are doing.</p>
        </div>
        <button className="btn btn-primary">
          Deposit Funds
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Main Chart Card */}
        <div className="glass-panel card col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <p className="text-muted mb-1">Total Balance</p>
              <h2 className="text-4xl font-bold">{currency}{totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                <TrendingUp size={16} /> +{currency}{(market === 'US' ? 3950.80 : 325400.50).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (All Time)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {showDatePicker && (
                <div className="flex items-center gap-2 animate-fade-in" style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent border-none text-white outline-none text-sm" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                  <span className="text-muted">to</span>
                  <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent border-none text-white outline-none text-sm" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                </div>
              )}
              <button
                className={`btn ${showDatePicker ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  if (!showDatePicker) setPeriod('CUSTOM');
                }}
              >
                <Calendar size={14} className="mr-1" /> Custom
              </button>
              <button
                className={`btn ${period === '1W' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => { setPeriod('1W'); setShowDatePicker(false); }}
              >
                1W
              </button>
              <button
                className={`btn ${period === '1M' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => { setPeriod('1M'); setShowDatePicker(false); }}
              >
                1M
              </button>
              <button
                className={`btn ${period === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => { setPeriod('ALL'); setShowDatePicker(false); }}
              >
                ALL
              </button>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%', position: 'relative' }}>
            {loadingChart && (
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(4px)', borderRadius: '12px' }}>
                <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${currency}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel card flex items-center gap-4">
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-primary)' }}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Buying Power</p>
              <p className="text-xl font-bold">{currency}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="glass-panel card flex items-center gap-4">
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', color: '#6366f1' }}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Active AI Alerts</p>
              <p className="text-xl font-bold">{market === 'US' ? '3' : '5'} Notifications</p>
            </div>
          </div>

          <div className="glass-panel card flex items-center gap-4">
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-warning)' }}>
              <PieChart size={24} />
            </div>
            <div>
              <p className="text-muted text-sm">Top Sector</p>
              <p className="text-xl font-bold">{market === 'US' ? 'Technology' : 'Financials'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Holdings Section */}
      <div style={{ marginTop: '2rem' }}></div>
      <h3 className="text-xl font-bold" style={{ marginBottom: '1.5rem' }}>Your Holdings</h3>
      <div className="glass-panel overflow-x-auto rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th className="p-4 text-muted font-normal text-sm">Asset</th>
              <th className="p-4 text-muted font-normal text-sm">Shares</th>
              <th className="p-4 text-muted font-normal text-sm">Avg Price</th>
              <th className="p-4 text-muted font-normal text-sm">Current Price</th>
              <th className="p-4 text-muted font-normal text-sm">Total Value</th>
              <th className="p-4 text-muted font-normal text-sm text-right">Performance</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-muted">No holdings yet. Go to Markets to buy some stocks!</td>
              </tr>
            ) : (
              holdings.map((asset, index) => {
                const performance = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
                const isPositive = performance >= 0;
                return (
                  <tr key={index} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td className="p-4 font-bold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, rgba(99, 102, 241, 0.8) 100%)' }}>
                        {asset.ticker.substring(0, 1)}
                      </div>
                      <span className="text-sm font-bold">{asset.ticker}</span>
                    </td>
                    <td className="p-4 text-sm">{asset.shares}</td>
                    <td className="p-4 text-muted text-sm">{currency}{asset.avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-4 text-sm font-bold" style={{ color: isPositive ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                      <div className="flex items-center gap-1.5">
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {currency}{asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-sm">{currency}{asset.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right font-bold text-sm" style={{ color: isPositive ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                      {isPositive ? '+' : ''}{performance.toFixed(2)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Live Financial News Section */}
      <div style={{ marginTop: '2rem' }}></div>
      <h3 className="flex items-center gap-2 text-xl font-bold" style={{ marginBottom: '1.5rem' }}>
        Live Financial News
        <span className="flex items-center gap-1 shadow-lg shadow-emerald-500/20" style={{ fontSize: '0.70rem', padding: '3px 10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Feed
        </span>
      </h3>

      {loadingNews ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl flex flex-col items-center justify-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="font-medium tracking-wide">Fetching global financial news...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl">
          <p>No recent news available.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {news.map((item, index) => {
            const date = new Date(item.datetime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-primary"
                style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--glass-border)', minHeight: '140px' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate mr-2" style={{ color: 'var(--accent-primary)' }}>{item.source}</span>
                  {item.impactTicker && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: item.impactChangePct >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }}>
                      <span className="text-[10px] font-bold">{item.impactTicker}</span>
                      <span className="text-[10px] font-bold" style={{ color: item.impactChangePct >= 0 ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                        {item.impactChangePct >= 0 ? '+' : ''}{item.impactChangePct.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {!item.impactTicker && <ExternalLink size={12} className="text-muted shrink-0" />}
                </div>

                <h4 className="text-sm font-bold mb-4 flex-1" style={{
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'var(--text-primary)'
                }}>
                  {item.headline.replace(` - ${item.source}`, '')}
                </h4>

                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mt-auto pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <Clock size={10} />
                  <span>{date}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Trending Market Opportunities Section */}
      <div style={{ marginTop: '4rem' }}></div>
      <h3 className="flex items-center gap-2 text-xl font-bold" style={{ marginBottom: '1.5rem' }}>
        Trending Market Opportunities
        <span className="flex items-center gap-1 shadow-lg shadow-blue-500/20" style={{ fontSize: '0.70rem', padding: '3px 10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
          <Activity size={10} />
          Global
        </span>
      </h3>

      {loadingNews ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl flex flex-col items-center justify-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="font-medium tracking-wide">Fetching global opportunities...</p>
        </div>
      ) : marketNews.length === 0 ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl">
          <p>No trending opportunities available.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {marketNews.map((item, index) => {
            const date = new Date(item.datetime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-primary"
                style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--glass-border)', minHeight: '140px' }}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate mr-2" style={{ color: '#3b82f6' }}>{item.source}</span>
                  <ExternalLink size={12} className="text-muted shrink-0" />
                </div>

                <h4 className="text-sm font-bold mb-4 flex-1" style={{
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  color: 'var(--text-primary)'
                }}>
                  {item.headline.replace(` - ${item.source}`, '')}
                </h4>

                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mt-auto pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <Clock size={10} />
                  <span>{date}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Upcoming Financial Results Section */}
      <div style={{ marginTop: '4rem' }}></div>
      <h3 className="flex items-center gap-2 text-xl font-bold" style={{ marginBottom: '1.5rem' }}>
        Upcoming Financial Results
        <span className="flex items-center gap-1 shadow-lg shadow-purple-500/20" style={{ fontSize: '0.70rem', padding: '3px 10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
          <Calendar size={10} />
          Earnings
        </span>
      </h3>

      {loadingNews ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl flex flex-col items-center justify-center">
          <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="font-medium tracking-wide">Fetching upcoming results...</p>
        </div>
      ) : earnings.length === 0 ? (
        <div className="glass-panel text-center p-12 text-muted rounded-xl">
          <p>No upcoming earnings found for your holdings.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-x-auto rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th className="p-4 text-muted font-normal text-sm">Company</th>
                <th className="p-4 text-muted font-normal text-sm">Earnings Date</th>
                <th className="p-4 text-muted font-normal text-sm">Expected EPS</th>
                <th className="p-4 text-muted font-normal text-sm">Expected Rev</th>
                <th className="p-4 text-muted font-normal text-sm text-right">Market Impact</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((item, index) => {
                const dateObj = new Date(item.earningsDate);
                const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const isPositive = item.changePct >= 0;

                // Format revenue estimate to billions/millions
                let revStr = 'N/A';
                if (item.revEstimate) {
                  if (item.revEstimate >= 1e9) {
                    revStr = `$${(item.revEstimate / 1e9).toFixed(2)}B`;
                  } else if (item.revEstimate >= 1e6) {
                    revStr = `$${(item.revEstimate / 1e6).toFixed(2)}M`;
                  }
                }

                return (
                  <tr key={index} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td className="p-4 font-bold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #a855f7 0%, rgba(99, 102, 241, 0.8) 100%)' }}>
                        {item.ticker.substring(0, 1)}
                      </div>
                      <span className="text-sm font-bold">{item.ticker}</span>
                    </td>
                    <td className="p-4 text-sm font-medium">{dateStr}</td>
                    <td className="p-4 text-sm">{item.epsEstimate ? `$${item.epsEstimate.toFixed(2)}` : 'N/A'}</td>
                    <td className="p-4 text-sm">{revStr}</td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }}>
                        <span className="text-xs font-bold" style={{ color: isPositive ? 'var(--accent-primary)' : 'var(--accent-warning)' }}>
                          {isPositive ? '+' : ''}{item.changePct.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
