
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- PLAN INSPECTION ---');
  const plans = await prisma.plan.findMany();
  
  for (const p of plans) {
    console.log(`Plan: ${p.name} (${p.id})`);
    console.log(`  - Amount: ${p.amount} ${p.currency}`);
    console.log(`  - Active: ${p.active}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
