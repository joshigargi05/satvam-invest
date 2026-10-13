import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const VITE_URL = 'http://localhost:5173';

const results = [];

function record(name, passed, details = '') {
  results.push({ name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runAllTests() {
  console.log('==================================================');
  console.log('   RUNNING SATVAM INVEST SYSTEM & ACCURACY TESTS  ');
  console.log('==================================================\n');

  // Test 1: Frontend Server Status
  try {
    const res = await axios.get(VITE_URL, { 
      headers: { Accept: 'text/html' },
      timeout: 3000 
    });
    record('Vite Frontend Server', res.status === 200, `Status: ${res.status}`);
  } catch (err) {
    record('Vite Frontend Server', false, err.message);
  }

  // Test 2: Alphabet Price via GOOGL
  try {
    const res = await axios.get(`${BASE_URL}/api/quote?symbol=GOOGL`);
    const valid = res.data && typeof res.data.c === 'number' && res.data.c > 0;
    record('Alphabet Price (GOOGL)', valid, `Price: $${res.data.c}, Change: ${res.data.dp}%`);
  } catch (err) {
    record('Alphabet Price (GOOGL)', false, err.message);
  }

  // Test 3: Alphabet Price via 'Alphabet' alias
  try {
    const res = await axios.get(`${BASE_URL}/api/quote?symbol=Alphabet`);
    const valid = res.data && typeof res.data.c === 'number' && res.data.c > 0;
    record('Alphabet Alias Resolution ("Alphabet")', valid, `Price: $${res.data.c}`);
  } catch (err) {
    record('Alphabet Alias Resolution ("Alphabet")', false, err.message);
  }

  // Test 4: Alphabet Price via 'google' alias
  try {
    const res = await axios.get(`${BASE_URL}/api/quote?symbol=google`);
    const valid = res.data && typeof res.data.c === 'number' && res.data.c > 0;
    record('Alphabet Alias Resolution ("google")', valid, `Price: $${res.data.c}`);
  } catch (err) {
    record('Alphabet Alias Resolution ("google")', false, err.message);
  }

  // Test 5: Alphabet Class C (GOOG)
  try {
    const res = await axios.get(`${BASE_URL}/api/quote?symbol=GOOG`);
    const valid = res.data && typeof res.data.c === 'number' && res.data.c > 0;
    record('Alphabet Class C Price (GOOG)', valid, `Price: $${res.data.c}`);
  } catch (err) {
    record('Alphabet Class C Price (GOOG)', false, err.message);
  }

  // Test 6: Multi-stock quotes (US & Indian tickers)
  try {
    const symbols = 'AAPL,MSFT,NVDA,GOOGL,RELIANCE,TCS';
    const res = await axios.get(`${BASE_URL}/api/quotes?symbols=${symbols}`);
    const keys = Object.keys(res.data);
    const valid = keys.length >= 4 && res.data.GOOGL && res.data.AAPL;
    record('Multi-Quote Batch (US + India)', valid, `Loaded ${keys.length} quotes: ${keys.join(', ')}`);
  } catch (err) {
    record('Multi-Quote Batch (US + India)', false, err.message);
  }

  // Test 7: Alphabet Fundamentals
  try {
    const res = await axios.get(`${BASE_URL}/api/fundamentals?symbol=GOOGL`);
    const hasAnnual = Array.isArray(res.data.annual) && res.data.annual.length > 0;
    const hasQuarterly = Array.isArray(res.data.quarterly) && res.data.quarterly.length > 0;
    record(
      'Alphabet Fundamentals API', 
      hasAnnual && hasQuarterly, 
      `${res.data.annual?.length || 0} annual periods, ${res.data.quarterly?.length || 0} quarterly periods`
    );
  } catch (err) {
    record('Alphabet Fundamentals API', false, err.message);
  }

  // Test 8: Market News
  try {
    const res = await axios.get(`${BASE_URL}/api/news`);
    const valid = Array.isArray(res.data) && res.data.length > 0;
    record('Market News Endpoint', valid, `${res.data.length} articles retrieved`);
  } catch (err) {
    record('Market News Endpoint', false, err.message);
  }

  // Test 9: Portfolio News & Price Impact
  try {
    const res = await axios.get(`${BASE_URL}/api/portfolio-news?symbols=GOOGL,AAPL,MSFT`);
    const valid = Array.isArray(res.data);
    record('Portfolio News Impact Endpoint', valid, `${res.data.length} items`);
  } catch (err) {
    record('Portfolio News Impact Endpoint', false, err.message);
  }

  // Test 10: Upcoming Earnings
  try {
    const res = await axios.get(`${BASE_URL}/api/upcoming-earnings?symbols=GOOGL,AAPL,MSFT`);
    const valid = Array.isArray(res.data);
    record('Upcoming Earnings Endpoint', valid, `${res.data.length} upcoming events`);
  } catch (err) {
    record('Upcoming Earnings Endpoint', false, err.message);
  }

  // Test 11: Portfolio History Calculation
  try {
    const payload = {
      holdings: [{ ticker: 'GOOGL', shares: 10, totalValue: 3400 }],
      balance: 10000,
      period: '1M'
    };
    const res = await axios.post(`${BASE_URL}/api/portfolio-history`, payload);
    const valid = Array.isArray(res.data);
    record('Portfolio History Endpoint', valid, `${res.data.length} chart points`);
  } catch (err) {
    record('Portfolio History Endpoint', false, err.message);
  }

  // Test 12: Algo Trading Engine
  try {
    const res = await axios.post(`${BASE_URL}/api/algo-trading`, { query: 'tech stocks' });
    const valid = Array.isArray(res.data) && res.data.length > 0 && res.data[0].finalScore !== undefined;
    record('Algo Trading Engine Endpoint', valid, `${res.data.length} ranked stock recommendations`);
  } catch (err) {
    record('Algo Trading Engine Endpoint', false, err.message);
  }

  console.log('\n==================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('==================================================');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
