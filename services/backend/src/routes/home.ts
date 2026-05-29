import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

import { HomeSummarySchema } from '../db/validators';
import * as homeService from '../services/homeService';

const summaryRoute = createRoute({
  method: 'get',
  path: '/home/summary',
  tags: ['Home'],
  operationId: 'getHomeSummary',
  responses: {
    200: {
      content: { 'application/json': { schema: HomeSummarySchema } },
      description: 'Home dashboard summary',
    },
  },
});

export const homeRoutes = new OpenAPIHono();

homeRoutes.openapi(summaryRoute, async (c) => {
  const summary = await homeService.getHomeSummary();
  return c.json(summary, 200);
});
