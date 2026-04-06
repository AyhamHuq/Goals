import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updatePreferences, UserPreferences } from '../api/users';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, prefs }: { id: string; prefs: UserPreferences }) =>
      updatePreferences(id, prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
