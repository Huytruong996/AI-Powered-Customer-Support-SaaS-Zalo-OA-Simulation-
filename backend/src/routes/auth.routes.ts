import { Router } from 'express';
import { login, register, getMe, logout, demoLogin } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/logout', logout);
router.post('/register', register);
router.get('/me', authMiddleware , getMe);
router.post('/demo', demoLogin);

export default router;
