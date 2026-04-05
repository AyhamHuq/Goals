import { Router } from 'express';
import { pool } from '../db/pool';
import { runMigrations } from '../db/migrate';
import { seedDatabase } from '../services/seedService';
import { config } from '../config';

const router = Router();

router.post('/reset', async (_req, res, next) => {
  if (!config.sandbox) {
    return res.status(403).json({ error: 'Only available in sandbox mode' });
  }

  const client = await pool.connect();
  try {
    await client.query(
      'TRUNCATE progress_entries, goals, categories, users, groups CASCADE'
    );
    await client.query('DELETE FROM schema_migrations');
  } catch (err) {
    client.release();
    return next(err);
  }
  client.release();

  try {
    await runMigrations();
    await seedDatabase();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
