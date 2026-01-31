import { Router } from 'express';
import { CustomersController } from './customers.controller';

const router = Router();
const controller = new CustomersController();

router.get('/', controller.getCustomers);
router.get('/:id', controller.getCustomer);
router.post('/', controller.createCustomer);
router.delete('/:id', controller.deleteCustomer);

export default router;
