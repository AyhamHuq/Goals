import { getDaysInMonth, parseISO, differenceInDays } from 'date-fns';
import { pool } from '../db/pool';
import { calcProgress } from './frequencyCalc';
import { FrequencyType, GoalType } from '../types';

interface RecentEntry {
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
  recent_entries: RecentEntry[];
}

export interface PersonalDashboardResponse {
  period_key: string;
  days_in_month: number;
  days_elapsed: number;
  weeks_elapsed: number;
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
      const latestResult = await pool.query(
        `SELECT value FROM progress_entries
         WHERE goal_id = $1
         ORDER BY logged_for DESC, created_at DESC
         LIMIT 1`,
        [row.id],
      );
      currentValue = latestResult.rows.length > 0
        ? parseFloat(latestResult.rows[0].value)
        : parseFloat(row.start_value ?? row.target_value);
    } else {
      const sumResult = await pool.query(
        `SELECT COALESCE(SUM(value), 0) AS current_value FROM progress_entries WHERE goal_id = $1`,
        [row.id],
      );
      currentValue = parseFloat(sumResult.rows[0].current_value);
    }

    // Get recent 5 entries
    const recentResult = await pool.query(
      `SELECT id, value, logged_for, note, logged_unit, logged_value FROM progress_entries
       WHERE goal_id = $1
       ORDER BY logged_for DESC, created_at DESC
       LIMIT 5`,
      [row.id],
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
    });
  }

  return {
    period_key: periodKey,
    days_in_month: daysInMonth,
    days_elapsed: daysElapsed,
    weeks_elapsed: weeksElapsed,
    goals,
  };
}

export async function getGroupDashboard(
  groupId: string,
  periodKey: string,
  referenceDate?: Date,
): Promise<GroupDashboardResponse> {
  const ref = referenceDate ?? new Date();

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
                  WHERE pe2.goal_id = g.id
                  ORDER BY pe2.logged_for DESC, pe2.created_at DESC
                  LIMIT 1
                )
                ELSE COALESCE(SUM(pe.value), 0)
              END AS current_value
       FROM goals g
       LEFT JOIN categories c ON g.category_id = c.id
       LEFT JOIN progress_entries pe ON pe.goal_id = g.id AND g.goal_type = 'accumulation'
       WHERE g.user_id = $1 AND g.period_key = $2
       GROUP BY g.id, c.id, c.name
       ORDER BY g.created_at ASC`,
      [userRow.id, periodKey],
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
      };
    });

    users.push({
      user: { id: userRow.id, display_name: userRow.display_name, avatar_color: userRow.avatar_color },
      goals,
    });
  }

  return { users };
}
