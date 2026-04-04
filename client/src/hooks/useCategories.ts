import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory } from '../api/categories';

export function useCategories(groupId: string | undefined) {
  return useQuery({
    queryKey: ['categories', groupId],
    queryFn: () => getCategories(groupId!),
    enabled: !!groupId,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
