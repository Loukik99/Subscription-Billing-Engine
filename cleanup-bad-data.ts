
import { PrismaClient } from '@prisma/client';
import { SimpleTaxProvider } from './src/tax/tax.service';

const prisma = new PrismaClient();
const taxProvider = new SimpleTaxProvider();

async function main() {
  console.log('--- CLEANING UP BAD DATA ---');
  
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
  let deletedCount = 0;

  for (const inv of invoices) {
    if (!inv.subscription) continue;

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

    // Strict check: If amount is NOT what we expect now (with correct tax), delete it.
    // This removes the "missing tax" invoices and any "inflated" ones.
    if (inv.amount !== expectedTotal) {
        console.log(`Deleting Invoice ${inv.id}: Amount ${inv.amount} != Expected ${expectedTotal}`);
        
        // Delete payments linked to this invoice first
        // Payment has invoiceId (unique)
        const payment = await prisma.payment.findUnique({ where: { invoiceId: inv.id } });
        if (payment) {
            console.log(`  - Deleting linked payment ${payment.id} (${payment.amount})`);
            await prisma.payment.delete({ where: { id: payment.id } });
        }
        
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
        await prisma.invoice.delete({ where: { id: inv.id } });
        deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} bad invoices.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
