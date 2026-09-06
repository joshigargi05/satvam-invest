import fetch from 'node-fetch';

async function testFetch() {
  try {
    const res = await fetch('http://localhost:3000/api/fundamentals?symbol=GOOGL');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    console.log("SUCCESS! Here is the data exactly as it will appear:");
    console.log(data.financials);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
testFetch();
