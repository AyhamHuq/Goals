import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { getPersonalDashboard } from '../services/dashboardService';

const router = Router();

// GET /api/history?user_id= — returns distinct period_keys sorted desc
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user_id } = req.query;
    if (!user_id || typeof user_id !== 'string') {
      res.status(400).json({ error: 'user_id query parameter is required' });
      return;
    }
    const result = await pool.query(
      `SELECT DISTINCT period_key FROM goals WHERE user_id = $1 ORDER BY period_key DESC`,
      [user_id],
    );
    res.json(result.rows.map((r: { period_key: string }) => r.period_key));
  } catch (err) {
    next(err);
  }
});

// GET /api/history/:period_key?user_id= — personal dashboard for that period (read-only)
router.get('/:period_key', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period_key } = req.params;
    const { user_id } = req.query;
    if (!user_id || typeof user_id !== 'string') {
      res.status(400).json({ error: 'user_id query parameter is required' });
      return;
    }
    const data = await getPersonalDashboard(user_id, period_key);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
