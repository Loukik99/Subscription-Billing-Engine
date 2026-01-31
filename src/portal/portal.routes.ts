import { Router } from 'express';
import { PortalController } from './portal.controller';
import { authenticateToken, requireCustomer } from '../middleware/auth.middleware';

const router = Router();
const controller = new PortalController();

// All portal routes require authentication and customer role
router.use(authenticateToken, requireCustomer);

router.get('/me', controller.getDashboard);
router.get('/me/subscription', controller.getSubscription);
router.get('/me/invoices', controller.getInvoices);
router.get('/me/invoices/:id', controller.getInvoiceDetail);

export default router;
