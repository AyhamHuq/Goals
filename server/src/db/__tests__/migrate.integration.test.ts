import { runMigrations } from '../migrate';
import { createTestPool, teardownTestDb } from '../../test/db';
import { Pool } from 'pg';

let pool: Pool;

beforeAll(async () => {
  pool = createTestPool();
  // Run migrations once before assertions
  await runMigrations();
});

afterAll(async () => {
  await teardownTestDb(pool);
});

describe('runMigrations (integration)', () => {
  it('applies all migrations without throwing', async () => {
    // Already ran in beforeAll — if it got here, no error was thrown
    expect(true).toBe(true);
  });

  it('is idempotent — running a second time does not error', async () => {
    await expect(runMigrations()).resolves.not.toThrow();
  });

  it('creates schema_migrations tracking table with at least one entry', async () => {
    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM schema_migrations',
    );
    expect(Number(rows[0].count)).toBeGreaterThan(0);
  });

  it('creates all expected application tables', async () => {
    const { rows } = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    const names = rows.map((r) => r.table_name);
    expect(names).toContain('groups');
    expect(names).toContain('users');
    expect(names).toContain('categories');
    expect(names).toContain('goals');
    expect(names).toContain('progress_entries');
    expect(names).toContain('schema_migrations');
  });

  it('goals table has goal_type column from migration 002', async () => {
    const { rows } = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'goals' AND column_name = 'goal_type'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('goals table has start_value column from migration 002', async () => {
    const { rows } = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'goals' AND column_name = 'start_value'`,
    );
    expect(rows).toHaveLength(1);
  });
});
