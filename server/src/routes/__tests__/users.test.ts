import request from 'supertest';
import { app } from '../../app';

// Mock the pool module
jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

import { pool } from '../../db/pool';
const mockQuery = pool.query as jest.Mock;

beforeEach(() => {
  mockQuery.mockReset();
});

describe('GET /api/users', () => {
  it('returns list of users ordered by sort_order', async () => {
    const users = [
      { id: 'uuid-1', display_name: 'Alice', sort_order: 0 },
      { id: 'uuid-2', display_name: 'Bob', sort_order: 1 },
    ];
    mockQuery.mockResolvedValueOnce({ rows: users });

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(users);
  });

  it('returns empty array when no users', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('PATCH /api/users/:id/touch', () => {
  it('updates last_active_at and returns updated user', async () => {
    const user = { id: 'uuid-1', last_active_at: new Date().toISOString() };
    mockQuery.mockResolvedValueOnce({ rows: [user] });

    const res = await request(app).patch('/api/users/uuid-1/touch');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('uuid-1');
  });

  it('returns 404 when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).patch('/api/users/nonexistent/touch');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/users/:id/preferences', () => {
  it('updates sms_reminders_enabled and returns updated user', async () => {
    const updated = { id: 'uuid-1', sms_reminders_enabled: true, reminder_hour: 20, phone: null };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/api/users/uuid-1/preferences')
      .send({ sms_reminders_enabled: true });
    expect(res.status).toBe(200);
    expect(res.body.sms_reminders_enabled).toBe(true);
  });

  it('updates phone number', async () => {
    const updated = { id: 'uuid-1', phone: '+15551234567', sms_reminders_enabled: false, reminder_hour: 20 };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/api/users/uuid-1/preferences')
      .send({ phone: '+15551234567' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+15551234567');
  });

  it('validates reminder_hour is 0-23', async () => {
    const res = await request(app)
      .patch('/api/users/uuid-1/preferences')
      .send({ reminder_hour: 25 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/users/nonexistent/preferences')
      .send({ sms_reminders_enabled: true });
    expect(res.status).toBe(404);
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .patch('/api/users/uuid-1/preferences')
      .send({});
    expect(res.status).toBe(400);
  });
});
