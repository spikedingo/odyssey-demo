import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { db } from '../db';
import { truncateAll } from './helpers';

process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://odyssey:odyssey@localhost:5432/odyssey_test';

await migrate(db, { migrationsFolder: './drizzle' });
await truncateAll();

beforeEach(async () => {
  await truncateAll();
});
