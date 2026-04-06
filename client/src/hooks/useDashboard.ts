import { useQuery } from '@tanstack/react-query';
import { getPersonalDashboard, getGroupDashboard } from '../api/dashboard';

export function usePersonalDashboard(
  userId: string | undefined,
  periodKey: string,
  selectedDay?: string,
) {
  return useQuery({
    queryKey: ['dashboard', 'personal', userId, periodKey, selectedDay],
    queryFn: () => getPersonalDashboard(userId!, periodKey, selectedDay),
    enabled: !!userId,
  });
}

export function useGroupDashboard(
  groupId: string | undefined,
  periodKey: string,
  selectedDay?: string,
) {
  return useQuery({
    queryKey: ['dashboard', 'group', groupId, periodKey, selectedDay],
    queryFn: () => getGroupDashboard(groupId!, periodKey, selectedDay),
    enabled: !!groupId,
  });
}
