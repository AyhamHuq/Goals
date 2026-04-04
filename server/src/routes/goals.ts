import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { validate } from '../middleware/validate';

const router = Router();

const createGoalSchema = z.object({
  user_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  period_key: z.string().regex(/^\d{4}-\d{2}$/),
  title: z.string().min(1).max(255),
  target_value: z.number().positive(),
  unit: z.string().min(1).max(50),
  frequency_type: z.enum(['total', 'daily', 'weekly']),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  target_value: z.number().positive().optional(),
  unit: z.string().min(1).max(50).optional(),
  frequency_type: z.enum(['total', 'daily', 'weekly']).optional(),
  category_id: z.string().uuid().nullable().optional(),
});

const copyGoalsSchema = z.object({
  user_id: z.string().uuid(),
  from_period_key: z.string().regex(/^\d{4}-\d{2}$/),
  to_period_key: z.string().regex(/^\d{4}-\d{2}$/),
});

// GET /api/goals?user_id=&period_key=
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id, period_key } = req.query;
    if (!user_id || typeof user_id !== 'string') {
      res.status(400).json({ error: 'user_id query parameter is required' });
      return;
    }
    if (!period_key || typeof period_key !== 'string') {
      res.status(400).json({ error: 'period_key query parameter is required' });
      return;
    }
    const result = await pool.query(
      `SELECT g.*, c.name AS category_name, c.icon AS category_icon
       FROM goals g
       LEFT JOIN categories c ON g.category_id = c.id
       WHERE g.user_id = $1 AND g.period_key = $2
       ORDER BY g.created_at ASC`,
      [user_id, period_key],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/goals/copy-from-previous — must come BEFORE /:id routes
router.post(
  '/copy-from-previous',
  validate(copyGoalsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_id, from_period_key, to_period_key } =
        req.body as z.infer<typeof copyGoalsSchema>;

      // Fetch goals from source period
      const source = await pool.query(
        `SELECT * FROM goals WHERE user_id = $1 AND period_key = $2 AND is_archived = FALSE`,
        [user_id, from_period_key],
      );

      const goals = source.rows;
      let copied = 0;

      for (const goal of goals) {
        await pool.query(
          `INSERT INTO goals (user_id, category_id, period_key, title, target_value, unit, frequency_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            goal.user_id,
            goal.category_id,
            to_period_key,
            goal.title,
            goal.target_value,
            goal.unit,
            goal.frequency_type,
          ],
        );
        copied++;
      }

      res.status(201).json({ copied });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/goals
router.post(
  '/',
  validate(createGoalSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_id, category_id, period_key, title, target_value, unit, frequency_type } =
        req.body as z.infer<typeof createGoalSchema>;
      const result = await pool.query(
        `INSERT INTO goals (user_id, category_id, period_key, title, target_value, unit, frequency_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [user_id, category_id ?? null, period_key, title, target_value, unit, frequency_type],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/goals/:id
router.put(
  '/:id',
  validate(updateGoalSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const fields = req.body as z.infer<typeof updateGoalSchema>;

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (fields.title !== undefined) {
        setClauses.push(`title = $${paramIdx++}`);
        values.push(fields.title);
      }
      if (fields.target_value !== undefined) {
        setClauses.push(`target_value = $${paramIdx++}`);
        values.push(fields.target_value);
      }
      if (fields.unit !== undefined) {
        setClauses.push(`unit = $${paramIdx++}`);
        values.push(fields.unit);
      }
      if (fields.frequency_type !== undefined) {
        setClauses.push(`frequency_type = $${paramIdx++}`);
        values.push(fields.frequency_type);
      }
      if (fields.category_id !== undefined) {
        setClauses.push(`category_id = $${paramIdx++}`);
        values.push(fields.category_id);
      }

      if (setClauses.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE goals SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
        values,
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Goal not found' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/goals/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM goals WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
