
import { PrismaClient, Prisma } from '@prisma/client';

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
    const paymentSum = c.payments.reduce((sum, p) => sum + (p.amount as unknown as Prisma.Decimal).toNumber(), 0);
    
    console.log(`\nCustomer: ${c.email} (${c.id})`);
    console.log(`  - DB Balance Field (Deprecated?): ${(c.balance as unknown as Prisma.Decimal).toNumber()}`);
    console.log(`  - Calculated Balance (Sum Payments): ${paymentSum}`);
    console.log(`  - Currency: ${c.currency}`);
    console.log(`  - Payments: ${c.payments.length}`);
    c.payments.forEach(p => {
      console.log(`    - Payment ID: ${p.id}, Amount: ${(p.amount as unknown as Prisma.Decimal).toNumber()}, Created: ${p.createdAt.toISOString()}`);
    });
    console.log(`  - Invoices: ${c.invoices.length}`);
    c.invoices.forEach(i => {
      console.log(`    - Invoice ID: ${i.id}, Total: ${(i.amount as unknown as Prisma.Decimal).toNumber()}, Status: ${i.status}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
