import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { pool } from './src/db/pool';
import { seedDatabase } from './src/services/seedService';

seedDatabase()
  .then(() => {
    console.log('\nSeed complete.');
    return pool.end();
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
