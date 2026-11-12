import { Router } from 'express';
import {
  getDailyReviews,
  getDailyReview,
  createDailyReview,
  updateDailyReview,
  createDailyReviewSchema,
  updateDailyReviewSchema,
} from '../controllers/dailyReviewController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/', getDailyReviews);
router.get('/:date', getDailyReview);
router.post('/', validate(createDailyReviewSchema), createDailyReview);
router.put('/:date', validate(updateDailyReviewSchema), updateDailyReview);

export default router;

