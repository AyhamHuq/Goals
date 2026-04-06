import apiClient from './client';
import { PersonalDashboardResponse, GroupDashboardResponse } from '../types';

export async function getPersonalDashboard(
  userId: string,
  periodKey: string,
  selectedDay?: string,
): Promise<PersonalDashboardResponse> {
  const params: Record<string, string> = { user_id: userId, period_key: periodKey };
  if (selectedDay) params.reference_date = selectedDay;
  const res = await apiClient.get<PersonalDashboardResponse>('/dashboard/personal', { params });
  return res.data;
}

export async function getGroupDashboard(
  groupId: string,
  periodKey: string,
  selectedDay?: string,
): Promise<GroupDashboardResponse> {
  const params: Record<string, string> = { group_id: groupId, period_key: periodKey };
  if (selectedDay) params.reference_date = selectedDay;
  const res = await apiClient.get<GroupDashboardResponse>('/dashboard/group', { params });
  return res.data;
}
