import { sql } from 'drizzle-orm';

import {
  categories,
  customers,
  menuItems,
  orderItems,
  orders,
  settings,
} from './schema';
import { db } from './index';
import { getMenuImageUrl } from './menuImages';

const OPENING_HOURS = {
  mon: { open: '09:00', close: '22:00' },
  tue: { open: '09:00', close: '22:00' },
  wed: { open: '09:00', close: '22:00' },
  thu: { open: '09:00', close: '22:00' },
  fri: { open: '09:00', close: '23:00' },
  sat: { open: '10:00', close: '23:00' },
  sun: { open: '10:00', close: '21:00' },
};

const STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
] as const;

async function seed() {
  console.log('Seeding database...');

  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE TABLE order_items, orders, menu_items, categories, customers, settings RESTART IDENTITY CASCADE`);

    const [settingsRow] = await tx
      .insert(settings)
      .values({
        restaurant_name: 'Sakura Garden',
        prep_time_minutes: 20,
        auto_accept: false,
        service_available: true,
        delivery_available: true,
        opening_hours: OPENING_HOURS,
      })
      .returning();

    if (!settingsRow) throw new Error('Failed to seed settings');

    const categoryRows = await tx
      .insert(categories)
      .values([
        { name: 'Starters', sort_order: 1 },
        { name: 'Mains', sort_order: 2 },
        { name: 'Drinks', sort_order: 3 },
      ])
      .returning();

    const [starters, mains, drinks] = categoryRows;

    const seedMenuItems = [
      { category_id: starters!.id, name: 'Edamame', description: 'Steamed soybeans with sea salt', price_cents: 650, available: true },
      { category_id: starters!.id, name: 'Gyoza', description: 'Pan-fried pork dumplings', price_cents: 950, available: true },
      { category_id: starters!.id, name: 'Miso Soup', description: 'Traditional tofu miso soup', price_cents: 450, available: true },
      { category_id: starters!.id, name: 'Seaweed Salad', description: 'Wakame with sesame dressing', price_cents: 750, available: false },
      { category_id: mains!.id, name: 'Salmon Teriyaki', description: 'Grilled salmon with teriyaki glaze', price_cents: 2450, available: true },
      { category_id: mains!.id, name: 'Chicken Katsu', description: 'Crispy breaded chicken cutlet', price_cents: 1850, available: true },
      { category_id: mains!.id, name: 'Beef Ramen', description: 'Rich tonkotsu broth with chashu', price_cents: 1650, available: true },
      { category_id: mains!.id, name: 'Vegetable Curry', description: 'Japanese curry with seasonal vegetables', price_cents: 1450, available: true },
      { category_id: drinks!.id, name: 'Green Tea', description: 'Hot sencha green tea', price_cents: 350, available: true },
      { category_id: drinks!.id, name: 'Sake Flight', description: 'Three premium sake samples', price_cents: 1800, available: true },
      { category_id: drinks!.id, name: 'Yuzu Soda', description: 'Sparkling yuzu citrus drink', price_cents: 550, available: true },
      { category_id: drinks!.id, name: 'Matcha Latte', description: 'Ceremonial grade matcha with oat milk', price_cents: 650, available: true },
    ] as const;

    const menuRows = await tx
      .insert(menuItems)
      .values(
        seedMenuItems.map((item) => ({
          ...item,
          image_url: getMenuImageUrl(item.name) ?? null,
        })),
      )
      .returning();

    const customerRows = await tx
      .insert(customers)
      .values([
        { name: 'Alice Chen', email: 'alice@example.com', phone: '+1-555-0101' },
        { name: 'Bob Martinez', email: 'bob@example.com', phone: '+1-555-0102' },
        { name: 'Carol Williams', email: 'carol@example.com', phone: '+1-555-0103' },
        { name: 'David Kim', email: 'david@example.com', phone: '+1-555-0104' },
        { name: 'Eva Johnson', email: 'eva@example.com', phone: '+1-555-0105' },
        { name: 'Frank Lopez', email: 'frank@example.com', phone: '+1-555-0106' },
        { name: 'Grace Park', email: 'grace@example.com', phone: '+1-555-0107' },
        { name: 'Henry Davis', email: 'henry@example.com', phone: '+1-555-0108' },
      ])
      .returning();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 20; i++) {
      const status = STATUSES[i % STATUSES.length]!;
      const customer = i % 5 === 0 ? null : customerRows[i % customerRows.length]!;
      const item1 = menuRows[i % menuRows.length]!;
      const item2 = menuRows[(i + 3) % menuRows.length]!;
      const qty1 = (i % 3) + 1;
      const qty2 = (i % 2) + 1;
      const subtotal = item1.price_cents * qty1 + item2.price_cents * qty2;
      const createdAt = new Date(now - (i % 30) * dayMs - i * 3600000);

      const [order] = await tx
        .insert(orders)
        .values({
          customer_id: customer?.id ?? null,
          status,
          subtotal_cents: subtotal,
          total_cents: subtotal,
          notes: i % 4 === 0 ? 'Extra spicy please' : null,
          created_at: createdAt,
          updated_at: createdAt,
        })
        .returning();

      if (!order) throw new Error('Failed to seed order');

      await tx.insert(orderItems).values([
        {
          order_id: order.id,
          menu_item_id: item1.id,
          menu_item_name: item1.name,
          unit_price_cents: item1.price_cents,
          quantity: qty1,
        },
        {
          order_id: order.id,
          menu_item_id: item2.id,
          menu_item_name: item2.name,
          unit_price_cents: item2.price_cents,
          quantity: qty2,
        },
      ]);
    }
  });

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
