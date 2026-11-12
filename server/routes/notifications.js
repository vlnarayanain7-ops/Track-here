import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribe,
  unsubscribe,
  getVapidKey,
  snoozeNotification,
} from '../controllers/notificationController.js';
import auth from '../middleware/auth.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.post('/subscribe', subscribe);
router.delete('/unsubscribe', unsubscribe);
router.get('/vapid-key', getVapidKey);
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.put('/:id/snooze', snoozeNotification);
router.delete('/:id', deleteNotification);

export default router;

