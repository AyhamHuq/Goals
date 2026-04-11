import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { validate } from '../middleware/validate';
import { sendPushNotification } from '../services/pushService';

const router = Router();

const likeBodySchema = z.object({
  goal_id:       z.string().uuid(),
  liker_user_id: z.string().uuid(),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

async function currentLikers(goalId: string, date: string): Promise<string[]> {
  const result = await pool.query<{ liker_user_id: string }>(
    `SELECT liker_user_id FROM likes WHERE goal_id = $1 AND liked_for = $2`,
    [goalId, date],
  );
  return result.rows.map((r) => r.liker_user_id);
}

// POST /api/likes — like a goal's progress for a given day
router.post('/', validate(likeBodySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { goal_id, liker_user_id, date } = req.body as z.infer<typeof likeBodySchema>;

    // Look up goal to get owner
    const goalResult = await pool.query<{ id: string; user_id: string; title: string }>(
      `SELECT id, user_id, title FROM goals WHERE id = $1`,
      [goal_id],
    );
    if (goalResult.rows.length === 0) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    const goal = goalResult.rows[0];

    if (liker_user_id === goal.user_id) {
      res.status(400).json({ error: 'Cannot like your own goal' });
      return;
    }

    // Get owner and liker names for push message
    const [ownerResult, likerResult] = await Promise.all([
      pool.query<{ id: string; display_name: string }>(`SELECT id, display_name FROM users WHERE id = $1`, [goal.user_id]),
      pool.query<{ id: string; display_name: string }>(`SELECT id, display_name FROM users WHERE id = $1`, [liker_user_id]),
    ]);
    const owner = ownerResult.rows[0];
    const liker = likerResult.rows[0];

    const insertResult = await pool.query(
      `INSERT INTO likes (goal_id, liked_for, liker_user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (goal_id, liked_for, liker_user_id) DO NOTHING
       RETURNING id`,
      [goal_id, date, liker_user_id],
    );

    const isNew = (insertResult.rowCount ?? 0) > 0;

    // Fire-and-forget push notification on new like
    if (isNew && owner && liker) {
      sendPushNotification(
        goal.user_id,
        `❤️ ${liker.display_name} liked your progress!`,
        `Keep it up, ${owner.display_name}! Your ${goal.title} is inspiring.`,
      ).catch(console.error);
    }

    const liked_by = await currentLikers(goal_id, date);
    res.status(isNew ? 201 : 200).json({ like_count: liked_by.length, liked_by });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/likes — unlike a goal's progress for a given day
router.delete('/', validate(likeBodySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { goal_id, liker_user_id, date } = req.body as z.infer<typeof likeBodySchema>;

    await pool.query(
      `DELETE FROM likes WHERE goal_id = $1 AND liked_for = $2 AND liker_user_id = $3`,
      [goal_id, date, liker_user_id],
    );

    const liked_by = await currentLikers(goal_id, date);
    res.json({ like_count: liked_by.length, liked_by });
  } catch (err) {
    next(err);
  }
});

export default router;
