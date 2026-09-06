import YahooFinance from 'yahoo-finance2';

async function testServerLogic() {
  const symbol = "GOOGL";
  try {
    const yahooFinance = new YahooFinance();
    // Fetch last 5 years of data
    const date = new Date();
    date.setFullYear(date.getFullYear() - 5);
    const period1 = date.toISOString().split('T')[0];

    const trailingResults = await yahooFinance.fundamentalsTimeSeries(symbol, { 
      period1, module: "all", type: "trailing"
    }, { validateResult: false });
    
    console.log("Success! Got length:", trailingResults.length);
  } catch (error) {
    console.error("Caught error:", error.message);
  }
}
testServerLogic();
