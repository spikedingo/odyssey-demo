import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import { ApiErrorSchema, InsertCategorySchema, SelectCategorySchema } from '../db/validators';
import * as categoryService from '../services/categoryService';

const listRoute = createRoute({
  method: 'get',
  path: '/categories',
  tags: ['Categories'],
  operationId: 'listCategories',
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(SelectCategorySchema) } },
      description: 'List categories',
    },
  },
});

const createRouteDef = createRoute({
  method: 'post',
  path: '/categories',
  tags: ['Categories'],
  operationId: 'createCategory',
  request: {
    body: { content: { 'application/json': { schema: InsertCategorySchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: SelectCategorySchema } },
      description: 'Category created',
    },
    400: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Bad request' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/categories/{id}',
  tags: ['Categories'],
  operationId: 'deleteCategory',
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
  },
  responses: {
    204: { description: 'Category deleted' },
    404: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Not found' },
    422: {
      content: { 'application/json': { schema: ApiErrorSchema } },
      description: 'Category has items',
    },
  },
});

export const categoryRoutes = new OpenAPIHono();

categoryRoutes.openapi(listRoute, async (c) => {
  const categories = await categoryService.getCategories();
  return c.json(categories, 200);
});

categoryRoutes.openapi(createRouteDef, async (c) => {
  const body = c.req.valid('json');
  const category = await categoryService.createCategory(body);
  return c.json(category, 201);
});

categoryRoutes.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid('param');
  await categoryService.deleteCategory(id);
  return c.body(null, 204);
});
