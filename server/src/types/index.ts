export type FrequencyType = 'total' | 'daily' | 'weekly';

export interface Group {
  id: string;
  name: string;
  created_at: Date;
}

export interface User {
  id: string;
  group_id: string;
  display_name: string;
  avatar_color: string;
  phone: string | null;
  sort_order: number;
  last_active_at: Date | null;
  created_at: Date;
}

export interface Category {
  id: string;
  group_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: Date;
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
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProgressEntry {
  id: string;
  goal_id: string;
  value: number;
  logged_for: Date;
  note: string | null;
  created_at: Date;
  updated_at: Date;
}
