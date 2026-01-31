
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CLEANING UP BAD DATA (MAJOR UNITS MIGRATION) ---');
  
  // 1. Delete all Payments (containing inflated values)
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${deletedPayments.count} payments.`);

  // 2. Delete all Invoice Items
  const deletedItems = await prisma.invoiceItem.deleteMany({});
  console.log(`Deleted ${deletedItems.count} invoice items.`);

  // 3. Delete all Invoices
  const deletedInvoices = await prisma.invoice.deleteMany({});
  console.log(`Deleted ${deletedInvoices.count} invoices.`);

  // 4. Delete all Subscriptions (to ensure clean slate for new plans)
  const deletedSubs = await prisma.subscription.deleteMany({});
  console.log(`Deleted ${deletedSubs.count} subscriptions.`);
  
  // 5. Delete all Customers (optional, but good for clean test)
  // Let's keep customers but reset their balances (which are calculated from payments anyway).
  // Actually, user said "Re-create ONE clean invoice and payment".
  // Deleting customers is safer to avoid lingering bad state.
  // But wait, users table links to customers. If I delete customer, I might break user login?
  // User model: `customer Customer? @relation(fields: [customerId], references: [id])`
  // It's optional. But if I delete customer, user.customerId becomes invalid unless I set it null.
  // Let's just delete the billing data. Customers can stay.

  console.log('Data cleanup complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
