
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Plans ---');
  const plans = await prisma.plan.findMany();
  console.log(`Found ${plans.length} plans.`);
  
  for (const p of plans) {
    console.log(`Plan: ${p.name} (ID: ${p.id})`);
    console.log(`  - Amount: ${p.amount} (Currency: ${p.currency})`);
    console.log(`  - Interval: ${p.interval}`);
    console.log('-----------------------------------');
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
