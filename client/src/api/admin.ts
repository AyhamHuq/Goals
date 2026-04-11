import apiClient from './client';
import type {
  OverviewStats,
  TrendPoint,
  HeatmapDay,
  AdminUser,
  AdminUserDetail,
  GoalDetail,
  EngagementStats,
  NotificationStats,
} from '../types/admin';

export async function adminAuth(pin: string): Promise<void> {
  await apiClient.post('/admin/auth', { pin }, { withCredentials: true });
}

export async function adminLogout(): Promise<void> {
  await apiClient.post('/admin/logout', {}, { withCredentials: true });
}

export async function checkAdminAuth(): Promise<boolean> {
  try {
    await apiClient.get('/admin/check', { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

export async function getAdminOverview(from: string, to: string): Promise<OverviewStats> {
  const res = await apiClient.get('/admin/overview', { params: { from, to }, withCredentials: true });
  return res.data;
}

export async function getAdminTrends(from: string, to: string, granularity: 'day' | 'week' | 'month'): Promise<TrendPoint[]> {
  const res = await apiClient.get('/admin/trends', { params: { from, to, granularity }, withCredentials: true });
  return res.data;
}

export async function getAdminHeatmap(year: number, userId?: string): Promise<HeatmapDay[]> {
  const params: Record<string, unknown> = { year };
  if (userId) params.user_id = userId;
  const res = await apiClient.get('/admin/heatmap', { params, withCredentials: true });
  return res.data;
}

export async function getAdminUsers(from: string, to: string): Promise<AdminUser[]> {
  const res = await apiClient.get('/admin/users', { params: { from, to }, withCredentials: true });
  return res.data;
}

export async function getAdminUserDetail(userId: string, from: string, to: string): Promise<AdminUserDetail> {
  const res = await apiClient.get(`/admin/users/${userId}/detail`, { params: { from, to }, withCredentials: true });
  return res.data;
}

export async function getAdminGoalDetail(goalId: string): Promise<GoalDetail> {
  const res = await apiClient.get(`/admin/goals/${goalId}/detail`, { withCredentials: true });
  return res.data;
}

export async function getAdminEngagement(from: string, to: string): Promise<EngagementStats> {
  const res = await apiClient.get('/admin/engagement', { params: { from, to }, withCredentials: true });
  return res.data;
}

export async function getAdminNotifications(): Promise<NotificationStats> {
  const res = await apiClient.get('/admin/notifications', { withCredentials: true });
  return res.data;
}
