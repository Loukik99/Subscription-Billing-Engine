import { addMonths, addYears } from 'date-fns';
import { Prisma } from '@prisma/client'; // commented out to fix ts-node issue
import prisma from '../db/prisma';
// Refreshed imports
import { SubscriptionStatus, PlanInterval, InvoiceItemType } from '../types';
import { ProrationService } from '../billing/proration.service';
import { TaxService, SimpleTaxProvider } from '../tax/tax.service';
import { TaxRequest } from '../tax/tax.types';

export class SubscriptionService {
  private prorationService: ProrationService;
  private taxService: TaxService;

  constructor() {
    this.prorationService = new ProrationService();
    this.taxService = new TaxService(new SimpleTaxProvider());
  }
  
  async createSubscription(customerId: string, planId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error(`Customer ${customerId} not found`);

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error(`Plan ${planId} not found`);

    if (customer.currency !== plan.currency) {
      throw new Error(`Currency mismatch: Customer (${customer.currency}) vs Plan (${plan.currency})`);
    }

    const startDate = new Date();
    let endDate: Date;

    if (plan.interval === PlanInterval.MONTH) {
      endDate = addMonths(startDate, 1);
    } else {
      endDate = addYears(startDate, 1);
    }

    // ENFORCE: 0 or 1 ACTIVE subscription per customer
    const existingActiveSub = await prisma.subscription.findFirst({
      where: {
        customerId,
        status: SubscriptionStatus.ACTIVE
      }
    });

    if (existingActiveSub) {
      throw new Error(`Customer ${customerId} already has an ACTIVE subscription. Please cancel it first.`);
    }

    return prisma.$transaction(async (tx: any) => {
      const subscription = await tx.subscription.create({
        data: {
          customerId,
          planId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
        },
      });

      // STEP 1 Requirement: No invoice generated yet. 
      // The Billing Job (Step 3) will pick this up and generate the invoice.

      return subscription;
    });
  }

  async cancelSubscription(subscriptionId: string, immediate = false) {
    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) throw new Error(`Subscription ${subscriptionId} not found`);

    if (immediate) {
      return prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
          // Force type check update
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      return prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
    }
  }

  // STEP 5: Mid-Cycle Plan Change (Proration)
  async changePlan(subscriptionId: string, newPlanId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, customer: true }
    });
    if (!subscription) throw new Error(`Subscription ${subscriptionId} not found`);
    if (subscription.status !== SubscriptionStatus.ACTIVE) throw new Error(`Subscription ${subscriptionId} is not ACTIVE`);
    if (subscription.planId === newPlanId) throw new Error(`Subscription is already on plan ${newPlanId}`);

    const newPlan = await prisma.plan.findUnique({ where: { id: newPlanId } });
    if (!newPlan) throw new Error(`Plan ${newPlanId} not found`);
    if (newPlan.currency !== subscription.customer.currency) throw new Error(`Currency mismatch`);

    const now = new Date();
    
    // Perform Proration via Transaction
    return prisma.$transaction(async (tx: any) => {
      // 1. Calculate Unused Amount on Old Plan
      // We need to credit the user for the remaining time on the old plan.
      // 2. Calculate Cost of New Plan for Remaining Period
      // We charge for the time from NOW until currentPeriodEnd.
      
      // Note: We are NOT changing the billing period. We are just swapping the plan within the current period.
      // Next billing cycle (renewal), the full new plan price will be charged.
      
      const totalDuration = subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime();
      const usedDuration = now.getTime() - subscription.currentPeriodStart.getTime();
      const remainingDuration = subscription.currentPeriodEnd.getTime() - now.getTime();
      
      const percentRemaining = remainingDuration / totalDuration;
      
      const planAmount = (subscription.plan.amount as unknown as Prisma.Decimal).toNumber();
      const newPlanAmountVal = (newPlan.amount as unknown as Prisma.Decimal).toNumber();

      // Credit for Old Plan (Negative amount)
      const unusedAmount = -1 * Math.round(planAmount * percentRemaining);
      
      // Charge for New Plan (Positive amount)
      const remainingAmount = Math.round(newPlanAmountVal * percentRemaining);
      
      const netAmount = unusedAmount + remainingAmount;
      
      // Update Subscription to New Plan
      const updatedSub = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlanId,
          updatedAt: now
        }
      });
      
      // Generate Proration Invoice (Immediate)
      // This is the ONE exception where an invoice is generated outside the billing job,
      // because it is triggered by a direct admin action (plan change).
      
      // Calculate Tax on Net Amount
      let taxAmount = 0;
      if (netAmount > 0) {
          const address = subscription.customer.address as any;
          const taxRequest: TaxRequest = {
            amount: netAmount,
            currency: newPlan.currency,
            customerAddress: { country: address?.country || 'US', state: address?.state, postalCode: address?.postalCode }
          };
          const taxResult = await this.taxService.calculateTax(taxRequest);
          taxAmount = taxResult.totalTaxAmount;
      }
      
      const invoice = await tx.invoice.create({
        data: {
          customerId: subscription.customerId,
          subscriptionId: subscription.id,
          status: 'OPEN', // or PAID if we had auto-charge
          billingReason: 'SUBSCRIPTION_UPDATE',
          date: now,
          amount: netAmount + taxAmount,
          subtotal: netAmount,
          currency: newPlan.currency,
          tax: taxAmount,
          dueDate: addMonths(now, 1), // Due in 30 days usually
          items: {
            create: [
              {
                description: `Unused time on ${subscription.plan.name} (${subscription.plan.interval})`,
                amount: unusedAmount,
                currency: newPlan.currency,
                type: InvoiceItemType.PRORATION,
                periodStart: now,
                periodEnd: subscription.currentPeriodEnd
              },
              {
                description: `Remaining time on ${newPlan.name} (${newPlan.interval})`,
                amount: remainingAmount,
                currency: newPlan.currency,
                type: InvoiceItemType.PRORATION,
                periodStart: now,
                periodEnd: subscription.currentPeriodEnd
              }
            ]
          }
        },
        include: { items: true }
      });
      
      return { subscription: updatedSub, invoice };
    });
  }

  async getSubscriptions() {
    return prisma.subscription.findMany({
      include: {
        plan: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscription(subscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, customer: true, invoices: true }
    });
  }

  async deleteSubscription(subscriptionId: string) {
    // Delete related invoices/items to ensure clean deletion?
    // Or just nullify? For test cleanup, deleting is better.
    return prisma.$transaction(async (tx) => {
      const invoices = await tx.invoice.findMany({ where: { subscriptionId }, select: { id: true } });
      const invoiceIds = invoices.map(i => i.id);
      
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.invoice.deleteMany({ where: { subscriptionId } });
      
      return tx.subscription.delete({ where: { id: subscriptionId } });
    });
  }

}
