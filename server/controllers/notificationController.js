import NotificationLog from '../models/NotificationLog.js';
import PushSubscription from '../models/PushSubscription.js';
import env from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// ─── Controllers ──────────────────────────────────────────────

/**
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, unreadOnly } = req.query;

  const query = { user: req.user.id };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const notifications = await NotificationLog.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10));

  res.json(notifications);
});

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await NotificationLog.countDocuments({
    user: req.user.id,
    read: false,
  });

  res.json({ count });
});

/**
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationLog.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  res.json(notification);
});

/**
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  await NotificationLog.updateMany(
    { user: req.user.id, read: false },
    { $set: { read: true } }
  );

  res.json({ message: 'All notifications marked as read' });
});

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await NotificationLog.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  res.json({ message: 'Notification deleted' });
});

/**
 * POST /api/notifications/subscribe
 */
export const subscribe = asyncHandler(async (req, res) => {
  const { endpoint, keys, userAgent } = req.body;

  if (!endpoint || !keys) {
    throw ApiError.badRequest('Invalid push subscription payload');
  }

  const subscription = await PushSubscription.findOneAndUpdate(
    { user: req.user.id, endpoint },
    {
      user: req.user.id,
      endpoint,
      keys,
      userAgent: userAgent || req.headers['user-agent'],
    },
    { upsert: true, new: true }
  );

  res.status(201).json(subscription);
});

/**
 * DELETE /api/notifications/unsubscribe
 */
export const unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;

  await PushSubscription.findOneAndDelete({
    user: req.user.id,
    endpoint,
  });

  res.json({ message: 'Unsubscribed successfully' });
});

/**
 * GET /api/notifications/vapid-key
 */
export const getVapidKey = asyncHandler(async (req, res) => {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY || '' });
});

/**
 * PUT /api/notifications/:id/snooze
 */
export const snoozeNotification = asyncHandler(async (req, res) => {
  const { minutes = 10 } = req.body;
  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);

  const notification = await NotificationLog.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { snoozedUntil: snoozeUntil } },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  res.json(notification);
});

