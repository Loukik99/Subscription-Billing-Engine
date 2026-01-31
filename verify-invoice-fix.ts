
import { PrismaClient } from '@prisma/client';
import { BillingService } from './src/billing/billing.service';
import { SubscriptionService } from './src/subscriptions/subscriptions.service';
import { CustomersService } from './src/customers/customers.service';
import { PlanInterval } from './src/types';

const prisma = new PrismaClient();
const billingService = new BillingService();
const subscriptionService = new SubscriptionService();
const customersService = new CustomersService();

async function main() {
  console.log('--- STARTING CLEAN TEST VERIFICATION ---');

  // 1. Create Plan (₹550 / month)
  // Amount in DB must be in MAJOR units (Rupees). 550 INR = 550.
  const planId = `test-plan-550-${Date.now()}`;
  const plan = await prisma.plan.create({
    data: {
      id: planId,
      name: 'Test Plan 550',
      amount: 550, // 550.00 INR
      currency: 'INR',
      interval: PlanInterval.MONTH,
    }
  });
  console.log(`1. Created Plan: ${plan.name} (Amount: ${plan.amount})`);

  // 2. Create Customer
  const customer = await customersService.createCustomer({
    email: `test-user-550-${Date.now()}@example.com`,
    name: 'Test User 550',
    address: { country: 'IN', state: 'MH' }, // India, Maharashtra
    currency: 'INR',
    region: 'IN'
  });
  console.log(`2. Created Customer: ${customer.email} (ID: ${customer.id})`);

  // 3. Create Subscription
  // This creates the subscription but NO invoice initially (per new logic)
  const subscription = await subscriptionService.createSubscription(customer.id, plan.id);
  // The service returns the transaction result which contains the subscription
  const subId = subscription.id;
  console.log(`3. Created Subscription: ${subId}`);

  // 4. Generate Due Invoices (Triggers the "Billing Job")
  console.log('4. Running Billing Job (Generate Due Invoices)...');
  const invoiceIds = await billingService.generateDueInvoices();
  console.log(`   Generated Invoice IDs: ${invoiceIds.join(', ')}`);

  // Find the invoice for this subscription
  const invoice = await prisma.invoice.findFirst({
    where: { subscriptionId: subId },
    include: { items: true }
  });

  if (!invoice) throw new Error('Invoice NOT generated!');

  console.log(`5. Verifying Invoice Amount...`);
  console.log(`   Invoice Subtotal: ${invoice.subtotal}`);
  console.log(`   Invoice Tax: ${invoice.tax}`);
  console.log(`   Invoice Total: ${invoice.amount}`);

  // EXPECTATIONS
  // Subtotal = Plan Amount = 550
  // Tax (India 18%) = 550 * 0.18 = 99
  // Total = 550 + 99 = 649
  // Displayed Total = ₹649.00

  const expectedSubtotal = 550;
  const expectedTax = Math.round(550 * 0.18); // 18% IGST
  const expectedTotal = expectedSubtotal + expectedTax;

  console.log(`   Expected Total: ${expectedTotal} (Subtotal ${expectedSubtotal} + Tax ${expectedTax})`);

  if (invoice.amount !== expectedTotal) {
    console.error(`FAIL: Invoice amount ${invoice.amount} does not match expected ${expectedTotal}`);
    throw new Error('Invoice inflation detected!');
  } else {
    console.log('PASS: Invoice amount is exactly correct (Plan + Tax). No inflation.');
  }

  // 6. Verify Account Balance Logic
  // Should be 0 initially because balance = SUM(payments) and we haven't paid yet.
  let customerCheck = await customersService.getCustomer(customer.id);
  console.log(`6. Account Balance (Pre-Payment): ${customerCheck?.balance}`);
  
  if (customerCheck?.balance !== 0) {
     throw new Error('Balance should be 0 before payment');
  }

  // 7. Mark as Paid (Simulate Payment)
  console.log('7. Marking Invoice as Paid...');
  // We need to use InvoicesService for this, but I'll use prisma for simplicity or import it
  const { InvoicesService } = require('./src/invoices/invoices.service');
  const invoicesService = new InvoicesService();
  await invoicesService.payInvoice(invoice.id);

  // 8. Verify Account Balance Matches Invoice Amount
  customerCheck = await customersService.getCustomer(customer.id);
  console.log(`8. Account Balance (Post-Payment): ${customerCheck?.balance}`);

  if (customerCheck?.balance !== expectedTotal) {
    console.error(`FAIL: Balance ${customerCheck?.balance} != Invoice Total ${expectedTotal}`);
    throw new Error('Balance mismatch!');
  }

  console.log('SUCCESS: Full flow verified. No accumulation. No inflation.');
  
  // Cleanup
  await customersService.deleteCustomer(customer.id);
  await prisma.plan.delete({ where: { id: plan.id } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
