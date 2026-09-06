import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const res = await axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=${process.env.FINNHUB_API_KEY}`);
    console.log(Object.keys(res.data.series.annual));
    if (res.data.series.annual.salesPerShare) {
      console.log(res.data.series.annual.salesPerShare.slice(0, 4));
    }
  } catch (err) {
    console.error(err.message);
  }
}
test();
