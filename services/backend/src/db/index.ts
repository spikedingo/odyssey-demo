import { AsyncLocalStorage } from 'node:async_hooks';

import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://odyssey:odyssey@localhost:5432/odyssey';

type AppDb = PostgresJsDatabase<typeof schema>;

const requestDbStorage = new AsyncLocalStorage<AppDb>();

const sharedClient = postgres(connectionString, { max: 10 });
const sharedDb = drizzle(sharedClient, { schema });

function getActiveDb(): AppDb {
  return requestDbStorage.getStore() ?? sharedDb;
}

export const db = new Proxy(sharedDb, {
  get(_target, prop, receiver) {
    const active = getActiveDb();
    const value = Reflect.get(active, prop, receiver);
    return typeof value === 'function' ? value.bind(active) : value;
  },
}) as AppDb;

export type DbClient = typeof db;

export async function runWithRequestDb<T>(fn: () => Promise<T>): Promise<T> {
  const client = postgres(connectionString, { max: 1 });
  const requestDb = drizzle(client, { schema });
  return requestDbStorage.run(requestDb, async () => {
    try {
      return await fn();
    } finally {
      await client.end({ timeout: 0 });
    }
  });
}
