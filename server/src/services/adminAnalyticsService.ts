import { pool } from '../db/pool';
import { getUserStreak } from './streakService';

export interface OverviewStats {
  totalUsers: number;
  totalGoals: number;
  totalEntries: number;
  totalLikes: number;
  activeUsers: number;
  goalsCreated: number;
  entriesLogged: number;
  avgEntriesPerUser: number;
  completionRate: number;
  totalDailyCompletions: number;
}

export interface TrendPoint {
  date: string;
  entriesLogged: number;
  goalsCreated: number;
  activeUsers: number;
  likesGiven: number;
  dailyCompletions: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface AdminUser {
  id: string;
  display_name: string;
  avatar_color: string;
  last_active_at: string | null;
  created_at: string;
  push_reminders_enabled: boolean;
  goals_count: number;
  entries_count: number;
  likes_given: number;
  likes_received: number;
  streak: number;
  avg_completion: number;
  period_count: number;
}

export interface AdminUserDetail {
  user: {
    id: string;
    display_name: string;
    avatar_color: string;
    last_active_at: string | null;
    created_at: string;
    push_reminders_enabled: boolean;
    reminder_hour: number;
    streak: number;
    push_subscriptions: number;
  };
  goals: Array<{
    id: string;
    title: string;
    period_key: string;
    target_value: number;
    unit: string;
    frequency_type: string;
    goal_type: string;
    category_name: string | null;
    current_value: number;
    entries_count: number;
    percentage: number;
    is_archived: boolean;
  }>;
  activityByDay: HeatmapDay[];
  periodSummaries: Array<{
    period_key: string;
    goals_count: number;
    avg_completion: number;
  }>;
  entriesByHour: Array<{ hour: number; count: number }>;
}

export interface GoalDetail {
  goal: {
    id: string;
    title: string;
    period_key: string;
    target_value: number;
    unit: string;
    frequency_type: string;
    goal_type: string;
    category_name: string | null;
    user_display_name: string;
    user_id: string;
    created_at: string;
  };
  entries: Array<{
    id: string;
    value: number;
    logged_for: string;
    note: string | null;
    created_at: string;
  }>;
  likesTimeline: Array<{ date: string; count: number }>;
  cumulativeProgress: Array<{ date: string; cumulative: number }>;
}

export interface EngagementStats {
  hourDistribution: Array<{ hour: number; count: number }>;
  dowDistribution: Array<{ dow: number; count: number }>;
  categoryBreakdown: Array<{ category: string; goals_count: number; entries_count: number }>;
  topUsers: Array<{ display_name: string; avatar_color: string; entries_count: number }>;
  retentionByMonth: Array<{ month: string; users_with_goals: number; users_with_entries: number }>;
}

export async function getOverview(from: string, to: string): Promise<OverviewStats> {
  const [
    totalsRes,
    activeUsersRes,
    goalsCreatedRes,
    entriesLoggedRes,
    dailyCompletionsRes,
  ] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM goals WHERE NOT is_archived) AS total_goals,
        (SELECT COUNT(*) FROM progress_entries) AS total_entries,
        (SELECT COUNT(*) FROM likes) AS total_likes
    `),
    pool.query(`
      SELECT COUNT(DISTINCT sub.user_id) AS count FROM (
        SELECT g.user_id FROM progress_entries pe
        JOIN goals g ON pe.goal_id = g.id
        WHERE pe.logged_for BETWEEN $1 AND $2
        UNION
        SELECT user_id FROM daily_completions
        WHERE completed_date BETWEEN $1 AND $2
      ) sub
    `, [from, to]),
    pool.query(`SELECT COUNT(*) AS count FROM goals WHERE created_at::date BETWEEN $1 AND $2`, [from, to]),
    pool.query(`SELECT COUNT(*) AS count FROM progress_entries WHERE logged_for BETWEEN $1 AND $2`, [from, to]),
    pool.query(`SELECT COUNT(*) AS count FROM daily_completions WHERE completed_date BETWEEN $1 AND $2`, [from, to]),
  ]);

  const totals = totalsRes.rows[0];
  const totalUsers = Number(totals.total_users);
  const entriesLogged = Number(entriesLoggedRes.rows[0].count);
  const activeUsers = Number(activeUsersRes.rows[0].count);

  // Avg completion: goals that have >= 100% progress in the period
  const completionRes = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN COALESCE(pe_sum.current_value, 0) >= g.target_value THEN 1 ELSE 0 END) AS completed
    FROM goals g
    LEFT JOIN (
      SELECT goal_id, SUM(value) AS current_value
      FROM progress_entries
      WHERE logged_for BETWEEN $1 AND $2
      GROUP BY goal_id
    ) pe_sum ON pe_sum.goal_id = g.id
    WHERE g.created_at::date <= $2
      AND g.period_key BETWEEN $3 AND $4
      AND NOT g.is_archived
  `, [from, to, from.slice(0, 7), to.slice(0, 7)]);

  const compRow = completionRes.rows[0];
  const completionRate = Number(compRow.total) > 0
    ? Math.round((Number(compRow.completed) / Number(compRow.total)) * 100)
    : 0;

  return {
    totalUsers,
    totalGoals: Number(totals.total_goals),
    totalEntries: Number(totals.total_entries),
    totalLikes: Number(totals.total_likes),
    activeUsers,
    goalsCreated: Number(goalsCreatedRes.rows[0].count),
    entriesLogged,
    avgEntriesPerUser: totalUsers > 0 ? Math.round((entriesLogged / totalUsers) * 10) / 10 : 0,
    completionRate,
    totalDailyCompletions: Number(dailyCompletionsRes.rows[0].count),
  };
}

