
import { PrismaClient } from '@prisma/client';
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
        amount: plan.amount,
        currency: plan.currency,
        customerAddress: {
            country: address?.country || 'US',
            state: address?.state,
            postalCode: address?.postalCode
        }
    });

    const expectedTotal = plan.amount + taxResult.totalTaxAmount;

    // Check discrepancy
    if (inv.amount !== expectedTotal) {
        console.log(`Mismatch Invoice ${inv.id} (Date: ${inv.date.toISOString().split('T')[0]})`);
        console.log(`  - Plan: ${plan.name} (${plan.amount})`);
        console.log(`  - Expected: ${expectedTotal} (Tax: ${taxResult.totalTaxAmount})`);
        console.log(`  - Actual:   ${inv.amount}`);
        console.log(`  - Diff:     ${inv.amount - expectedTotal}`);
        
        // Flag very high inflation
        if (inv.amount > expectedTotal * 2) {
             console.log(`  !!! CRITICAL INFLATION DETECTED !!!`);
        }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
