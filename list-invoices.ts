
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CURRENT CUSTOMERS ---');
  const customers = await prisma.customer.findMany({
    include: {
      subscriptions: true,
      invoices: true,
      payments: true
    }
  });

  for (const c of customers) {
    console.log(`Customer: ${c.email} (ID: ${c.id})`);
    console.log(`  - Region: ${c.region}`);
    console.log(`  - Balance: ${c.balance}`);
    console.log(`  - Subscriptions: ${c.subscriptions.length}`);
    console.log(`  - Invoices: ${c.invoices.length}`);
    console.log(`  - Payments: ${c.payments.length}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
