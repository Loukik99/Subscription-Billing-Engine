import { Request, Response } from 'express';
import { BillingService } from './billing.service';

export class BillingController {
  private billingService: BillingService;

  constructor() {
    this.billingService = new BillingService();
  }

  triggerBillingCycle = async (req: Request, res: Response) => {
    try {
      const { targetDate } = req.body;
      const date = targetDate ? new Date(targetDate) : new Date();
      
      const invoiceIds = await this.billingService.generateDueInvoices(date);
      res.json({ 
        message: 'Billing cycle completed', 
        generatedInvoices: invoiceIds.length,
        invoiceIds 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
