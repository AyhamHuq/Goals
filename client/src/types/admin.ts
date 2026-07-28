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

export interface NotificationStats {
  usersWithSubscriptions: number;
  totalSubscriptions: number;
  reminderEnabledCount: number;
  recentNotifications: Array<{
    user_id: string;
    display_name: string;
    notification_type: string;
    sent_for: string;
    sent_at: string;
  }>;
}

export type TimeRange = '12h' | '1d' | '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export interface Challenge {
  id: string;
  group_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'judging' | 'completed' | 'cancelled';
  winner_id: string | null;
  winner_name: string | null;
  awarded_at: string | null;
  gift_card_name: string | null;
  gift_card_amount: string | null;
  leader_id: string | null;
  leader_name: string | null;
  created_at: string;
}

export interface ChallengeUserActivity {
  user_id: string;
  display_name: string;
  avatar_color: string;
  days_logged: number;
  total_days: number;
  completions: string[];
  progress_entries: Array<{
    id: string;
    goal_title: string;
    value: number;
    logged_for: string;
    note: string | null;
    unit: string;
  }>;
}

export interface ChallengeActivityFeed {
  challenge: Challenge;
  users: ChallengeUserActivity[];
}
