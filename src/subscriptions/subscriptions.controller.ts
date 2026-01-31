import { Request, Response } from 'express';
import { SubscriptionService } from './subscriptions.service';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  getSubscriptions = async (req: Request, res: Response) => {
    try {
      const subscriptions = await this.subscriptionService.getSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createSubscription = async (req: Request, res: Response) => {
    try {
      const { customerId, planId } = req.body;
      if (!customerId || !planId) {
        return res.status(400).json({ error: 'customerId and planId are required' });
      }

      const subscription = await this.subscriptionService.createSubscription(customerId, planId);
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cancelSubscription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { immediate } = req.body;
      const subscription = await this.subscriptionService.cancelSubscription(id as string, immediate);
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getSubscription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const subscription = await this.subscriptionService.getSubscription(id as string);
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  changePlan = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPlanId } = req.body;
      if (!newPlanId) {
        return res.status(400).json({ error: 'newPlanId is required' });
      }

      const subscription = await this.subscriptionService.changePlan(id as string, newPlanId);
      res.json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteSubscription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.subscriptionService.deleteSubscription(id as string);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
