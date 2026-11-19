import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  logout,
  refresh,
  getMe,
  getSession,
  forgotPassword,
  resetPassword,
  getCsrfToken,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/authController.js';
import auth, { authenticateOptional } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.get('/session', authenticateOptional, getSession);
router.get('/csrf', getCsrfToken);
// These endpoints issue authentication cookies, so they also require the
// double-submit token. The client fetches `/csrf` during app bootstrap.
router.post('/register', authLimiter, csrfProtection, validate(registerSchema), register);
router.post('/login', authLimiter, csrfProtection, validate(loginSchema), login);
router.post('/google', authLimiter, csrfProtection, googleAuth);
router.post('/logout', csrfProtection, logout);
router.post('/refresh', csrfProtection, refresh);
router.get('/me', auth, getMe);
router.post('/forgot-password', authLimiter, csrfProtection, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', authLimiter, csrfProtection, validate(resetPasswordSchema), resetPassword);

export default router;

