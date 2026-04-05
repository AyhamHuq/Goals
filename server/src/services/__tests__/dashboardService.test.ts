import { getPersonalDashboard, getGroupDashboard } from '../dashboardService';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../db/pool';
const mockQuery = pool.query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
});

const PERIOD = '2026-04';
const REF_DATE = new Date(2026, 3, 10); // April 10 — day 10
const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const GROUP_ID = '223e4567-e89b-12d3-a456-426614174000';

describe('getPersonalDashboard', () => {
  it('returns correct structure with calculated progress', async () => {
    // Query 1: goals
    mockQuery
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
      // Query 2: SUM progress
      .mockResolvedValueOnce({ rows: [{ current_value: '1.00' }] })
      // Query 3: recent entries
      .mockResolvedValueOnce({
        rows: [{ id: 'pe-1', value: 1, logged_for: '2026-04-02', note: null }],
      });

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);

    expect(result.period_key).toBe(PERIOD);
    expect(result.days_in_month).toBe(30);
    expect(result.days_elapsed).toBe(10);
    expect(result.goals).toHaveLength(1);

    const goal = result.goals[0];
    expect(goal.current_value).toBe(1);
    expect(goal.percentage).toBeCloseTo(25);
    expect(goal.on_track).toBeNull(); // total frequency
    expect(goal.recent_entries).toHaveLength(1);
  });

  it('handles daily goal and computes on_track', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'goal-2',
            title: 'Run daily',
            frequency_type: 'daily',
            target_value: '1.00',
            unit: 'km',
            cat_id: null,
            cat_name: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ current_value: '10.00' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    const goal = result.goals[0];
    // daysElapsed=10, expected=1*10=10, current=10 → on_track=true
    expect(goal.on_track).toBe(true);
    expect(goal.expected_value).toBeCloseTo(10);
  });

  it('returns empty goals array when no goals exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    expect(result.goals).toHaveLength(0);
  });
});

describe('getPersonalDashboard — measurement goal', () => {
  it('uses latest entry as current_value, not SUM', async () => {
    mockQuery
      // Query 1: goals
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'goal-m',
            title: 'Lose weight',
            frequency_type: 'total',
            goal_type: 'measurement',
            target_value: '75.00',
            start_value: '90.00',
            unit: 'kg',
            cat_id: null,
            cat_name: null,
          },
        ],
      })
      // Query 2: latest entry (measurement path)
      .mockResolvedValueOnce({ rows: [{ value: '82.50' }] })
      // Query 3: recent entries
      .mockResolvedValueOnce({ rows: [{ id: 'pe-1', value: 82.5, logged_for: '2026-04-05', note: null }] });

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    const goal = result.goals[0];
    expect(goal.current_value).toBe(82.5);
    expect(goal.percentage).toBeCloseTo(50); // |90-82.5| / |90-75| = 7.5/15 = 50%
    // Measurement goals with a reference date get paced: expected at day 10 = 90 + (75-90)*(10/30) = 85
    expect(goal.expected_value).toBeCloseTo(85);
    expect(goal.on_track).toBe(true); // 82.5 < 85 for a reducing goal → ahead of pace
  });

  it('falls back to start_value when no entries logged', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'goal-m',
            title: 'Lose weight',
            frequency_type: 'total',
            goal_type: 'measurement',
            target_value: '75.00',
            start_value: '90.00',
            unit: 'kg',
            cat_id: null,
            cat_name: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // no entries yet
      .mockResolvedValueOnce({ rows: [] });

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    const goal = result.goals[0];
    // current_value falls back to start_value (90), so moved=0 → 0%
    expect(goal.current_value).toBe(90);
    expect(goal.percentage).toBe(0);
  });

  it('measurement goal computes expected_value and on_track from pacing', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'goal-m',
            title: 'Lose weight',
            frequency_type: 'total',
            goal_type: 'measurement',
            target_value: '75.00',
            start_value: '90.00',
            unit: 'kg',
            cat_id: null,
            cat_name: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ value: '80.00' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getPersonalDashboard(USER_ID, PERIOD, REF_DATE);
    // REF_DATE = April 10 → expected = 90 + (75-90)*(10/30) = 85
    expect(result.goals[0].expected_value).toBeCloseTo(85);
    // current=80 < expected=85 for reducing goal → on track
    expect(result.goals[0].on_track).toBe(true);
  });
});

describe('getGroupDashboard', () => {
  it('returns users with full goal progress', async () => {
    mockQuery
      // Query 1: users
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', display_name: 'Alice', avatar_color: '#1976d2' }],
      })
      // Query 2: goals with progress for user-1
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'goal-1',
            title: 'Read books',
            frequency_type: 'total',
            target_value: '4.00',
            current_value: '4.00',
            unit: 'books',
            cat_id: null,
            cat_name: null,
          },
        ],
      });

    const result = await getGroupDashboard(GROUP_ID, PERIOD, REF_DATE);
    expect(result.users).toHaveLength(1);
    expect(result.users[0].user.display_name).toBe('Alice');
    expect(result.users[0].goals).toHaveLength(1);
    expect(result.users[0].goals[0].percentage).toBeCloseTo(100);
    expect(result.users[0].goals[0].current_value).toBe(4);
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
