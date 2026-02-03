import { Prisma } from '@prisma/client';
import { BillingService } from '../src/billing/billing.service';
import prisma from '../src/db/prisma';
import { SubscriptionStatus, PlanInterval, BillingReason } from '../src/types';
import { addMonths } from 'date-fns';

// Mock Prisma
jest.mock('../src/db/prisma', () => ({
  __esModule: true,
  default: {
    subscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock TaxService
jest.mock('../src/tax/tax.service', () => {
    return {
        TaxService: jest.fn().mockImplementation(() => ({
            calculateTax: jest.fn().mockResolvedValue({ totalTaxAmount: 0, rate: 0, components: [] })
        })),
        SimpleTaxProvider: jest.fn()
    };
});

const prismaMock = prisma as unknown as {
  subscription: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  invoice: {
    create: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService();
    jest.clearAllMocks();
    
    // Default transaction mock
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback(prismaMock);
    });
  });

  describe('generateDueInvoices', () => {
    it('should generate invoices for subscriptions that are due', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const subId = 'sub_due';
      const plan = {
          id: 'plan_1',
          amount: new Prisma.Decimal(1000),
          currency: 'USD',
          interval: PlanInterval.MONTH,
          name: 'Pro Plan'
      };
      const customer = {
          id: 'cust_1',
          address: '{"country":"US","state":"NY"}'
      };

      const subscription = {
        id: subId,
        customerId: 'cust_1',
        planId: 'plan_1',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: yesterday, // Due
        plan,
        customer
      };

      prismaMock.subscription.findMany.mockResolvedValue([subscription]);
      prismaMock.subscription.findUnique.mockResolvedValue(subscription); // Inside transaction
      prismaMock.invoice.create.mockResolvedValue({ id: 'inv_new' });

      const result = await service.generateDueInvoices();

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('inv_new');
      
      // Verify findMany called with correct query
      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
              status: SubscriptionStatus.ACTIVE,
          }),
          include: {
            plan: true,
            customer: true
          }
      }));

      // Verify Invoice Creation
      expect(prismaMock.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
              subscriptionId: subId,
              billingReason: BillingReason.SUBSCRIPTION_CYCLE,
              amount: 1000, // Tax is 0 in mock
          })
      }));

      // Verify Subscription Update (New period)
      const expectedNewEnd = addMonths(yesterday, 1);
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
          where: { id: subId },
          data: expect.objectContaining({
              currentPeriodStart: yesterday,
              currentPeriodEnd: expectedNewEnd
          })
      }));
    });

    it('should skip subscriptions that are not due (double check)', async () => {
        // Scenario: findMany returns it (maybe race condition), but findUnique sees it's updated
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        
        const subId = 'sub_future';
        const subscription = {
          id: subId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: futureDate, // Not due
          customer: { address: '{}' },
          plan: { currency: 'USD', amount: 100 },
          customerId: 'cust_1'
        };
  
        // findMany returns it (simulating it WAS due when queried)
        prismaMock.subscription.findMany.mockResolvedValue([subscription]);
        // findUnique returns it with FUTURE date (simulating another worker updated it)
        prismaMock.subscription.findUnique.mockResolvedValue(subscription);
        
        // Mock invoice.findFirst to return something so it skips invoice generation
        // Or assume it proceeds to check invoice and finds one?
        // The test says "should skip".
        // If it's not due, it checks if invoice exists.
        // We want it to skip generating invoice.
        // So let's mock findFirst to return an invoice.
        prismaMock.invoice.findFirst.mockResolvedValue({ id: 'inv_existing' });

        const result = await service.generateDueInvoices();
  
        expect(result).toHaveLength(0);
        expect(prismaMock.invoice.create).not.toHaveBeenCalled();
        expect(prismaMock.subscription.update).not.toHaveBeenCalled();
      });
  });
});
