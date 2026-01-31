import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.get('/summary', controller.getSummary);
router.get('/system', controller.getSystemStatus);

export default router;
