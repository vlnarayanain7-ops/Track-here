import { Router } from 'express';
import { weekly, saveDaily, getDaily } from '../controllers/reportsController.js';
import auth from '../middleware/auth.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/weekly', weekly);
router.post('/daily', saveDaily);
router.get('/daily/:date', getDaily);

export default router;
