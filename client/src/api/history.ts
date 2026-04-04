import apiClient from './client';
import { PersonalDashboardResponse } from '../types';

export async function getHistoryPeriods(userId: string): Promise<string[]> {
  const res = await apiClient.get<string[]>('/history', { params: { user_id: userId } });
  return res.data;
}

export async function getHistoryDetail(
  userId: string,
  periodKey: string
): Promise<PersonalDashboardResponse> {
  const res = await apiClient.get<PersonalDashboardResponse>(`/history/${periodKey}`, {
    params: { user_id: userId },
  });
  return res.data;
}
