import type { OrderStatus } from '@odyssey/types';
import { VALID_TRANSITIONS } from '@odyssey/types';
import { and, count, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';

import type { z } from 'zod';
import { db } from '../db';
import { customers, menuItems, orderItems, orders, settings } from '../db/schema';
import type { CreateOrderSchema } from '../db/validators';
import { ApiError } from '../middleware/errorHandler';

export { VALID_TRANSITIONS };

type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

function toIso(date: Date): string {
  return date.toISOString();
}

type DbConn = Pick<typeof db, 'select' | 'insert' | 'update' | 'transaction'>;

export async function fetchOrderDetail(orderId: number, conn: DbConn = db) {
  const [order] = await conn.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  }

  let customerName: string | null = null;
  if (order.customer_id) {
    const [customer] = await conn
      .select({ name: customers.name })
      .from(customers)
      .where(eq(customers.id, order.customer_id));
    customerName = customer?.name ?? null;
  }

  const items = await conn.select().from(orderItems).where(eq(orderItems.order_id, orderId));

  return {
    id: order.id,
    customer_id: order.customer_id,
    customer_name: customerName,
    status: order.status,
    order_type: order.order_type,
    subtotal_cents: order.subtotal_cents,
    total_cents: order.total_cents,
    notes: order.notes,
    items: items.map((item) => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item_name,
      unit_price_cents: item.unit_price_cents,
      quantity: item.quantity,
      line_total_cents: item.unit_price_cents * item.quantity,
    })),
    created_at: toIso(order.created_at),
    updated_at: toIso(order.updated_at),
  };
}

export async function createOrder(input: CreateOrderInput) {
  const orderType = input.order_type ?? 'dine_in';

  const [settingsRow] = await db.select().from(settings).limit(1);
  if (settingsRow && !settingsRow.service_available) {
    throw new ApiError(422, 'SERVICE_UNAVAILABLE', 'Restaurant is not accepting orders');
  }
  if (orderType === 'delivery' && settingsRow && !settingsRow.delivery_available) {
    throw new ApiError(422, 'DELIVERY_UNAVAILABLE', 'Delivery is not available');
  }

  const itemIds = input.items.map((i) => i.menu_item_id);
  const menuItemRows = await db.select().from(menuItems).where(inArray(menuItems.id, itemIds));

  for (const { menu_item_id } of input.items) {
    if (!menuItemRows.find((m) => m.id === menu_item_id)) {
      throw new ApiError(422, 'ITEM_NOT_FOUND', `Menu item ${menu_item_id} not found`, {
        item_id: menu_item_id,
      });
    }
  }

  for (const item of menuItemRows) {
    if (!item.available) {
      throw new ApiError(422, 'ITEM_UNAVAILABLE', `Item "${item.name}" is not available`, {
        item_id: item.id,
      });
    }
  }

  const computed = input.items.reduce((acc, { menu_item_id, quantity }) => {
    const item = menuItemRows.find((m) => m.id === menu_item_id)!;
    return acc + item.price_cents * quantity;
  }, 0);

  if (computed !== input.total_cents) {
    throw new ApiError(422, 'TOTAL_MISMATCH', 'Submitted total does not match computed total', {
      computed,
      submitted: input.total_cents,
    });
  }

  const initialStatus = settingsRow?.auto_accept ? 'accepted' : 'pending';

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        customer_id: input.customer_id ?? null,
        order_type: orderType,
        subtotal_cents: computed,
        total_cents: computed,
        notes: input.notes ?? null,
        status: initialStatus,
      })
      .returning();

    if (!order) {
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to create order');
    }

    await tx.insert(orderItems).values(
      input.items.map(({ menu_item_id, quantity }) => {
        const item = menuItemRows.find((m) => m.id === menu_item_id)!;
        return {
          order_id: order.id,
          menu_item_id,
          menu_item_name: item.name,
          unit_price_cents: item.price_cents,
          quantity,
        };
      }),
    );

    return fetchOrderDetail(order.id, tx);
  });
}

export async function transitionOrderStatus(orderId: number, newStatus: OrderStatus) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  }

  const allowed = VALID_TRANSITIONS[order.status as OrderStatus];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(
      422,
      'INVALID_TRANSITION',
      `Cannot transition from ${order.status} to ${newStatus}`,
      { from: order.status, to: newStatus },
    );
  }

  await db
    .update(orders)
    .set({ status: newStatus, updated_at: new Date() })
    .where(eq(orders.id, orderId));

  return fetchOrderDetail(orderId);
}

export async function listOrders(filters: {
  status?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(orders.status, filters.status as OrderStatus));
  }
  if (filters.customer_id) {
    conditions.push(eq(orders.customer_id, filters.customer_id));
  }
  if (filters.date_from) {
    conditions.push(gte(orders.created_at, new Date(filters.date_from)));
  }
  if (filters.date_to) {
    conditions.push(lt(orders.created_at, new Date(filters.date_to)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db.select({ count: count() }).from(orders).where(whereClause);
  const total = totalResult?.count ?? 0;

  const orderRows = await db
    .select({
      id: orders.id,
      status: orders.status,
      order_type: orders.order_type,
      customer_name: customers.name,
      total_cents: orders.total_cents,
      created_at: orders.created_at,
      item_count: sql<number>`cast(count(${orderItems.id}) as int)`,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customer_id, customers.id))
    .leftJoin(orderItems, eq(orderItems.order_id, orders.id))
    .where(whereClause)
    .groupBy(orders.id, customers.name)
    .orderBy(desc(orders.created_at))
    .limit(limit)
    .offset(offset);

  return {
    data: orderRows.map((row) => ({
      id: row.id,
      status: row.status,
      order_type: row.order_type,
      customer_name: row.customer_name,
      item_count: row.item_count,
      total_cents: row.total_cents,
      created_at: toIso(row.created_at),
    })),
    total,
    page,
    limit,
  };
}

export async function getOrderById(orderId: number) {
  return fetchOrderDetail(orderId);
}
