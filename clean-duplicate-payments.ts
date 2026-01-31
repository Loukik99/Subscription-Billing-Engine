
import prisma from './src/db/prisma';

async function main() {
  console.log('Starting cleanup of duplicate payments...');

  // 1. Find all payments grouped by invoiceId
  const payments = await prisma.payment.findMany();
  const invoiceMap = new Map<string, string[]>(); // invoiceId -> paymentIds[]

  for (const p of payments) {
    if (!invoiceMap.has(p.invoiceId)) {
      invoiceMap.set(p.invoiceId, []);
    }
    invoiceMap.get(p.invoiceId)?.push(p.id);
  }

  let deletedCount = 0;

  // 2. Iterate and keep only the first one
  for (const [invoiceId, paymentIds] of invoiceMap.entries()) {
    if (paymentIds.length > 1) {
      console.log(`Found ${paymentIds.length} payments for invoice ${invoiceId}. Keeping one, deleting ${paymentIds.length - 1}.`);
      
      // Sort by creation time (optional, but good practice to keep oldest) or just pick first
      // Since we just want ONE, we slice from index 1 to end
      const toDelete = paymentIds.slice(1);
      
      await prisma.payment.deleteMany({
        where: {
          id: { in: toDelete }
        }
      });
      
      deletedCount += toDelete.length;
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} duplicate payments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
