import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';

const Send = Lucide.Send || (() => '🚀');
const Bot = Lucide.Bot || (() => '🤖');
const Sparkles = Lucide.Sparkles || (() => '✨');
const AlertTriangle = Lucide.AlertTriangle || (() => '⚠️');
const Settings2 = Lucide.Settings2 || (() => '⚙️');
const Trash2 = Lucide.Trash2 || (() => '🗑️');
const Info = Lucide.Info || (() => 'ℹ️');

import { generateAIResponse } from '../services/ai';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useMarket } from '../context/MarketContext';

const CopilotChart = ({ parsed }) => {
  const [period, setPeriod] = useState('annual');
  const [metric, setMetric] = useState('Income');
  
  const rawData = parsed[period] || parsed.data || [];
  const data = rawData.map(d => ({...d, periodLabel: d.period || d.year}));
  const tickerName = parsed.ticker ? `${parsed.ticker} ` : '';
  
  const colorBlue = '#1a73e8';
  const colorGreen = '#34a853';
  
  return (
    <div style={{ width: '100%', margin: '1.5rem 0', background: 'var(--bg-secondary)', padding: '1.5rem 1.5rem 1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="m-0 text-xl font-bold">{tickerName}Financials</h3>
        <Info size={20} className="text-muted" />
      </div>
      
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button onClick={() => setMetric('Income')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${metric === 'Income' ? 'bg-[#1a73e8] text-white' : 'bg-white/5 text-muted hover:bg-white/10'}`}>Income</button>
        <button onClick={() => setMetric('Balance Sheet')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${metric === 'Balance Sheet' ? 'bg-[#1a73e8] text-white' : 'bg-white/5 text-muted hover:bg-white/10'}`}>Balance Sheet</button>
        <button onClick={() => setMetric('Cash Flow')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${metric === 'Cash Flow' ? 'bg-[#1a73e8] text-white' : 'bg-white/5 text-muted hover:bg-white/10'}`}>Cash Flow</button>
      </div>
      
      <div className="flex gap-6 mb-6 px-2">
        {metric === 'Income' && (
          <>
            <div className="flex items-center gap-2">
              <div style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: colorBlue}}></div>
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: colorGreen}}></div>
              <span className="text-sm font-medium">Net Income</span>
            </div>
          </>
        )}
        {metric === 'Balance Sheet' && (
          <>
            <div className="flex items-center gap-2">
              <div style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: colorBlue}}></div>
              <span className="text-sm font-medium">Total Assets</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: colorGreen}}></div>
              <span className="text-sm font-medium">Total Liabilities</span>
            </div>
          </>
        )}
        {metric === 'Cash Flow' && (
          <>
            <div className="flex items-center gap-2">
              <div style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: colorBlue}}></div>
              <span className="text-sm font-medium">Operating Cash Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{width: 10, height: 10, borderRadius: '50%', backgroundColor: colorGreen}}></div>
              <span className="text-sm font-medium">Free Cash Flow</span>
            </div>
          </>
        )}
      </div>
      
      <div style={{height: '250px', width: '100%', marginBottom: '2rem'}}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={6}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="periodLabel" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis orientation="right" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val.toFixed(1)}B`} tickMargin={10} width={50} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
            {metric === 'Income' && <Bar dataKey="revenue" fill={colorBlue} name="Revenue" radius={[2, 2, 0, 0]} maxBarSize={32} />}
            {metric === 'Income' && <Bar dataKey="profit" fill={colorGreen} name="Net Income" radius={[2, 2, 0, 0]} maxBarSize={32} />}
            {metric === 'Balance Sheet' && <Bar dataKey="assets" fill={colorBlue} name="Total Assets" radius={[2, 2, 0, 0]} maxBarSize={32} />}
            {metric === 'Balance Sheet' && <Bar dataKey="liabilities" fill={colorGreen} name="Total Liabilities" radius={[2, 2, 0, 0]} maxBarSize={32} />}
            {metric === 'Cash Flow' && <Bar dataKey="operatingCashFlow" fill={colorBlue} name="Operating Cash Flow" radius={[2, 2, 0, 0]} maxBarSize={32} />}
            {metric === 'Cash Flow' && <Bar dataKey="freeCashFlow" fill={colorGreen} name="Free Cash Flow" radius={[2, 2, 0, 0]} maxBarSize={32} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/5">
          <button onClick={() => setPeriod('annual')} className={`px-6 py-1.5 rounded-full text-sm font-medium transition-colors ${period === 'annual' ? 'bg-[#1a73e8] text-white shadow-lg' : 'text-muted hover:text-white'}`}>Annually</button>
          <button onClick={() => setPeriod('quarterly')} className={`px-6 py-1.5 rounded-full text-sm font-medium transition-colors ${period === 'quarterly' ? 'bg-[#1a73e8] text-white shadow-lg' : 'text-muted hover:text-white'}`}>Quarterly</button>
        </div>
      </div>
      
      {period === 'annual' && data.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {data.map((d, i) => (
            <div key={i} className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap ${i === data.length - 1 ? 'bg-[#1a73e8] text-white' : 'bg-white/5 text-muted'}`}>
              FY{d.periodLabel.slice(-2)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Copilot() {
  const { market, currency } = useMarket();
  const lastQuarterLabel = (() => {
    const d = new Date();
    const m = d.getMonth();
    const y = d.getFullYear();
    if (m < 3) return `Q4 ${y - 1}`;
    if (m < 6) return `Q1 ${y}`;
    if (m < 9) return `Q2 ${y}`;
    return `Q3 ${y}`;
  })();
  
  const currentYear = new Date().getFullYear();
  const y1 = currentYear - 3;
  const y2 = currentYear - 2;
  const y3 = currentYear - 1;
  const promptPeriods = `${y1}, ${y2}, ${y3}, ${lastQuarterLabel}`;

  const defaultMessages = [
    { id: 1, type: 'ai', text: 'Hi there! I am your Galora AI Copilot. As an **AI-powered global investing intelligence platform**, I can analyze your portfolio, evaluate global assets, or research complex market trends. What strategic insights would you like to explore today?' }
  ];

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chatHistory');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(m => ({
            ...m,
            text: typeof m.text === 'string'
              ? m.text.replace(/Vestra\s*AI/gi, 'Galora AI').replace(/Satvam\s*Invest/gi, 'Galora AI')
              : m.text
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaultMessages;
  });

  const [input, setInput] = useState('');
  const [customTicker, setCustomTicker] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [provider, setProvider] = useState(() => {
    return localStorage.getItem('aiProvider') || 'gemini';
  });

  // Save history on change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  // Save provider on change
  useEffect(() => {
    localStorage.setItem('aiProvider', provider);
  }, [provider]);

  const handleSendDirectly = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', text: text };
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setIsTyping(true);
    const aiResponseText = await generateAIResponse(userMsg.text, currentHistory, provider);
    setIsTyping(false);
    setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: aiResponseText }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    handleSendDirectly(text);
  };

  const clearHistory = () => {
    if(window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages(defaultMessages);
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div style={{ background: 'var(--accent-secondary)', padding: '0.75rem', borderRadius: '12px', color: 'white' }}>
            <Bot size={28} />
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>AI Investing Copilot</h1>
            <p className="text-muted">Your personal financial analyst, powered by AI.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={clearHistory} className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
            <Trash2 size={16} />
            <span className="hidden md:inline ml-2">Clear</span>
          </button>
          
          {/* Model Selection Dropdown */}
          <div className="flex items-center gap-2 glass-panel px-4 py-2">
            <Settings2 size={16} className="text-muted" />
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className="bg-transparent border-none text-white outline-none"
              style={{ fontFamily: 'var(--font-body)', cursor: 'pointer' }}
            >
              <option value="gemini" style={{ color: 'black' }}>Google Gemini</option>
              <option value="openai" style={{ color: 'black' }}>OpenAI (GPT-4o)</option>
              <option value="grok" style={{ color: 'black' }}>xAI Grok</option>
            </select>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel card col-span-2 chat-container">
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                {msg.type === 'ai' ? (
                  <>
                    <Sparkles size={16} className="mb-2" style={{ color: 'var(--accent-primary)' }} />
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match && match[1] === 'chart') {
                            try {
                              const parsed = JSON.parse(String(children).replace(/\n$/, ''));
                              
                              return <CopilotChart parsed={parsed} />;
                            } catch (e) {
                              return <pre className="bg-red-900 p-2 rounded">Chart Render Error: {e.message}</pre>;
                            }
                          }
                          return <code className={className} {...props}>{children}</code>;
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message ai">
                <span className="text-muted">Analyzing market data using {provider.charAt(0).toUpperCase() + provider.slice(1)}...</span>
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Ask me to analyze AAPL or recommend stocks..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn btn-primary" onClick={handleSend} style={{ padding: '0 1.5rem', opacity: isTyping ? 0.5 : 1 }} disabled={isTyping}>
              <Send size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass-panel card">
            <h3 className="flex items-center gap-2 text-gradient mb-4">
              <Sparkles size={18} /> Deep Analysis Reports
            </h3>
            <div className="flex flex-col gap-3">
              {['NVDA', 'AAPL', 'MSFT', 'AMZN'].map(ticker => (
                <button 
                  key={ticker}
                  className="btn btn-outline" 
                  onClick={() => handleSendDirectly(`You are an institutional-quality investment analyst.\nAnalyze the stock ${ticker}.\nProvide:\n1. Business summary\n2. Growth drivers\n3. Risks\n4. Valuation view\n5. Overall rating (Buy/Hold/Avoid)\n6. Confidence score (1–10)\n7. Revenue & Profit Data (Provide a markdown chart block as instructed in system prompt)`)}
                >
                  Generate {ticker} Report
                </button>
              ))}
              
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  className="chat-input flex-1" 
                  placeholder="Custom Stock..." 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  value={customTicker}
                  onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customTicker.trim()) {
                      handleSendDirectly(`You are an institutional-quality investment analyst.\nAnalyze the stock ${customTicker.trim()}.\nProvide:\n1. Business summary\n2. Growth drivers\n3. Risks\n4. Valuation view\n5. Overall rating (Buy/Hold/Avoid)\n6. Confidence score (1–10)\n7. Revenue & Profit Data (Provide a markdown chart block as instructed in system prompt)`);
                      setCustomTicker('');
                    }
                  }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  onClick={() => {
                    if (customTicker.trim()) {
                      handleSendDirectly(`You are an institutional-quality investment analyst.\nAnalyze the stock ${customTicker.trim()}.\nProvide:\n1. Business summary\n2. Growth drivers\n3. Risks\n4. Valuation view\n5. Overall rating (Buy/Hold/Avoid)\n6. Confidence score (1–10)\n7. Revenue & Profit Data (Provide a markdown chart block as instructed in system prompt)`);
                      setCustomTicker('');
                    }
                  }}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
             <h3 className="flex items-center gap-2 mb-2" style={{ color: 'var(--accent-warning)' }}>
               <AlertTriangle size={18} /> Active Alerts
             </h3>
             <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <li className="mb-2 pb-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <strong>NVDA</strong> earnings call is tomorrow. Expect high volatility.
                </li>
                <li>
                  <strong>TSLA</strong> dropped 5% below your target price. Consider buying?
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
