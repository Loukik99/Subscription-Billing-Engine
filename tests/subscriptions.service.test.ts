import { addMonths } from 'date-fns';
import { SubscriptionService } from '../src/subscriptions/subscriptions.service';
import prisma from '../src/db/prisma';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PlanInterval, SubscriptionStatus } from '../src/types';

jest.mock('../src/db/prisma', () => {
  const { mockDeep } = require('jest-mock-extended');
  return {
    __esModule: true,
    default: mockDeep(),
  };
});

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
    jest.clearAllMocks();
    
    // Default transaction mock
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback(prismaMock);
    });
  });

  describe('createSubscription', () => {
    const customerId = 'cust_123';
    const planId = 'plan_monthly';
    const mockCustomer = {
      id: customerId,
      email: 'test@example.com',
      currency: 'USD',
      name: 'Test',
      address: '{"country":"US","state":"NY"}',
      region: 'US', // Added missing region field
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockPlan = {
      id: planId,
      name: 'Pro Monthly',
      interval: PlanInterval.MONTH,
      currency: 'USD',
      amount: 1000,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a subscription with correct dates for monthly plan', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(mockCustomer);
      prismaMock.plan.findUnique.mockResolvedValue(mockPlan);
      prismaMock.subscription.create.mockResolvedValue({
        id: 'sub_123',
        customerId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelAtPeriodEnd: false, // Force type update
      });
      prismaMock.invoice.create.mockResolvedValue({ id: 'inv_init' } as any);

      await service.createSubscription(customerId, planId);

      expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({ where: { id: customerId } });
      expect(prismaMock.plan.findUnique).toHaveBeenCalledWith({ where: { id: planId } });
      
      const createCall = prismaMock.subscription.create.mock.calls[0][0];
      expect(createCall.data.customerId).toBe(customerId);
      expect(createCall.data.planId).toBe(planId);
      expect(createCall.data.status).toBe(SubscriptionStatus.ACTIVE);
      
      // expect(prismaMock.invoice.create).toHaveBeenCalled();

      // Check dates roughly
      const now = new Date();
      const start = createCall.data.currentPeriodStart as Date;
      const end = createCall.data.currentPeriodEnd as Date;
      
      expect(start.getTime()).toBeCloseTo(now.getTime(), -3); // within 1s
      // End should be approx 1 month later
      const expectedEnd = addMonths(start, 1);
      expect(end.getTime()).toBeCloseTo(expectedEnd.getTime(), -3);
    });

    it('should throw error on currency mismatch', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({ ...mockCustomer, currency: 'EUR' });
      prismaMock.plan.findUnique.mockResolvedValue(mockPlan);

      await expect(service.createSubscription(customerId, planId))
        .rejects.toThrow('Currency mismatch');
    });
  });

  describe('cancelSubscription', () => {
    const subscriptionId = 'sub_cancel';
    const mockSubscription = {
      id: subscriptionId,
      customerId: 'cust_1',
      planId: 'plan_1',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      canceledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      cancelAtPeriodEnd: false
    };

    it('should cancel immediately when immediate=true', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prismaMock.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        cancelAtPeriodEnd: false
      } as any);

      await service.cancelSubscription(subscriptionId, true);

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: expect.objectContaining({
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: false
        })
      });
    });

    it('should schedule cancellation at period end when immediate=false', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(mockSubscription as any);
      prismaMock.subscription.update.mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true
      } as any);

      await service.cancelSubscription(subscriptionId, false);

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true
        }
      });
    });
  });

  describe('changePlan', () => {
     it('should change plan and generate invoice items', async () => {
       const subscriptionId = 'sub_1';
       const oldPlanId = 'plan_a';
       const newPlanId = 'plan_b';
       
       const oldPlan = { id: oldPlanId, amount: 1000, currency: 'USD', interval: PlanInterval.MONTH, name: 'Plan A', active: true, createdAt: new Date(), updatedAt: new Date() };
       const newPlan = { id: newPlanId, amount: 2000, currency: 'USD', interval: PlanInterval.MONTH, name: 'Plan B', active: true, createdAt: new Date(), updatedAt: new Date() };
       
       const subscription = {
         id: subscriptionId,
         planId: oldPlanId,
         customerId: 'cust_1',
         status: SubscriptionStatus.ACTIVE,
         currentPeriodStart: new Date(),
         currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // +30 days
         plan: oldPlan,
          customer: {
            id: 'cust_1',
            email: 'test@example.com',
            address: '{"country":"US","state":"NY"}',
            currency: 'USD'
         },
         canceledAt: null, createdAt: new Date(), updatedAt: new Date(),
         cancelAtPeriodEnd: false
       };

       prismaMock.subscription.findUnique.mockResolvedValue(subscription as any);
       prismaMock.plan.findUnique.mockResolvedValue(newPlan);
       
       // Mock Transaction
       // Already mocked in beforeEach
       
       prismaMock.subscription.update.mockResolvedValue({ ...subscription, planId: newPlanId } as any);
       prismaMock.invoice.create.mockResolvedValue({ id: 'inv_1' } as any);

       await service.changePlan(subscriptionId, newPlanId);

       expect(prismaMock.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
         where: { id: subscriptionId },
         data: expect.objectContaining({ planId: newPlanId })
       }));

       expect(prismaMock.invoice.create).toHaveBeenCalled();
     });
  });
});
