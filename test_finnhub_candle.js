import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const symbol = 'AAPL';
    const key = process.env.FINNHUB_API_KEY;
    const to = Math.floor(Date.now() / 1000);
    const from = to - (6 * 30 * 24 * 60 * 60); // 6 months ago
    
    const res = await axios.get(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${key}`);
    console.log(res.data.c.length, "days of data");
    console.log("First day close:", res.data.c[0]);
    console.log("Last day close:", res.data.c[res.data.c.length-1]);

  } catch (err) {
    console.error(err.message);
  }
}
test();
