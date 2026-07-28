import { getPersonalDashboard, getGroupDashboard } from '../dashboardService';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../challengeService', () => ({
  getActiveChallenge: jest.fn().mockResolvedValue(null),
}));

import { pool } from '../../db/pool';
const mockQuery = pool.query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
});

const PERIOD = '2026-04';
const REF_DATE = new Date('2026-04-10T12:00:00Z'); // April 10 UTC noon — selectedDay = '2026-04-10'
const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const GROUP_ID = '223e4567-e89b-12d3-a456-426614174000';

// Per-goal query sequence for accumulation goals:
//   Q1: SUM progress (filtered by selectedDay)
//   Q2: recent entries (filtered by selectedDay)
//   Q3: day_entries (for selectedDay)
// After all goals:
//   Qn-1: streak (getUserStreak → daily_completions)
//   Qn:   day_completed (daily_completions)

describe('getPersonalDashboard', () => {
  it('returns correct structure with calculated progress', async () => {
    mockQuery
      // Q1: goals
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'goal-1',
            title: 'Read books',
            frequency_type: 'total',
            target_value: '4.00',
            unit: 'books',
            cat_id: null,
            cat_name: null,
          },
        ],
      })
      // Q2: SUM progress
      .mockResolvedValueOnce({ rows: [{ current_value: '1.00' }] })
      // Q3: recent entries
      .mockResolvedValueOnce({ rows: [{ id: 'pe-1', value: 1, logged_for: '2026-04-02', note: null }] })
      // Q4: day_entries
      .mockResolvedValueOnce({ rows: [] })
      // Q5: batch likes
      .mockResolvedValueOnce({ rows: [{ goal_id: 'goal-1', liker_user_id: 'liker-1' }] })
      // Q6: streak
      .mockResolvedValueOnce({ rows: [{ completed_date: '2026-04-10' }, { completed_date: '2026-04-09' }] })
      // Q7: day_completed
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
      // Q8: user group_id
      .mockResolvedValueOnce({ rows: [{ group_id: GROUP_ID }] });

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);

    expect(result.period_key).toBe(PERIOD);
    expect(result.days_in_month).toBe(30);
    expect(result.days_elapsed).toBe(10);
    expect(result.streak).toBe(2);
    expect(result.day_completed).toBe(true);
    expect(result.selected_day).toBe('2026-04-10');
    expect(result.goals).toHaveLength(1);

    const goal = result.goals[0];
    expect(goal.current_value).toBe(1);
    expect(goal.percentage).toBeCloseTo(25);
    expect(goal.on_track).toBe(false);
    expect(goal.expected_value).toBeCloseTo(1.33, 1);
    expect(goal.recent_entries).toHaveLength(1);
    expect(goal.day_entries).toHaveLength(0);
    expect(goal.like_count).toBe(1);
    expect(goal.liked_by).toEqual(['liker-1']);
  });

  it('returns day_completed false when not marked done', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // no goals
      .mockResolvedValueOnce({ rows: [] }) // streak
      .mockResolvedValueOnce({ rows: [] }) // day_completed (no row)
      .mockResolvedValueOnce({ rows: [{ group_id: GROUP_ID }] }); // user group_id

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    expect(result.day_completed).toBe(false);
  });

  it('handles daily goal and computes on_track', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'goal-2', title: 'Run daily', frequency_type: 'daily', target_value: '1.00', unit: 'km', cat_id: null, cat_name: null }],
      })
      .mockResolvedValueOnce({ rows: [{ current_value: '10.00' }] }) // SUM
      .mockResolvedValueOnce({ rows: [] })  // recent
      .mockResolvedValueOnce({ rows: [] })  // day_entries
      .mockResolvedValueOnce({ rows: [] })  // batch likes
      .mockResolvedValueOnce({ rows: [] })  // streak
      .mockResolvedValueOnce({ rows: [] }) // day_completed
      .mockResolvedValueOnce({ rows: [{ group_id: GROUP_ID }] }); // user group_id

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    const goal = result.goals[0];
    expect(goal.on_track).toBe(true);
    expect(goal.expected_value).toBeCloseTo(10);
  });

  it('returns empty goals array when no goals exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // goals
      .mockResolvedValueOnce({ rows: [] }) // streak
      .mockResolvedValueOnce({ rows: [] }) // day_completed
      .mockResolvedValueOnce({ rows: [{ group_id: GROUP_ID }] }); // user group_id
    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    expect(result.goals).toHaveLength(0);
    expect(result.day_completed).toBe(false);
  });
});

