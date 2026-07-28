import { Router, Request, Response, NextFunction } from 'express';
import { adminLogin, adminLogout, adminGuard } from '../middleware/adminAuth';
import * as analytics from '../services/adminAnalyticsService';
import {
  createChallenge,
  getActiveChallenge,
  getChallengeActivityFeed,
  pickWinner,
  cancelChallenge,
  getChallengeHistory,
} from '../services/challengeService';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// POST /api/admin/challenges — create a new challenge
router.post('/challenges', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { group_id, duration_days } = req.body;
    if (!group_id || typeof group_id !== 'string' || !UUID_RE.test(group_id)) {
      res.status(400).json({ error: 'Valid group_id (UUID) is required' });
      return;
    }
    if (!duration_days || typeof duration_days !== 'number' || !Number.isInteger(duration_days) || duration_days < 1 || duration_days > 365) {
      res.status(400).json({ error: 'duration_days must be an integer between 1 and 365' });
      return;
    }
    const challenge = await createChallenge(group_id, duration_days);
    res.status(201).json(challenge);
  } catch (err: any) {
    if (err.message?.includes('already an active')) {
      res.status(409).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// GET /api/admin/challenges/current?group_id=
router.get('/challenges/current', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { group_id } = req.query;
    if (!group_id || typeof group_id !== 'string' || !UUID_RE.test(group_id)) {
      res.status(400).json({ error: 'Valid group_id (UUID) is required' });
      return;
    }
    const challenge = await getActiveChallenge(group_id);
    res.json({ challenge });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/challenges/:id/activity — full activity feed for judging
router.get('/challenges/:id/activity', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid challenge ID' });
      return;
    }
    const feed = await getChallengeActivityFeed(req.params.id);
    res.json(feed);
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// POST /api/admin/challenges/:id/winner — pick a winner
router.post('/challenges/:id/winner', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid challenge ID' });
      return;
    }
    const { user_id } = req.body;
    if (!user_id || typeof user_id !== 'string' || !UUID_RE.test(user_id)) {
      res.status(400).json({ error: 'Valid user_id (UUID) is required' });
      return;
    }
    await pickWinner(req.params.id, user_id);
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message?.includes('judging')) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// POST /api/admin/challenges/:id/cancel — cancel a challenge
router.post('/challenges/:id/cancel', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid challenge ID' });
      return;
    }
    await cancelChallenge(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    if (err.message?.includes('Cannot cancel')) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// GET /api/admin/challenges/history?group_id=
router.get('/challenges/history', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { group_id } = req.query;
    if (!group_id || typeof group_id !== 'string' || !UUID_RE.test(group_id)) {
      res.status(400).json({ error: 'Valid group_id (UUID) is required' });
      return;
    }
    const history = await getChallengeHistory(group_id);
    res.json(history);
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
