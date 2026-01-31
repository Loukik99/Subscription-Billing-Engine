import { Request, Response } from 'express';
import { InvoicesService } from './invoices.service';

export class InvoicesController {
  private invoicesService: InvoicesService;

  constructor() {
    this.invoicesService = new InvoicesService();
  }

  getInvoices = async (req: Request, res: Response) => {
    try {
      const invoices = await this.invoicesService.getInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getInvoice = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const invoice = await this.invoicesService.getInvoice(id as string);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  payInvoice = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const invoice = await this.invoicesService.payInvoice(id as string);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
