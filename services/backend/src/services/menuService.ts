import { and, eq } from 'drizzle-orm';

import type { z } from 'zod';
import { db } from '../db';
import { menuItems } from '../db/schema';
import type { InsertMenuItemSchema } from '../db/validators';
import { ApiError } from '../middleware/errorHandler';

type InsertMenuItemInput = z.infer<typeof InsertMenuItemSchema>;
type UpdateMenuItemInput = Partial<InsertMenuItemInput>;

export async function getMenuItems(filters: { category_id?: number; available?: boolean }) {
  const conditions = [];
  if (filters.category_id !== undefined) {
    conditions.push(eq(menuItems.category_id, filters.category_id));
  }
  if (filters.available !== undefined) {
    conditions.push(eq(menuItems.available, filters.available));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(menuItems).where(whereClause).orderBy(menuItems.name);
}

export async function createMenuItem(input: InsertMenuItemInput) {
  const [item] = await db
    .insert(menuItems)
    .values({
      category_id: input.category_id,
      name: input.name,
      description: input.description ?? null,
      price_cents: input.price_cents,
      available: input.available ?? true,
      image_url: input.image_url ?? null,
    } satisfies typeof menuItems.$inferInsert)
    .returning();

  if (!item) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to create menu item');
  }

  return item;
}

export async function updateMenuItem(id: number, input: UpdateMenuItemInput) {
  const [existing] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Menu item not found');
  }

  const updates: Partial<typeof menuItems.$inferInsert> = { updated_at: new Date() };
  if (input.category_id !== undefined) updates.category_id = input.category_id;
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description ?? null;
  if (input.price_cents !== undefined) updates.price_cents = input.price_cents;
  if (input.available !== undefined) updates.available = input.available;
  if (input.image_url !== undefined) updates.image_url = input.image_url ?? null;

  const [item] = await db
    .update(menuItems)
    .set(updates)
    .where(eq(menuItems.id, id))
    .returning();

  if (!item) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to update menu item');
  }

  return item;
}

export async function deleteMenuItem(id: number) {
  const [existing] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Menu item not found');
  }

  await db.delete(menuItems).where(eq(menuItems.id, id));
}
