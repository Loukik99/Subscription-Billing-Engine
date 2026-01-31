
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

    console.log('--- STARTING LIFECYCLE TEST ---');

    // 1. Create Customer
    console.log('1. Creating customer...');
    const customer = await post(`${API_URL}/customers`, {
      email: `flow-test-${Date.now()}@example.com`,
      name: 'Flow Test User',
      address: JSON.stringify({ country: 'US', state: 'NY', postalCode: '10001' }),
      currency: 'USD',
      region: 'US'
    });
    console.log('   Customer created:', customer.id);

    // 2. Create Plan
    console.log('2. Creating plan...');
    const planId = `flow-plan-${Date.now()}`;
    const plan = await post(`${API_URL}/plans`, {
      id: planId,
      name: 'Flow Test Plan',
      interval: 'MONTH',
      currency: 'USD',
      amount: 5000 // $50.00
    });
    console.log('   Plan created:', plan.id);

    // 3. Create Subscription (Step 1)
    console.log('3. Creating subscription (Should be ACTIVE but NO INVOICE)...');
    const subscription = await post(`${API_URL}/subscriptions`, {
      customerId: customer.id,
      planId: plan.id
    });
    console.log('   Subscription created:', subscription.id);
    console.log('   Status:', subscription.status);

    // Verify NO invoice
    const invoicesBefore = await get(`${API_URL}/invoices?customerId=${customer.id}`);
    const subInvoicesBefore = invoicesBefore.filter((i: any) => i.subscriptionId === subscription.id);
    console.log('   Invoices count (expect 0):', subInvoicesBefore.length);
    if (subInvoicesBefore.length > 0) throw new Error('FAIL: Invoice created immediately!');

    // 4. Run Billing Job (Step 3)
    console.log('4. Running Billing Job (Should generate invoice)...');
    const billingRes = await post(`${API_URL}/billing/cycle`, {});
    console.log('   Billing Job Result:', billingRes);

    // Verify Invoice Created
    const invoicesAfter = await get(`${API_URL}/invoices?customerId=${customer.id}`);
    const subInvoicesAfter = invoicesAfter.filter((i: any) => i.subscriptionId === subscription.id);
    console.log('   Invoices count (expect 1):', subInvoicesAfter.length);
    if (subInvoicesAfter.length !== 1) throw new Error('FAIL: Invoice NOT generated!');
    console.log('   Invoice Amount:', subInvoicesAfter[0].amount);

    // 5. Run Billing Job Again (Idempotency)
    console.log('5. Running Billing Job Again (Should do nothing)...');
    const billingRes2 = await post(`${API_URL}/billing/cycle`, {});
    console.log('   Billing Job Result:', billingRes2);
    
    // Verify NO new invoice
    const invoicesFinal = await get(`${API_URL}/invoices?customerId=${customer.id}`);
    const subInvoicesFinal = invoicesFinal.filter((i: any) => i.subscriptionId === subscription.id);
    console.log('   Invoices count (expect 1):', subInvoicesFinal.length);
    if (subInvoicesFinal.length !== 1) throw new Error('FAIL: Duplicate invoice generated!');

    console.log('--- TEST PASSED ---');

  } catch (error: any) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

runTest();
