import 'dotenv/config';
import cron from 'node-cron';
import { app } from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';
import { pool } from './db/pool';
import { seedDatabase } from './services/seedService';
import { sendDailyReminders } from './services/reminderService';
import { transitionExpiredChallenges } from './services/challengeService';

async function start() {
  await runMigrations();

  const { rows } = await pool.query('SELECT 1 FROM users LIMIT 1');
  if (rows.length === 0) {
    console.log('No users found — seeding database...');
    if (process.env.DEMO_SEED === 'true') {
      const { seedDemoDatabase } = await import('./services/demoSeedService.js');
      await seedDemoDatabase();
      console.log('Demo database seeded.');
    } else {
      await seedDatabase();
      console.log('Database seeded.');
    }
  }

  // Run push reminder check every hour at :00
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const currentHour = now.getHours();
    console.log(`[Cron] Running reminder check for hour ${currentHour}`);
    try {
      await sendDailyReminders(currentHour, now);
    } catch (err) {
      console.error('[Cron] Reminder job failed:', err);
    }

    // Check for expired challenges once daily at midnight
    if (currentHour === 0) {
      try {
        await transitionExpiredChallenges();
      } catch (err) {
        console.error('[Cron] Challenge transition failed:', err);
      }
    }
  });

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
