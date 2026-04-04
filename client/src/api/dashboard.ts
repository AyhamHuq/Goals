import apiClient from './client';
import { PersonalDashboardResponse, GroupDashboardResponse } from '../types';

export async function getPersonalDashboard(
  userId: string,
  periodKey: string
): Promise<PersonalDashboardResponse> {
  const res = await apiClient.get<PersonalDashboardResponse>('/dashboard/personal', {
    params: { user_id: userId, period_key: periodKey },
  });
  return res.data;
}

export async function getGroupDashboard(
  groupId: string,
  periodKey: string
): Promise<GroupDashboardResponse> {
  const res = await apiClient.get<GroupDashboardResponse>('/dashboard/group', {
    params: { group_id: groupId, period_key: periodKey },
  });
  return res.data;
}
