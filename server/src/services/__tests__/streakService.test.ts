import { getUserStreak } from '../streakService';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../db/pool';
const mockQuery = pool.query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
});

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('getUserStreak', () => {
  it('returns 0 when user has no daily completions', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const result = await getUserStreak(USER_ID);
    expect(result).toBe(0);
  });

  it('returns 1 when user only completed today', async () => {
    const ref = new Date('2026-04-10');
    mockQuery.mockResolvedValueOnce({
      rows: [{ completed_date: '2026-04-10' }],
    });
    const result = await getUserStreak(USER_ID, ref);
    expect(result).toBe(1);
  });

  it('returns N for N consecutive days ending today', async () => {
    const ref = new Date('2026-04-10');
    mockQuery.mockResolvedValueOnce({
      rows: [
        { completed_date: '2026-04-10' },
        { completed_date: '2026-04-09' },
        { completed_date: '2026-04-08' },
        { completed_date: '2026-04-07' },
      ],
    });
    const result = await getUserStreak(USER_ID, ref);
    expect(result).toBe(4);
  });

  it('breaks streak when there is a gap', async () => {
    const ref = new Date('2026-04-10');
    mockQuery.mockResolvedValueOnce({
      rows: [
        { completed_date: '2026-04-10' },
        { completed_date: '2026-04-09' },
        // gap: missing 2026-04-08
        { completed_date: '2026-04-07' },
        { completed_date: '2026-04-06' },
      ],
    });
    const result = await getUserStreak(USER_ID, ref);
    expect(result).toBe(2);
  });

  it('still counts streak if user completed yesterday but not yet today (grace period)', async () => {
    const ref = new Date('2026-04-10');
    mockQuery.mockResolvedValueOnce({
      rows: [
        { completed_date: '2026-04-09' },
        { completed_date: '2026-04-08' },
        { completed_date: '2026-04-07' },
      ],
    });
    const result = await getUserStreak(USER_ID, ref);
    expect(result).toBe(3);
  });

  it('returns 0 if last completion was 2+ days ago', async () => {
    const ref = new Date('2026-04-10');
    mockQuery.mockResolvedValueOnce({
      rows: [
        { completed_date: '2026-04-08' },
        { completed_date: '2026-04-07' },
      ],
    });
    const result = await getUserStreak(USER_ID, ref);
    expect(result).toBe(0);
  });

  it('retroactive completion repairs streak', async () => {
    // User missed Apr 8 but went back and marked it done
    const ref = new Date('2026-04-10');
    mockQuery.mockResolvedValueOnce({
      rows: [
        { completed_date: '2026-04-10' },
        { completed_date: '2026-04-09' },
        { completed_date: '2026-04-08' }, // retroactively filled in
        { completed_date: '2026-04-07' },
      ],
    });
    const result = await getUserStreak(USER_ID, ref);
    expect(result).toBe(4);
  });
});
