import apiClient from './client';
import { User } from '../types';

export interface UserPreferences {
  push_reminders_enabled?: boolean;
}

export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get<User[]>('/users');
  return res.data;
}

export async function touchUser(id: string): Promise<void> {
  await apiClient.patch(`/users/${id}/touch`);
}

export async function updatePreferences(id: string, prefs: UserPreferences): Promise<User> {
  const res = await apiClient.patch<User>(`/users/${id}/preferences`, prefs);
  return res.data;
}
