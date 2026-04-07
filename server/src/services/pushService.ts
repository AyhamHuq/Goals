import webpush from 'web-push';
import { pool } from '../db/pool';
import { config } from '../config';

export interface PushResult {
  sent: number;
  failed: number;
}

function initWebPush(): typeof webpush | null {
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    return null;
  }
  webpush.setVapidDetails(config.vapidEmail, config.vapidPublicKey, config.vapidPrivateKey);
  return webpush;
}

export async function sendPushNotification(userId: string, title: string, body: string): Promise<PushResult> {
  const wp = initWebPush();
  if (!wp) {
    console.log(`[Push stub] userId=${userId} | ${title}: ${body}`);
    return { sent: 0, failed: 0 };
  }

  const result = await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
    [userId]
  );

  let sent = 0;
  let failed = 0;

  for (const sub of result.rows) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await wp.sendNotification(subscription, JSON.stringify({ title, body }));
      sent++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
      } else {
        console.error(`[Push] Failed for subscription ${sub.id}:`, err.message);
      }
      failed++;
    }
  }

  return { sent, failed };
}
