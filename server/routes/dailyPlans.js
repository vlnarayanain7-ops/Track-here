import { Router } from 'express';
import {
  getDailyPlans,
  getDailyPlan,
  createDailyPlan,
  updateDailyPlan,
  createDailyPlanSchema,
  updateDailyPlanSchema,
} from '../controllers/dailyPlanController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/', getDailyPlans);
router.get('/:date', getDailyPlan);
router.post('/', validate(createDailyPlanSchema), createDailyPlan);
router.put('/:date', validate(updateDailyPlanSchema), updateDailyPlan);

export default router;

