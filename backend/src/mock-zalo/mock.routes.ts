import { Router } from 'express';
import { sendMockWebhook } from './mock.controller';

const router = Router();

router.post('/send-to-webhook', sendMockWebhook);

export default router;
