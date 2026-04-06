import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { validate } from '../middleware/validate';

const router = Router();

// GET /api/users — list all users ordered by sort_order
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY sort_order ASC',
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/touch — update last_active_at
router.patch('/:id/touch', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE users SET last_active_at = NOW() WHERE id = $1 RETURNING *',
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

const preferencesSchema = z
  .object({
    phone: z.string().max(20).nullable().optional(),
    sms_reminders_enabled: z.boolean().optional(),
    reminder_hour: z.number().int().min(0).max(23).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one preference field must be provided',
  });

// PATCH /api/users/:id/preferences — update notification preferences
router.patch('/:id/preferences', validate(preferencesSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const fields = req.body as z.infer<typeof preferencesSchema>;

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (fields.phone !== undefined) {
      setClauses.push(`phone = $${idx++}`);
      values.push(fields.phone);
    }
    if (fields.sms_reminders_enabled !== undefined) {
      setClauses.push(`sms_reminders_enabled = $${idx++}`);
      values.push(fields.sms_reminders_enabled);
    }
    if (fields.reminder_hour !== undefined) {
      setClauses.push(`reminder_hour = $${idx++}`);
      values.push(fields.reminder_hour);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
