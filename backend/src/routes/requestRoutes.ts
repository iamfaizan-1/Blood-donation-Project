import { Router } from 'express';
import {
  createRequest,
  getActiveRequests,
  getMatchingDonors,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
} from '../controllers/requestController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBloodRequest } from '../middleware/validate.js';

const router = Router();

// Public routes for donors
router.get('/', getActiveRequests);
router.get('/match/donors', getMatchingDonors);
router.get('/:id', getRequestById);

// Protected routes
router.post('/', authenticate, validateBloodRequest, createRequest);
router.get('/user/my-requests', authenticate, getMyRequests);
router.patch('/:id/status', authenticate, updateRequestStatus);

export default router;
