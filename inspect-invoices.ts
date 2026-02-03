
import { PrismaClient, Prisma } from '@prisma/client';
import { SimpleTaxProvider } from './src/tax/tax.service';

const prisma = new PrismaClient();
const taxProvider = new SimpleTaxProvider();

async function main() {
  console.log('--- INSPECTING INVOICES FOR INFLATION ---');
  
  const invoices = await prisma.invoice.findMany({
    include: {
      subscription: {
        include: {
          plan: true,
          customer: true
        }
      }
    }
  });

  console.log(`Found ${invoices.length} invoices.`);

  for (const inv of invoices) {
    if (!inv.subscription) {
      console.log(`Invoice ${inv.id}: No subscription linked. Skipping.`);
      continue;
    }

    const plan = inv.subscription.plan;
    const customer = inv.subscription.customer;
    
    // Calculate Expected
    let address: any = {};
    try {
        address = typeof customer.address === 'string' 
        ? JSON.parse(customer.address) 
        : customer.address;
    } catch (e) { address = {}; }

    const taxResult = await taxProvider.calculateTax({
        amount: (plan.amount as unknown as Prisma.Decimal).toNumber(),
        currency: plan.currency,
        customerAddress: {
            country: address?.country || 'US',
            state: address?.state,
            postalCode: address?.postalCode
        }
    });

    const expectedTotal = (plan.amount as unknown as Prisma.Decimal).toNumber() + taxResult.totalTaxAmount;

    // Check discrepancy
    if ((inv.amount as unknown as Prisma.Decimal).toNumber() !== expectedTotal) {
        console.log(`Mismatch Invoice ${inv.id} (Date: ${inv.date.toISOString().split('T')[0]})`);
        console.log(`  - Plan: ${plan.name} (${(plan.amount as unknown as Prisma.Decimal).toNumber()})`);
        console.log(`  - Expected: ${expectedTotal} (Tax: ${taxResult.totalTaxAmount})`);
        console.log(`  - Actual:   ${(inv.amount as unknown as Prisma.Decimal).toNumber()}`);
        console.log(`  - Diff:     ${(inv.amount as unknown as Prisma.Decimal).toNumber() - expectedTotal}`);
        
        // Flag very high inflation
        if ((inv.amount as unknown as Prisma.Decimal).toNumber() > expectedTotal * 2) {
             console.log(`  !!! CRITICAL INFLATION DETECTED !!!`);
        }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
