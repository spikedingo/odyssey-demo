import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import { HealthResponseSchema } from '../db/validators';

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  operationId: 'getHealth',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthResponseSchema } },
      description: 'Health check',
    },
  },
});

export const healthRoutes = new OpenAPIHono();

healthRoutes.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() }, 200);
});
