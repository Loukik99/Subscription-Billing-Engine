import prisma from '../db/prisma';

export class DashboardService {
  async getSummary() {
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    const pendingInvoices = await prisma.invoice.count({
      where: { status: 'OPEN' },
    });

    // Billed Revenue: Sum of OPEN invoices (Obligation)
    const billedInvoices = await prisma.invoice.aggregate({
      _sum: {
        amount: true,
      },
      where: { status: 'OPEN' },
    });
    
    // Collected Revenue: Sum of PAYMENTS (Actual Cash)
    const collectedRevenue = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
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
        revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + p.amount);
      }
    });

    // Convert to array and sort
    const revenueHistory = Array.from(revenueMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      activeSubscriptions,
      pendingInvoices,
      totalRevenue: billedInvoices._sum.amount || 0, // Now represents OPEN invoices
      collectedRevenue: collectedRevenue._sum.amount || 0, // Now represents PAYMENTS
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
