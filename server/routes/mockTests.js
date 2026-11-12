import { Router } from 'express';
import {
  getMockTests,
  getMockTestStats,
  getMockTest,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  createMockTestSchema,
  updateMockTestSchema,
} from '../controllers/mockTestController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/', getMockTests);
router.get('/stats', getMockTestStats);
router.get('/:id', getMockTest);
router.post('/', validate(createMockTestSchema), createMockTest);
router.put('/:id', validate(updateMockTestSchema), updateMockTest);
router.delete('/:id', deleteMockTest);

export default router;

