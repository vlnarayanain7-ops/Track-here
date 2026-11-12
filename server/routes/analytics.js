import { Router } from 'express';
import {
  getDashboard,
  getStudyTime,
  getCategories,
  getWeeklySummary,
  getStreaks,
  getHeatmap,
  getConsistency,
} from '../controllers/analyticsController.js';
import auth from '../middleware/auth.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/', getDashboard);
router.get('/dashboard', getDashboard);
router.get('/study-time', getStudyTime);
router.get('/categories', getCategories);
router.get('/weekly-summary', getWeeklySummary);
router.get('/streaks', getStreaks);
router.get('/heatmap', getHeatmap);
router.get('/consistency', getConsistency);

export default router;

