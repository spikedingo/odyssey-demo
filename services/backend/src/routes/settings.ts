import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import { SelectSettingsSchema, UpdateSettingsBodySchema } from '../db/validators';
import * as settingsService from '../services/settingsService';

const getRoute = createRoute({
  method: 'get',
  path: '/settings',
  tags: ['Settings'],
  operationId: 'getSettings',
  responses: {
    200: {
      content: { 'application/json': { schema: SelectSettingsSchema } },
      description: 'Get settings',
    },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/settings',
  tags: ['Settings'],
  operationId: 'updateSettings',
  request: {
    body: { content: { 'application/json': { schema: UpdateSettingsBodySchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SelectSettingsSchema } },
      description: 'Settings updated',
    },
  },
});

export const settingsRoutes = new OpenAPIHono();

settingsRoutes.openapi(getRoute, async (c) => {
  const settings = await settingsService.getSettings();
  return c.json(settings, 200);
});

settingsRoutes.openapi(updateRoute, async (c) => {
  const body = c.req.valid('json');
  const settings = await settingsService.updateSettings({
    ...(body.restaurant_name !== undefined ? { restaurant_name: body.restaurant_name } : {}),
    ...(body.prep_time_minutes !== undefined ? { prep_time_minutes: body.prep_time_minutes } : {}),
    ...(body.auto_accept !== undefined ? { auto_accept: body.auto_accept } : {}),
    ...(body.service_available !== undefined ? { service_available: body.service_available } : {}),
    ...(body.delivery_available !== undefined ? { delivery_available: body.delivery_available } : {}),
    ...(body.opening_hours !== undefined ? { opening_hours: body.opening_hours } : {}),
  });
  return c.json(settings, 200);
});
