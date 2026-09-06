import finnhub from 'finnhub';
import dotenv from 'dotenv';
dotenv.config();

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = process.env.FINNHUB_API_KEY;
const finnhubClient = new finnhub.DefaultApi();

finnhubClient.companyBasicFinancials("AAPL", "all", (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data.series.annual.salesPerShare, null, 2));
  }
});
