import { Pool } from 'pg';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgres://goals:goals@localhost:5432/goals_test';

export function createTestPool(): Pool {
  return new Pool({ connectionString: TEST_DB_URL });
}

/** Truncate all data tables in FK-safe order, preserving schema. */
export async function cleanTestDb(pool: Pool): Promise<void> {
  await pool.query(
    'TRUNCATE TABLE progress_entries, goals, categories, users, groups RESTART IDENTITY CASCADE',
  );
}

export async function teardownTestDb(pool: Pool): Promise<void> {
  await pool.end();
}
