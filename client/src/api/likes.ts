import apiClient from './client';

export interface LikeResponse {
  like_count: number;
  liked_by: string[];
}

export async function likeGoal(goal_id: string, liker_user_id: string, date: string): Promise<LikeResponse> {
  const res = await apiClient.post<LikeResponse>('/likes', { goal_id, liker_user_id, date });
  return res.data;
}

export async function unlikeGoal(goal_id: string, liker_user_id: string, date: string): Promise<LikeResponse> {
  const res = await apiClient.delete<LikeResponse>('/likes', { data: { goal_id, liker_user_id, date } });
  return res.data;
}
