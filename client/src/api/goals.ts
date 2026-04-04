import apiClient from './client';
import { Goal, FrequencyType } from '../types';

export interface CreateGoalInput {
  user_id: string;
  category_id?: string | null;
  period_key: string;
  title: string;
  target_value: number;
  unit: string;
  frequency_type: FrequencyType;
}

export async function getGoals(userId: string, periodKey: string): Promise<Goal[]> {
  const res = await apiClient.get<Goal[]>('/goals', { params: { user_id: userId, period_key: periodKey } });
  return res.data;
}

export async function createGoal(data: CreateGoalInput): Promise<Goal> {
  const res = await apiClient.post<Goal>('/goals', data);
  return res.data;
}

export async function updateGoal(id: string, data: Partial<CreateGoalInput>): Promise<Goal> {
  const res = await apiClient.put<Goal>(`/goals/${id}`, data);
  return res.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}

export async function copyFromPrevious(data: {
  user_id: string;
  from_period_key: string;
  to_period_key: string;
}): Promise<Goal[]> {
  const res = await apiClient.post<Goal[]>('/goals/copy-from-previous', data);
  return res.data;
}
