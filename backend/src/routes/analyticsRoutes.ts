import { Router } from 'express';
import { getDataMiningInsights } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/analytics/insights -> KDD data mining insights (donor clusters + demand patterns)
router.get('/insights', getDataMiningInsights);

export default router;
