import 'dotenv/config';
import { app } from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';
import { pool } from './db/pool';
import { seedDatabase } from './services/seedService';

async function start() {
  await runMigrations();

  const { rows } = await pool.query('SELECT 1 FROM users LIMIT 1');
  if (rows.length === 0) {
    console.log('No users found — seeding database...');
    await seedDatabase();
    console.log('Database seeded.');
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
