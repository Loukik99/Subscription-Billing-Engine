import { Router } from 'express';
import { SubscriptionController } from './subscriptions.controller';

const router = Router();
const controller = new SubscriptionController();

router.post('/', controller.createSubscription);
router.get('/', controller.getSubscriptions);
router.get('/:id', controller.getSubscription);
router.post('/:id/cancel', controller.cancelSubscription);
router.post('/:id/change-plan', controller.changePlan);
router.delete('/:id', controller.deleteSubscription);

export default router;
