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

const sampleEntry = {
  id: VALID_UUID,
  goal_id: VALID_UUID,
  value: '5.00',
  logged_for: '2026-04-03',
  note: null,
};

describe('GET /api/progress', () => {
  it('returns progress entries for a goal', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleEntry] });
    const res = await request(app).get(`/api/progress?goal_id=${VALID_UUID}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 400 when goal_id is missing', async () => {
    const res = await request(app).get('/api/progress');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/progress', () => {
  it('creates an entry and returns 201', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleEntry] });
    const res = await request(app)
      .post('/api/progress')
      .send({
        goal_id: VALID_UUID,
        value: 5,
        logged_for: '2026-04-03',
      });
    expect(res.status).toBe(201);
    expect(res.body.goal_id).toBe(VALID_UUID);
  });

  it('creates entry with note', async () => {
    const withNote = { ...sampleEntry, note: 'Great run!' };
    mockQuery.mockResolvedValueOnce({ rows: [withNote] });
    const res = await request(app)
      .post('/api/progress')
      .send({
        goal_id: VALID_UUID,
        value: 5,
        logged_for: '2026-04-03',
        note: 'Great run!',
      });
    expect(res.status).toBe(201);
    expect(res.body.note).toBe('Great run!');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/progress')
      .send({ value: 5 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when logged_for is invalid date', async () => {
    const res = await request(app)
      .post('/api/progress')
      .send({ goal_id: VALID_UUID, value: 5, logged_for: 'not-a-date' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/progress/:id', () => {
  it('updates an entry and returns it', async () => {
    const updated = { ...sampleEntry, value: '10.00' };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });
    const res = await request(app)
      .put(`/api/progress/${VALID_UUID}`)
      .send({ value: 10 });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('10.00');
  });

  it('returns 404 when entry not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .put(`/api/progress/${VALID_UUID}`)
      .send({ value: 10 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/progress/:id', () => {
  it('deletes an entry and returns 204', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleEntry] });
    const res = await request(app).delete(`/api/progress/${VALID_UUID}`);
    expect(res.status).toBe(204);
  });

  it('returns 404 when entry not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).delete(`/api/progress/${VALID_UUID}`);
    expect(res.status).toBe(404);
  });
});
