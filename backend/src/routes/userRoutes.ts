import { Router } from 'express';
import {
  getCurrentUser,
  updateProfile,
  updateAvailability,
  updatePushToken,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all user routes with JWT authentication
router.use(authenticate);

router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);
router.patch('/availability', updateAvailability);
router.post('/push-token', updatePushToken);

export default router;
