
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Customer Balance Investigation ---');
  
  const customers = await prisma.customer.findMany({
    include: {
      payments: true,
      invoices: true,
    },
    orderBy: { createdAt: 'desc' } // Newest first
  });

  console.log(`Found ${customers.length} customers.\n`);

  for (const c of customers) {
    const paymentTotal = c.payments.reduce((sum, p) => sum + p.amount, 0);
    const invoiceTotal = c.invoices.reduce((sum, i) => sum + i.amount, 0);
    const paidInvoicesTotal = c.invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);

    console.log(`Customer: ${c.email} (ID: ${c.id})`);
    console.log(`  - Created At: ${c.createdAt}`);
    console.log(`  - Invoices: ${c.invoices.length} (Total Amount: ${invoiceTotal})`);
    console.log(`  - Paid Invoices Sum: ${paidInvoicesTotal}`);
    console.log(`  - Payments Table Sum: ${paymentTotal}`);
    console.log(`  - Balance (Payments Sum): ${paymentTotal}`);
    
    // Check for mismatch between "Paid Invoices" and "Payments"
    if (paidInvoicesTotal !== paymentTotal) {
      console.log(`  WARNING: Mismatch detected! Paid Invoices (${paidInvoicesTotal}) != Payments (${paymentTotal})`);
      console.log(`  This suggests some invoices were marked PAID before the payment system was added.`);
    }

    console.log('  - Payments Details:');
    c.payments.forEach(p => {
      console.log(`    - ID: ${p.id}, Amount: ${p.amount}, InvoiceID: ${p.invoiceId}, Created: ${p.createdAt}`);
    });
    console.log('---------------------------------------------------');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
