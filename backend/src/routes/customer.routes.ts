import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
} from '../controllers/customer.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

export default router;
