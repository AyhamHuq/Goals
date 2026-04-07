import { pool } from '../db/pool';
import { sendPushNotification } from './pushService';
import { getUserStreak } from './streakService';

interface EligibleUser {
  id: string;
  display_name: string;
  reminder_hour: number;
}

export async function sendDailyReminders(currentHour: number, today: Date): Promise<void> {
  const todayStr = today.toISOString().split('T')[0];

  const usersResult = await pool.query<EligibleUser>(
    `SELECT id, display_name, reminder_hour
     FROM users
     WHERE push_reminders_enabled = true
       AND reminder_hour = $1`,
    [currentHour],
  );

  for (const user of usersResult.rows) {
    try {
      const completedResult = await pool.query(
        `SELECT 1 FROM daily_completions WHERE user_id = $1 AND completed_date = $2 LIMIT 1`,
        [user.id, todayStr],
      );
      if (completedResult.rows.length > 0) continue;

      const alreadySentResult = await pool.query(
        `SELECT 1 FROM notification_log
         WHERE user_id = $1 AND notification_type = 'push_reminder' AND sent_for = $2
         LIMIT 1`,
        [user.id, todayStr],
      );
      if (alreadySentResult.rows.length > 0) continue;

      const streak = await getUserStreak(user.id, today);
      const { title, body } = composeMessage(user.display_name, streak);

      await sendPushNotification(user.id, title, body);

      await pool.query(
        `INSERT INTO notification_log (user_id, notification_type, sent_for)
         VALUES ($1, 'push_reminder', $2)
         ON CONFLICT (user_id, notification_type, sent_for) DO NOTHING`,
        [user.id, todayStr],
      );
    } catch (err) {
      console.error(`[Reminders] Failed for user ${user.id} (${user.display_name}):`, err);
    }
  }
}

function composeMessage(name: string, streak: number): { title: string; body: string } {
  if (streak > 0) {
    return {
      title: 'Goal Tracker',
      body: `Hey ${name}! ${streak}-day streak. Log progress & mark done to keep it!`,
    };
  }
  return {
    title: 'Goal Tracker',
    body: `Hey ${name}! Log your progress and mark your day done. Every day counts!`,
  };
}
