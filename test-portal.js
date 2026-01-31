
// const fetch = require('node-fetch'); // Using native fetch
// In recent node versions, fetch is global. If not, this might fail, but let's try global fetch first.

const BASE_URL = 'http://localhost:3000/api';
const EMAIL = 'lkkokate99@gmail.com';

async function testPortal() {
  console.log('--- Testing Portal Login ---');
  const loginRes = await fetch(`${BASE_URL}/portal/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  console.log('Login successful:', loginData);
  const customerId = loginData.token; // In our implementation token is customerId
  const headers = { 'x-portal-customer-id': customerId };

  console.log('\n--- Testing Dashboard (Get Me) ---');
  const meRes = await fetch(`${BASE_URL}/portal/me`, { headers });
  console.log('Dashboard status:', meRes.status);
  if (meRes.ok) console.log('Dashboard data:', await meRes.json());
  else console.error('Dashboard error:', await meRes.text());

  console.log('\n--- Testing Subscription ---');
  const subRes = await fetch(`${BASE_URL}/portal/me/subscription`, { headers });
  console.log('Subscription status:', subRes.status);
  if (subRes.ok) console.log('Subscription data:', await subRes.json());
  else console.error('Subscription error:', await subRes.text());

  console.log('\n--- Testing Invoices ---');
  const invRes = await fetch(`${BASE_URL}/portal/me/invoices`, { headers });
  console.log('Invoices status:', invRes.status);
  if (invRes.ok) console.log('Invoices data:', await invRes.json());
  else console.error('Invoices error:', await invRes.text());
}

testPortal().catch(console.error);
