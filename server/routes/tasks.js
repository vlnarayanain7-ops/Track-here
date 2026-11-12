import { Router } from 'express';
import {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
} from '../controllers/taskController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/', getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.get('/:id', getTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.put('/:id/status', validate(updateStatusSchema), updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;

