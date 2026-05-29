import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';

import { ApiError, formatErrorResponse } from './middleware/errorHandler';
import { requestDbMiddleware } from './middleware/requestDb';
import { categoryRoutes } from './routes/categories';
import { customerRoutes } from './routes/customers';
import { healthRoutes } from './routes/health';
import { homeRoutes } from './routes/home';
import { menuItemRoutes } from './routes/menuItems';
import { orderRoutes } from './routes/orders';
import { settingsRoutes } from './routes/settings';

export function createApp() {
  const app = new OpenAPIHono();

  app.use('*', cors());
  app.use('*', requestDbMiddleware);

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json(formatErrorResponse(err), err.status as 400 | 404 | 422 | 500);
    }
    console.error(err);
    return c.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      500,
    );
  });

  app.route('/', healthRoutes);

  const api = new OpenAPIHono();
  api.route('/', categoryRoutes);
  api.route('/', menuItemRoutes);
  api.route('/', customerRoutes);
  api.route('/', orderRoutes);
  api.route('/', settingsRoutes);
  api.route('/', homeRoutes);

  app.route('/api/v1', api);

  app.doc('/api/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'Odyssey Restaurant API',
      version: '1.0.0',
      description: 'Restaurant operations dashboard API',
    },
    servers: [{ url: 'http://localhost:8787', description: 'Local development' }],
  });

  return app;
}

const app = createApp();
export default app;
