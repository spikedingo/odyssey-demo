import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
]);

export const orderTypeEnum = pgEnum('order_type', ['dine_in', 'takeout', 'delivery']);

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  restaurant_name: text('restaurant_name').notNull(),
  prep_time_minutes: integer('prep_time_minutes').notNull().default(15),
  auto_accept: boolean('auto_accept').notNull().default(false),
  service_available: boolean('service_available').notNull().default(true),
  delivery_available: boolean('delivery_available').notNull().default(true),
  opening_hours: jsonb('opening_hours').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id')
    .notNull()
    .references(() => categories.id),
  name: text('name').notNull(),
  description: text('description'),
  price_cents: integer('price_cents').notNull(),
  available: boolean('available').notNull().default(true),
  image_url: text('image_url'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customers.id),
  status: orderStatusEnum('status').notNull().default('pending'),
  order_type: orderTypeEnum('order_type').notNull().default('dine_in'),
  subtotal_cents: integer('subtotal_cents').notNull(),
  total_cents: integer('total_cents').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  menu_item_id: integer('menu_item_id')
    .notNull()
    .references(() => menuItems.id),
  menu_item_name: text('menu_item_name').notNull(),
  unit_price_cents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
});

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type OrderType = (typeof orderTypeEnum.enumValues)[number];
