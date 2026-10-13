import fetch from 'node-fetch';

async function testFetch() {
  try {
    const res = await fetch('http://localhost:3000/api/fundamentals?symbol=GOOGL');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    console.log("SUCCESS! Here is Alphabet (GOOGL) fundamentals data:");
    console.log("Annual Data:", JSON.stringify(data.annual, null, 2));
    console.log("Quarterly Data:", JSON.stringify(data.quarterly, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
testFetch();
