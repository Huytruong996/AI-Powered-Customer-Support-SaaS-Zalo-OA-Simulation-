import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { sendMockWebhook } from './mock.controller';

const router = Router();

// Protected: only authenticated users can trigger mock webhooks (prevents AI quota abuse)
router.post('/send-to-webhook', authMiddleware, sendMockWebhook);

export default router;
