import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verify } from '../lib/milestones.js';

const router = Router();

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many verification attempts. Please try again later.' },
});

router.get('/:serial', verifyLimiter, verify);

export default router;
