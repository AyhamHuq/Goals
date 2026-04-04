import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { validate } from '../middleware/validate';

const router = Router();

const createCategorySchema = z.object({
  group_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  icon: z.string().max(50).optional(),
});

// GET /api/categories?group_id= — list categories for a group
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { group_id } = req.query;
    if (!group_id || typeof group_id !== 'string') {
      res.status(400).json({ error: 'group_id query parameter is required' });
      return;
    }
    const result = await pool.query(
      'SELECT * FROM categories WHERE group_id = $1 ORDER BY sort_order ASC',
      [group_id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories — create a category
router.post(
  '/',
  validate(createCategorySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { group_id, name, icon } = req.body as z.infer<typeof createCategorySchema>;
      const result = await pool.query(
        `INSERT INTO categories (group_id, name, icon)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [group_id, name, icon ?? null],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
