import { sql } from 'drizzle-orm';

import { db } from '../db';

export async function truncateAll() {
  await db.execute(
    sql`TRUNCATE TABLE order_items, orders, menu_items, categories, customers, settings RESTART IDENTITY CASCADE`,
  );
}
