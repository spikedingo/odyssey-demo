# Plan 05 — Testing & DX

## Approach

Backend tests are integration tests against a real test Postgres DB (same Docker Compose, separate database). Frontend tests are unit tests using `@testing-library/react-native`. Both are configured to run via Turborepo's `test` pipeline.

---

## Backend Test Setup

### Test database

Add a second service to `docker-compose.yml`:

```yaml
# No separate service needed — use the same Postgres with a different database name.
# Create odyssey_test DB after postgres starts:
# pnpm db:up && docker exec -it odyssey-postgres-1 psql -U odyssey -c "CREATE DATABASE odyssey_test;"
```

Or: add a `db:setup-test` script:
```json
"db:setup-test": "docker exec odyssey-postgres-1 psql -U odyssey -c 'CREATE DATABASE IF NOT EXISTS odyssey_test'"
```

`TEST_DATABASE_URL` defaults to `postgresql://odyssey:odyssey@localhost:5432/odyssey_test`.

### Vitest config

`services/backend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    poolOptions: {
      threads: { singleThread: true },  // prevent parallel DB mutation
    },
  },
});
```

### Test setup file

`services/backend/src/__tests__/setup.ts`:
```ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../db/schema';

const testConnectionString = process.env.TEST_DATABASE_URL ?? 'postgresql://odyssey:odyssey@localhost:5432/odyssey_test';
const sql = postgres(testConnectionString);
export const testDb = drizzle(sql, { schema });

beforeAll(async () => {
  await migrate(testDb, { migrationsFolder: './drizzle' });
});

beforeEach(async () => {
  // Truncate in dependency order
  await sql`TRUNCATE order_items, orders, menu_items, categories, customers, settings RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await sql.end();
});
```

### Test helper factories

`services/backend/src/__tests__/factories.ts`:
```ts
export async function createCategory(db = testDb, overrides = {}) {
  const [cat] = await db.insert(categories).values({ name: 'Test Category', sort_order: 0, ...overrides }).returning();
  return cat;
}

export async function createMenuItem(db = testDb, categoryId: number, overrides = {}) {
  const [item] = await db.insert(menu_items).values({
    category_id: categoryId, name: 'Test Item', price_cents: 1000, available: true, ...overrides
  }).returning();
  return item;
}

export async function createCustomer(db = testDb, overrides = {}) {
  const [c] = await db.insert(customers).values({ name: 'Test Customer', ...overrides }).returning();
  return c;
}
```

---

## Frontend Test Setup

### Jest config

`apps/dashboard/jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|@tanstack)',
  ],
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  passWithNoTests: true,
};
```

Install:
```bash
pnpm --filter=dashboard add -D jest jest-expo @testing-library/react-native @testing-library/jest-native
```

For UI package tests:
```bash
pnpm --filter=ui add -D jest jest-expo @testing-library/react-native
```

---

## Test File Locations

```
services/backend/src/__tests__/
├── setup.ts                     # DB setup/teardown
├── factories.ts                 # Test data factories
├── orderService.test.ts         # createOrder + transitionOrderStatus
├── menuService.test.ts          # Zod validators (no DB needed)
└── homeService.test.ts          # getHomeSummary

apps/dashboard/src/__tests__/
├── utils/
│   ├── orderStatus.test.ts
│   └── currency.test.ts

packages/ui/src/__tests__/
├── Badge.test.tsx
└── EmptyState.test.tsx
```

---

## Turbo Test Pipeline

`turbo.json` (ensure test is in the pipeline):
```json
"test": {
  "dependsOn": ["^build"],
  "cache": true,
  "outputs": ["coverage/**"]
}
```

Root `package.json` additional scripts:
```json
"test:backend": "pnpm --filter=backend run test",
"test:frontend": "pnpm --filter=dashboard run test && pnpm --filter=ui run test"
```

---

## DX Notes

### `.env.test` for backend

`services/backend/.env.test`:
```
TEST_DATABASE_URL=postgresql://odyssey:odyssey@localhost:5432/odyssey_test
```

Vitest loads this via `dotenv` in `setup.ts` or `vitest.config.ts`.

### Fast iteration workflow

```bash
# Backend tests in watch mode
pnpm --filter=backend exec vitest

# Run specific test file
pnpm --filter=backend exec vitest orderService

# Frontend tests in watch mode
pnpm --filter=dashboard exec jest --watch
```

### Scripts summary in root `package.json`

```json
{
  "dev:dashboard":  "turbo run dev --filter=dashboard",
  "dev:backend":    "turbo run dev --filter=backend",
  "db:up":          "docker compose up -d postgres",
  "db:down":        "docker compose down",
  "db:migrate":     "pnpm --filter=backend run db:migrate",
  "seed":           "pnpm --filter=backend run seed",
  "gen:contract":   "pnpm --filter=backend run build:openapi && pnpm --filter=api-client exec orval && pnpm --filter=api-client run typecheck",
  "lint":           "turbo run lint",
  "typecheck":      "turbo run typecheck",
  "test":           "turbo run test",
  "test:backend":   "pnpm --filter=backend run test",
  "test:frontend":  "pnpm --filter=dashboard run test && pnpm --filter=ui run test"
}
```
