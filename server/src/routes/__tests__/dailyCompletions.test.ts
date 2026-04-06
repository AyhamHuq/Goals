import request from 'supertest';
import { app } from '../../app';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../db/pool';
const mockQuery = pool.query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
});

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TODAY = new Date().toISOString().split('T')[0];
const YESTERDAY = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
})();
const TOMORROW = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
})();

describe('POST /api/daily-completions', () => {
  it('marks today as done and returns 201', async () => {
    const row = { id: 'comp-1', user_id: USER_ID, completed_date: TODAY };
    mockQuery.mockResolvedValueOnce({ rows: [row] });

    const res = await request(app)
      .post('/api/daily-completions')
      .send({ user_id: USER_ID, completed_date: TODAY });

    expect(res.status).toBe(201);
    expect(res.body.completed_date).toBe(TODAY);
  });

  it('marks a past day as done', async () => {
    const row = { id: 'comp-2', user_id: USER_ID, completed_date: YESTERDAY };
    mockQuery.mockResolvedValueOnce({ rows: [row] });

    const res = await request(app)
      .post('/api/daily-completions')
      .send({ user_id: USER_ID, completed_date: YESTERDAY });

    expect(res.status).toBe(201);
  });

  it('rejects future dates with 400', async () => {
    const res = await request(app)
      .post('/api/daily-completions')
      .send({ user_id: USER_ID, completed_date: TOMORROW });

    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('is idempotent — returns 201 even if already completed', async () => {
    // DO UPDATE SET ... RETURNING always returns the row
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'comp-1', user_id: USER_ID, completed_date: TODAY }],
    });

    const res = await request(app)
      .post('/api/daily-completions')
      .send({ user_id: USER_ID, completed_date: TODAY });

    expect(res.status).toBe(201);
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app)
      .post('/api/daily-completions')
      .send({ completed_date: TODAY });
    expect(res.status).toBe(400);
  });

  it('returns 400 when completed_date is missing', async () => {
    const res = await request(app)
      .post('/api/daily-completions')
      .send({ user_id: USER_ID });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/daily-completions', () => {
  it('deletes a completion and returns 204', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete(`/api/daily-completions?user_id=${USER_ID}&completed_date=${TODAY}`);

    expect(res.status).toBe(204);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE'),
      expect.arrayContaining([USER_ID, TODAY]),
    );
  });

  it('returns 400 when params are missing', async () => {
    const res = await request(app)
      .delete(`/api/daily-completions?user_id=${USER_ID}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/daily-completions', () => {
  it('returns completed dates in range', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ completed_date: YESTERDAY }, { completed_date: TODAY }],
    });

    const res = await request(app)
      .get(`/api/daily-completions?user_id=${USER_ID}&from=${YESTERDAY}&to=${TODAY}`);

    expect(res.status).toBe(200);
    expect(res.body.completions).toHaveLength(2);
    expect(res.body.completions).toContain(TODAY);
  });

  it('returns empty array when no completions in range', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/daily-completions?user_id=${USER_ID}&from=${TODAY}&to=${TODAY}`);

    expect(res.status).toBe(200);
    expect(res.body.completions).toEqual([]);
  });

  it('returns 400 when params are missing', async () => {
    const res = await request(app)
      .get(`/api/daily-completions?user_id=${USER_ID}`);
    expect(res.status).toBe(400);
  });
});
