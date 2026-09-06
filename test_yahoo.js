import { default as YahooFinance } from 'yahoo-finance2';

async function test() {
  try {
    const yahooFinance = new YahooFinance();
    const res = await yahooFinance.search('AAPL', { newsCount: 3 });
    console.log(JSON.stringify(res.news, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
