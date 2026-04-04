import 'dotenv/config';
import { app } from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';

async function start() {
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
