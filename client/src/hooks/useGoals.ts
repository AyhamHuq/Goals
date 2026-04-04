import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  copyFromPrevious,
  CreateGoalInput,
} from '../api/goals';

export function useGoals(userId: string | undefined, periodKey: string) {
  return useQuery({
    queryKey: ['goals', userId, periodKey],
    queryFn: () => getGoals(userId!, periodKey),
    enabled: !!userId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalInput) => createGoal(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['goals', variables.user_id, variables.period_key] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGoalInput> }) =>
      updateGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCopyFromPrevious() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: copyFromPrevious,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['goals', variables.user_id, variables.to_period_key] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
