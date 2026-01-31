import { Request, Response } from 'express';
import { PlansService } from './plans.service';

export class PlansController {
  private plansService: PlansService;

  constructor() {
    this.plansService = new PlansService();
  }

  createPlan = async (req: Request, res: Response) => {
    try {
      const plan = await this.plansService.createPlan(req.body);
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getPlans = async (req: Request, res: Response) => {
    try {
      const plans = await this.plansService.getPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  deletePlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.plansService.deletePlan(id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
