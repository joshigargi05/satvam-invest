import { default as YahooFinance } from 'yahoo-finance2';

async function test() {
  try {
    const yahooFinance = new YahooFinance();
    const res = await yahooFinance.quoteSummary('AAPL', { modules: ['calendarEvents', 'earnings'] });
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
