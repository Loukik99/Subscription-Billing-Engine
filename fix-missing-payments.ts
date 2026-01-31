
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Fixing Missing Payments (Backfill) ---');

  // 1. Get all PAID invoices
  const paidInvoices = await prisma.invoice.findMany({
    where: { status: 'PAID' },
    include: { customer: true }
  });

  console.log(`Found ${paidInvoices.length} PAID invoices.`);

  let fixedCount = 0;

  for (const invoice of paidInvoices) {
    // 2. Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { invoiceId: invoice.id }
    });

    if (!payment) {
      console.log(`Missing payment for Invoice ${invoice.id} (Amount: ${invoice.amount}, Customer: ${invoice.customer.email})`);
      
      // 3. Create missing payment
      await prisma.payment.create({
        data: {
          id: undefined, // Let UUID be generated
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          amount: invoice.amount,
          createdAt: invoice.paidAt || invoice.createdAt, // Use paid date if available, else created date
        }
      });
      
      console.log(`  -> Created payment record.`);
      fixedCount++;
    } else {
      // console.log(`Invoice ${invoice.id} is OK.`);
    }
  }

  console.log(`\nFinished. Backfilled ${fixedCount} missing payments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
