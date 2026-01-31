
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE INSPECTION ---');
  
  const customers = await prisma.customer.findMany({
    include: {
      payments: true,
      invoices: true
    }
  });

  console.log(`Found ${customers.length} customers.`);

  for (const c of customers) {
    // Calculate balance manually
    const paymentSum = c.payments.reduce((sum, p) => sum + p.amount, 0);
    
    console.log(`\nCustomer: ${c.email} (${c.id})`);
    console.log(`  - DB Balance Field (Deprecated?): ${c.balance}`);
    console.log(`  - Calculated Balance (Sum Payments): ${paymentSum}`);
    console.log(`  - Currency: ${c.currency}`);
    console.log(`  - Payments: ${c.payments.length}`);
    c.payments.forEach(p => {
      console.log(`    - Payment ID: ${p.id}, Amount: ${p.amount}, Created: ${p.createdAt.toISOString()}`);
    });
    console.log(`  - Invoices: ${c.invoices.length}`);
    c.invoices.forEach(i => {
      console.log(`    - Invoice ID: ${i.id}, Total: ${i.amount}, Status: ${i.status}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
