import apiClient from './client';

export interface LikeResponse {
  like_count: number;
  liked_by: string[];
}

export interface GoalLikesResponse {
  likes_by_date: Record<string, string[]>;
}

export async function fetchGoalLikes(goal_id: string): Promise<GoalLikesResponse> {
  const res = await apiClient.get<GoalLikesResponse>(`/likes/goal/${goal_id}`);
  return res.data;
}

export async function likeGoal(goal_id: string, liker_user_id: string, date: string): Promise<LikeResponse> {
  const res = await apiClient.post<LikeResponse>('/likes', { goal_id, liker_user_id, date });
  return res.data;
}

export async function unlikeGoal(goal_id: string, liker_user_id: string, date: string): Promise<LikeResponse> {
  const res = await apiClient.delete<LikeResponse>('/likes', { data: { goal_id, liker_user_id, date } });
  return res.data;
}
