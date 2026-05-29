import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import {
  ApiErrorSchema,
  InsertMenuItemSchema,
  SelectMenuItemSchema,
  UpdateMenuItemSchema,
} from '../db/validators';
import * as menuService from '../services/menuService';

const listRoute = createRoute({
  method: 'get',
  path: '/menu-items',
  tags: ['MenuItems'],
  operationId: 'listMenuItems',
  request: {
    query: z.object({
      category_id: z.coerce.number().int().positive().optional(),
      available: z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(SelectMenuItemSchema) } },
      description: 'List menu items',
    },
  },
});

const createRouteDef = createRoute({
  method: 'post',
  path: '/menu-items',
  tags: ['MenuItems'],
  operationId: 'createMenuItem',
  request: {
    body: { content: { 'application/json': { schema: InsertMenuItemSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: SelectMenuItemSchema } },
      description: 'Menu item created',
    },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/menu-items/{id}',
  tags: ['MenuItems'],
  operationId: 'updateMenuItem',
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: {
      content: {
        'application/json': { schema: InsertMenuItemSchema.partial() },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SelectMenuItemSchema } },
      description: 'Menu item updated',
    },
    404: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/menu-items/{id}',
  tags: ['MenuItems'],
  operationId: 'deleteMenuItem',
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
  },
  responses: {
    204: { description: 'Menu item deleted' },
    404: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Not found' },
  },
});

export const menuItemRoutes = new OpenAPIHono();

menuItemRoutes.openapi(listRoute, async (c) => {
  const query = c.req.valid('query');
  const items = await menuService.getMenuItems({
    ...(query.category_id !== undefined ? { category_id: query.category_id } : {}),
    ...(query.available !== undefined ? { available: query.available } : {}),
  });
  return c.json(items, 200);
});

menuItemRoutes.openapi(createRouteDef, async (c) => {
  const body = c.req.valid('json');
  const item = await menuService.createMenuItem(body);
  return c.json(item, 201);
});

menuItemRoutes.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const item = await menuService.updateMenuItem(id, {
    ...(body.category_id !== undefined ? { category_id: body.category_id } : {}),
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.price_cents !== undefined ? { price_cents: body.price_cents } : {}),
    ...(body.available !== undefined ? { available: body.available } : {}),
    ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
  });
  return c.json(item, 200);
});

menuItemRoutes.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid('param');
  await menuService.deleteMenuItem(id);
  return c.body(null, 204);
});

// Suppress unused import warning for UpdateMenuItemSchema reference in docs
void UpdateMenuItemSchema;