export async function getTrends(from: string, to: string, granularity: 'day' | 'week' | 'month'): Promise<TrendPoint[]> {
  const interval = granularity === 'day' ? '1 day' : granularity === 'week' ? '1 week' : '1 month';
  const trunc = granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';

  const result = await pool.query(`
    SELECT
      d.date::text AS date,
      COALESCE(pe.count, 0) AS entries_logged,
      COALESCE(g.count, 0) AS goals_created,
      COALESCE(au.count, 0) AS active_users,
      COALESCE(l.count, 0) AS likes_given,
      COALESCE(dc.count, 0) AS daily_completions
    FROM generate_series($1::date, $2::date, $3::interval) AS d(date)
    LEFT JOIN (
      SELECT date_trunc($4, logged_for) AS date, COUNT(*) AS count
      FROM progress_entries WHERE logged_for BETWEEN $1 AND $2
      GROUP BY 1
    ) pe ON pe.date = d.date
    LEFT JOIN (
      SELECT date_trunc($4, created_at) AS date, COUNT(*) AS count
      FROM goals WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY 1
    ) g ON g.date = d.date
    LEFT JOIN (
      SELECT date_trunc($4, sub.date) AS date, COUNT(DISTINCT sub.user_id) AS count FROM (
        SELECT pe2.logged_for AS date, g2.user_id
        FROM progress_entries pe2 JOIN goals g2 ON pe2.goal_id = g2.id
        WHERE pe2.logged_for BETWEEN $1 AND $2
      ) sub GROUP BY 1
    ) au ON au.date = d.date
    LEFT JOIN (
      SELECT date_trunc($4, created_at) AS date, COUNT(*) AS count
      FROM likes WHERE created_at::date BETWEEN $1 AND $2
      GROUP BY 1
    ) l ON l.date = d.date
    LEFT JOIN (
      SELECT date_trunc($4, completed_date) AS date, COUNT(*) AS count
      FROM daily_completions WHERE completed_date BETWEEN $1 AND $2
      GROUP BY 1
    ) dc ON dc.date = d.date
    ORDER BY d.date
  `, [from, to, interval, trunc]);

  return result.rows.map(r => ({
    date: r.date.split('T')[0],
    entriesLogged: Number(r.entries_logged),
    goalsCreated: Number(r.goals_created),
    activeUsers: Number(r.active_users),
    likesGiven: Number(r.likes_given),
    dailyCompletions: Number(r.daily_completions),
  }));
}

export async function getHeatmap(year: number, userId?: string): Promise<HeatmapDay[]> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  let result;
  if (userId) {
    result = await pool.query(`
      SELECT pe.logged_for::text AS date, COUNT(*) AS count
      FROM progress_entries pe
      JOIN goals g ON pe.goal_id = g.id
      WHERE g.user_id = $1 AND pe.logged_for BETWEEN $2 AND $3
      GROUP BY pe.logged_for ORDER BY pe.logged_for
    `, [userId, from, to]);
  } else {
    result = await pool.query(`
      SELECT logged_for::text AS date, COUNT(*) AS count
      FROM progress_entries
      WHERE logged_for BETWEEN $1 AND $2
      GROUP BY logged_for ORDER BY logged_for
    `, [from, to]);
  }

  return result.rows.map(r => ({
    date: r.date.split('T')[0],
    count: Number(r.count),
  }));
}

