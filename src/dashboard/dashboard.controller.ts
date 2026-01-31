import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getSummary = async (req: Request, res: Response) => {
    try {
      const summary = await this.dashboardService.getSummary();
      res.json(summary);
    } catch (error: any) {
      console.error('Dashboard Error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  getSystemStatus = async (req: Request, res: Response) => {
    try {
      const status = await this.dashboardService.getSystemStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
