import { pool } from '../db/pool';
import { sendSms } from './smsService';
import { getUserStreak } from './streakService';

interface EligibleUser {
  id: string;
  display_name: string;
  phone: string;
  reminder_hour: number;
}

/**
 * Send daily SMS reminders to users who:
 * - Have sms_reminders_enabled = true and a phone number
 * - Have their reminder_hour matching the current hour
 * - Have NOT logged any progress today
 * - Have NOT already received a reminder today
 */
export async function sendDailyReminders(currentHour: number, today: Date): Promise<void> {
  const todayStr = today.toISOString().split('T')[0];

  const usersResult = await pool.query<EligibleUser>(
    `SELECT id, display_name, phone, reminder_hour
     FROM users
     WHERE sms_reminders_enabled = true
       AND phone IS NOT NULL
       AND reminder_hour = $1`,
    [currentHour],
  );

  for (const user of usersResult.rows) {
    try {
      // Check if user already marked today as done
      const completedResult = await pool.query(
        `SELECT 1 FROM daily_completions WHERE user_id = $1 AND completed_date = $2 LIMIT 1`,
        [user.id, todayStr],
      );
      if (completedResult.rows.length > 0) continue;

      // Check if we already sent a reminder today (idempotency)
      const alreadySentResult = await pool.query(
        `SELECT 1 FROM notification_log
         WHERE user_id = $1 AND notification_type = 'sms_reminder' AND sent_for = $2
         LIMIT 1`,
        [user.id, todayStr],
      );
      if (alreadySentResult.rows.length > 0) continue;

      const streak = await getUserStreak(user.id, today);
      const message = composeMessage(user.display_name, streak);

      const { sid } = await sendSms({ to: user.phone, message });

      await pool.query(
        `INSERT INTO notification_log (user_id, notification_type, sent_for, twilio_sid)
         VALUES ($1, 'sms_reminder', $2, $3)
         ON CONFLICT (user_id, notification_type, sent_for) DO NOTHING`,
        [user.id, todayStr, sid],
      );
    } catch (err) {
      console.error(`[Reminders] Failed for user ${user.id} (${user.display_name}):`, err);
    }
  }
}

function composeMessage(name: string, streak: number): string {
  if (streak > 0) {
    return `Hey ${name}! ${streak}-day streak. Log progress & mark done to keep it!`;
  }
  return `Hey ${name}! Log your progress and mark your day done. Every day counts!`;
}
