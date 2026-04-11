import { useQuery } from '@tanstack/react-query';
import {
  getAdminOverview,
  getAdminTrends,
  getAdminHeatmap,
  getAdminUsers,
  getAdminUserDetail,
  getAdminGoalDetail,
  getAdminEngagement,
  getAdminNotifications,
} from '../api/admin';

export function useAdminOverview(from: string, to: string) {
  return useQuery({
    queryKey: ['admin', 'overview', from, to],
    queryFn: () => getAdminOverview(from, to),
    staleTime: 60_000,
  });
}

export function useAdminTrends(from: string, to: string, granularity: 'day' | 'week' | 'month') {
  return useQuery({
    queryKey: ['admin', 'trends', from, to, granularity],
    queryFn: () => getAdminTrends(from, to, granularity),
    staleTime: 60_000,
  });
}

export function useAdminHeatmap(year: number, userId?: string) {
  return useQuery({
    queryKey: ['admin', 'heatmap', year, userId],
    queryFn: () => getAdminHeatmap(year, userId),
    staleTime: 60_000,
  });
}

export function useAdminUsers(from: string, to: string) {
  return useQuery({
    queryKey: ['admin', 'users', from, to],
    queryFn: () => getAdminUsers(from, to),
    staleTime: 60_000,
  });
}

export function useAdminUserDetail(userId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['admin', 'user-detail', userId, from, to],
    queryFn: () => getAdminUserDetail(userId, from, to),
    staleTime: 60_000,
  });
}

export function useAdminGoalDetail(goalId: string) {
  return useQuery({
    queryKey: ['admin', 'goal-detail', goalId],
    queryFn: () => getAdminGoalDetail(goalId),
    staleTime: 60_000,
  });
}

export function useAdminEngagement(from: string, to: string) {
  return useQuery({
    queryKey: ['admin', 'engagement', from, to],
    queryFn: () => getAdminEngagement(from, to),
    staleTime: 60_000,
  });
}

export function useAdminNotifications() {
  return useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: getAdminNotifications,
    staleTime: 60_000,
  });
}
