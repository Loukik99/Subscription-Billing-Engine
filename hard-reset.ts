
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- HARD RESET: DELETING ALL BILLING DATA ---');
  
  // 1. Delete Payments (Source of Truth)
  const payments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${payments.count} payments.`);

  // 2. Delete Invoice Items (FK constraint for Invoices)
  const items = await prisma.invoiceItem.deleteMany({});
  console.log(`Deleted ${items.count} invoice items.`);

  // 3. Delete Invoices
  const invoices = await prisma.invoice.deleteMany({});
  console.log(`Deleted ${invoices.count} invoices.`);

  // 4. Delete Subscriptions
  const subs = await prisma.subscription.deleteMany({});
  console.log(`Deleted ${subs.count} subscriptions.`);

  console.log('--- HARD RESET COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
