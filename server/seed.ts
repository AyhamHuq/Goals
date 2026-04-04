import 'dotenv/config';
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

    // Insert users with distinct MUI primary colors
    const users = [
      { name: 'Alice',   color: '#1976d2', order: 0 }, // MUI blue
      { name: 'Bob',     color: '#388e3c', order: 1 }, // MUI green
      { name: 'Charlie', color: '#d32f2f', order: 2 }, // MUI red
      { name: 'Diana',   color: '#7b1fa2', order: 3 }, // MUI purple
      { name: 'Eve',     color: '#f57c00', order: 4 }, // MUI orange
      { name: 'Frank',   color: '#0288d1', order: 5 }, // MUI light blue
    ];

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
      { name: 'Fitness',      icon: '🏋️',  order: 0 },
      { name: 'Reading',      icon: '📚',  order: 1 },
      { name: 'Sleep',        icon: '😴',  order: 2 },
      { name: 'Nutrition',    icon: '🥗',  order: 3 },
      { name: 'Learning',     icon: '🧠',  order: 4 },
      { name: 'Mindfulness',  icon: '🧘',  order: 5 },
      { name: 'Finance',      icon: '💰',  order: 6 },
      { name: 'Social',       icon: '🤝',  order: 7 },
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
