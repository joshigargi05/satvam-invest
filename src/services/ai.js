import { getLiveStockQuote, getMarketNews, getFundamentals } from './api';
import { apiFetch } from './platform';

// Regex to detect potential stock tickers (1-5 uppercase letters)
const extractTickers = (text) => {
  const matches = text.match(/\b[A-Z]{1,12}\b/g) || [];
  
  // Map common names if users type them instead of tickers
  const nameMapping = {
    'ALPHABET': 'GOOGL',
    'GOOGLE': 'GOOGL',
    'APPLE': 'AAPL',
    'MICROSOFT': 'MSFT',
    'AMAZON': 'AMZN',
    'NVIDIA': 'NVDA',
    'TESLA': 'TSLA',
    'META': 'META',
    'FACEBOOK': 'META',
    'MICRON': 'MU'
  };

  const upperText = text.toUpperCase();
  for (const [name, ticker] of Object.entries(nameMapping)) {
    if (upperText.includes(name) && !matches.includes(ticker)) {
      matches.push(ticker);
    }
  }

  return [...new Set(matches)];
};

export const generateAIResponse = async (userMessage, history, provider = 'gemini') => {
  try {
    let contextData = '';
    const tickers = extractTickers(userMessage);

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
    const y1 = (currentYear - 3).toString();
    const y2 = (currentYear - 2).toString();
    const y3 = (currentYear - 1).toString();
    
    if (tickers.length > 0) {
      contextData += `Live Data & Financials for mentioned tickers:\n`;
      for (const ticker of tickers) {
        const quote = await getLiveStockQuote(ticker);
        if (quote && quote.c) {
          contextData += `- ${ticker}: Current Price $${quote.c}, Daily Change ${quote.dp}%\n`;
        }
        
        // Fetch Real Fundamentals Dynamically using Yahoo Finance v3!
        const fundData = await getFundamentals(ticker);
        if (fundData && fundData.annual && fundData.annual.length > 0) {
           contextData += `- ${ticker} Historical P&L (in Billions):\n`;
           contextData += JSON.stringify(fundData) + '\n';
           contextData += `IMPORTANT INSTRUCTION: Use ONLY the exact numbers provided in this JSON object above when generating the Revenue & Profit chart for ${ticker}! Do not hallucinate or guess any numbers.\n`;
        }
      }
    } else {
      const news = await getMarketNews();
      if (news && news.length > 0) {
        contextData += `Latest Market News:\n`;
        news.forEach(n => {
          contextData += `- ${n.headline}\n`;
        });
      }
    }

    const systemPrompt = `You are Galora AI, an AI-powered global investing intelligence platform. 
Always be highly analytical, comprehensive, and professional. Use the provided real-time data to answer the user's query if applicable. 
When asked to analyze a stock or show its financials, you MUST provide a detailed report and ALWAYS include a dynamic chart.
To render the chart, provide a markdown code block with language 'chart' containing ONLY a valid JSON object. 
YOU MUST USE EXACTLY THE YEARS AND FINANCIAL NUMBERS PROVIDED IN THE LIVE CONTEXT DATA! Do not make up or hallucinate any numbers or quarters.
Use this exact format for the chart block:
\`\`\`chart
{"ticker":"TICKER_NAME","annual":[{"period":"2022","revenue":10.5,"profit":2.1,"assets":45.2,"liabilities":12.1,"operatingCashFlow":4.5,"freeCashFlow":3.1}], "quarterly":[{"period":"Q1 2026","revenue":2.5,"profit":0.5,"assets":48.0,"liabilities":11.5,"operatingCashFlow":1.2,"freeCashFlow":0.8}]}
\`\`\`
CRITICAL: You must write out the COMPLETE JSON arrays for ALL periods provided in the context data. DO NOT abbreviate, truncate, or use "..." in the JSON. Output every single year and quarter.
Remember your identity: You are an intelligence platform, not just an ordinary trading app.`;

    const prompt = `${systemPrompt}\n\nLive Context Data:\n${contextData || 'No live data available.'}\n\nUser Question: ${userMessage}`;

    const response = await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        prompt,
        history
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return data.error || "Failed to communicate with AI server.";
    }

    return data.response;

  } catch (error) {
    console.error(`Failed to generate AI response from ${provider}:`, error);
    return `An error occurred while connecting to the ${provider} brain.`;
  }
};
