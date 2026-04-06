import { pool } from '../db/pool';

/** Return a YYYY-MM-DD string from a Date using UTC parts (avoids timezone shifts). */
function toUtcDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Subtract N days from a YYYY-MM-DD string, returning a new YYYY-MM-DD string. */
function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
}

/**
 * Compute the current streak for a user: consecutive days (ending today or yesterday)
 * on which they logged ANY progress entry.
 *
 * Grace period: if a user has logged yesterday but not yet today, the streak is still
 * alive — they have until end of day. The streak resets only when the last logged day
 * is 2+ days ago.
 */
export async function getUserStreak(userId: string, referenceDate?: Date): Promise<number> {
  const ref = referenceDate ?? new Date();
  const todayStr = toUtcDateStr(ref);
  const yesterdayStr = subtractDays(todayStr, 1);

  const result = await pool.query(
    `SELECT DISTINCT pe.logged_for::date AS logged_for
     FROM progress_entries pe
     JOIN goals g ON pe.goal_id = g.id
     WHERE g.user_id = $1
       AND pe.logged_for <= $2
     ORDER BY logged_for DESC`,
    [userId, todayStr],
  );

  const dates: Set<string> = new Set(
    result.rows.map((r: { logged_for: Date | string }) => {
      const d = r.logged_for;
      if (d instanceof Date) return toUtcDateStr(d);
      return String(d).split('T')[0];
    }),
  );

  if (dates.size === 0) return 0;

  const todayInSet = dates.has(todayStr);
  const yesterdayInSet = dates.has(yesterdayStr);

  // No activity today or yesterday → streak is broken
  if (!todayInSet && !yesterdayInSet) return 0;

  // Start counting from today if logged today, otherwise from yesterday (grace period)
  let streak = 0;
  let cursor = todayInSet ? todayStr : yesterdayStr;

  while (dates.has(cursor)) {
    streak++;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}
