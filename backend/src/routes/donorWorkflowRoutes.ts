import { Router } from 'express';
import {
  notifyDonors,
  getMyNotifications,
  acceptRequest,
  declineRequest,
  getRequestDetails,
  advanceStatus,
} from '../controllers/donorWorkflowController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All donor workflow routes require authentication
router.use(authenticate);

// Requester dispatches notifications to matched donors
router.post('/notify/:requestId', notifyDonors);

// Donor views their pending request notifications
router.get('/notifications', getMyNotifications);

// Donor accepts a request
router.post('/accept/:notificationId', acceptRequest);

// Donor declines a request
router.post('/decline/:notificationId', declineRequest);

// Get accepted request details with privacy-gated contact info
router.get('/request-details/:requestId', getRequestDetails);

// Advance request status through workflow stages
router.patch('/advance/:requestId', advanceStatus);

export default router;
