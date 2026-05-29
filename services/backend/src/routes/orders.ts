import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import {
  ApiErrorSchema,
  CreateOrderSchema,
  OrderDetailSchema,
  OrdersListResponseSchema,
  UpdateOrderStatusSchema,
} from '../db/validators';
import * as orderService from '../services/orderService';

const listRoute = createRoute({
  method: 'get',
  path: '/orders',
  tags: ['Orders'],
  operationId: 'listOrders',
  request: {
    query: z.object({
      status: z.string().optional(),
      customer_id: z.coerce.number().int().positive().optional(),
      date_from: z.string().datetime().optional(),
      date_to: z.string().datetime().optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: OrdersListResponseSchema } },
      description: 'List orders',
    },
  },
});

const createRouteDef = createRoute({
  method: 'post',
  path: '/orders',
  tags: ['Orders'],
  operationId: 'createOrder',
  request: {
    body: { content: { 'application/json': { schema: CreateOrderSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: OrderDetailSchema } },
      description: 'Order created',
    },
    422: {
      content: { 'application/json': { schema: ApiErrorSchema } },
      description: 'Business rule violation',
    },
  },
});

const detailRoute = createRoute({
  method: 'get',
  path: '/orders/{id}',
  tags: ['Orders'],
  operationId: 'getOrder',
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: OrderDetailSchema } },
      description: 'Order detail',
    },
    404: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Not found' },
  },
});

const updateStatusRoute = createRoute({
  method: 'patch',
  path: '/orders/{id}/status',
  tags: ['Orders'],
  operationId: 'updateOrderStatus',
  request: {
    params: z.object({ id: z.coerce.number().int().positive() }),
    body: { content: { 'application/json': { schema: UpdateOrderStatusSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: OrderDetailSchema } },
      description: 'Order status updated',
    },
    404: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Not found' },
    422: {
      content: { 'application/json': { schema: ApiErrorSchema } },
      description: 'Invalid transition',
    },
  },
});

export const orderRoutes = new OpenAPIHono();

orderRoutes.openapi(listRoute, async (c) => {
  const query = c.req.valid('query');
  const result = await orderService.listOrders({
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.customer_id !== undefined ? { customer_id: query.customer_id } : {}),
    ...(query.date_from !== undefined ? { date_from: query.date_from } : {}),
    ...(query.date_to !== undefined ? { date_to: query.date_to } : {}),
    ...(query.page !== undefined ? { page: query.page } : {}),
    ...(query.limit !== undefined ? { limit: query.limit } : {}),
  });
  return c.json(result, 200);
});

orderRoutes.openapi(createRouteDef, async (c) => {
  const body = c.req.valid('json');
  const order = await orderService.createOrder(body);
  return c.json(order, 201);
});

orderRoutes.openapi(detailRoute, async (c) => {
  const { id } = c.req.valid('param');
  const order = await orderService.getOrderById(id);
  return c.json(order, 200);
});

orderRoutes.openapi(updateStatusRoute, async (c) => {
  const { id } = c.req.valid('param');
  const { status } = c.req.valid('json');
  const order = await orderService.transitionOrderStatus(id, status);
  return c.json(order, 200);
});
