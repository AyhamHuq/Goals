import apiClient from './client';
import { Category } from '../types';

export async function getCategories(groupId: string): Promise<Category[]> {
  const res = await apiClient.get<Category[]>('/categories', { params: { group_id: groupId } });
  return res.data;
}

export async function createCategory(data: {
  group_id: string;
  name: string;
  icon?: string;
}): Promise<Category> {
  const res = await apiClient.post<Category>('/categories', data);
  return res.data;
}
