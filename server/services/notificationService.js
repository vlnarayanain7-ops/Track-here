import webpush from 'web-push';
import cron from 'node-cron';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import env from '../config/env.js';
import User from '../models/User.js';
import PushSubscription from '../models/PushSubscription.js';
import NotificationLog from '../models/NotificationLog.js';
import Revision from '../models/Revision.js';
import Task from '../models/Task.js';

// Configure web-push if VAPID keys are set
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

/**
 * Check if current time is within quiet hours for a user.
 */
function isQuietHours(user) {
  if (!user.quietHoursStart || !user.quietHoursEnd) return false;

  const now = toZonedTime(new Date(), user.timezone || 'Asia/Kolkata');
  const currentTime = format(now, 'HH:mm');

  const start = user.quietHoursStart;
  const end = user.quietHoursEnd;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  return currentTime >= start && currentTime < end;
}

/**
 * Check if today is an active weekday for the user.
 */
function isActiveWeekday(user) {
  const now = toZonedTime(new Date(), user.timezone || 'Asia/Kolkata');
  const dayOfWeek = now.getDay(); // 0 = Sunday
  return user.activeWeekdays.includes(dayOfWeek);
}

/**
 * Send a push notification to a specific user.
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({ title, body, data });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
      } catch (error) {
        // If subscription is invalid, remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
          console.log(`Removed invalid subscription for user ${userId}`);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error.message);
  }
}

/**
 * Send morning reminders to eligible users.
 */
async function scheduleMorningReminders() {
  try {
    const users = await User.find({
      notificationsEnabled: true,
      'activeNotifications.morning': true,
    }).select('_id timezone morningReminderTime quietHoursStart quietHoursEnd activeWeekdays');

    for (const user of users) {
      if (!isActiveWeekday(user)) continue;
      if (isQuietHours(user)) continue;

      const now = toZonedTime(new Date(), user.timezone || 'Asia/Kolkata');
      const currentTime = format(now, 'HH:mm');

      if (currentTime !== user.morningReminderTime) continue;

      // Deduplication
      const dedupKey = `morning-${user._id}-${format(now, 'yyyy-MM-dd')}`;
      const existing = await NotificationLog.findOne({ deduplicationKey: dedupKey });
      if (existing) continue;

      const title = '🌅 Good Morning!';
      const body = "Ready to start your study session? Let's make today productive!";

      await sendPushNotification(user._id, title, body, { type: 'morning' });

      await NotificationLog.create({
        user: user._id,
        type: 'morning',
        title,
        body,
        deduplicationKey: dedupKey,
      });
    }
  } catch (error) {
    console.error('Error in morning reminders:', error.message);
  }
}

/**
 * Send evening reminders to eligible users.
 */
async function scheduleEveningReminders() {
  try {
    const users = await User.find({
      notificationsEnabled: true,
      'activeNotifications.evening': true,
    }).select('_id timezone eveningReminderTime quietHoursStart quietHoursEnd activeWeekdays');

    for (const user of users) {
      if (!isActiveWeekday(user)) continue;
      if (isQuietHours(user)) continue;

      const now = toZonedTime(new Date(), user.timezone || 'Asia/Kolkata');
      const currentTime = format(now, 'HH:mm');

      if (currentTime !== user.eveningReminderTime) continue;

      const dedupKey = `evening-${user._id}-${format(now, 'yyyy-MM-dd')}`;
      const existing = await NotificationLog.findOne({ deduplicationKey: dedupKey });
      if (existing) continue;

      const title = '🌙 Evening Review';
      const body = "Time to review your day! How was your study session?";

      await sendPushNotification(user._id, title, body, { type: 'evening' });

      await NotificationLog.create({
        user: user._id,
        type: 'evening',
        title,
        body,
        deduplicationKey: dedupKey,
      });
    }
  } catch (error) {
    console.error('Error in evening reminders:', error.message);
  }
}

/**
 * Check for upcoming task deadlines and send reminders.
 */
async function scheduleTaskReminders() {
  try {
    const users = await User.find({
      notificationsEnabled: true,
      'activeNotifications.taskDeadline': true,
    }).select('_id timezone quietHoursStart quietHoursEnd activeWeekdays');

    for (const user of users) {
      if (isQuietHours(user)) continue;

      const now = new Date();
      const tomorrowEnd = new Date(now);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Find tasks due within 24 hours
      const upcomingTasks = await Task.find({
        user: user._id,
        status: { $in: ['Todo', 'In Progress'] },
        dueDate: { $gte: now, $lte: tomorrowEnd },
      });

      for (const task of upcomingTasks) {
        const dedupKey = `task-${task._id}-${format(now, 'yyyy-MM-dd')}`;
        const existing = await NotificationLog.findOne({ deduplicationKey: dedupKey });
        if (existing) continue;

        const title = '⏰ Task Deadline Approaching';
        const body = `"${task.title}" is due soon!`;

        await sendPushNotification(user._id, title, body, { type: 'taskDeadline', taskId: task._id });

        await NotificationLog.create({
          user: user._id,
          type: 'taskDeadline',
          title,
          body,
          deduplicationKey: dedupKey,
        });
      }
    }
  } catch (error) {
    console.error('Error in task reminders:', error.message);
  }
}

/**
 * Check for due revisions and send reminders.
 */
async function scheduleRevisionReminders() {
  try {
    const users = await User.find({
      notificationsEnabled: true,
      'activeNotifications.revision': true,
    }).select('_id timezone quietHoursStart quietHoursEnd activeWeekdays');

    for (const user of users) {
      if (isQuietHours(user)) continue;

      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const dueRevisions = await Revision.find({
        user: user._id,
        status: 'pending',
        dueDate: { $lte: todayEnd },
      });

      if (dueRevisions.length === 0) continue;

      const dedupKey = `revision-${user._id}-${format(now, 'yyyy-MM-dd')}`;
      const existing = await NotificationLog.findOne({ deduplicationKey: dedupKey });
      if (existing) continue;

      const title = '📝 Revisions Due';
      const body = `You have ${dueRevisions.length} revision(s) due today!`;

      await sendPushNotification(user._id, title, body, {
        type: 'revision',
        count: dueRevisions.length,
      });

      await NotificationLog.create({
        user: user._id,
        type: 'revision',
        title,
        body,
        deduplicationKey: dedupKey,
      });
    }
  } catch (error) {
    console.error('Error in revision reminders:', error.message);
  }
}

/**
 * Start all notification cron jobs.
 * Runs every minute to check if any notifications need to be sent.
 */
export function startNotificationCrons() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await Promise.allSettled([
      scheduleMorningReminders(),
      scheduleEveningReminders(),
      scheduleTaskReminders(),
      scheduleRevisionReminders(),
    ]);
  });

  console.log('Notification cron jobs started');
}

export default {
  sendPushNotification,
  startNotificationCrons,
};
