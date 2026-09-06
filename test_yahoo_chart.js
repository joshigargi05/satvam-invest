import axios from 'axios';

async function test() {
  try {
    const symbol = 'AAPL';
    const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`);
    const result = res.data.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    
    console.log(`Fetched ${closes.length} daily closes for ${symbol}`);
    console.log("Last close:", closes[closes.length-1]);

  } catch (err) {
    console.error(err.message);
  }
}
test();
