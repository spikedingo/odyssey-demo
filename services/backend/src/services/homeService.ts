import { and, count, desc, eq, gte, lt, ne, sql } from 'drizzle-orm';

import { db } from '../db';
import { customers, orderItems, orders } from '../db/schema';

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toIso(date: Date): string {
  return date.toISOString();
}

export async function getHomeSummary() {
  const now = new Date();
  const todayStart = startOfDayUtc(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

  const [todayOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(gte(orders.created_at, todayStart), lt(orders.created_at, tomorrowStart)));

  const [yesterdayOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(gte(orders.created_at, yesterdayStart), lt(orders.created_at, todayStart)));

  const [todayRevenue] = await db
    .select({ total: sql<number>`cast(coalesce(sum(${orders.total_cents}), 0) as int)` })
    .from(orders)
    .where(
      and(
        gte(orders.created_at, todayStart),
        lt(orders.created_at, tomorrowStart),
        ne(orders.status, 'cancelled'),
      ),
    );

  const [yesterdayRevenue] = await db
    .select({ total: sql<number>`cast(coalesce(sum(${orders.total_cents}), 0) as int)` })
    .from(orders)
    .where(
      and(
        gte(orders.created_at, yesterdayStart),
        lt(orders.created_at, todayStart),
        ne(orders.status, 'cancelled'),
      ),
    );

  const [pendingOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.status, 'pending'));

  const popularItems = await db
    .select({
      name: orderItems.menu_item_name,
      quantity_sold: sql<number>`cast(sum(${orderItems.quantity}) as int)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.order_id, orders.id))
    .where(ne(orders.status, 'cancelled'))
    .groupBy(orderItems.menu_item_name)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  const recentOrderRows = await db
    .select({
      id: orders.id,
      status: orders.status,
      customer_name: customers.name,
      total_cents: orders.total_cents,
      created_at: orders.created_at,
      item_count: sql<number>`cast((select count(*) from order_items oi where oi.order_id = ${orders.id}) as int)`,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customer_id, customers.id))
    .orderBy(desc(orders.created_at))
    .limit(10);

  return {
    total_orders_today: todayOrders?.count ?? 0,
    total_orders_yesterday: yesterdayOrders?.count ?? 0,
    revenue_today_cents: todayRevenue?.total ?? 0,
    revenue_yesterday_cents: yesterdayRevenue?.total ?? 0,
    pending_orders: pendingOrders?.count ?? 0,
    popular_items: popularItems.map((item) => ({
      name: item.name,
      quantity_sold: item.quantity_sold,
    })),
    recent_orders: recentOrderRows.map((row) => ({
      id: row.id,
      status: row.status,
      customer_name: row.customer_name,
      item_count: row.item_count,
      total_cents: row.total_cents,
      created_at: toIso(row.created_at),
    })),
  };
}
