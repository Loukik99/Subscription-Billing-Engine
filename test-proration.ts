
import { PrismaClient } from '@prisma/client';
// import fetch from 'node-fetch'; // Use global fetch

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('--- STARTING PRORATION TEST ---');

  try {
    // 1. Create Customer
    const customerRes = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `proration_test_${Date.now()}@example.com`,
        name: 'Proration Tester',
        currency: 'USD',
        address: { country: 'US', state: 'NY', postalCode: '10001' }
      })
    });
    const customer = await customerRes.json();
    console.log('Created Customer:', customer.id);

    // 2. Create Plan A (Monthly, $100)
    const planARes = await fetch(`${API_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `plan-a-${Date.now()}`,
        name: 'Plan A (Monthly)',
        amount: 10000, // $100.00
        currency: 'USD',
        interval: 'MONTH'
      })
    });
    const planA = await planARes.json();
    console.log('Created Plan A Response:', JSON.stringify(planA));
    console.log('Created Plan A ID:', planA.id);

    // 3. Create Plan B (Monthly, $200)
    const planBRes = await fetch(`${API_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `plan-b-${Date.now()}`,
        name: 'Plan B (Monthly)',
        amount: 20000, // $200.00
        currency: 'USD',
        interval: 'MONTH'
      })
    });
    const planB = await planBRes.json();
    console.log('Created Plan B Response:', JSON.stringify(planB));
    console.log('Created Plan B ID:', planB.id);

    if (!planA.id || !planB.id) {
        throw new Error('Failed to create plans - ID is missing');
    }

    // 4. Create Subscription to Plan A
    const subRes = await fetch(`${API_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customer.id,
        planId: planA.id
      })
    });
    const subscription = await subRes.json();
    console.log('Created Subscription:', subscription.id);
    console.log('Initial Status:', subscription.status);

    // Wait a moment to simulate time passing (optional, but good for timestamps)
    await new Promise(r => setTimeout(r, 1000));

    // 5. Change Plan to Plan B (Upgrade)
    console.log('Changing Plan to Plan B...');
    const changeRes = await fetch(`${API_URL}/subscriptions/${subscription.id}/change-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newPlanId: planB.id
      })
    });
    
    if (!changeRes.ok) {
        const err = await changeRes.text();
        throw new Error(`Failed to change plan: ${err}`);
    }

    const result = await changeRes.json();
    console.log('Plan Change Result:', result);
    
    // 6. Verify Invoice
    const invoice = result.invoice;
    console.log('Generated Invoice ID:', invoice.id);
    console.log('Invoice Amount:', invoice.amount);
    console.log('Invoice Items:', JSON.stringify(invoice.items, null, 2));

    // Simple assertion
    if (invoice.items.length !== 2) {
        console.error('FAIL: Expected 2 invoice items (credit + charge)');
    } else {
        console.log('PASS: 2 invoice items found');
    }

  } catch (error) {
    console.error('TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
