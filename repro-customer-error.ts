
// import fetch from 'node-fetch';

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'India Customer',
        email: `india_${Date.now()}@example.com`,
        region: 'IN',
        currency: 'INR',
        address: { country: 'IN' },
        balance: 0
      })
    });
    
    if (!res.ok) {
        const text = await res.text();
        console.log('Error Status:', res.status);
        console.log('Error Body:', text);
    } else {
        const json = await res.json();
        console.log('Success:', json);
    }

  } catch (err) {
    console.error(err);
  }
}

run();
