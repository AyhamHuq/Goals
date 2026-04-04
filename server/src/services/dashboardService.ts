import { getDaysInMonth, parseISO, differenceInDays } from 'date-fns';
import { pool } from '../db/pool';
import { calcProgress } from './frequencyCalc';
import { FrequencyType } from '../types';

interface RecentEntry {
  id: string;
  value: number;
  logged_for: string;
  note: string | null;
}

interface GoalWithProgress {
  id: string;
  title: string;
  category: { id: string; name: string } | null;
  target_value: number;
  unit: string;
  frequency_type: FrequencyType;
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

export interface GroupDashboardUserSummary {
  user: {
    id: string;
    display_name: string;
    avatar_color: string;
  };
  goals_summary: {
    total_goals: number;
    completed: number;
    on_track: number;
    avg_percentage: number;
  };
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
    // Get sum of progress for this goal
    const sumResult = await pool.query(
      `SELECT COALESCE(SUM(value), 0) AS current_value FROM progress_entries WHERE goal_id = $1`,
      [row.id],
    );
    const currentValue = parseFloat(sumResult.rows[0].current_value);

    // Get recent 5 entries
    const recentResult = await pool.query(
      `SELECT id, value, logged_for, note FROM progress_entries
       WHERE goal_id = $1
       ORDER BY logged_for DESC, created_at DESC
       LIMIT 5`,
      [row.id],
    );

    const calc = calcProgress(
      row.frequency_type as FrequencyType,
      currentValue,
      parseFloat(row.target_value),
      periodKey,
      ref,
    );

    goals.push({
      id: row.id,
      title: row.title,
      category: row.cat_id ? { id: row.cat_id, name: row.cat_name } : null,
      target_value: parseFloat(row.target_value),
      unit: row.unit,
      frequency_type: row.frequency_type,
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
): Promise<GroupDashboardUserSummary[]> {
  const usersResult = await pool.query(
    `SELECT id, display_name, avatar_color FROM users WHERE group_id = $1 ORDER BY sort_order ASC`,
    [groupId],
  );

  const summaries: GroupDashboardUserSummary[] = [];
  const ref = referenceDate ?? new Date();

  for (const user of usersResult.rows) {
    const goalsResult = await pool.query(
      `SELECT g.*, COALESCE(SUM(pe.value), 0) AS current_value
       FROM goals g
       LEFT JOIN progress_entries pe ON pe.goal_id = g.id
       WHERE g.user_id = $1 AND g.period_key = $2
       GROUP BY g.id
       ORDER BY g.created_at ASC`,
      [user.id, periodKey],
    );

    const goals = goalsResult.rows;
    let totalGoals = goals.length;
    let completed = 0;
    let onTrackCount = 0;
    let totalPercentage = 0;

    for (const goal of goals) {
      const currentValue = parseFloat(goal.current_value);
      const targetValue = parseFloat(goal.target_value);
      const calc = calcProgress(
        goal.frequency_type as FrequencyType,
        currentValue,
        targetValue,
        periodKey,
        ref,
      );

      totalPercentage += calc.percentage;
      if (calc.percentage >= 100) completed++;
      if (calc.onTrack === true) onTrackCount++;
    }

    const avgPercentage =
      totalGoals > 0 ? Math.round((totalPercentage / totalGoals) * 100) / 100 : 0;

    summaries.push({
      user: {
        id: user.id,
        display_name: user.display_name,
        avatar_color: user.avatar_color,
      },
      goals_summary: {
        total_goals: totalGoals,
        completed,
        on_track: onTrackCount,
        avg_percentage: avgPercentage,
      },
    });
  }

  return summaries;
}
