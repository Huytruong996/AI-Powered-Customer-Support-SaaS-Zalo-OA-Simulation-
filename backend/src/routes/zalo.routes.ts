import { Router } from 'express';
import { verifyWebhook, handleWebhook } from '../controllers/zalo.controller';
import { getZaloConfig, updateZaloConfig } from '../controllers/zalo.config.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

router.get('/config', authMiddleware, getZaloConfig);
router.put('/config', authMiddleware, updateZaloConfig);

export default router;
