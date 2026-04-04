import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { pool } from './src/db/pool';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert group
    const groupResult = await client.query<{ id: string }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      ['Our Family']
    );
    const groupId = groupResult.rows[0].id;
    console.log(`Created group: Our Family (${groupId})`);

    // Insert users — names come from SEED_USERS env var (comma-separated)
    const palette = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00', '#0288d1'];
    const names = (process.env.SEED_USERS || 'Alice,Bob,Charlie,Diana,Eve,Frank')
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);
    const users = names.map((name, i) => ({
      name,
      color: palette[i % palette.length],
      order: i,
    }));

    for (const user of users) {
      const result = await client.query<{ id: string }>(
        `INSERT INTO users (group_id, display_name, avatar_color, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [groupId, user.name, user.color, user.order]
      );
      console.log(`Created user: ${user.name} (${result.rows[0].id})`);
    }

    // Insert categories with emoji icons
    const categories = [
      { name: 'Weight Loss',     icon: '⚖️',  order: 0 },
      { name: 'Arabic Learning', icon: '📖',  order: 1 },
      { name: 'Fitness',         icon: '🏋️',  order: 2 },
      { name: 'Quran',           icon: '🕌',  order: 3 },
    ];

    for (const cat of categories) {
      const result = await client.query<{ id: string }>(
        `INSERT INTO categories (group_id, name, icon, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [groupId, cat.name, cat.icon, cat.order]
      );
      console.log(`Created category: ${cat.name} (${result.rows[0].id})`);
    }

    await client.query('COMMIT');
    console.log('\nSeed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
