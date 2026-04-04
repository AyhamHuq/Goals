import request from 'supertest';
import { app } from '../../app';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

// Mock the dashboard service so we don't have to chain many queries
jest.mock('../../services/dashboardService', () => ({
  getPersonalDashboard: jest.fn(),
  getGroupDashboard: jest.fn(),
}));

import { getPersonalDashboard, getGroupDashboard } from '../../services/dashboardService';
const mockPersonal = getPersonalDashboard as jest.Mock;
const mockGroup = getGroupDashboard as jest.Mock;

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const GROUP_ID = '223e4567-e89b-12d3-a456-426614174000';

beforeEach(() => {
  mockPersonal.mockReset();
  mockGroup.mockReset();
});

describe('GET /api/dashboard/personal', () => {
  it('returns personal dashboard data', async () => {
    const mockData = {
      period_key: '2026-04',
      days_in_month: 30,
      days_elapsed: 3,
      weeks_elapsed: 0.43,
      goals: [],
    };
    mockPersonal.mockResolvedValueOnce(mockData);

    const res = await request(app).get(
      `/api/dashboard/personal?user_id=${USER_ID}&period_key=2026-04`,
    );
    expect(res.status).toBe(200);
    expect(res.body.period_key).toBe('2026-04');
    expect(mockPersonal).toHaveBeenCalledWith(USER_ID, '2026-04');
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).get('/api/dashboard/personal?period_key=2026-04');
    expect(res.status).toBe(400);
  });

  it('returns 400 when period_key is missing', async () => {
    const res = await request(app).get(`/api/dashboard/personal?user_id=${USER_ID}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/dashboard/group', () => {
  it('returns group dashboard data', async () => {
    const mockData = [
      {
        user: { id: USER_ID, display_name: 'Alice', avatar_color: '#1976d2' },
        goals_summary: { total_goals: 3, completed: 1, on_track: 2, avg_percentage: 60 },
      },
    ];
    mockGroup.mockResolvedValueOnce(mockData);

    const res = await request(app).get(
      `/api/dashboard/group?group_id=${GROUP_ID}&period_key=2026-04`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].user.display_name).toBe('Alice');
  });

  it('returns 400 when group_id is missing', async () => {
    const res = await request(app).get('/api/dashboard/group?period_key=2026-04');
    expect(res.status).toBe(400);
  });
});
