import request from 'supertest';
import { app } from '../../app';

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn() },
}));

jest.mock('../../services/pushService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

import { pool } from '../../db/pool';
import { sendPushNotification } from '../../services/pushService';

const mockQuery = pool.query as jest.Mock;
const mockPush = sendPushNotification as jest.Mock;

const GOAL_ID   = '00000000-0000-0000-0000-000000000001';
const OWNER_ID  = '00000000-0000-0000-0000-000000000002';
const LIKER_ID  = '00000000-0000-0000-0000-000000000003';
const DATE      = '2026-04-11';

const GOAL = { id: GOAL_ID, user_id: OWNER_ID, title: 'Running' };
const OWNER = { id: OWNER_ID, display_name: 'Alice' };
const LIKER = { id: LIKER_ID, display_name: 'Bob' };

beforeEach(() => {
  mockQuery.mockReset();
  mockPush.mockReset();
  mockPush.mockResolvedValue({ sent: 1, failed: 0 });
});

describe('POST /api/likes', () => {
  function mockLikeCreate(opts: { alreadyLiked?: boolean } = {}) {
    mockQuery
      .mockResolvedValueOnce({ rows: [GOAL] })           // goal lookup
      .mockResolvedValueOnce({ rows: [OWNER] })           // owner lookup
      .mockResolvedValueOnce({ rows: [LIKER] })           // liker lookup
      .mockResolvedValueOnce({                            // insert
        rows: opts.alreadyLiked ? [] : [{ id: 'like-1' }],
        rowCount: opts.alreadyLiked ? 0 : 1,
      })
      .mockResolvedValueOnce({ rows: [{ liker_user_id: LIKER_ID }] }); // current likers
  }

  it('creates a like and returns 201 with like_count and liked_by', async () => {
    mockLikeCreate();
    const res = await request(app)
      .post('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: DATE });

    expect(res.status).toBe(201);
    expect(res.body.like_count).toBe(1);
    expect(res.body.liked_by).toContain(LIKER_ID);
  });

  it('returns 200 if already liked (idempotent)', async () => {
    mockLikeCreate({ alreadyLiked: true });
    const res = await request(app)
      .post('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: DATE });

    expect(res.status).toBe(200);
    expect(res.body.liked_by).toContain(LIKER_ID);
  });

  it('sends a push notification to the goal owner on new like', async () => {
    mockLikeCreate();
    await request(app)
      .post('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: DATE });

    // push is fire-and-forget; wait a tick
    await new Promise((r) => setImmediate(r));
    expect(mockPush).toHaveBeenCalledWith(
      OWNER_ID,
      expect.stringContaining('Bob'),
      expect.any(String),
    );
  });

  it('does not send push notification when already liked', async () => {
    mockLikeCreate({ alreadyLiked: true });
    await request(app)
      .post('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: DATE });

    await new Promise((r) => setImmediate(r));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('returns 400 when liker is the goal owner', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [GOAL] }); // goal lookup
    const res = await request(app)
      .post('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: OWNER_ID, date: DATE });

    expect(res.status).toBe(400);
  });

  it('returns 404 when goal does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: DATE });

    expect(res.status).toBe(404);
  });

  it('returns 400 when goal_id is missing', async () => {
    const res = await request(app)
      .post('/api/likes')
      .send({ liker_user_id: LIKER_ID, date: DATE });
    expect(res.status).toBe(400);
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(app)
      .post('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: 'not-a-date' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/likes', () => {
  function mockLikeDelete() {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // delete
      .mockResolvedValueOnce({ rows: [] });              // current likers (empty)
  }

  it('removes a like and returns 200 with updated like_count', async () => {
    mockLikeDelete();
    const res = await request(app)
      .delete('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: DATE });

    expect(res.status).toBe(200);
    expect(res.body.like_count).toBe(0);
    expect(res.body.liked_by).toEqual([]);
  });

  it('is idempotent when like does not exist', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // nothing deleted
      .mockResolvedValueOnce({ rows: [] });              // current likers

    const res = await request(app)
      .delete('/api/likes')
      .send({ goal_id: GOAL_ID, liker_user_id: LIKER_ID, date: DATE });

    expect(res.status).toBe(200);
  });

  it('returns 400 when liker_user_id is missing', async () => {
    const res = await request(app)
      .delete('/api/likes')
      .send({ goal_id: GOAL_ID, date: DATE });
    expect(res.status).toBe(400);
  });
});
