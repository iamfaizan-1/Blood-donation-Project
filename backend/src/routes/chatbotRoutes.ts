import { Router } from 'express';
import { askChatbot } from '../controllers/chatbotController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// POST /api/chatbot/ask -> { message: string } => { intent, reply }
router.post('/ask', askChatbot);

export default router;
