import { Router } from 'express';
import {
  createDonation,
  completeDonation,
  getDonationHistory,
} from '../controllers/donationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all donation routes
router.use(authenticate);

router.post('/', createDonation);
router.patch('/:id/complete', completeDonation);
router.get('/history', getDonationHistory);

export default router;