export async function getUsers(from: string, to: string): Promise<AdminUser[]> {
  const result = await pool.query(`
    SELECT
      u.id, u.display_name, u.avatar_color, u.last_active_at, u.created_at,
      u.push_reminders_enabled,
      COUNT(DISTINCT g.id) AS goals_count,
      COUNT(DISTINCT pe.id) AS entries_count,
      COUNT(DISTINCT lg.id) AS likes_given,
      COUNT(DISTINCT lr.id) AS likes_received,
      (SELECT COUNT(DISTINCT period_key) FROM goals WHERE user_id = u.id) AS period_count
    FROM users u
    LEFT JOIN goals g ON g.user_id = u.id AND g.created_at::date <= $2
    LEFT JOIN progress_entries pe ON pe.goal_id = g.id AND pe.logged_for BETWEEN $1 AND $2
    LEFT JOIN likes lg ON lg.liker_user_id = u.id AND lg.created_at::date BETWEEN $1 AND $2
    LEFT JOIN (
      SELECT l2.id, g2.user_id
      FROM likes l2 JOIN goals g2 ON l2.goal_id = g2.id
      WHERE l2.created_at::date BETWEEN $1 AND $2
    ) lr ON lr.user_id = u.id
    GROUP BY u.id
    ORDER BY entries_count DESC
  `, [from, to]);

  const users: AdminUser[] = [];
  for (const row of result.rows) {
    const streak = await getUserStreak(row.id);

    // Avg completion: average percentage across active goals in range
    const compRes = await pool.query(`
      SELECT AVG(
        LEAST(100, CASE WHEN g.target_value > 0 THEN
          COALESCE(pe_sum.current_value, 0) / g.target_value * 100
        ELSE 0 END)
      ) AS avg_completion
      FROM goals g
      LEFT JOIN (
        SELECT goal_id, SUM(value) AS current_value
        FROM progress_entries WHERE logged_for BETWEEN $2 AND $3
        GROUP BY goal_id
      ) pe_sum ON pe_sum.goal_id = g.id
      WHERE g.user_id = $1
        AND g.period_key BETWEEN $4 AND $5
        AND NOT g.is_archived
    `, [row.id, from, to, from.slice(0, 7), to.slice(0, 7)]);

    users.push({
      id: row.id,
      display_name: row.display_name,
      avatar_color: row.avatar_color,
      last_active_at: row.last_active_at,
      created_at: row.created_at,
      push_reminders_enabled: row.push_reminders_enabled,
      goals_count: Number(row.goals_count),
      entries_count: Number(row.entries_count),
      likes_given: Number(row.likes_given),
      likes_received: Number(row.likes_received),
      streak,
      avg_completion: Math.round(Number(compRes.rows[0].avg_completion) || 0),
      period_count: Number(row.period_count),
    });
  }

  return users;
}

