process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://odyssey:odyssey@localhost:5432/odyssey_test';

import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { beforeEach, describe, expect, test } from 'vitest';

import { db } from '../db';
import { categories, menuItems, settings } from '../db/schema';
import { InsertMenuItemSchema } from '../db/validators';
import { ApiError } from '../middleware/errorHandler';
import { getHomeSummary } from '../services/homeService';
import { createOrder, transitionOrderStatus } from '../services/orderService';
import { truncateAll } from './helpers';

await migrate(db, { migrationsFolder: './drizzle' });

async function seedItem(available = true, price_cents = 1000) {
  const [category] = await db.insert(categories).values({ name: 'Test', sort_order: 1 }).returning();
  const [item] = await db
    .insert(menuItems)
    .values({
      category_id: category!.id,
      name: available ? 'Burger' : 'Sold Out Soup',
      price_cents,
      available,
    })
    .returning();
  return item!;
}

async function seedSettings(overrides: Partial<typeof settings.$inferInsert> = {}) {
  await db.insert(settings).values({
    restaurant_name: 'Test Kitchen',
    prep_time_minutes: 15,
    auto_accept: false,
    service_available: true,
    delivery_available: true,
    opening_hours: { mon: { open: '09:00', close: '22:00' } },
    ...overrides,
  });
}

beforeEach(async () => {
  await truncateAll();
});

describe('createOrder', () => {
  test('creates order with valid items', async () => {
    const item = await seedItem();
    const order = await createOrder({
      items: [{ menu_item_id: item.id, quantity: 2 }],
      total_cents: 2000,
    });
    expect(order.status).toBe('pending');
    expect(order.order_type).toBe('dine_in');
    expect(order.total_cents).toBe(2000);
    expect(order.items[0]?.unit_price_cents).toBe(1000);
  });

  test('rejects unavailable item', async () => {
    const item = await seedItem(false);
    await expect(
      createOrder({ items: [{ menu_item_id: item.id, quantity: 1 }], total_cents: 1000 }),
    ).rejects.toMatchObject({ code: 'ITEM_UNAVAILABLE' });
  });

  test('rejects wrong total', async () => {
    const item = await seedItem();
    await expect(
      createOrder({ items: [{ menu_item_id: item.id, quantity: 1 }], total_cents: 999 }),
    ).rejects.toMatchObject({ code: 'TOTAL_MISMATCH' });
  });

  test('snapshots price after menu update', async () => {
    const item = await seedItem(true, 500);
    const order = await createOrder({
      items: [{ menu_item_id: item.id, quantity: 1 }],
      total_cents: 500,
    });
    await db.update(menuItems).set({ price_cents: 999 }).where(eq(menuItems.id, item.id));
    expect(order.items[0]?.unit_price_cents).toBe(500);
  });

  test('creates takeout order with order_type', async () => {
    const item = await seedItem();
    const order = await createOrder({
      order_type: 'takeout',
      items: [{ menu_item_id: item.id, quantity: 1 }],
      total_cents: 1000,
      notes: '[Pickup: Alice]',
    });
    expect(order.order_type).toBe('takeout');
  });

  test('rejects delivery when unavailable', async () => {
    await seedSettings({ delivery_available: false });
    const item = await seedItem();
    await expect(
      createOrder({
        order_type: 'delivery',
        items: [{ menu_item_id: item.id, quantity: 1 }],
        total_cents: 1000,
      }),
    ).rejects.toMatchObject({ code: 'DELIVERY_UNAVAILABLE' });
  });

  test('rejects order when service unavailable', async () => {
    await seedSettings({ service_available: false });
    const item = await seedItem();
    await expect(
      createOrder({
        items: [{ menu_item_id: item.id, quantity: 1 }],
        total_cents: 1000,
      }),
    ).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });

  test('auto accepts when setting enabled', async () => {
    await seedSettings({ auto_accept: true });
    const item = await seedItem();
    const order = await createOrder({
      items: [{ menu_item_id: item.id, quantity: 1 }],
      total_cents: 1000,
    });
    expect(order.status).toBe('accepted');
  });
});

describe('transitionOrderStatus', () => {
  test('allows pending to accepted', async () => {
    const item = await seedItem();
    const created = await createOrder({
      items: [{ menu_item_id: item.id, quantity: 1 }],
      total_cents: 1000,
    });
    const updated = await transitionOrderStatus(created.id, 'accepted');
    expect(updated.status).toBe('accepted');
  });

  test('rejects pending to completed', async () => {
    const item = await seedItem();
    const created = await createOrder({
      items: [{ menu_item_id: item.id, quantity: 1 }],
      total_cents: 1000,
    });
    await expect(transitionOrderStatus(created.id, 'completed')).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
  });
});

describe('validators', () => {
  test('InsertMenuItemSchema rejects negative price', () => {
    const result = InsertMenuItemSchema.safeParse({ name: 'Soup', price_cents: -100, category_id: 1 });
    expect(result.success).toBe(false);
  });
});

describe('getHomeSummary', () => {
  test('revenue excludes cancelled orders', async () => {
    const item = await seedItem();
    const good = await createOrder({
      items: [{ menu_item_id: item.id, quantity: 1 }],
      total_cents: 1000,
    });
    await transitionOrderStatus(good.id, 'accepted');

    const [category] = await db.select().from(categories).limit(1);
    const [cancelledItem] = await db
      .insert(menuItems)
      .values({ category_id: category!.id, name: 'Tea', price_cents: 500, available: true })
      .returning();
    const bad = await createOrder({
      items: [{ menu_item_id: cancelledItem!.id, quantity: 1 }],
      total_cents: 500,
    });
    await transitionOrderStatus(bad.id, 'cancelled');

    const summary = await getHomeSummary();
    expect(summary.revenue_today_cents).toBeGreaterThanOrEqual(1000);
    expect(summary.revenue_today_cents).toBeLessThan(1600);
  });
});

describe('ApiError', () => {
  test('formats error payload', () => {
    const err = new ApiError(422, 'TOTAL_MISMATCH', 'bad total', { computed: 1, submitted: 2 });
    expect(err.code).toBe('TOTAL_MISMATCH');
    expect(err.status).toBe(422);
  });
});
