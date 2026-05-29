import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import { db } from '../db';
import { settings } from '../db/schema';
import type { SettingsSchema, UpdateSettingsBodySchema } from '../db/validators';

type UpdateSettingsInput = z.infer<typeof UpdateSettingsBodySchema>;
type SettingsResponse = z.infer<typeof SettingsSchema>;

const DEFAULT_OPENING_HOURS = {
  mon: { open: '09:00', close: '22:00' },
  tue: { open: '09:00', close: '22:00' },
  wed: { open: '09:00', close: '22:00' },
  thu: { open: '09:00', close: '22:00' },
  fri: { open: '09:00', close: '23:00' },
  sat: { open: '10:00', close: '23:00' },
  sun: { open: '10:00', close: '21:00' },
};

function serializeSettings(row: typeof settings.$inferSelect): SettingsResponse {
  return {
    id: row.id,
    restaurant_name: row.restaurant_name,
    prep_time_minutes: row.prep_time_minutes,
    auto_accept: row.auto_accept,
    service_available: row.service_available,
    delivery_available: row.delivery_available,
    opening_hours: row.opening_hours as Record<string, { open: string; close: string }>,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

async function getSettingsRow() {
  const [row] = await db.select().from(settings).limit(1);
  if (row) return row;

  const [created] = await db
    .insert(settings)
    .values({
      restaurant_name: 'Odyssey Restaurant',
      prep_time_minutes: 15,
      auto_accept: false,
      service_available: true,
      delivery_available: true,
      opening_hours: DEFAULT_OPENING_HOURS,
    })
    .returning();

  return created!;
}

export async function getSettings(): Promise<SettingsResponse> {
  return serializeSettings(await getSettingsRow());
}

export async function updateSettings(input: UpdateSettingsInput): Promise<SettingsResponse> {
  const current = await getSettingsRow();

  const updates: Partial<typeof settings.$inferInsert> = { updated_at: new Date() };
  if (input.restaurant_name !== undefined) updates.restaurant_name = input.restaurant_name;
  if (input.prep_time_minutes !== undefined) updates.prep_time_minutes = input.prep_time_minutes;
  if (input.auto_accept !== undefined) updates.auto_accept = input.auto_accept;
  if (input.service_available !== undefined) updates.service_available = input.service_available;
  if (input.delivery_available !== undefined) updates.delivery_available = input.delivery_available;
  if (input.opening_hours !== undefined) updates.opening_hours = input.opening_hours;

  const [updated] = await db
    .update(settings)
    .set(updates)
    .where(eq(settings.id, current.id))
    .returning();

  return serializeSettings(updated!);
}
