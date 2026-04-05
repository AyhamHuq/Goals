import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { validate } from '../middleware/validate';

const router = Router();

const createProgressSchema = z.object({
  goal_id: z.string().uuid(),
  value: z.number(),
  logged_for: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'logged_for must be YYYY-MM-DD'),
  note: z.string().max(500).optional(),
  logged_unit: z.string().max(50).optional(),
  logged_value: z.number().optional(),
});

const updateProgressSchema = z.object({
  value: z.number().optional(),
  logged_for: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(500).nullable().optional(),
  logged_unit: z.string().max(50).nullable().optional(),
  logged_value: z.number().nullable().optional(),
});

// GET /api/progress?goal_id=
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { goal_id } = req.query;
    if (!goal_id || typeof goal_id !== 'string') {
      res.status(400).json({ error: 'goal_id query parameter is required' });
      return;
    }
    const result = await pool.query(
      `SELECT id, goal_id, value,
              TO_CHAR(logged_for, 'YYYY-MM-DD') AS logged_for,
              note, logged_unit, logged_value, created_at, updated_at
       FROM progress_entries WHERE goal_id = $1 ORDER BY logged_for DESC, created_at DESC`,
      [goal_id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/progress
router.post(
  '/',
  validate(createProgressSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goal_id, value, logged_for, note, logged_unit, logged_value } = req.body as z.infer<typeof createProgressSchema>;
      const result = await pool.query(
        `INSERT INTO progress_entries (goal_id, value, logged_for, note, logged_unit, logged_value)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [goal_id, value, logged_for, note ?? null, logged_unit ?? null, logged_value ?? null],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/progress/:id
router.put(
  '/:id',
  validate(updateProgressSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const fields = req.body as z.infer<typeof updateProgressSchema>;

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (fields.value !== undefined) {
        setClauses.push(`value = $${paramIdx++}`);
        values.push(fields.value);
      }
      if (fields.logged_for !== undefined) {
        setClauses.push(`logged_for = $${paramIdx++}`);
        values.push(fields.logged_for);
      }
      if (fields.note !== undefined) {
        setClauses.push(`note = $${paramIdx++}`);
        values.push(fields.note);
      }
      if (fields.logged_unit !== undefined) {
        setClauses.push(`logged_unit = $${paramIdx++}`);
        values.push(fields.logged_unit);
      }
      if (fields.logged_value !== undefined) {
        setClauses.push(`logged_value = $${paramIdx++}`);
        values.push(fields.logged_value);
      }

      if (setClauses.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE progress_entries SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
        values,
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Progress entry not found' });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/progress/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM progress_entries WHERE id = $1 RETURNING id',
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Progress entry not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
