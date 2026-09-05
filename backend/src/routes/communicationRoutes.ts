import { Router } from 'express';
import {
  getChatHistory,
  reportUser,
  blockUser,
  getSecureContact,
} from '../controllers/communicationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all communication endpoints with JWT authentication
router.use(authenticate);

router.get('/messages/:requestId', getChatHistory);
router.post('/report', reportUser);
router.post('/block', blockUser);
router.get('/contact/:requestId', getSecureContact);

export default router;
