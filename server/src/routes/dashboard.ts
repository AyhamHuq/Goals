import { Router, Request, Response, NextFunction } from 'express';
import { getPersonalDashboard, getGroupDashboard } from '../services/dashboardService';

const router = Router();

// GET /api/dashboard/personal?user_id=&period_key=
router.get('/personal', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const data = await getPersonalDashboard(user_id, period_key);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/group?group_id=&period_key=
router.get('/group', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { group_id, period_key } = req.query;
    if (!group_id || typeof group_id !== 'string') {
      res.status(400).json({ error: 'group_id query parameter is required' });
      return;
    }
    if (!period_key || typeof period_key !== 'string') {
      res.status(400).json({ error: 'period_key query parameter is required' });
      return;
    }
    const data = await getGroupDashboard(group_id, period_key);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
