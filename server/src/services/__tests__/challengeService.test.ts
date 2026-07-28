import {
  createChallenge,
  getActiveChallenge,
  getChallengeActivityFeed,
  pickWinner,
  cancelChallenge,
  transitionExpiredChallenges,
} from '../challengeService';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../pushService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

jest.mock('../../config', () => ({
  config: { adminUserId: 'admin-user-1' },
}));

import { pool } from '../../db/pool';
import { sendPushNotification } from '../pushService';

const mockQuery = pool.query as jest.Mock;
const mockSendPush = sendPushNotification as jest.Mock;

const GROUP_ID = 'group-1';
const USER_ID = 'user-1';
const CHALLENGE_ID = 'challenge-1';

beforeEach(() => {
  mockQuery.mockReset();
  mockSendPush.mockReset();
  mockSendPush.mockResolvedValue({ sent: 1, failed: 0 });
});

describe('createChallenge', () => {
  it('creates a challenge when none is active', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // no active/judging challenge
      .mockResolvedValueOnce({
        rows: [{ id: CHALLENGE_ID, group_id: GROUP_ID, start_date: '2026-07-27', end_date: '2026-08-06', status: 'active' }],
      }) // insert
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }, { id: 'user-2' }] }); // users for notification

    const result = await createChallenge(GROUP_ID, 10);
    expect(result).toMatchObject({ id: CHALLENGE_ID, status: 'active' });
    // Should notify all users
    expect(mockSendPush).toHaveBeenCalledTimes(2);
  });

  it('throws when a challenge is already active', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'existing', status: 'active' }],
    });

    await expect(createChallenge(GROUP_ID, 10)).rejects.toThrow('already an active');
  });

  it('throws when a challenge is in judging status', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'existing', status: 'judging' }],
    });

    await expect(createChallenge(GROUP_ID, 10)).rejects.toThrow('already an active');
  });
});

describe('getActiveChallenge', () => {
  it('returns challenge with days remaining', async () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5);
    const endDateStr = endDate.toISOString().split('T')[0];

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, group_id: GROUP_ID, start_date: '2026-07-27', end_date: endDateStr, status: 'active', created_at: '2026-07-27T00:00:00Z' }],
    });

    const result = await getActiveChallenge(GROUP_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(CHALLENGE_ID);
    expect(result!.days_remaining).toBeGreaterThanOrEqual(4);
    expect(result!.status).toBe('active');
  });

  it('returns null when no active challenge', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await getActiveChallenge(GROUP_ID);
    expect(result).toBeNull();
  });
});

describe('getChallengeActivityFeed', () => {
  it('returns activity for all users during the challenge period', async () => {
    // Challenge query
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: CHALLENGE_ID, group_id: GROUP_ID, start_date: '2026-07-20', end_date: '2026-07-30', status: 'judging',
      }],
    });
    // Users in group
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'user-1', display_name: 'Alice', avatar_color: '#FF0000' },
        { id: 'user-2', display_name: 'Bob', avatar_color: '#0000FF' },
      ],
    });
    // Daily completions for user-1
    mockQuery.mockResolvedValueOnce({
      rows: [{ completed_date: '2026-07-20' }, { completed_date: '2026-07-21' }, { completed_date: '2026-07-22' }],
    });
    // Progress entries for user-1
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'e1', goal_title: 'Read', value: 30, logged_for: '2026-07-20', note: null, unit: 'pages' }],
    });
    // Daily completions for user-2
    mockQuery.mockResolvedValueOnce({
      rows: [{ completed_date: '2026-07-20' }],
    });
    // Progress entries for user-2
    mockQuery.mockResolvedValueOnce({
      rows: [],
    });

    const result = await getChallengeActivityFeed(CHALLENGE_ID);
    expect(result.users).toHaveLength(2);
    expect(result.users[0].display_name).toBe('Alice');
    expect(result.users[0].days_logged).toBe(3);
    expect(result.users[0].total_days).toBe(11); // July 20-30 inclusive
    expect(result.users[1].display_name).toBe('Bob');
    expect(result.users[1].days_logged).toBe(1);
  });

  it('throws when challenge not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(getChallengeActivityFeed('nonexistent')).rejects.toThrow('Challenge not found');
  });
});

describe('pickWinner', () => {
  it('sets winner and sends push notification', async () => {
    // Get challenge
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, group_id: GROUP_ID, status: 'judging' }],
    });
    // Verify winner is in group
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: USER_ID }],
    });
    // Update challenge
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, winner_id: USER_ID, status: 'completed' }],
    });
    // Get winner name
    mockQuery.mockResolvedValueOnce({
      rows: [{ display_name: 'Alice' }],
    });

    await pickWinner(CHALLENGE_ID, USER_ID);

    expect(mockSendPush).toHaveBeenCalledWith(
      USER_ID,
      expect.stringContaining('Congratulations'),
      expect.any(String),
    );
  });

  it('throws when winner is not in the challenge group', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, group_id: GROUP_ID, status: 'judging' }],
    });
    // Membership check returns empty — user not in group
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(pickWinner(CHALLENGE_ID, 'other-user')).rejects.toThrow('member of the challenge group');
  });

  it('throws when challenge is not in judging status', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, group_id: GROUP_ID, status: 'active' }],
    });

    await expect(pickWinner(CHALLENGE_ID, USER_ID)).rejects.toThrow('judging');
  });

  it('throws when challenge not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(pickWinner(CHALLENGE_ID, USER_ID)).rejects.toThrow('Challenge not found');
  });
});

describe('cancelChallenge', () => {
  it('cancels an active challenge', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, status: 'active' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: CHALLENGE_ID, status: 'cancelled' }] });

    await cancelChallenge(CHALLENGE_ID);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("status = 'cancelled'"),
      [CHALLENGE_ID],
    );
  });

  it('throws when challenge is already completed', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, status: 'completed' }],
    });

    await expect(cancelChallenge(CHALLENGE_ID)).rejects.toThrow('Cannot cancel');
  });
});

describe('transitionExpiredChallenges', () => {
  it('transitions active challenges past end_date to judging', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: CHALLENGE_ID, group_id: GROUP_ID }],
    });

    await transitionExpiredChallenges();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("status = 'judging'"),
      expect.any(Array),
    );
    // Should notify admin
    expect(mockSendPush).toHaveBeenCalledWith(
      'admin-user-1',
      expect.any(String),
      expect.stringContaining('pick a winner'),
    );
  });

  it('does nothing when no expired challenges', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await transitionExpiredChallenges();
    expect(mockSendPush).not.toHaveBeenCalled();
  });
});
