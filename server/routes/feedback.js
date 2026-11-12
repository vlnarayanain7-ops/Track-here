import express from 'express';
import { submitFeedback, listFeedback } from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';
import { feedbackLimiter } from '../middleware/rateLimiter.js';
import csrfProtection from '../middleware/csrf.js';

const router = express.Router();

// Submit feedback: auth required, strict rate limiting (5 req/min per user), csrf protection
router.post('/', authenticate, csrfProtection, feedbackLimiter, submitFeedback);

// List feedbacks: strictly restricted to authenticated user's own feedback
router.get('/', authenticate, listFeedback);

export default router;
