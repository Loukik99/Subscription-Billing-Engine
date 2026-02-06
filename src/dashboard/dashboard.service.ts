import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';

export class DashboardService {
  async getSummary() {
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    const pendingInvoices = await prisma.invoice.count({
      where: { status: 'OPEN' },
    });

    // Billed Revenue: Sum ONLY invoices where status = 'OPEN'
    const billedInvoices = await prisma.invoice.aggregate({
      _sum: {
        amount: true,
      },
      where: { status: 'OPEN' },
    });
    
    // Collected Revenue: Sum ONLY payments where status = 'SUCCESS'
    const collectedRevenue = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: { status: 'SUCCESS' },
    });

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
      },
    });

    // Calculate revenue history (last 30 days) based on PAYMENTS
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const periodPayments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: 'SUCCESS',
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const revenueMap = new Map<string, number>();
    
    // Initialize last 30 days with 0
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revenueMap.set(dateStr, 0);
    }

    // Fill with data from PAYMENTS
    periodPayments.forEach((p) => {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      if (revenueMap.has(dateStr)) {
        const amount = (p.amount as unknown as Prisma.Decimal).toNumber();
        revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + amount);
      }
    });

    // Convert to array and sort
    const revenueHistory = Array.from(revenueMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = billedInvoices._sum.amount ? (billedInvoices._sum.amount as unknown as Prisma.Decimal).toNumber() : 0;
    const collectedRevenueAmount = collectedRevenue._sum.amount ? (collectedRevenue._sum.amount as unknown as Prisma.Decimal).toNumber() : 0;

    return {
      activeSubscriptions,
      pendingInvoices,
      totalRevenue, // Now represents OPEN invoices
      collectedRevenue: collectedRevenueAmount, // Now represents PAYMENTS
      recentInvoices,
      revenueHistory,
    };
  }

  async getSystemStatus() {
    // In a real system, we'd check job logs. 
    // Here we'll just check the DB connectivity and latest data.
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: 'operational',
      lastBillingRun: lastInvoice?.createdAt || null,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
