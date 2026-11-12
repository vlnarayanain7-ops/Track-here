import { Router } from 'express';
import {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  addAttempt,
  getProblemStats,
  createProblemSchema,
  updateProblemSchema,
  createAttemptSchema,
} from '../controllers/problemController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/stats', getProblemStats);
router.get('/', getProblems);
router.post('/', validate(createProblemSchema), createProblem);
router.get('/:id', getProblem);
router.put('/:id', validate(updateProblemSchema), updateProblem);
router.delete('/:id', deleteProblem);
router.post('/:id/attempts', validate(createAttemptSchema), addAttempt);

export default router;

