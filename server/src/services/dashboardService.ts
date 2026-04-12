import { getDaysInMonth, parseISO, differenceInDays } from 'date-fns';
import { pool } from '../db/pool';
import { calcProgress } from './frequencyCalc';
import { getUserStreak } from './streakService';
import { FrequencyType, GoalType } from '../types';

interface ProgressEntrySlim {
  id: string;
  value: number;
  logged_for: string;
  note: string | null;
  logged_unit: string | null;
  logged_value: number | null;
}

interface GoalWithProgress {
  id: string;
  user_id: string;
  category_id: string | null;
  period_key: string;
  title: string;
  category: { id: string; name: string } | null;
  target_value: number;
  unit: string;
  frequency_type: FrequencyType;
  goal_type: GoalType;
  start_value: number | null;
  current_value: number;
  expected_value: number | null;
  percentage: number;
  on_track: boolean | null;
  recent_entries: ProgressEntrySlim[];
  day_entries: ProgressEntrySlim[];
  day_entry_count: number;
  like_count: number;
  liked_by: string[];
}

export interface PersonalDashboardResponse {
  period_key: string;
  days_in_month: number;
  days_elapsed: number;
  weeks_elapsed: number;
  streak: number;
  day_completed: boolean;
  selected_day: string;
  goals: GoalWithProgress[];
}

export interface GroupDashboardUserEntry {
  user: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
  goals: GoalWithProgress[];
}

export interface GroupDashboardResponse {
  users: GroupDashboardUserEntry[];
}

export async function getPersonalDashboard(
  userId: string,
  periodKey: string,
  referenceDate?: Date,
): Promise<PersonalDashboardResponse> {
  const monthStart = parseISO(`${periodKey}-01`);
  const daysInMonth = getDaysInMonth(monthStart);
  const ref = referenceDate ?? new Date();
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const clampedRef = ref < monthStart ? monthStart : ref > monthEnd ? monthEnd : ref;
  const daysElapsed = differenceInDays(clampedRef, monthStart) + 1;
  const weeksElapsed = Math.round((daysElapsed / 7) * 100) / 100;
  const selectedDay = ref.toISOString().split('T')[0];

  // Get all goals for this user+period
  const goalsResult = await pool.query(
    `SELECT g.*, c.id AS cat_id, c.name AS cat_name
     FROM goals g
     LEFT JOIN categories c ON g.category_id = c.id
     WHERE g.user_id = $1 AND g.period_key = $2
     ORDER BY g.created_at ASC`,
    [userId, periodKey],
  );

  const goals: GoalWithProgress[] = [];

  for (const row of goalsResult.rows) {
    let currentValue: number;
    if (row.goal_type === 'measurement') {
      // Latest entry up to the selected day
      const latestResult = await pool.query(
        `SELECT value FROM progress_entries
         WHERE goal_id = $1 AND logged_for <= $2
         ORDER BY logged_for DESC, created_at DESC
         LIMIT 1`,
        [row.id, selectedDay],
      );
      currentValue = latestResult.rows.length > 0
        ? parseFloat(latestResult.rows[0].value)
        : parseFloat(row.start_value ?? row.target_value);
    } else {
      // Sum of entries up to and including the selected day
      const sumResult = await pool.query(
        `SELECT COALESCE(SUM(value), 0) AS current_value FROM progress_entries
         WHERE goal_id = $1 AND logged_for <= $2`,
        [row.id, selectedDay],
      );
      currentValue = parseFloat(sumResult.rows[0].current_value);
    }

    // Recent 5 entries up to selected day
    const recentResult = await pool.query(
      `SELECT id, value, logged_for, note, logged_unit, logged_value FROM progress_entries
       WHERE goal_id = $1 AND logged_for <= $2
       ORDER BY logged_for DESC, created_at DESC
       LIMIT 5`,
      [row.id, selectedDay],
    );

    // Entries logged on exactly the selected day
    const dayResult = await pool.query(
      `SELECT id, value, logged_for, note, logged_unit, logged_value FROM progress_entries
       WHERE goal_id = $1 AND logged_for = $2
       ORDER BY created_at DESC`,
      [row.id, selectedDay],
    );

    const startValue = row.start_value != null ? parseFloat(row.start_value) : undefined;
    const calc = calcProgress(
      row.frequency_type as FrequencyType,
      currentValue,
      parseFloat(row.target_value),
      periodKey,
      ref,
      row.goal_type as GoalType,
      startValue,
    );

    goals.push({
      id: row.id,
      user_id: row.user_id,
      category_id: row.category_id ?? null,
      period_key: periodKey,
      title: row.title,
      category: row.cat_id ? { id: row.cat_id, name: row.cat_name } : null,
      target_value: parseFloat(row.target_value),
      unit: row.unit,
      frequency_type: row.frequency_type,
      goal_type: row.goal_type as GoalType,
      start_value: row.start_value != null ? parseFloat(row.start_value) : null,
      current_value: currentValue,
      expected_value: calc.expectedValue,
      percentage: Math.round(calc.percentage * 100) / 100,
      on_track: calc.onTrack,
      recent_entries: recentResult.rows,
      day_entries: dayResult.rows,
      day_entry_count: dayResult.rows.length,
      like_count: 0,
      liked_by: [],
    });
  }

  // Batch-load likes for all goals on selectedDay
  if (goals.length > 0) {
    const goalIds = goals.map((g) => g.id);
    const likesResult = await pool.query<{ goal_id: string; liker_user_id: string }>(
      `SELECT goal_id, liker_user_id
       FROM likes
       WHERE goal_id = ANY($1) AND liked_for = $2`,
      [goalIds, selectedDay],
    );
    const likersMap = new Map<string, string[]>();
    for (const row of likesResult.rows) {
      const existing = likersMap.get(row.goal_id) ?? [];
      existing.push(row.liker_user_id);
      likersMap.set(row.goal_id, existing);
    }
    for (const goal of goals) {
      const liked_by = likersMap.get(goal.id) ?? [];
      goal.liked_by = liked_by;
      goal.like_count = liked_by.length;
    }
  }

  const streak = await getUserStreak(userId, ref);

  // Check if user marked this day as done
  const completionResult = await pool.query(
    `SELECT 1 FROM daily_completions WHERE user_id = $1 AND completed_date = $2 LIMIT 1`,
    [userId, selectedDay],
  );
  const dayCompleted = completionResult.rows.length > 0;

  return {
    period_key: periodKey,
    days_in_month: daysInMonth,
    days_elapsed: daysElapsed,
    weeks_elapsed: weeksElapsed,
    streak,
    day_completed: dayCompleted,
    selected_day: selectedDay,
    goals,
  };
}