describe('getPersonalDashboard — measurement goal', () => {
  // Per-goal query sequence for measurement goals:
  //   Q1: latest entry (with date filter)
  //   Q2: recent entries
  //   Q3: day_entries

  it('uses latest entry as current_value, not SUM', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          id: 'goal-m', title: 'Lose weight', frequency_type: 'total',
          goal_type: 'measurement', target_value: '75.00', start_value: '90.00',
          unit: 'kg', cat_id: null, cat_name: null,
        }],
      })
      .mockResolvedValueOnce({ rows: [{ value: '82.50' }] })  // latest entry
      .mockResolvedValueOnce({ rows: [{ id: 'pe-1', value: 82.5, logged_for: '2026-04-05', note: null }] }) // recent
      .mockResolvedValueOnce({ rows: [] })  // day_entries
      .mockResolvedValueOnce({ rows: [] })  // batch likes
      .mockResolvedValueOnce({ rows: [] })  // streak
      .mockResolvedValueOnce({ rows: [] }) // day_completed
      .mockResolvedValueOnce({ rows: [{ group_id: GROUP_ID }] }); // user group_id

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    const goal = result.goals[0];
    expect(goal.current_value).toBe(82.5);
    expect(goal.percentage).toBeCloseTo(50);
    expect(goal.expected_value).toBeCloseTo(85);
    expect(goal.on_track).toBe(true);
  });

  it('falls back to start_value when no entries logged', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          id: 'goal-m', title: 'Lose weight', frequency_type: 'total',
          goal_type: 'measurement', target_value: '75.00', start_value: '90.00',
          unit: 'kg', cat_id: null, cat_name: null,
        }],
      })
      .mockResolvedValueOnce({ rows: [] }) // no entries
      .mockResolvedValueOnce({ rows: [] }) // recent
      .mockResolvedValueOnce({ rows: [] }) // day_entries
      .mockResolvedValueOnce({ rows: [] }) // batch likes
      .mockResolvedValueOnce({ rows: [] }) // streak
      .mockResolvedValueOnce({ rows: [] }) // day_completed
      .mockResolvedValueOnce({ rows: [{ group_id: GROUP_ID }] }); // user group_id

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    const goal = result.goals[0];
    expect(goal.current_value).toBe(90);
    expect(goal.percentage).toBe(0);
  });

  it('measurement goal computes expected_value and on_track from pacing', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          id: 'goal-m', title: 'Lose weight', frequency_type: 'total',
          goal_type: 'measurement', target_value: '75.00', start_value: '90.00',
          unit: 'kg', cat_id: null, cat_name: null,
        }],
      })
      .mockResolvedValueOnce({ rows: [{ value: '80.00' }] })
      .mockResolvedValueOnce({ rows: [] }) // recent
      .mockResolvedValueOnce({ rows: [] }) // day_entries
      .mockResolvedValueOnce({ rows: [] }) // batch likes
      .mockResolvedValueOnce({ rows: [] }) // streak
      .mockResolvedValueOnce({ rows: [] }) // day_completed
      .mockResolvedValueOnce({ rows: [{ group_id: GROUP_ID }] }); // user group_id

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    expect(result.goals[0].expected_value).toBeCloseTo(85);
    expect(result.goals[0].on_track).toBe(true);
  });
});

describe('getGroupDashboard', () => {
  it('returns users with full goal progress', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', display_name: 'Alice', avatar_color: '#1976d2' }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'goal-1', title: 'Read books', frequency_type: 'total',
          target_value: '4.00', current_value: '4.00', unit: 'books',
          cat_id: null, cat_name: null,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })  // batch: day entry counts
      .mockResolvedValueOnce({ rows: [] }); // batch: likes

    const result = await getGroupDashboard(GROUP_ID, PERIOD, REF_DATE);
    expect(result.users).toHaveLength(1);
    expect(result.users[0].user.display_name).toBe('Alice');
    expect(result.users[0].goals).toHaveLength(1);
    expect(result.users[0].goals[0].percentage).toBeCloseTo(100);
    expect(result.users[0].goals[0].current_value).toBe(4);
    expect(result.users[0].goals[0].day_entry_count).toBe(0);
    expect(result.users[0].goals[0].like_count).toBe(0);
    expect(result.users[0].goals[0].liked_by).toEqual([]);
  });

  it('handles user with no goals', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', display_name: 'Bob', avatar_color: '#e91e63' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getGroupDashboard(GROUP_ID, PERIOD, REF_DATE);
    expect(result.users[0].goals).toHaveLength(0);
  });
});
