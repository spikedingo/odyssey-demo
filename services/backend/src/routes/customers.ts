import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import {
  ApiErrorSchema,
  CustomerDetailSchema,
  CustomersListResponseSchema,
  InsertCustomerSchema,
  SelectCustomerSchema,
  UpdateCustomerSchema,
} from '../db/validators';
import * as customerService from '../services/customerService';

const listRoute = createRoute({
  method: 'get',
  path: '/customers',
  tags: ['Customers'],
  operationId: 'listCustomers',
  request: {
    query: z.object({
      search: z.string().optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CustomersListResponseSchema } },
      description: 'List customers',
    },
  },
});

const createRouteDef = createRoute({
  method: 'post',
  path: '/customers',
  tags: ['Customers'],
  operationId: 'createCustomer',
  request: {
    body: { content: { 'application/json': { schema: InsertCustomerSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: SelectCustomerSchema } },
      description: 'Customer created',
    },
  },
});

const detailRoute = createRoute({
  method: 'get',
  path: '/customers/{id}',
  tags: ['Customers'],
  operationId: 'getCustomer',
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CustomerDetailSchema } },
      description: 'Customer detail',
    },
    404: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Not found' },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/customers/{id}',
  tags: ['Customers'],
  operationId: 'updateCustomer',
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: { content: { 'application/json': { schema: UpdateCustomerSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SelectCustomerSchema } },
      description: 'Customer updated',
    },
    404: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Not found' },
  },
});

export const customerRoutes = new OpenAPIHono();

customerRoutes.openapi(listRoute, async (c) => {
  const query = c.req.valid('query');
  const result = await customerService.getCustomers({
    ...(query.search !== undefined ? { search: query.search } : {}),
    ...(query.page !== undefined ? { page: query.page } : {}),
    ...(query.limit !== undefined ? { limit: query.limit } : {}),
  });
  return c.json(result, 200);
});

customerRoutes.openapi(createRouteDef, async (c) => {
  const body = c.req.valid('json');
  const customer = await customerService.createCustomer(body);
  return c.json(customer, 201);
});

customerRoutes.openapi(detailRoute, async (c) => {
  const { id } = c.req.valid('param');
  const customer = await customerService.getCustomerDetail(id);
  return c.json(customer, 200);
});

customerRoutes.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const customer = await customerService.updateCustomer(id, body);
  return c.json(customer, 200);
});
