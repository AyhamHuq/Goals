import apiClient from './client';
import { ProgressEntry } from '../types';

export interface CreateProgressInput {
  goal_id: string;
  value: number;
  logged_for: string;
  note?: string;
}

export async function getProgress(goalId: string): Promise<ProgressEntry[]> {
  const res = await apiClient.get<ProgressEntry[]>('/progress', { params: { goal_id: goalId } });
  return res.data;
}

export async function createProgress(data: CreateProgressInput): Promise<ProgressEntry> {
  const res = await apiClient.post<ProgressEntry>('/progress', data);
  return res.data;
}

export async function updateProgress(
  id: string,
  data: Partial<CreateProgressInput>
): Promise<ProgressEntry> {
  const res = await apiClient.put<ProgressEntry>(`/progress/${id}`, data);
  return res.data;
}

export async function deleteProgress(id: string): Promise<void> {
  await apiClient.delete(`/progress/${id}`);
}
