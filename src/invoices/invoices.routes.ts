import { Router } from 'express';
import { InvoicesController } from './invoices.controller';

const router = Router();
const controller = new InvoicesController();

router.get('/', controller.getInvoices);
router.get('/:id', controller.getInvoice);
router.post('/:id/pay', controller.payInvoice);

export default router;
