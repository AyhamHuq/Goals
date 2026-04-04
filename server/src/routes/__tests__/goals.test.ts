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

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_UUID2 = '223e4567-e89b-12d3-a456-426614174000';

const sampleGoal = {
  id: VALID_UUID,
  user_id: VALID_UUID2,
  category_id: null,
  period_key: '2026-04',
  title: 'Read books',
  target_value: '4.00',
  unit: 'books',
  frequency_type: 'total',
  is_archived: false,
};

describe('GET /api/goals', () => {
  it('returns goals for user+period', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleGoal] });
    const res = await request(app).get(`/api/goals?user_id=${VALID_UUID2}&period_key=2026-04`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Read books');
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await request(app).get('/api/goals?period_key=2026-04');
    expect(res.status).toBe(400);
  });

  it('returns 400 when period_key is missing', async () => {
    const res = await request(app).get(`/api/goals?user_id=${VALID_UUID2}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/goals', () => {
  it('creates a goal and returns 201', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleGoal] });
    const res = await request(app)
      .post('/api/goals')
      .send({
        user_id: VALID_UUID2,
        period_key: '2026-04',
        title: 'Read books',
        target_value: 4,
        unit: 'books',
        frequency_type: 'total',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Read books');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/goals')
      .send({ title: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid frequency_type', async () => {
    const res = await request(app)
      .post('/api/goals')
      .send({
        user_id: VALID_UUID2,
        period_key: '2026-04',
        title: 'Read books',
        target_value: 4,
        unit: 'books',
        frequency_type: 'hourly',
      });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/goals/:id', () => {
  it('updates a goal and returns it', async () => {
    const updated = { ...sampleGoal, title: 'Updated title' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });
    const res = await request(app)
      .put(`/api/goals/${VALID_UUID}`)
      .send({ title: 'Updated title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
  });

  it('returns 404 when goal not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .put(`/api/goals/${VALID_UUID}`)
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/goals/:id', () => {
  it('deletes a goal and returns 204', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleGoal] });
    const res = await request(app).delete(`/api/goals/${VALID_UUID}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when goal not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete(`/api/goals/${VALID_UUID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/goals/copy-from-previous', () => {
  it('copies goals and returns count', async () => {
    const goals = [sampleGoal];
    mockQuery
      .mockResolvedValueOnce({ rows: goals })       // SELECT goals to copy
      .mockResolvedValueOnce({ rows: [sampleGoal] }); // INSERT each

    const res = await request(app)
      .post('/api/goals/copy-from-previous')
      .send({
        user_id: VALID_UUID2,
        from_period_key: '2026-03',
        to_period_key: '2026-04',
      });
    expect(res.status).toBe(201);
    expect(res.body.copied).toBe(1);
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/goals/copy-from-previous')
      .send({ user_id: VALID_UUID2 });
    expect(res.status).toBe(400);
  });
});
