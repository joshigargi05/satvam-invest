import { default as YahooFinance } from 'yahoo-finance2';

async function test() {
  try {
    const yahooFinance = new YahooFinance();
    const result = await yahooFinance.chart('AAPL', {
      period1: '2026-05-01',
      interval: '1d'
    });
    console.log(JSON.stringify(result.quotes, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
