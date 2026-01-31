
const API_URL = 'http://localhost:3000/api';

async function runTest() {
  try {
    // Helper for fetch
    const post = async (url: string, data: any) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST ${url} failed: ${res.status} ${text}`);
      }
      return res.json();
    };

    const get = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET ${url} failed: ${res.status} ${text}`);
      }
      return res.json();
    };

    // 1. Create Customer
    console.log('Creating customer...');
    const customer = await post(`${API_URL}/customers`, {
      email: `test-${Date.now()}@example.com`,
      name: 'Test Customer',
      address: JSON.stringify({ country: 'US', state: 'CA', postalCode: '90210' }),
      currency: 'USD',
      region: 'US'
    });
    console.log('Customer created:', customer.id);

    // 2. Create Plan
    console.log('Creating plan...');
    const planId = `plan-${Date.now()}`;
    const plan = await post(`${API_URL}/plans`, {
      id: planId,
      name: 'Test Plan',
      interval: 'MONTH',
      currency: 'USD',
      amount: 1000
    });
    console.log('Plan created:', plan.id);

    // 3. Create Subscription
    console.log('Creating subscription...');
    const subscription = await post(`${API_URL}/subscriptions`, {
      customerId: customer.id,
      planId: plan.id
    });
    console.log('Subscription created:', subscription.id);

    // 4. List Subscriptions
    console.log('Listing subscriptions...');
    const list = await get(`${API_URL}/subscriptions`);
    console.log('Subscriptions count:', list.length);
    console.log('Subscriptions:', JSON.stringify(list, null, 2));

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

runTest();
