import { Router } from 'express';
import subscriptionRoutes from '../subscriptions/subscriptions.routes';
import billingRoutes from '../billing/billing.routes';
import plansRoutes from '../plans/plans.routes';
import invoicesRoutes from '../invoices/invoices.routes';
import dashboardRoutes from '../dashboard/dashboard.routes';
import customersRoutes from '../customers/customers.routes';
import portalRoutes from '../portal/portal.routes';
import authRoutes from '../auth/auth.routes';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/portal', portalRoutes); // Portal routes handle their own auth

// Admin protected routes
router.use('/subscriptions', authenticateToken, requireAdmin, subscriptionRoutes);
router.use('/billing', authenticateToken, requireAdmin, billingRoutes);
router.use('/plans', plansRoutes);
router.use('/invoices', authenticateToken, requireAdmin, invoicesRoutes);
router.use('/dashboard', authenticateToken, requireAdmin, dashboardRoutes);
router.use('/customers', authenticateToken, requireAdmin, customersRoutes);

export default router;
