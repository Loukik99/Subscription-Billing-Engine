import { PrismaClient, Subscription, Plan } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { differenceInSeconds, getUnixTime } from 'date-fns';

export class ProrationService {
  /**
   * Calculates the proration amount for a subscription change.
   * 
   * Strategy:
   * 1. Calculate the % of time remaining in the current billing period.
   * 2. Calculate the unused portion of the *current* plan's cost (Credit).
   * 3. Calculate the cost of the *new* plan for the remaining period (Charge).
   * 4. Net amount = Charge - Credit.
   * 
   * Rounding:
   * - We use BigNumber for calculations.
   * - We round to the nearest integer (cents) at the very end.
   * - Rounding mode: ROUND_HALF_UP (common for currency).
   */
  calculateProration(
    currentSubscription: Subscription & { plan: Plan },
    newPlan: Plan,
    prorationDate: Date = new Date()
  ): { amount: number; credit: number; charge: number; periodStart: Date; periodEnd: Date } {
    
    const periodStart = currentSubscription.currentPeriodStart;
    const periodEnd = currentSubscription.currentPeriodEnd;

    // If we are outside the period (shouldn't happen for active subs), return 0
    if (prorationDate < periodStart || prorationDate >= periodEnd) {
      return { amount: 0, credit: 0, charge: 0, periodStart: prorationDate, periodEnd };
    }

    const totalDurationSeconds = differenceInSeconds(periodEnd, periodStart);
    const usedDurationSeconds = differenceInSeconds(prorationDate, periodStart);
    const remainingDurationSeconds = differenceInSeconds(periodEnd, prorationDate);

    if (totalDurationSeconds <= 0) {
      return { amount: 0, credit: 0, charge: 0, periodStart: prorationDate, periodEnd };
    }

    // Calculate ratio of remaining time
    // using BigNumber for precision
    const totalDuration = new BigNumber(totalDurationSeconds);
    const remainingDuration = new BigNumber(remainingDurationSeconds);
    
    // precision: 20 decimal places for intermediate ratio
    const remainingRatio = remainingDuration.dividedBy(totalDuration); 

    // 1. Unused portion of current plan (Credit)
    const currentPlanAmount = new BigNumber(currentSubscription.plan.amount.toString());
    const unusedCurrentValue = currentPlanAmount.multipliedBy(remainingRatio);
    
    // 2. Cost of new plan for remaining period (Charge)
    const newPlanAmount = new BigNumber(newPlan.amount.toString());
    const costForRemainingPeriod = newPlanAmount.multipliedBy(remainingRatio);

    // 3. Round components first to ensure invoice consistency
    // (Charge - Credit = Amount) should hold true for the final rounded numbers.
    const credit = unusedCurrentValue.decimalPlaces(0, BigNumber.ROUND_HALF_UP);
    const charge = costForRemainingPeriod.decimalPlaces(0, BigNumber.ROUND_HALF_UP);
    const amount = charge.minus(credit);
    
    return {
      amount: amount.toNumber(),
      credit: credit.toNumber(),
      charge: charge.toNumber(),
      periodStart: prorationDate,
      periodEnd: periodEnd
    };
  }
}
