import { Request, Response } from 'express';
import { PortalService } from './portal.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class PortalController {
  private service: PortalService;

  constructor() {
    this.service = new PortalService();
  }

  getDashboard = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const customerId = authReq.user?.customerId;
      if (!customerId) throw new Error('Unauthorized');
      const data = await this.service.getDashboard(customerId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getSubscription = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const customerId = authReq.user?.customerId;
      if (!customerId) throw new Error('Unauthorized');
      const data = await this.service.getSubscription(customerId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getInvoices = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const customerId = authReq.user?.customerId;
      if (!customerId) throw new Error('Unauthorized');
      const data = await this.service.getInvoices(customerId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getInvoiceDetail = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const customerId = authReq.user?.customerId;
      if (!customerId) throw new Error('Unauthorized');
      const { id } = req.params;
      const data = await this.service.getInvoiceDetail(customerId, id as string);
      res.json(data);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };
}
