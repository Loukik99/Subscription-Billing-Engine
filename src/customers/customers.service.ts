import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';

export class CustomersService {
  async getCustomers() {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Fetch balances via aggregation (Source of Truth: Payments)
    const balances = await prisma.payment.groupBy({
      by: ['customerId'],
      _sum: { amount: true },
    });

    const balanceMap = new Map<string, number>();
    balances.forEach(b => {
      const amount = b._sum.amount ? (b._sum.amount as unknown as Prisma.Decimal).toNumber() : 0;
      balanceMap.set(b.customerId, amount);
    });

    return customers.map(c => ({
      ...c,
      balance: balanceMap.get(c.id) || 0
    }));
  }

  async getCustomer(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        subscriptions: { include: { plan: true } },
        invoices: true,
        // payments: { select: { amount: true } } // REMOVE
      },
    });

    if (!customer) return null;

    // Calculate balance from PAYMENTS only
    const paymentAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { customerId: id },
    });

    const balance = paymentAgg._sum.amount ? (paymentAgg._sum.amount as unknown as Prisma.Decimal).toNumber() : 0;

    return {
      ...customer,
      balance
    };
  }

  async createCustomer(data: any) {
    const normalized = {
      ...data,
      address:
        typeof data?.address === 'string'
          ? data.address
          : JSON.stringify(data?.address ?? {}),
    };
    return prisma.customer.create({ data: normalized });
  }

  async deleteCustomer(id: string) {
    return prisma.$transaction(async (tx) => {
      // Delete invoice items first
      const invoices = await tx.invoice.findMany({ where: { customerId: id }, select: { id: true } });
      const invoiceIds = invoices.map(i => i.id);
      
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.payment.deleteMany({ where: { customerId: id } }); // Delete payments
      await tx.invoice.deleteMany({ where: { customerId: id } });
      await tx.subscription.deleteMany({ where: { customerId: id } });
      return tx.customer.delete({ where: { id } });
    });
  }
}
