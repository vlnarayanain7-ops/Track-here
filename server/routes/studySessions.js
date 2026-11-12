import { Router } from 'express';
import {
  getSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  startTimer,
  pauseTimer,
  resumeTimer,
  finishTimer,
  getActiveTimer,
  createSessionSchema,
  updateSessionSchema,
  startTimerSchema,
} from '../controllers/studySessionController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

// Timer specific routes
router.get('/timer/active', getActiveTimer);
router.post('/timer/start', validate(startTimerSchema), startTimer);
router.put('/timer/:id/pause', pauseTimer);
router.post('/timer/:id/pause', pauseTimer);
router.post('/timer/pause', pauseTimer);
router.put('/timer/:id/resume', resumeTimer);
router.post('/timer/:id/resume', resumeTimer);
router.post('/timer/resume', resumeTimer);
router.put('/timer/:id/finish', finishTimer);
router.post('/timer/:id/finish', finishTimer);
router.post('/timer/finish', finishTimer);

// CRUD routes
router.get('/', getSessions);
router.post('/', validate(createSessionSchema), createSession);
router.get('/:id', getSession);
router.put('/:id', validate(updateSessionSchema), updateSession);
router.delete('/:id', deleteSession);

export default router;
