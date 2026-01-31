import prisma from '../db/prisma';
import { Plan } from '@prisma/client';
import { PlanInterval } from '../types';

export class PlansService {
  async createPlan(data: {
    id: string;
    name: string;
    interval: PlanInterval;
    currency: string;
    amount: number;
  }): Promise<Plan> {
    return prisma.plan.create({
      data: {
        ...data,
        active: true,
      },
    });
  }

  async getPlans(): Promise<Plan[]> {
    return prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePlan(id: string): Promise<Plan> {
    return prisma.plan.delete({
      where: { id },
    });
  }
}
