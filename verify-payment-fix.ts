
import { PrismaClient } from '@prisma/client';
import { InvoicesService } from './src/invoices/invoices.service';
import { CustomersService } from './src/customers/customers.service';

const prisma = new PrismaClient();
const invoicesService = new InvoicesService();
const customersService = new CustomersService();

async function main() {
  console.log('Starting Payment Fix Verification Test...');

  // 1. Create a test customer
  const customer = await customersService.createCustomer({
    email: `test-fix-${Date.now()}@example.com`,
    name: 'Payment Fix Test User',
    address: '123 Test St',
    region: 'US',
    currency: 'USD',
  });
  console.log('1. Created customer:', customer.id);

  // 2. Create a test invoice
  const invoice = await prisma.invoice.create({
    data: {
      customerId: customer.id,
      amount: 10000, // $100.00
      subtotal: 10000,
      tax: 0,
      currency: 'USD',
      status: 'OPEN',
      billingReason: 'SUBSCRIPTION_CREATE',
      date: new Date(),
      dueDate: new Date(),
    }
  });
  console.log('2. Created invoice:', invoice.id, 'Amount: 10000');

  // 3. Mark as Paid (First Time)
  console.log('3. Marking invoice as PAID (1st attempt)...');
  await invoicesService.payInvoice(invoice.id);

  // Verify Balance
  let customerData = await customersService.getCustomer(customer.id);
  console.log('   Balance after 1st pay:', customerData?.balance);
  if (customerData?.balance !== 10000) throw new Error('Balance incorrect after first payment');

  // 4. Mark as Paid (Second Time)
  console.log('4. Marking invoice as PAID (2nd attempt - should be ignored)...');
  try {
    await invoicesService.payInvoice(invoice.id);
    console.log('   Second payment attempt completed without error (expected).');
  } catch (e) {
    console.error('   Error during second payment:', e);
  }

  // Verify Balance Again
  customerData = await customersService.getCustomer(customer.id);
  console.log('   Balance after 2nd pay:', customerData?.balance);
  
  // Check Payment Count
  const payments = await prisma.payment.findMany({ where: { invoiceId: invoice.id } });
  console.log('   Total payments for invoice:', payments.length);

  if (customerData?.balance !== 10000) throw new Error('Balance CHANGED after second payment! Fix failed.');
  if (payments.length !== 1) throw new Error('Multiple payments created! Fix failed.');

  console.log('SUCCESS: Idempotency verification passed!');

  // Cleanup
  await customersService.deleteCustomer(customer.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
