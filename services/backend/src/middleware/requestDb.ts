import { createMiddleware } from 'hono/factory';

import { runWithRequestDb } from '../db';

/** Cloudflare Workers: one postgres.js client per request (no cross-request I/O). */
export const requestDbMiddleware = createMiddleware(async (_c, next) => {
  await runWithRequestDb(next);
});
