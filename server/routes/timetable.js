import { Router } from 'express';
import {
  getTimetableSlots,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  createTimetableSlotSchema,
  updateTimetableSlotSchema,
} from '../controllers/timetableController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/', getTimetableSlots);
router.post('/', validate(createTimetableSlotSchema), createTimetableSlot);
router.put('/:id', validate(updateTimetableSlotSchema), updateTimetableSlot);
router.delete('/:id', deleteTimetableSlot);

export default router;

