import { Router } from 'express';
import {
  getNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote,
  getFolders,
  createNoteSchema,
  updateNoteSchema,
} from '../controllers/noteController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/folders', getFolders);
router.get('/', getNotes);
router.post('/', validate(createNoteSchema), createNote);
router.get('/:id', getNote);
router.put('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

export default router;

