import { Router, Request, Response, NextFunction } from 'express';
import { adminLogin, adminLogout, adminGuard } from '../middleware/adminAuth';
import * as analytics from '../services/adminAnalyticsService';

const router = Router();

// POST /api/admin/auth — no guard
router.post('/auth', (req: Request, res: Response) => {
  adminLogin(req, res);
});

// POST /api/admin/logout — no guard
router.post('/logout', (req: Request, res: Response) => {
  adminLogout(req, res);
});

// All routes below require auth
router.use(adminGuard);

// GET /api/admin/check — verify cookie is valid
router.get('/check', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// GET /api/admin/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/overview', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from = defaultFrom(), to = today() } = req.query as Record<string, string>;
    const data = await analytics.getOverview(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/trends?from&to&granularity=day|week|month
router.get('/trends', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from = defaultFrom(), to = today(), granularity = 'day' } = req.query as Record<string, string>;
    const g = granularity as 'day' | 'week' | 'month';
    const data = await analytics.getTrends(from, to, g);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/heatmap?year=2026&user_id=<optional>
router.get('/heatmap', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year = String(new Date().getFullYear()), user_id } = req.query as Record<string, string>;
    const data = await analytics.getHeatmap(Number(year), user_id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users?from&to
router.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from = defaultFrom(), to = today() } = req.query as Record<string, string>;
    const data = await analytics.getUsers(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id/detail?from&to
router.get('/users/:id/detail', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from = defaultFrom(), to = today() } = req.query as Record<string, string>;
    const data = await analytics.getUserDetail(req.params.id, from, to);
    if (!data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/goals/:id/detail
router.get('/goals/:id/detail', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await analytics.getGoalDetail(req.params.id);
    if (!data) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/engagement?from&to
router.get('/engagement', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from = defaultFrom(), to = today() } = req.query as Record<string, string>;
    const data = await analytics.getEngagement(from, to);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/notifications
router.get('/notifications', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await analytics.getNotificationStats();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

export default router;
