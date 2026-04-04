import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProgress,
  createProgress,
  updateProgress,
  deleteProgress,
  CreateProgressInput,
} from '../api/progress';

export function useProgress(goalId: string | undefined) {
  return useQuery({
    queryKey: ['progress', goalId],
    queryFn: () => getProgress(goalId!),
    enabled: !!goalId,
  });
}

export function useCreateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProgressInput) => createProgress(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['progress', variables.goal_id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProgressInput> }) =>
      updateProgress(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProgress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
