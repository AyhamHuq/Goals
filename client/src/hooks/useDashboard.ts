import { useQuery } from '@tanstack/react-query';
import { getPersonalDashboard, getGroupDashboard } from '../api/dashboard';

export function usePersonalDashboard(userId: string | undefined, periodKey: string) {
  return useQuery({
    queryKey: ['dashboard', 'personal', userId, periodKey],
    queryFn: () => getPersonalDashboard(userId!, periodKey),
    enabled: !!userId,
  });
}

export function useGroupDashboard(groupId: string | undefined, periodKey: string) {
  return useQuery({
    queryKey: ['dashboard', 'group', groupId, periodKey],
    queryFn: () => getGroupDashboard(groupId!, periodKey),
    enabled: !!groupId,
  });
}
