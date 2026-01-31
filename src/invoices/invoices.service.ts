import prisma from '../db/prisma';

export class InvoicesService {
  async getInvoices() {
    return prisma.invoice.findMany({
      include: {
        customer: true,
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoice(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: true,
        items: true,
      },
    });
  }

  async payInvoice(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { status: true, customerId: true, amount: true }
    });

    if (!invoice) throw new Error('Invoice not found');
    
    // Check if already paid OR payment exists (Idempotency)
    const existingPayment = await prisma.payment.findUnique({
      where: { invoiceId: id }
    });

    if (invoice.status === 'PAID' || existingPayment) {
      return prisma.invoice.findUniqueOrThrow({ 
        where: { id },
        include: {
          customer: true,
          subscription: true,
          items: true,
        },
      });
    }

    // Transaction: Create Payment -> Update Invoice
    return prisma.$transaction(async (tx) => {
      // 1. Create Payment
      await tx.payment.create({
        data: {
          customerId: invoice.customerId,
          invoiceId: id,
          amount: invoice.amount,
        }
      });

      // 2. Update Invoice
      return tx.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
        include: {
          customer: true,
          subscription: true,
          items: true,
        },
      });
    });
  }
}
