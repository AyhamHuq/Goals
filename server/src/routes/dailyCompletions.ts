import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { validate } from '../middleware/validate';

const router = Router();

const createSchema = z.object({
  user_id: z.string().uuid(),
  completed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// POST /api/daily-completions — mark a day as done
router.post('/', validate(createSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, completed_date } = req.body as z.infer<typeof createSchema>;

    // Reject future dates
    const today = new Date().toISOString().split('T')[0];
    if (completed_date > today) {
      res.status(400).json({ error: 'Cannot mark a future date as complete' });
      return;
    }

    // Upsert — DO UPDATE with no-op keeps the original row, RETURNING always gives back the row
    const result = await pool.query(
      `INSERT INTO daily_completions (user_id, completed_date)
       VALUES ($1, $2)
       ON CONFLICT (user_id, completed_date)
       DO UPDATE SET created_at = daily_completions.created_at
       RETURNING *`,
      [user_id, completed_date],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/daily-completions?user_id=&completed_date= — unmark a day
router.delete('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, completed_date } = req.query;
    if (!user_id || typeof user_id !== 'string') {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }
    if (!completed_date || typeof completed_date !== 'string') {
      res.status(400).json({ error: 'completed_date is required' });
      return;
    }

    await pool.query(
      `DELETE FROM daily_completions WHERE user_id = $1 AND completed_date = $2`,
      [user_id, completed_date],
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/daily-completions?user_id=&from=&to= — list completions in date range
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, from, to } = req.query;
    if (!user_id || typeof user_id !== 'string') {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }
    if (!from || typeof from !== 'string' || !to || typeof to !== 'string') {
      res.status(400).json({ error: 'from and to query params are required' });
      return;
    }

    const result = await pool.query(
      `SELECT completed_date::text FROM daily_completions
       WHERE user_id = $1 AND completed_date >= $2 AND completed_date <= $3
       ORDER BY completed_date ASC`,
      [user_id, from, to],
    );

    res.json({ completions: result.rows.map((r: { completed_date: string }) => r.completed_date) });
  } catch (err) {
    next(err);
  }
});

export default router;
