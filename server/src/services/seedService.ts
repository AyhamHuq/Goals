import { pool } from '../db/pool';

export async function seedDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const groupResult = await client.query<{ id: string }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      ['Our Family']
    );
    const groupId = groupResult.rows[0].id;

    const palette = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00', '#0288d1'];
    const names = (process.env.SEED_USERS || 'Alice,Bob,Charlie,Diana,Eve,Frank')
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

    for (let i = 0; i < names.length; i++) {
      await client.query(
        `INSERT INTO users (group_id, display_name, avatar_color, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [groupId, names[i], palette[i % palette.length], i]
      );
    }

    const categories = [
      { name: 'Weight Loss',          icon: '⚖️',  order: 0 },
      { name: 'Arabic Learning',     icon: '📖',  order: 1 },
      { name: 'Fitness',             icon: '🏋️',  order: 2 },
      { name: 'Quran',               icon: '🕌',  order: 3 },
      { name: 'Professional Learning', icon: '💼', order: 4 },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (group_id, name, icon, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [groupId, cat.name, cat.icon, cat.order]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