export async function getUserDetail(userId: string, from: string, to: string): Promise<AdminUserDetail | null> {
  const userRes = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
  if (userRes.rows.length === 0) return null;
  const user = userRes.rows[0];

  const [streak, goalsRes, activityRes, periodRes, hourRes, pushSubsRes] = await Promise.all([
    getUserStreak(userId),
    pool.query(`
      SELECT g.id, g.title, g.period_key, g.target_value, g.unit, g.frequency_type,
             g.goal_type, g.is_archived, c.name AS category_name,
             COALESCE(pe_sum.current_value, 0) AS current_value,
             COALESCE(pe_sum.entries_count, 0) AS entries_count
      FROM goals g
      LEFT JOIN categories c ON g.category_id = c.id
      LEFT JOIN (
        SELECT goal_id,
               SUM(value) AS current_value,
               COUNT(*) AS entries_count
        FROM progress_entries WHERE logged_for BETWEEN $2 AND $3
        GROUP BY goal_id
      ) pe_sum ON pe_sum.goal_id = g.id
      WHERE g.user_id = $1
      ORDER BY g.period_key DESC, g.created_at ASC
    `, [userId, from, to]),
    pool.query(`
      SELECT pe.logged_for::text AS date, COUNT(*) AS count
      FROM progress_entries pe
      JOIN goals g ON pe.goal_id = g.id
      WHERE g.user_id = $1 AND pe.logged_for BETWEEN $2 AND $3
      GROUP BY pe.logged_for ORDER BY pe.logged_for
    `, [userId, from, to]),
    pool.query(`
      SELECT period_key, COUNT(*) AS goals_count
      FROM goals WHERE user_id = $1
      GROUP BY period_key ORDER BY period_key DESC
    `, [userId]),
    pool.query(`
      SELECT EXTRACT(HOUR FROM pe.created_at)::int AS hour, COUNT(*) AS count
      FROM progress_entries pe
      JOIN goals g ON pe.goal_id = g.id
      WHERE g.user_id = $1 AND pe.logged_for BETWEEN $2 AND $3
      GROUP BY hour ORDER BY hour
    `, [userId, from, to]),
    pool.query(`SELECT COUNT(*) AS count FROM push_subscriptions WHERE user_id = $1`, [userId]),
  ]);

  const goals = goalsRes.rows.map(g => ({
    id: g.id,
    title: g.title,
    period_key: g.period_key,
    target_value: Number(g.target_value),
    unit: g.unit,
    frequency_type: g.frequency_type,
    goal_type: g.goal_type,
    category_name: g.category_name,
    current_value: Number(g.current_value),
    entries_count: Number(g.entries_count),
    percentage: g.target_value > 0
      ? Math.round(Math.min(100, (Number(g.current_value) / Number(g.target_value)) * 100))
      : 0,
    is_archived: g.is_archived,
  }));

  // Period summaries with avg completion
  const periodSummaries = await Promise.all(periodRes.rows.map(async p => {
    const compRes = await pool.query(`
      SELECT AVG(
        LEAST(100, CASE WHEN g.target_value > 0 THEN
          COALESCE(pe_sum.current_value, 0) / g.target_value * 100
        ELSE 0 END)
      ) AS avg_completion
      FROM goals g
      LEFT JOIN (
        SELECT goal_id, SUM(value) AS current_value
        FROM progress_entries
        WHERE logged_for LIKE $2
        GROUP BY goal_id
      ) pe_sum ON pe_sum.goal_id = g.id
      WHERE g.user_id = $1 AND g.period_key = $3 AND NOT g.is_archived
    `, [userId, `${p.period_key}%`, p.period_key]);
    return {
      period_key: p.period_key,
      goals_count: Number(p.goals_count),
      avg_completion: Math.round(Number(compRes.rows[0].avg_completion) || 0),
    };
  }));

  return {
    user: {
      id: user.id,
      display_name: user.display_name,
      avatar_color: user.avatar_color,
      last_active_at: user.last_active_at,
      created_at: user.created_at,
      push_reminders_enabled: user.push_reminders_enabled,
      reminder_hour: user.reminder_hour,
      streak,
      push_subscriptions: Number(pushSubsRes.rows[0].count),
    },
    goals,
    activityByDay: activityRes.rows.map(r => ({ date: r.date.split('T')[0], count: Number(r.count) })),
    periodSummaries,
    entriesByHour: hourRes.rows.map(r => ({ hour: r.hour, count: Number(r.count) })),
  };
}

export async function getGoalDetail(goalId: string): Promise<GoalDetail | null> {
  const goalRes = await pool.query(`
    SELECT g.*, c.name AS category_name, u.display_name AS user_display_name
    FROM goals g
    LEFT JOIN categories c ON g.category_id = c.id
    JOIN users u ON g.user_id = u.id
    WHERE g.id = $1
  `, [goalId]);
  if (goalRes.rows.length === 0) return null;
  const g = goalRes.rows[0];

  const [entriesRes, likesRes] = await Promise.all([
    pool.query(`
      SELECT id, value, logged_for::text AS logged_for, note, created_at
      FROM progress_entries WHERE goal_id = $1 ORDER BY logged_for ASC
    `, [goalId]),
    pool.query(`
      SELECT liked_for::text AS date, COUNT(*) AS count
      FROM likes WHERE goal_id = $1 GROUP BY liked_for ORDER BY liked_for
    `, [goalId]),
  ]);

  // Build cumulative progress
  let cumulative = 0;
  const cumulativeProgress = entriesRes.rows.map(e => {
    cumulative += Number(e.value);
    return { date: e.logged_for.split('T')[0], cumulative };
  });

  return {
    goal: {
      id: g.id,
      title: g.title,
      period_key: g.period_key,
      target_value: Number(g.target_value),
      unit: g.unit,
      frequency_type: g.frequency_type,
      goal_type: g.goal_type,
      category_name: g.category_name,
      user_display_name: g.user_display_name,
      user_id: g.user_id,
      created_at: g.created_at,
    },
    entries: entriesRes.rows.map(e => ({
      id: e.id,
      value: Number(e.value),
      logged_for: e.logged_for.split('T')[0],
      note: e.note,
      created_at: e.created_at,
    })),
    likesTimeline: likesRes.rows.map(r => ({ date: r.date.split('T')[0], count: Number(r.count) })),
    cumulativeProgress,
  };
}

