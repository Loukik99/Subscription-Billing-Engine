
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'lokesh@gmail.com';
  
  console.log(`Fetching data for ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, customerId: true }
  });

  const customer = await prisma.customer.findUnique({
    where: { email },
    select: { id: true, email: true }
  });
  
  console.log('\n--- STEP 1: VERIFY LINK ---');
  if (user) {
    console.log(`User Found: ID=${user.id}, CustomerID=${user.customerId}`);
  } else {
    console.log('User NOT Found');
  }
  
  if (customer) {
    console.log(`Customer Found: ID=${customer.id}`);
  } else {
    console.log('Customer NOT Found');
  }

  if (user && customer && user.customerId === customer.id) {
    console.log('✅ LINK VERIFIED: User.customerId matches Customer.id');
  } else {
    console.log('❌ LINK FAILED or Missing Data');
  }

  console.log('\n--- STEP 2: AVAILABLE PLANS ---');
  const plans = await prisma.plan.findMany({
    select: { id: true, name: true, amount: true, currency: true }
  });
  plans.forEach(p => console.log(`Plan: ${p.id} (${p.name}) - ${p.currency} ${p.amount}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
