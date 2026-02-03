import { SubscriptionService } from '../src/subscriptions/subscriptions.service';
import { ProrationService } from '../src/billing/proration.service';
import prisma from '../src/db/prisma';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, Prisma } from '@prisma/client';
import { PlanInterval, SubscriptionStatus } from '../src/types';
import BigNumber from 'bignumber.js';

jest.mock('../src/db/prisma', () => {
  const { mockDeep } = require('jest-mock-extended');
  return {
    __esModule: true,
    default: mockDeep(),
  };
});

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('ProrationService', () => {
  let prorationService: ProrationService;

  beforeEach(() => {
    prorationService = new ProrationService();
  });

  it('should calculate correct proration for upgrade mid-month', () => {
    // Scenario:
    // Plan A: $10/month
    // Plan B: $20/month
    // Upgrade exactly halfway through the month (15 days in 30 day month)
    // Remaining time: 50%
    // Unused Plan A: $5
    // Cost Plan B (50%): $10
    // Net Charge: $5 (500 cents)

    const startDate = new Date('2024-04-01T00:00:00Z');
    const endDate = new Date('2024-05-01T00:00:00Z'); // 30 days
    const upgradeDate = new Date('2024-04-16T00:00:00Z'); // Exactly 15 days later

    const currentPlan = {
      id: 'basic',
      name: 'Basic',
      interval: PlanInterval.MONTH,
      currency: 'USD',
      amount: new Prisma.Decimal(1000), // $10.00
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newPlan = {
      ...currentPlan,
      id: 'pro',
      amount: new Prisma.Decimal(2000), // $20.00
    };

    const subscription = {
      id: 'sub_1',
      customerId: 'cust_1',
      planId: 'basic',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      canceledAt: null,
      cancelAtPeriodEnd: false,
      createdAt: startDate,
      updatedAt: startDate,
      plan: currentPlan
    };

    const result = prorationService.calculateProration(subscription, newPlan, upgradeDate);

    expect(result.periodStart).toEqual(upgradeDate);
    expect(result.periodEnd).toEqual(endDate);
    
    // Exact calculation:
    // Total seconds: 30 * 24 * 3600 = 2,592,000
    // Used seconds: 15 * 24 * 3600 = 1,296,000 (Exactly half)
    // Ratio: 0.5
    // Credit: 1000 * 0.5 = 500
    // Charge: 2000 * 0.5 = 1000
    // Net: 500
    
    expect(result.credit).toBe(500);
    expect(result.charge).toBe(1000);
    expect(result.amount).toBe(500);
  });

  it('should calculate correct proration for downgrade mid-month', () => {
    // Scenario:
    // Plan A: $20/month
    // Plan B: $10/month
    // Downgrade halfway
    // Credit: $10 (1000 cents)
    // Charge: $5 (500 cents)
    // Net: -$5 (-500 cents)

    const startDate = new Date('2024-04-01T00:00:00Z');
    const endDate = new Date('2024-05-01T00:00:00Z');
    const downgradeDate = new Date('2024-04-16T00:00:00Z');

    const currentPlan = {
      id: 'pro',
      name: 'Pro',
      interval: PlanInterval.MONTH,
      currency: 'USD',
      amount: new Prisma.Decimal(2000), // $20.00
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newPlan = {
      ...currentPlan,
      id: 'basic',
      amount: new Prisma.Decimal(1000), // $10.00
    };

    const subscription = {
      id: 'sub_1',
      customerId: 'cust_1',
      planId: 'pro',
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      canceledAt: null,
      cancelAtPeriodEnd: false,
      createdAt: startDate,
      updatedAt: startDate,
      plan: currentPlan
    };

    const result = prorationService.calculateProration(subscription, newPlan, downgradeDate);

    expect(result.credit).toBe(1000);
    expect(result.charge).toBe(500);
    expect(result.amount).toBe(-500);
  });

  it('should handle rounding correctly', () => {
     // Scenario with non-even numbers
     // Plan A: $10 (1000 cents)
     // Upgrade at 1/3 of the month
     // Remaining: 2/3
     // Credit: 1000 * 2/3 = 666.666... -> 667
     
     const startDate = new Date('2024-04-01T00:00:00Z');
     const endDate = new Date('2024-05-01T00:00:00Z'); // 30 days
     // 10 days used
     const upgradeDate = new Date('2024-04-11T00:00:00Z'); 

     const currentPlan = {
       id: 'basic',
       name: 'Basic',
       interval: PlanInterval.MONTH,
       currency: 'USD',
       amount: new Prisma.Decimal(1000),
       active: true,
       createdAt: new Date(),
       updatedAt: new Date(),
     };

     const newPlan = { ...currentPlan, id: 'pro', amount: new Prisma.Decimal(2000) };

     const subscription = {
       id: 'sub_1',
       customerId: 'cust_1',
       planId: 'basic',
       status: SubscriptionStatus.ACTIVE,
       currentPeriodStart: startDate,
       currentPeriodEnd: endDate,
       canceledAt: null,
       cancelAtPeriodEnd: false,
       createdAt: startDate,
       updatedAt: startDate,
       plan: currentPlan
     };

     const result = prorationService.calculateProration(subscription, newPlan, upgradeDate);
     
     // Used: 10 days. Remaining: 20 days.
     // Ratio: 20/30 = 0.6666666667
     
     // Credit: 1000 * 0.666666... = 666.66... -> 667 (Half Up)
     // Charge: 2000 * 0.666666... = 1333.33... -> 1333 (Half Up)
     // Net: 1333 - 667 = 666
     
     expect(result.credit).toBe(667);
     expect(result.charge).toBe(1333);
     expect(result.amount).toBe(666);
  });
});
