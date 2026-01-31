import { Router } from 'express';
import { PlansController } from './plans.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
const controller = new PlansController();

router.get('/', controller.getPlans);

// Protected routes
router.use(authenticateToken, requireAdmin);
router.post('/', controller.createPlan);
router.delete('/:id', controller.deletePlan);

export default router;
