import { Router } from 'express';
import {
  getRevisions,
  getDueRevisions,
  getRevision,
  createRevision,
  updateRevision,
  deleteRevision,
  completeRevision,
  createRevisionSchema,
  updateRevisionSchema,
  completeRevisionSchema,
} from '../controllers/revisionController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/due', getDueRevisions);
router.get('/', getRevisions);
router.post('/', validate(createRevisionSchema), createRevision);
router.get('/:id', getRevision);
router.put('/:id', validate(updateRevisionSchema), updateRevision);
router.delete('/:id', deleteRevision);
router.post('/:id/complete', validate(completeRevisionSchema), completeRevision);
router.post('/:id/review', validate(completeRevisionSchema), completeRevision);

export default router;

