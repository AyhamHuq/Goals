import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';

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

export default router;
