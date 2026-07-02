import { Router } from 'express';
import { login, register, getMe, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/logout', logout);
router.post('/register', register);
router.get('/me', authMiddleware , getMe);

export default router;
