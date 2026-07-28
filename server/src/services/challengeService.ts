import { pool } from '../db/pool';
import { sendPushNotification } from './pushService';
import { config } from '../config';

export interface Challenge {
  id: string;
  group_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'judging' | 'completed' | 'cancelled';
  winner_id: string | null;
  awarded_at: string | null;
  created_at: string;
}

export interface ActiveChallenge extends Challenge {
  days_remaining: number;
  total_days: number;
}

export interface ChallengeUserActivity {
  user_id: string;
  display_name: string;
  avatar_color: string;
  days_logged: number;
  total_days: number;
  completions: string[]; // dates
  progress_entries: Array<{
    id: string;
    goal_title: string;
    value: number;
    logged_for: string;
    note: string | null;
    unit: string;
  }>;
}

export interface ChallengeActivityFeed {
  challenge: Challenge;
  users: ChallengeUserActivity[];
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function createChallenge(groupId: string, durationDays: number): Promise<Challenge> {
  // Check for existing active/judging challenge
  const existing = await pool.query(
    `SELECT id, status FROM gift_card_challenges
     WHERE group_id = $1 AND status IN ('active', 'judging')
     LIMIT 1`,
    [groupId],
  );

  if (existing.rows.length > 0) {
    throw new Error('There is already an active or pending challenge for this group');
  }

  const startDate = todayStr();
  const endDateObj = new Date();
  endDateObj.setDate(endDateObj.getDate() + durationDays - 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const result = await pool.query(
    `INSERT INTO gift_card_challenges (group_id, start_date, end_date)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [groupId, startDate, endDate],
  );

  const challenge = result.rows[0] as Challenge;

  // Notify all users in the group
  const usersResult = await pool.query(
    `SELECT id FROM users WHERE group_id = $1`,
    [groupId],
  );

  for (const user of usersResult.rows) {
    sendPushNotification(
      user.id,
      'Gift Card Challenge Started!',
      `A new challenge has started! Log every day for the next ${durationDays} days for a chance to win a gift card.`,
    ).catch(err => console.error('[Challenge] Notification failed:', err));
  }

  return challenge;
}

export async function getActiveChallenge(groupId: string): Promise<ActiveChallenge | null> {
  const result = await pool.query(
    `SELECT * FROM gift_card_challenges
     WHERE group_id = $1 AND status IN ('active', 'judging')
     ORDER BY created_at DESC
     LIMIT 1`,
    [groupId],
  );

  if (result.rows.length === 0) return null;

  const challenge = result.rows[0] as Challenge;
  const today = new Date();
  const endDate = new Date(challenge.end_date + 'T00:00:00Z');
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = daysBetween(challenge.start_date, challenge.end_date);

  return { ...challenge, days_remaining: daysRemaining, total_days: totalDays };
}

export async function getChallengeActivityFeed(challengeId: string): Promise<ChallengeActivityFeed> {
  const challengeResult = await pool.query(
    `SELECT * FROM gift_card_challenges WHERE id = $1`,
    [challengeId],
  );

  if (challengeResult.rows.length === 0) {
    throw new Error('Challenge not found');
  }

  const challenge = challengeResult.rows[0] as Challenge;
  const totalDays = daysBetween(challenge.start_date, challenge.end_date);

  // Get all users in the group
  const usersResult = await pool.query(
    `SELECT id, display_name, avatar_color FROM users
     WHERE group_id = $1
     ORDER BY sort_order ASC`,
    [challenge.group_id],
  );

  const users: ChallengeUserActivity[] = [];

  for (const user of usersResult.rows) {
    // Daily completions in the challenge period
    const completionsResult = await pool.query(
      `SELECT completed_date::text AS completed_date FROM daily_completions
       WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3
       ORDER BY completed_date ASC`,
      [user.id, challenge.start_date, challenge.end_date],
    );

    // Progress entries in the challenge period
    const entriesResult = await pool.query(
      `SELECT pe.id, g.title AS goal_title, pe.value, pe.logged_for::text AS logged_for, pe.note, g.unit
       FROM progress_entries pe
       JOIN goals g ON pe.goal_id = g.id
       WHERE g.user_id = $1 AND pe.logged_for >= $2 AND pe.logged_for <= $3
       ORDER BY pe.logged_for DESC, pe.created_at DESC`,
      [user.id, challenge.start_date, challenge.end_date],
    );

    users.push({
      user_id: user.id,
      display_name: user.display_name,
      avatar_color: user.avatar_color,
      days_logged: completionsResult.rows.length,
      total_days: totalDays,
      completions: completionsResult.rows.map((r: { completed_date: string }) => r.completed_date),
      progress_entries: entriesResult.rows,
    });
  }

  return { challenge, users };
}

export async function pickWinner(challengeId: string, winnerId: string): Promise<void> {
  const challengeResult = await pool.query(
    `SELECT * FROM gift_card_challenges WHERE id = $1`,
    [challengeId],
  );

  if (challengeResult.rows.length === 0) {
    throw new Error('Challenge not found');
  }

  const challenge = challengeResult.rows[0];
  if (challenge.status !== 'judging') {
    throw new Error('Challenge must be in judging status to pick a winner');
  }

  // Verify winner belongs to the challenge's group
  const memberCheck = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND group_id = $2`,
    [winnerId, challenge.group_id],
  );
  if (memberCheck.rows.length === 0) {
    throw new Error('Winner must be a member of the challenge group');
  }

  await pool.query(
    `UPDATE gift_card_challenges
     SET winner_id = $2, awarded_at = NOW(), status = 'completed'
     WHERE id = $1
     RETURNING *`,
    [challengeId, winnerId],
  );

  // Get winner name for notification
  const userResult = await pool.query(
    `SELECT display_name FROM users WHERE id = $1`,
    [winnerId],
  );

  const winnerName = userResult.rows[0]?.display_name ?? 'Someone';

  // Notify winner
  await sendPushNotification(
    winnerId,
    'Congratulations! You Won!',
    'You won the gift card challenge! You\'ll receive your gift card soon.',
  );

  // Notify admin
  if (config.adminUserId) {
    await sendPushNotification(
      config.adminUserId,
      'Challenge Winner Selected',
      `${winnerName} has been selected as the winner. Don't forget to send the gift card!`,
    );
  }
}

export async function cancelChallenge(challengeId: string): Promise<void> {
  const challengeResult = await pool.query(
    `SELECT * FROM gift_card_challenges WHERE id = $1`,
    [challengeId],
  );

  if (challengeResult.rows.length === 0) {
    throw new Error('Challenge not found');
  }

  if (challengeResult.rows[0].status === 'completed' || challengeResult.rows[0].status === 'cancelled') {
    throw new Error('Cannot cancel a completed or already cancelled challenge');
  }

  await pool.query(
    `UPDATE gift_card_challenges SET status = 'cancelled' WHERE id = $1`,
    [challengeId],
  );
}

export async function transitionExpiredChallenges(): Promise<void> {
  const today = todayStr();

  const result = await pool.query(
    `UPDATE gift_card_challenges
     SET status = 'judging'
     WHERE status = 'active' AND end_date < $1
     RETURNING id, group_id`,
    [today],
  );

  for (const challenge of result.rows) {
    if (config.adminUserId) {
      await sendPushNotification(
        config.adminUserId,
        'Challenge Ended!',
        'The gift card challenge has ended! Time to review activity and pick a winner.',
      );
    }
  }
}

export async function getChallengeHistory(groupId: string): Promise<Array<Challenge & { winner_name: string | null }>> {
  const result = await pool.query(
    `SELECT gc.*, u.display_name AS winner_name
     FROM gift_card_challenges gc
     LEFT JOIN users u ON gc.winner_id = u.id
     WHERE gc.group_id = $1
     ORDER BY gc.created_at DESC`,
    [groupId],
  );

  return result.rows;
}
