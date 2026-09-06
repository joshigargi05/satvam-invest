import axios from 'axios';

async function testSEC() {
  try {
    const headers = { 'User-Agent': 'VestraAI/1.0 (contact@vestra.ai)' };
    const tickersRes = await axios.get('https://www.sec.gov/files/company_tickers.json', { headers });
    const tickers = Object.values(tickersRes.data);
    const tickerMap = {};
    for (const t of tickers) tickerMap[t.ticker] = String(t.cik_str).padStart(10, '0');

    const cik = tickerMap['AAPL'];
    if (!cik) throw new Error("CIK not found");

    const factsRes = await axios.get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers });
    const revenue = factsRes.data.facts['us-gaap']['Revenues'] || factsRes.data.facts['us-gaap']['SalesRevenueNet'];
    const netIncome = factsRes.data.facts['us-gaap']['NetIncomeLoss'];

    // Get latest annuals (form 10-K)
    const getAnnuals = (metric) => {
        if (!metric) return {};
        const annuals = metric.units.USD.filter(d => d.form === '10-K' && d.frame && d.frame.length === 6); // e.g. CY2023
        const result = {};
        for (const item of annuals) {
            result[item.frame.replace('CY', '')] = item.val;
        }
        return result;
    };

    console.log("Revenue:", getAnnuals(revenue));
    console.log("NetIncome:", getAnnuals(netIncome));

  } catch (error) {
    console.error(error.message);
  }
}
testSEC();
