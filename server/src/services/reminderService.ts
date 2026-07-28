import { pool } from '../db/pool';
import { sendPushNotification } from './pushService';
import { getUserStreak } from './streakService';

type WindowType = 'push_afternoon' | 'push_evening' | 'push_final';

interface NotificationWindow {
  hour: number;
  type: WindowType;
}

const WINDOWS: readonly NotificationWindow[] = [
  { hour: 15, type: 'push_afternoon' },
  { hour: 20, type: 'push_evening' },
  { hour: 22, type: 'push_final' },
];

interface EligibleUser {
  id: string;
  display_name: string;
}

export async function sendDailyReminders(currentHour: number, today: Date): Promise<void> {
  const window = WINDOWS.find((w) => w.hour === currentHour);
  if (!window) return;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const usersResult = await pool.query<EligibleUser>(
    `SELECT id, display_name FROM users WHERE push_reminders_enabled = true`,
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
         WHERE user_id = $1 AND notification_type = $2 AND sent_for = $3
         LIMIT 1`,
        [user.id, window.type, todayStr],
      );
      if (alreadySentResult.rows.length > 0) continue;

      const streak = await getUserStreak(user.id, today);
      const { title, body } = composeMessage(user.display_name, streak, window.type);

      await sendPushNotification(user.id, title, body);

      await pool.query(
        `INSERT INTO notification_log (user_id, notification_type, sent_for)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, notification_type, sent_for) DO NOTHING`,
        [user.id, window.type, todayStr],
      );
    } catch (err) {
      console.error(`[Reminders] Failed for user ${user.id} (${user.display_name}):`, err);
    }
  }
}

function composeMessage(
  name: string,
  streak: number,
  windowType: WindowType,
): { title: string; body: string } {
  switch (windowType) {
    case 'push_afternoon':
      if (streak > 0) {
        return {
          title: 'Goal Tracker',
          body: `Hey ${name}! ${streak}-day streak on the line. Log your progress now!`,
        };
      }
      return {
        title: 'Goal Tracker',
        body: `Hey ${name}! Haven't logged anything today yet — time to check in on your goals!`,
      };

    case 'push_evening':
      if (streak > 0) {
        return {
          title: 'Goal Tracker',
          body: `Hey ${name}! ${streak}-day streak — don't let it slip tonight.`,
        };
      }
      return {
        title: 'Goal Tracker',
        body: `Hey ${name}! Don't forget to log your progress before the day ends.`,
      };

    case 'push_final':
      if (streak > 0) {
        return {
          title: '🚨 Last chance!',
          body: `${name}, mark your day done to keep your ${streak}-day streak alive.`,
        };
      }
      return {
        title: '🚨 Last chance!',
        body: `${name}, mark your day done before midnight.`,
      };
  }
}
