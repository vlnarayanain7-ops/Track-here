import { Router } from 'express';
import { search } from '../controllers/searchController.js';
import auth from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/', searchLimiter, search);

export default router;

