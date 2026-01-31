
import prisma from './src/db/prisma';
import { InvoicesService } from './src/invoices/invoices.service';
import { CustomersService } from './src/customers/customers.service';

const invoicesService = new InvoicesService();
const customersService = new CustomersService();

async function main() {
  console.log('Starting payment system test...');

  // 1. Create a test customer
  const customer = await customersService.createCustomer({
    email: `test-payment-${Date.now()}@example.com`,
    name: 'Payment Test User',
    address: '123 Test St',
    region: 'US',
    currency: 'USD',
  });
  console.log('Created customer:', customer.id);

  // 2. Create a test invoice manually (since service doesn't have create method exposed here easily without full subscription flow, or I can use prisma directly)
  const invoice = await prisma.invoice.create({
    data: {
      customerId: customer.id,
      amount: 5000, // $50.00
      subtotal: 5000,
      tax: 0,
      currency: 'USD',
      status: 'OPEN',
      billingReason: 'SUBSCRIPTION_CREATE',
      date: new Date(),
      dueDate: new Date(),
    }
  });
  console.log('Created invoice:', invoice.id, 'Amount:', invoice.amount);

  // 3. Verify initial balance is 0
  const initialCustomer = await customersService.getCustomer(customer.id);
  console.log('Initial Balance:', initialCustomer?.balance);
  if (initialCustomer?.balance !== 0) throw new Error('Initial balance should be 0');

  // 4. Mark as Paid
  console.log('Marking invoice as PAID...');
  await invoicesService.payInvoice(invoice.id);

  // 5. Verify Invoice Status
  const paidInvoice = await invoicesService.getInvoice(invoice.id);
  console.log('Invoice Status:', paidInvoice?.status);
  if (paidInvoice?.status !== 'PAID') throw new Error('Invoice status should be PAID');

  // 6. Verify Payment Record Created
  const payments = await prisma.payment.findMany({ where: { invoiceId: invoice.id } });
  console.log('Payments found:', payments.length);
  if (payments.length !== 1) throw new Error('Should have exactly 1 payment record');
  if (payments[0].amount !== 5000) throw new Error('Payment amount mismatch');

  // 7. Verify Customer Balance
  const finalCustomer = await customersService.getCustomer(customer.id);
  console.log('Final Balance:', finalCustomer?.balance);
  if (finalCustomer?.balance !== 5000) throw new Error('Final balance should be 5000');

  console.log('SUCCESS: Payment system verification passed!');

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
