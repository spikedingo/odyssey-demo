import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import {
  categories,
  customers,
  menuItems,
  orders,
  orderItems,
} from './schema';

export const SelectCategorySchema = createSelectSchema(categories);
export const InsertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1).max(100),
});

export const SelectMenuItemSchema = createSelectSchema(menuItems);
export const InsertMenuItemSchema = createInsertSchema(menuItems, {
  name: z.string().min(1).max(200),
  price_cents: z.number().int().positive(),
  category_id: z.number().int().positive(),
});
export const UpdateMenuItemSchema = InsertMenuItemSchema.partial().extend({
  id: z.number().int().positive(),
});

export const SelectCustomerSchema = createSelectSchema(customers);
export const InsertCustomerSchema = createInsertSchema(customers, {
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
});
export const UpdateCustomerSchema = InsertCustomerSchema.partial();

export const OrderItemInputSchema = z.object({
  menu_item_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
});

export const CreateOrderSchema = z.object({
  customer_id: z.number().int().positive().optional(),
  order_type: z.enum(['dine_in', 'takeout', 'delivery']).default('dine_in'),
  items: z.array(OrderItemInputSchema).min(1),
  notes: z.string().max(500).optional(),
  total_cents: z.number().int().positive(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'accepted',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled',
  ]),
});

export const SelectOrderSchema = createSelectSchema(orders);
export const SelectOrderItemSchema = createSelectSchema(orderItems);

export const SettingsSchema = z.object({
  id: z.number().int(),
  restaurant_name: z.string(),
  prep_time_minutes: z.number().int(),
  auto_accept: z.boolean(),
  service_available: z.boolean(),
  delivery_available: z.boolean(),
  opening_hours: z.record(z.object({ open: z.string(), close: z.string() })),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const SelectSettingsSchema = SettingsSchema;
export const UpdateSettingsBodySchema = z.object({
  restaurant_name: z.string().min(1).max(200).optional(),
  prep_time_minutes: z.number().int().positive().optional(),
  auto_accept: z.boolean().optional(),
  service_available: z.boolean().optional(),
  delivery_available: z.boolean().optional(),
  opening_hours: z.record(z.object({ open: z.string(), close: z.string() })).optional(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const OrderSummarySchema = z.object({
  id: z.number().int(),
  status: z.string(),
  order_type: z.enum(['dine_in', 'takeout', 'delivery']),
  customer_name: z.string().nullable(),
  item_count: z.number().int(),
  total_cents: z.number().int(),
  created_at: z.string().datetime(),
});

export const OrderItemDetailSchema = z.object({
  id: z.number().int(),
  menu_item_id: z.number().int(),
  menu_item_name: z.string(),
  unit_price_cents: z.number().int(),
  quantity: z.number().int(),
  line_total_cents: z.number().int(),
});

export const OrderDetailSchema = z.object({
  id: z.number().int(),
  customer_id: z.number().int().nullable(),
  customer_name: z.string().nullable(),
  status: z.enum([
    'pending',
    'accepted',
    'preparing',
    'ready',
    'out_for_delivery',
    'completed',
    'cancelled',
  ]),
  order_type: z.enum(['dine_in', 'takeout', 'delivery']),
  subtotal_cents: z.number().int(),
  total_cents: z.number().int(),
  notes: z.string().nullable(),
  items: z.array(OrderItemDetailSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const OrdersListResponseSchema = z.object({
  data: z.array(OrderSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export const CustomerWithStatsSchema = SelectCustomerSchema.extend({
  order_count: z.number().int(),
  total_spend_cents: z.number().int(),
});

export const CustomerDetailSchema = SelectCustomerSchema.extend({
  order_count: z.number().int(),
  total_spend_cents: z.number().int(),
  recent_orders: z.array(OrderSummarySchema),
});

export const CustomersListResponseSchema = z.object({
  data: z.array(CustomerWithStatsSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export const DailyRevenueSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  revenue_cents: z.number().int(),
});

export const HomeSummarySchema = z.object({
  total_orders_today: z.number().int(),
  total_orders_yesterday: z.number().int(),
  revenue_today_cents: z.number().int(),
  revenue_yesterday_cents: z.number().int(),
  pending_orders: z.number().int(),
  popular_items: z
    .array(
      z.object({
        name: z.string(),
        quantity_sold: z.number().int(),
      }),
    )
    .max(5),
  recent_orders: z.array(OrderSummarySchema).max(10),
  daily_revenue: z.array(DailyRevenueSchema),
});

export const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string().datetime(),
});
