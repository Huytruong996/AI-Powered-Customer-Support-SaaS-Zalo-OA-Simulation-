import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  suggestReply,
  suggestReplyStream,
  autoReply,
  getAIConfig,
  updateAIConfig,
} from '../controllers/ai.controller';

const router = Router();

router.use(authMiddleware);

router.post('/suggest', suggestReply);
router.post('/suggest-stream', suggestReplyStream);
router.post('/auto-reply', autoReply);
router.get('/config', getAIConfig);
router.put('/config', updateAIConfig);

export default router;
