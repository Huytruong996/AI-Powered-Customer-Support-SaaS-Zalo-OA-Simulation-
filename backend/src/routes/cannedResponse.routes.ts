import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from '../controllers/cannedResponse.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getCannedResponses);
router.post('/', createCannedResponse);
router.put('/:id', updateCannedResponse);
router.delete('/:id', deleteCannedResponse);

export default router;
