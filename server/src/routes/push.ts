import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { validate } from '../middleware/validate';
import { config } from '../config';

const router = Router();

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (_req: Request, res: Response): void => {
  res.json({ publicKey: config.vapidPublicKey });
});

const subscribeSchema = z.object({
  userId: z.string().uuid(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

// POST /api/push/subscribe
router.post('/subscribe', validate(subscribeSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, subscription } = req.body as z.infer<typeof subscribeSchema>;
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', validate(unsubscribeSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { endpoint } = req.body as z.infer<typeof unsubscribeSchema>;
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
