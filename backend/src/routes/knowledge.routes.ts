import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { createKnowledge, getKnowledgeList, deleteKnowledge } from '../controllers/knowledge.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', createKnowledge);
router.get('/', getKnowledgeList);
router.delete('/:id', deleteKnowledge);

export default router;
