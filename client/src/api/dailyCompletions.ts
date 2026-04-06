import apiClient from './client';

export async function markDayComplete(userId: string, completedDate: string): Promise<void> {
  await apiClient.post('/daily-completions', { user_id: userId, completed_date: completedDate });
}

export async function unmarkDayComplete(userId: string, completedDate: string): Promise<void> {
  await apiClient.delete('/daily-completions', {
    params: { user_id: userId, completed_date: completedDate },
  });
}

export async function getDayCompletions(userId: string, from: string, to: string): Promise<string[]> {
  const res = await apiClient.get<{ completions: string[] }>('/daily-completions', {
    params: { user_id: userId, from, to },
  });
  return res.data.completions;
}
