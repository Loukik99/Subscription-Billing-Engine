
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING ONE-TIME DATA CLEANUP (THRESHOLD: 10,000) ---');

  // STEP 1: DELETE INVALID PAYMENTS
  // "DELETE FROM payments WHERE amount >= 10000;"
  const deletedPayments = await prisma.payment.deleteMany({
    where: {
      amount: {
        gte: 10000
      }
    }
  });
  console.log(`STEP 1: Deleted ${deletedPayments.count} invalid payments (>= 10,000).`);

  // STEP 2: DELETE INVALID INVOICES
  // Need to handle Foreign Keys: Payment (referencing Invoice) and InvoiceItem (referencing Invoice)
  
  // Find invalid invoices first to handle relations
  const invalidInvoices = await prisma.invoice.findMany({
    where: {
      amount: {
        gte: 10000
      }
    },
    select: { id: true }
  });
  
  const invalidInvoiceIds = invalidInvoices.map(inv => inv.id);
  console.log(`Found ${invalidInvoiceIds.length} invalid invoices to delete.`);

  if (invalidInvoiceIds.length > 0) {
    // 2a. Delete any remaining payments linked to these invoices 
    // (In case payment was < 10000 but linked to invalid invoice, or just for safety)
    const linkedPayments = await prisma.payment.deleteMany({
      where: {
        invoiceId: {
          in: invalidInvoiceIds
        }
      }
    });
    console.log(`  - Deleted ${linkedPayments.count} payments linked to invalid invoices.`);

    // 2b. Delete Invoice Items linked to these invoices
    const deletedItems = await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId: {
          in: invalidInvoiceIds
        }
      }
    });
    console.log(`  - Deleted ${deletedItems.count} invoice items linked to invalid invoices.`);

    // 2c. Delete the Invoices
    const deletedInvoices = await prisma.invoice.deleteMany({
      where: {
        id: {
          in: invalidInvoiceIds
        }
      }
    });
    console.log(`STEP 2: Deleted ${deletedInvoices.count} invalid invoices (>= 10,000).`);
  } else {
    console.log('STEP 2: No invalid invoices found.');
  }

  // STEP 3: VERIFY CLEAN STATE
  const remainingBadPayments = await prisma.payment.count({ where: { amount: { gte: 10000 } } });
  const remainingBadInvoices = await prisma.invoice.count({ where: { amount: { gte: 10000 } } });

  console.log('--- VERIFICATION ---');
  console.log(`Bad Payments Remaining: ${remainingBadPayments}`);
  console.log(`Bad Invoices Remaining: ${remainingBadInvoices}`);

  if (remainingBadPayments === 0 && remainingBadInvoices === 0) {
    console.log('SUCCESS: Cleanup verified. System is clean.');
  } else {
    console.error('FAILURE: Some bad data remains.');
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
