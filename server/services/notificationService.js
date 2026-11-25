import webpush from 'web-push';
import env from '../config/env.js';
import PushSubscription from '../models/PushSubscription.js';

// Configure web-push if VAPID keys are set
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

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