export async function getGroupDashboard(
  groupId: string,
  periodKey: string,
  referenceDate?: Date,
): Promise<GroupDashboardResponse> {
  const ref = referenceDate ?? new Date();
  const selectedDay = ref.toISOString().split('T')[0];

  const usersResult = await pool.query(
    `SELECT id, display_name, avatar_color FROM users WHERE group_id = $1 ORDER BY sort_order ASC`,
    [groupId],
  );

  const users: GroupDashboardUserEntry[] = [];

  for (const userRow of usersResult.rows) {
    const goalsResult = await pool.query(
      `SELECT g.*, c.id AS cat_id, c.name AS cat_name,
              CASE
                WHEN g.goal_type = 'measurement' THEN (
                  SELECT pe2.value
                  FROM progress_entries pe2
                  WHERE pe2.goal_id = g.id AND pe2.logged_for <= $3
                  ORDER BY pe2.logged_for DESC, pe2.created_at DESC
                  LIMIT 1
                )
                ELSE COALESCE(SUM(pe.value), 0)
              END AS current_value
       FROM goals g
       LEFT JOIN categories c ON g.category_id = c.id
       LEFT JOIN progress_entries pe ON pe.goal_id = g.id
         AND g.goal_type = 'accumulation'
         AND pe.logged_for <= $3
       WHERE g.user_id = $1 AND g.period_key = $2
       GROUP BY g.id, c.id, c.name
       ORDER BY g.created_at ASC`,
      [userRow.id, periodKey, selectedDay],
    );

    const goals: GoalWithProgress[] = goalsResult.rows.map((row) => {
      const startValue = row.start_value != null ? parseFloat(row.start_value) : undefined;
      const rawCurrentValue = row.current_value;
      const currentValue = rawCurrentValue != null
        ? parseFloat(rawCurrentValue)
        : (startValue ?? parseFloat(row.target_value));
      const targetValue = parseFloat(row.target_value);
      const calc = calcProgress(
        row.frequency_type as FrequencyType,
        currentValue,
        targetValue,
        periodKey,
        ref,
        row.goal_type as GoalType,
        startValue,
      );
      return {
        id: row.id,
        user_id: row.user_id,
        category_id: row.category_id ?? null,
        period_key: periodKey,
        title: row.title,
        category: row.cat_id ? { id: row.cat_id, name: row.cat_name } : null,
        target_value: targetValue,
        unit: row.unit,
        frequency_type: row.frequency_type,
        goal_type: row.goal_type as GoalType,
        start_value: row.start_value != null ? parseFloat(row.start_value) : null,
        current_value: currentValue,
        expected_value: calc.expectedValue,
        percentage: Math.round(calc.percentage * 100) / 100,
        on_track: calc.onTrack,
        recent_entries: [],
        day_entries: [],
        day_entry_count: 0,
        like_count: 0,
        liked_by: [],
      };
    });

    users.push({
      user: { id: userRow.id, display_name: userRow.display_name, avatar_color: userRow.avatar_color },
      goals,
    });
  }

  // Batch-load day entry counts and likes for all goals
  const allGoals = users.flatMap((u) => u.goals);
  if (allGoals.length > 0) {
    const goalIds = allGoals.map((g) => g.id);

    const [entryCounts, likesResult] = await Promise.all([
      pool.query<{ goal_id: string; count: number }>(
        `SELECT goal_id, COUNT(*)::int AS count
         FROM progress_entries
         WHERE goal_id = ANY($1) AND logged_for = $2
         GROUP BY goal_id`,
        [goalIds, selectedDay],
      ),
      pool.query<{ goal_id: string; liker_user_id: string }>(
        `SELECT goal_id, liker_user_id
         FROM likes
         WHERE goal_id = ANY($1) AND liked_for = $2`,
        [goalIds, selectedDay],
      ),
    ]);

    const entryCountMap = new Map<string, number>();
    for (const row of entryCounts.rows) {
      entryCountMap.set(row.goal_id, row.count);
    }

    const likersMap = new Map<string, string[]>();
    for (const row of likesResult.rows) {
      const existing = likersMap.get(row.goal_id) ?? [];
      existing.push(row.liker_user_id);
      likersMap.set(row.goal_id, existing);
    }

    for (const userEntry of users) {
      for (const goal of userEntry.goals) {
        goal.day_entry_count = entryCountMap.get(goal.id) ?? 0;
        const liked_by = likersMap.get(goal.id) ?? [];
        goal.liked_by = liked_by;
        goal.like_count = liked_by.length;
      }
    }
  }

  return { users };
}
