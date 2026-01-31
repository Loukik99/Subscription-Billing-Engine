import prisma from '../db/prisma';
import { Customer, Subscription, Invoice } from '@prisma/client';
import { SubscriptionStatus } from '../types';

export class PortalService {
  async login(email: string) {
    const customer = await prisma.customer.findUnique({
      where: { email },
    });
    if (!customer) {
      throw new Error('Invalid credentials');
    }
    return customer;
  }

  async getDashboard(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          include: { plan: true },
          take: 1,
        },
        requests: {
          where: { status: 'PENDING' },
          include: { plan: true },
          take: 1,
        },
        // removed payments include, we will aggregate
      },
    });

    if (!customer) throw new Error('Customer not found');

    // Calculate balance from PAYMENTS only (Source of Truth)
    const paymentAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { customerId },
    });
    const computedBalance = paymentAgg._sum.amount || 0;

    const subscription = customer.subscriptions[0];
    const pendingRequest = customer.requests[0];
    
    return {
      customer: {
        name: customer.name,
        email: customer.email,
        balance: computedBalance,
        currency: customer.currency,
      },
      subscription: subscription ? {
        status: subscription.status,
        planName: subscription.plan.name,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBillingDate: subscription.currentPeriodEnd, // Usually same as period end
      } : null,
      pendingRequest: pendingRequest ? {
        status: pendingRequest.status,
        planName: pendingRequest.plan.name,
        requestedAt: pendingRequest.createdAt,
      } : null,
    };
  }

  async getSubscription(customerId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { 
        customerId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED, SubscriptionStatus.PAST_DUE] }
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return null;

    return {
      id: subscription.id,
      planName: subscription.plan.name,
      status: subscription.status,
      startDate: subscription.createdAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      amount: subscription.plan.amount,
      currency: subscription.plan.currency,
      interval: subscription.plan.interval,
    };
  }

  async getInvoices(customerId: string) {
    return prisma.invoice.findMany({
      where: { customerId },
      select: {
        id: true,
        date: true,
        status: true,
        amount: true,
        currency: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async getInvoiceDetail(customerId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: invoiceId,
        customerId, // Security: Ensure invoice belongs to customer
      },
      include: {
        items: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    return invoice;
  }
}
