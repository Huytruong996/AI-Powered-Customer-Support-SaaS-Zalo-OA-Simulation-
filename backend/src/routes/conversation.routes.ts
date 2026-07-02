import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getConversations,
  getConversationById,
  sendMessage,
  getConversationStats,
  toggleBotStatus,
} from '../controllers/conversation.controller';

const router = Router();

// All conversation routes are protected
router.use(authMiddleware);

router.get('/stats', getConversationStats);
router.get('/', getConversations);
router.get('/:id', getConversationById);
router.post('/:id/messages', sendMessage);
router.patch('/:id/bot-status', toggleBotStatus);

export default router;
