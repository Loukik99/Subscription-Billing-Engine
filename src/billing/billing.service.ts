import { addMonths, addYears } from 'date-fns';
import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';
import { SubscriptionStatus, PlanInterval, InvoiceItemType, BillingReason } from '../types';
import { TaxService, SimpleTaxProvider } from '../tax/tax.service';
import { TaxRequest } from '../tax/tax.types';

export class BillingService {
  private taxService: TaxService;

  constructor() {
    this.taxService = new TaxService(new SimpleTaxProvider());
  }

  /**
   * Universal Billing Job (Step 3 & 6)
   * Scans ALL active subscriptions.
   * 1. Checks if they need renewal (Step 6) -> Advances period.
   * 2. Checks if they need an invoice for the current period (Step 3) -> Generates invoice.
   */
  async generateDueInvoices(targetDate: Date = new Date()): Promise<string[]> {
    const generatedInvoiceIds: string[] = [];

    // Find ALL active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
        customer: true
      }
    });

    for (const subscription of activeSubscriptions) {
      try {
        const result = await prisma.$transaction(async (tx: any) => {
          // Re-fetch to lock/ensure fresh state
          const sub = await tx.subscription.findUnique({ where: { id: subscription.id } });
          if (!sub || sub.status !== SubscriptionStatus.ACTIVE) return null;

          let currentPeriodStart = sub.currentPeriodStart;
          let currentPeriodEnd = sub.currentPeriodEnd;
          let billingReason = BillingReason.SUBSCRIPTION_CYCLE;
          let isRenewal = false;

          // STEP 6: RENEWAL CHECK
          // If the period has ended, we must advance it BEFORE generating the invoice.
          // Note: If sub is brand new (Step 1), start=now, end=next_month. condition is false.
          if (sub.currentPeriodEnd <= targetDate) {
             // CHECK FOR CANCELLATION
             if (sub.cancelAtPeriodEnd) {
                 await tx.subscription.update({
                     where: { id: sub.id },
                     data: { 
                         status: SubscriptionStatus.CANCELED,
                         canceledAt: new Date()
                     }
                 });
                 return null; // Stop processing
             }

             isRenewal = true;
             // Advance the period
             const nextPeriodStart = sub.currentPeriodEnd;
             const nextPeriodEnd = subscription.plan.interval === PlanInterval.MONTH 
               ? addMonths(nextPeriodStart, 1) 
               : addYears(nextPeriodStart, 1);
             
             // Update Subscription State
             await tx.subscription.update({
               where: { id: sub.id },
               data: {
                 currentPeriodStart: nextPeriodStart,
                 currentPeriodEnd: nextPeriodEnd,
                 updatedAt: new Date()
               }
             });

             // Update local vars for invoice generation
             currentPeriodStart = nextPeriodStart;
             currentPeriodEnd = nextPeriodEnd;
             billingReason = BillingReason.SUBSCRIPTION_CYCLE;
          } else {
             // Not a renewal. It's either a new subscription or mid-cycle.
             // If it's the very first invoice (created just now), use SUBSCRIPTION_CREATE
             // We can guess it's CREATE if createdAt is close to currentPeriodStart, but CYCLE is safer generically.
             // Let's check if ANY invoice exists.
             const invoiceCount = await tx.invoice.count({ where: { subscriptionId: sub.id } });
             if (invoiceCount === 0) {
               billingReason = BillingReason.SUBSCRIPTION_CREATE;
             }
          }

          // STEP 3: INVOICE CHECK
          // Does an invoice exist for this period?
          // We look for an invoice for this sub that has an item covering this period start.
          const existingInvoice = await tx.invoice.findFirst({
            where: {
              subscriptionId: sub.id,
              items: {
                some: {
                  periodStart: currentPeriodStart,
                  type: InvoiceItemType.SUBSCRIPTION
                }
              }
            }
          });

          if (existingInvoice) {
            return null; // Already billed for this period
          }

          // GENERATE INVOICE
          // Calculate Tax
          let address: any = {};
          try {
            address = typeof subscription.customer.address === 'string'
              ? JSON.parse(subscription.customer.address)
              : subscription.customer.address;
          } catch (e) {
            console.warn(`Failed to parse address for customer ${subscription.customerId}`, e);
            address = {};
          }
          
          const taxRequest: TaxRequest = {
            amount: subscription.plan.amount.toNumber(),
            currency: subscription.plan.currency,
            customerAddress: {
              country: address?.country || 'US',
              state: address?.state,
              postalCode: address?.postalCode
            }
          };
          
          const taxResult = await this.taxService.calculateTax(taxRequest);
          const taxAmount = taxResult.totalTaxAmount;

          const planAmount = (subscription.plan.amount as unknown as Prisma.Decimal).toNumber();

          const invoice = await tx.invoice.create({
            data: {
              customerId: subscription.customerId,
              subscriptionId: subscription.id,
              currency: subscription.plan.currency,
              status: 'OPEN',
              billingReason: billingReason,
              date: new Date(),
              dueDate: new Date(),
              amount: planAmount + taxAmount,
              subtotal: subscription.plan.amount,
              tax: taxAmount,
              items: {
                create: [
                  {
                    description: isRenewal ? `Renewal of ${subscription.plan.name}` : `Subscription to ${subscription.plan.name}`,
                    amount: subscription.plan.amount,
                    currency: subscription.plan.currency,
                    type: InvoiceItemType.SUBSCRIPTION,
                    periodStart: currentPeriodStart,
                    periodEnd: currentPeriodEnd
                  }
                ]
              }
            }
          });

          return invoice.id;
        });

        if (result) {
          generatedInvoiceIds.push(result);
        }

      } catch (error) {
        console.error(`Failed to process subscription ${subscription.id}:`, error);
        // Continue to next subscription
      }
    }

    return generatedInvoiceIds;
  }
}
