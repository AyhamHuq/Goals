import request from 'supertest';
import { app } from '../../app';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../services/dashboardService', () => ({
  getPersonalDashboard: jest.fn(),
  getGroupDashboard: jest.fn(),
}));

import { pool } from '../../db/pool';
import { getPersonalDashboard } from '../../services/dashboardService';
const mockQuery = pool.query as jest.Mock;
const mockPersonal = getPersonalDashboard as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
  mockPersonal.mockReset();
});

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('GET /api/history', () => {
  it('returns distinct period_keys for user sorted desc', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ period_key: '2026-04' }, { period_key: '2026-03' }, { period_key: '2026-02' }],
    });

    const res = await request(app).get(`/api/history?user_id=${USER_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['2026-04', '2026-03', '2026-02']);
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).get('/api/history');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/history/:period_key', () => {
  it('returns dashboard data for the given period', async () => {
    const mockData = {
      period_key: '2026-03',
      days_in_month: 31,
      days_elapsed: 31,
      weeks_elapsed: 4.43,
      goals: [],
    };
    mockPersonal.mockResolvedValueOnce(mockData);

    const res = await request(app).get(
      `/api/history/2026-03?user_id=${USER_ID}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.period_key).toBe('2026-03');
    expect(mockPersonal).toHaveBeenCalledWith(USER_ID, '2026-03');
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).get('/api/history/2026-03');
    expect(res.status).toBe(400);
  });
});
