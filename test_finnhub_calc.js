import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const symbol = 'MU';
    const key = process.env.FINNHUB_API_KEY;
    const profileRes = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${key}`);
    const sharesOutstanding = profileRes.data.shareOutstanding; // in millions

    const metricRes = await axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${key}`);
    const metrics = metricRes.data.series.annual;

    const salesPerShare = metrics.salesPerShare;
    const eps = metrics.eps;

    console.log("Shares Outstanding (Millions):", sharesOutstanding);
    console.log("Sales Per Share:", salesPerShare.slice(0, 4));
    console.log("EPS:", eps.slice(0, 4));

    for (let i=0; i<4; i++) {
        const rev = salesPerShare[i].v * sharesOutstanding / 1000; // in Billions
        const prof = eps[i].v * sharesOutstanding / 1000; // in Billions
        console.log(`${salesPerShare[i].period}: Rev: $${rev.toFixed(2)}B, Profit: $${prof.toFixed(2)}B`);
    }

  } catch (err) {
    console.error(err.message);
  }
}
test();
