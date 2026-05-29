import { count, eq, ilike, or, sql } from 'drizzle-orm';

import type { z } from 'zod';
import { db } from '../db';
import { customers, orders } from '../db/schema';
import type { InsertCustomerSchema, UpdateCustomerSchema } from '../db/validators';
import { ApiError } from '../middleware/errorHandler';

type InsertCustomerInput = z.infer<typeof InsertCustomerSchema>;
type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

function toIso(date: Date): string {
  return date.toISOString();
}

export async function getCustomers(filters: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const searchCondition = filters.search
    ? or(
        ilike(customers.name, `%${filters.search}%`),
        ilike(customers.email, `%${filters.search}%`),
        ilike(customers.phone, `%${filters.search}%`),
      )
    : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(customers)
    .where(searchCondition);
  const total = totalResult?.count ?? 0;

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      created_at: customers.created_at,
      updated_at: customers.updated_at,
      order_count: sql<number>`cast(count(${orders.id}) as int)`,
      total_spend_cents: sql<number>`cast(coalesce(sum(${orders.total_cents}), 0) as int)`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customer_id, customers.id))
    .where(searchCondition)
    .groupBy(customers.id)
    .orderBy(customers.name)
    .limit(limit)
    .offset(offset);

  return {
    data: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      created_at: row.created_at,
      updated_at: row.updated_at,
      order_count: row.order_count,
      total_spend_cents: row.total_spend_cents,
    })),
    total,
    page,
    limit,
  };
}

export async function getCustomerDetail(id: number) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  if (!customer) {
    throw new ApiError(404, 'NOT_FOUND', 'Customer not found');
  }

  const [stats] = await db
    .select({
      order_count: count(),
      total_spend_cents: sql<number>`cast(coalesce(sum(${orders.total_cents}), 0) as int)`,
    })
    .from(orders)
    .where(eq(orders.customer_id, id));

  const recentOrderRows = await db
    .select({
      id: orders.id,
      status: orders.status,
      order_type: orders.order_type,
      customer_name: customers.name,
      total_cents: orders.total_cents,
      created_at: orders.created_at,
      item_count: sql<number>`cast((select count(*) from order_items oi where oi.order_id = ${orders.id}) as int)`,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customer_id, customers.id))
    .where(eq(orders.customer_id, id))
    .orderBy(sql`${orders.created_at} desc`)
    .limit(5);

  return {
    ...customer,
    order_count: stats?.order_count ?? 0,
    total_spend_cents: stats?.total_spend_cents ?? 0,
    recent_orders: recentOrderRows.map((row) => ({
      id: row.id,
      status: row.status,
      order_type: row.order_type,
      customer_name: row.customer_name,
      item_count: row.item_count,
      total_cents: row.total_cents,
      created_at: toIso(row.created_at),
    })),
  };
}

export async function createCustomer(input: InsertCustomerInput) {
  const [customer] = await db
    .insert(customers)
    .values({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
    } satisfies typeof customers.$inferInsert)
    .returning();

  if (!customer) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to create customer');
  }

  return customer;
}

export async function updateCustomer(id: number, input: UpdateCustomerInput) {
  const [existing] = await db.select().from(customers).where(eq(customers.id, id));
  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Customer not found');
  }

  const updates: Partial<typeof customers.$inferInsert> = { updated_at: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.email !== undefined) updates.email = input.email ?? null;
  if (input.phone !== undefined) updates.phone = input.phone ?? null;

  const [customer] = await db
    .update(customers)
    .set(updates)
    .where(eq(customers.id, id))
    .returning();

  if (!customer) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to update customer');
  }

  return customer;
}
