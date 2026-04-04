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

describe('GET /api/categories', () => {
  it('returns categories for a group ordered by sort_order', async () => {
    const cats = [
      { id: 'cat-1', name: 'Health', sort_order: 0 },
      { id: 'cat-2', name: 'Reading', sort_order: 1 },
    ];
    mockQuery.mockResolvedValueOnce({ rows: cats });

    const res = await request(app).get('/api/categories?group_id=grp-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(cats);
  });

  it('returns 400 when group_id is missing', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/categories', () => {
  it('creates a category and returns 201', async () => {
    const created = { id: 'cat-new', group_id: 'grp-1', name: 'Fitness', icon: '🏃' };
    mockQuery.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post('/api/categories')
      .send({ group_id: '123e4567-e89b-12d3-a456-426614174000', name: 'Fitness', icon: '🏃' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Fitness');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'No group' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ group_id: '123e4567-e89b-12d3-a456-426614174000' });
    expect(res.status).toBe(400);
  });
});