export async function getEngagement(from: string, to: string): Promise<EngagementStats> {
  const [hourRes, dowRes, catRes, topUsersRes, retentionRes] = await Promise.all([
    pool.query(`
      SELECT EXTRACT(HOUR FROM pe.created_at)::int AS hour, COUNT(*) AS count
      FROM progress_entries pe
      WHERE pe.logged_for BETWEEN $1 AND $2
      GROUP BY hour ORDER BY hour
    `, [from, to]),
    pool.query(`
      SELECT EXTRACT(DOW FROM pe.logged_for)::int AS dow, COUNT(*) AS count
      FROM progress_entries pe
      WHERE pe.logged_for BETWEEN $1 AND $2
      GROUP BY dow ORDER BY dow
    `, [from, to]),
    pool.query(`
      SELECT c.name AS category, COUNT(DISTINCT g.id) AS goals_count, COUNT(DISTINCT pe.id) AS entries_count
      FROM goals g
      JOIN categories c ON g.category_id = c.id
      LEFT JOIN progress_entries pe ON pe.goal_id = g.id AND pe.logged_for BETWEEN $1 AND $2
      WHERE g.created_at::date <= $2
      GROUP BY c.name ORDER BY goals_count DESC
    `, [from, to]),
    pool.query(`
      SELECT u.display_name, u.avatar_color, COUNT(pe.id) AS entries_count
      FROM users u
      JOIN goals g ON g.user_id = u.id
      JOIN progress_entries pe ON pe.goal_id = g.id AND pe.logged_for BETWEEN $1 AND $2
      GROUP BY u.id, u.display_name, u.avatar_color
      ORDER BY entries_count DESC
      LIMIT 5
    `, [from, to]),
    pool.query(`
      SELECT
        to_char(date_trunc('month', g.created_at), 'YYYY-MM') AS month,
        COUNT(DISTINCT g.user_id) AS users_with_goals,
        COUNT(DISTINCT pe_users.user_id) AS users_with_entries
      FROM goals g
      LEFT JOIN (
        SELECT DISTINCT g2.user_id, date_trunc('month', pe.logged_for) AS month
        FROM progress_entries pe JOIN goals g2 ON pe.goal_id = g2.id
        WHERE pe.logged_for BETWEEN $1 AND $2
      ) pe_users ON pe_users.user_id = g.user_id
        AND pe_users.month = date_trunc('month', g.created_at)
      WHERE g.created_at::date BETWEEN $1 AND $2
      GROUP BY 1 ORDER BY 1
    `, [from, to]),
  ]);

  return {
    hourDistribution: hourRes.rows.map(r => ({ hour: r.hour, count: Number(r.count) })),
    dowDistribution: dowRes.rows.map(r => ({ dow: r.dow, count: Number(r.count) })),
    categoryBreakdown: catRes.rows.map(r => ({
      category: r.category,
      goals_count: Number(r.goals_count),
      entries_count: Number(r.entries_count),
    })),
    topUsers: topUsersRes.rows.map(r => ({
      display_name: r.display_name,
      avatar_color: r.avatar_color,
      entries_count: Number(r.entries_count),
    })),
    retentionByMonth: retentionRes.rows.map(r => ({
      month: r.month,
      users_with_goals: Number(r.users_with_goals),
      users_with_entries: Number(r.users_with_entries),
    })),
  };
}

export async function getNotificationStats(): Promise<{
  usersWithSubscriptions: number;
  totalSubscriptions: number;
  reminderEnabledCount: number;
  recentNotifications: Array<{ user_id: string; display_name: string; notification_type: string; sent_for: string; sent_at: string }>;
}> {
  const [subsRes, recentRes] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(DISTINCT user_id) AS users_with_subs,
        COUNT(*) AS total_subs,
        (SELECT COUNT(*) FROM users WHERE push_reminders_enabled) AS reminders_enabled
      FROM push_subscriptions
    `),
    pool.query(`
      SELECT nl.user_id, u.display_name, nl.notification_type,
             nl.sent_for::text AS sent_for, nl.sent_at
      FROM notification_log nl
      JOIN users u ON nl.user_id = u.id
      ORDER BY nl.sent_at DESC LIMIT 20
    `),
  ]);

  const row = subsRes.rows[0];
  return {
    usersWithSubscriptions: Number(row.users_with_subs),
    totalSubscriptions: Number(row.total_subs),
    reminderEnabledCount: Number(row.reminders_enabled),
    recentNotifications: recentRes.rows,
  };
}
