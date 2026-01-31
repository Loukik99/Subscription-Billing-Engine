
import { PrismaClient } from '@prisma/client';
import { DashboardService } from './src/dashboard/dashboard.service';
import { PortalService } from './src/portal/portal.service';
import { CustomersService } from './src/customers/customers.service';

const prisma = new PrismaClient();
const dashboardService = new DashboardService();
const portalService = new PortalService();
const customersService = new CustomersService();

async function main() {
  console.log('--- VERIFICATION STARTING ---');

  // 1. Create Plan (₹800)
  const plan = await prisma.plan.upsert({
    where: { id: 'test-plan-inr' },
    update: {},
    create: {
      id: 'test-plan-inr',
      name: 'Test Plan INR',
      amount: 800, // ₹800 Major Unit
      currency: 'INR',
      interval: 'MONTH',
      active: true
    }
  });
  console.log(`1. Plan Created: ${plan.amount} ${plan.currency}`);

  // 2. Create Customer (India for 18% Tax)
  const customer = await prisma.customer.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test Customer',
      region: 'IN', // For tax
      address: JSON.stringify({ country: 'IN', state: 'MH', postalCode: '400001' }),
      currency: 'INR'
    }
  });
  console.log(`2. Customer Created: ${customer.email}`);

  // 3. Create Subscription
  const sub = await prisma.subscription.create({
    data: {
      customerId: customer.id,
      planId: plan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000),
    }
  });
  console.log('3. Subscription Created');

  // 4. Generate Invoice
  // Logic: 800 + 18% Tax (144) = 944
  const taxAmount = 144; 
  const total = 944;
  
  const invoice = await prisma.invoice.create({
    data: {
      customerId: customer.id,
      subscriptionId: sub.id,
      status: 'OPEN',
      date: new Date(),
      dueDate: new Date(),
      currency: 'INR',
      amount: total,
      subtotal: 800,
      tax: taxAmount,
      billingReason: 'SUBSCRIPTION_CREATE',
      items: {
        create: [{
           description: 'Test Item',
           amount: 800,
           currency: 'INR',
           type: 'SUBSCRIPTION',
           periodStart: new Date(),
           periodEnd: new Date()
        }]
      }
    }
  });
  console.log(`4. Invoice Generated: ${invoice.amount}`);

  // 5. Pay Invoice
  await prisma.payment.create({
    data: {
      customerId: customer.id,
      invoiceId: invoice.id,
      amount: invoice.amount, // 944
    }
  });
  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'PAID', paidAt: new Date() }
  });
  console.log('5. Invoice Paid');

  // 6. Verify Dashboard (Admin)
  const dashboard = await dashboardService.getSummary();
  console.log('6. Admin Dashboard Stats:');
  console.log(`   - Collected Revenue (Expected: 944): ${dashboard.collectedRevenue}`);
  console.log(`   - Billed/Open Revenue (Expected: 0): ${dashboard.totalRevenue}`);
  
  // 7. Verify Customer Balance (Portal)
  const portalData = await portalService.getDashboard(customer.id);
  console.log('7. Customer Portal Stats:');
  console.log(`   - Balance (Expected: 944): ${portalData.customer.balance}`);

  // 8. Verify Customer List (Admin)
  const customerList = await customersService.getCustomers();
  const listCustomer = customerList.find(c => c.id === customer.id);
  console.log('8. Customer List Stats:');
  console.log(`   - Balance (Expected: 944): ${listCustomer?.balance}`);

  // Final Check
  if (
    dashboard.collectedRevenue === 944 &&
    portalData.customer.balance === 944 &&
    listCustomer?.balance === 944
  ) {
    console.log('\nSUCCESS: All numbers match expected ₹944.');
  } else {
    console.error('\nFAILURE: Numbers do not match.');
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
