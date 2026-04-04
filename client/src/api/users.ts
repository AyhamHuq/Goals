import apiClient from './client';
import { User } from '../types';

export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get<User[]>('/users');
  return res.data;
}

export async function touchUser(id: string): Promise<void> {
  await apiClient.patch(`/users/${id}/touch`);
}
