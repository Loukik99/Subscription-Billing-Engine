
import { PrismaClient } from '@prisma/client';

console.log('Script started');
const prisma = new PrismaClient();

const plans = [
  {
    id: 'basic-monthly-usd',
    name: 'Basic Plan (Monthly)',
    interval: 'MONTH',
    currency: 'USD',
    amount: 10, // $10
    active: true,
  },
  {
    id: 'pro-monthly-usd',
    name: 'Pro Plan (Monthly)',
    interval: 'MONTH',
    currency: 'USD',
    amount: 29, // $29
    active: true,
  },
  {
    id: 'enterprise-yearly-usd',
    name: 'Enterprise Plan (Yearly)',
    interval: 'YEAR',
    currency: 'USD',
    amount: 299, // $299
    active: true,
  },
  {
    id: 'basic-monthly-inr',
    name: 'Basic Plan (Monthly) - IN',
    interval: 'MONTH',
    currency: 'INR',
    amount: 800, // ₹800
    active: true,
  },
];

async function main() {
  console.log('Connecting to DB...');
  await prisma.$connect();
  console.log('Seeding plans...');
  for (const plan of plans) {
    console.log(`Upserting plan: ${plan.id}`);
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: { amount: plan.amount }, // FORCE UPDATE AMOUNT
      create: plan,
    });
  }
  console.log('Plans seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Disconnected.');
  });
