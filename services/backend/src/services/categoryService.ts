import { count, eq } from 'drizzle-orm';

import type { z } from 'zod';
import { db } from '../db';
import { categories, menuItems } from '../db/schema';
import type { InsertCategorySchema } from '../db/validators';
import { ApiError } from '../middleware/errorHandler';

type InsertCategoryInput = z.infer<typeof InsertCategorySchema>;

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.sort_order);
}

export async function createCategory(input: InsertCategoryInput) {
  const [category] = await db
    .insert(categories)
    .values({
      name: input.name,
      sort_order: input.sort_order ?? 0,
    } satisfies typeof categories.$inferInsert)
    .returning();

  if (!category) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to create category');
  }

  return category;
}

export async function deleteCategory(id: number) {
  const [category] = await db.select().from(categories).where(eq(categories.id, id));
  if (!category) {
    throw new ApiError(404, 'NOT_FOUND', 'Category not found');
  }

  const [itemCount] = await db
    .select({ count: count() })
    .from(menuItems)
    .where(eq(menuItems.category_id, id));

  if ((itemCount?.count ?? 0) > 0) {
    throw new ApiError(422, 'CATEGORY_HAS_ITEMS', 'Cannot delete category with menu items');
  }

  await db.delete(categories).where(eq(categories.id, id));
}
