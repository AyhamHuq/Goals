import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markDayComplete, unmarkDayComplete } from '../api/dailyCompletions';

export function useMarkDayComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, completedDate }: { userId: string; completedDate: string }) =>
      markDayComplete(userId, completedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUnmarkDayComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, completedDate }: { userId: string; completedDate: string }) =>
      unmarkDayComplete(userId, completedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
