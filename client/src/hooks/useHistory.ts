import { useQuery } from '@tanstack/react-query';
import { getHistoryPeriods, getHistoryDetail } from '../api/history';

export function useHistoryPeriods(userId: string | undefined) {
  return useQuery({
    queryKey: ['history', 'periods', userId],
    queryFn: () => getHistoryPeriods(userId!),
    enabled: !!userId,
  });
}

export function useHistoryDetail(userId: string | undefined, periodKey: string | undefined) {
  return useQuery({
    queryKey: ['history', 'detail', userId, periodKey],
    queryFn: () => getHistoryDetail(userId!, periodKey!),
    enabled: !!userId && !!periodKey,
  });
}
