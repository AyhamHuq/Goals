export type FrequencyType = 'total' | 'daily' | 'weekly';
export type GoalType = 'accumulation' | 'measurement';

export interface User {
  id: string;
  group_id: string;
  display_name: string;
  avatar_color: string;
  phone: string | null;
  sort_order: number;
  last_active_at: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  group_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  category_id: string | null;
  period_key: string;
  title: string;
  target_value: number;
  unit: string;
  frequency_type: FrequencyType;
  goal_type: GoalType;
  start_value: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressEntry {
  id: string;
  goal_id: string;
  value: number;
  logged_for: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalWithProgress {
  id: string;
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
  recent_entries: Pick<ProgressEntry, 'id' | 'value' | 'logged_for' | 'note'>[];
}

export interface PersonalDashboardResponse {
  period_key: string;
  days_in_month: number;
  days_elapsed: number;
  weeks_elapsed: number;
  goals: GoalWithProgress[];
}

export interface UserGoalSummary {
  user: Pick<User, 'id' | 'display_name' | 'avatar_color'>;
  goals: GoalWithProgress[];
}

export interface GroupDashboardResponse {
  users: UserGoalSummary[];
}
