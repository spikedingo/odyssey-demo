# Plan 02 — Backend Data Model & API

## Approach

Build backend in this order: schema → migrations → validators → service layer → Hono routes with OpenAPI → seed script. Keep route handlers thin (validate + call service + return). All business logic lives in `services/`.

---

## File Structure

```
services/backend/src/
├── db/
│   ├── schema.ts          # All Drizzle table definitions
│   ├── validators.ts      # drizzle-zod derived schemas + custom Zod schemas
│   ├── index.ts           # DB client (postgres + drizzle)
│   ├── migrate.ts         # Migration runner (run by pnpm db:migrate)
│   └── seed.ts            # Seed script (run by pnpm seed)
├── services/
│   ├── orderService.ts    # createOrder, transitionOrderStatus
│   ├── menuService.ts     # getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem
│   ├── customerService.ts # getCustomers, getCustomerDetail, createCustomer, updateCustomer
│   ├── settingsService.ts # getSettings, updateSettings
│   └── categoryService.ts # getCategories, createCategory, deleteCategory
├── routes/
│   ├── health.ts
│   ├── categories.ts
│   ├── menuItems.ts
│   ├── customers.ts
│   ├── orders.ts
│   └── settings.ts
├── middleware/
│   └── errorHandler.ts    # Catches unhandled errors, returns typed ApiError
├── openapi.ts             # OpenAPI document setup, serves /api/openapi.json
└── index.ts               # App entry: creates Hono, mounts routes, exports default
```

---

## Step-by-Step

### 1. DB client setup

```ts
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });
```

`drizzle.config.ts` (root of backend):
```ts
export default {
  schema: './src/db/schema.ts',
  out:    './drizzle',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config;
```

### 2. Schema (`src/db/schema.ts`)

Write all 6 tables as specified in `spec.md`. Key points:
- Use `pgEnum` for `order_status`.
- `customer_id` on `orders` is nullable FK (walk-in support).
- `order_items` stores `menu_item_name` and `unit_price_cents` as price snapshots.
- All `*_cents` columns are `integer`, never `real`/`float`.

### 3. Migrations

```bash
pnpm drizzle-kit generate:pg   # generates SQL in ./drizzle/
pnpm drizzle-kit migrate:pg    # applies to DB
```

`src/db/migrate.ts`:
```ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
await migrate(db, { migrationsFolder: './drizzle' });
```

Called via `pnpm db:migrate` (wraps `tsx src/db/migrate.ts`).

### 4. Validators (`src/db/validators.ts`)

Use `createInsertSchema` / `createSelectSchema` from `drizzle-zod`. Augment with custom constraints as shown in `spec.md`. Export all schemas for use by route handlers and Orval (via OpenAPI registration).

### 5. Service layer

**`orderService.createOrder`**:
```ts
async function createOrder(input: z.infer<typeof CreateOrderSchema>) {
  // 1. Batch-fetch menu items by IDs from input.items
  const itemIds = input.items.map(i => i.menu_item_id);
  const menuItems = await db.select().from(menu_items).where(inArray(menu_items.id, itemIds));

  // 2. Validate: all items found
  for (const { menu_item_id } of input.items) {
    if (!menuItems.find(m => m.id === menu_item_id))
      throw new ApiError(422, 'ITEM_NOT_FOUND', `Menu item ${menu_item_id} not found`);
  }

  // 3. Validate: all items available
  for (const item of menuItems) {
    if (!item.available)
      throw new ApiError(422, 'ITEM_UNAVAILABLE', `Item "${item.name}" is not available`);
  }

  // 4. Compute totals
  const computed = input.items.reduce((sum, { menu_item_id, quantity }) => {
    const item = menuItems.find(m => m.id === menu_item_id)!;
    return sum + item.price_cents * quantity;
  }, 0);

  // 5. Verify submitted total
  if (computed !== input.total_cents)
    throw new ApiError(422, 'TOTAL_MISMATCH', 'Submitted total does not match computed total', { computed, submitted: input.total_cents });

  // 6. Insert order + items in a transaction
  return await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({ customer_id: input.customer_id, subtotal_cents: computed, total_cents: computed, notes: input.notes, status: 'pending' }).returning();
    await tx.insert(order_items).values(input.items.map(({ menu_item_id, quantity }) => {
      const item = menuItems.find(m => m.id === menu_item_id)!;
      return { order_id: order.id, menu_item_id, menu_item_name: item.name, unit_price_cents: item.price_cents, quantity };
    }));
    return fetchOrderDetail(tx, order.id);
  });
}
```

**`orderService.transitionOrderStatus`**:
```ts
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = { ... }; // from constitution

async function transitionOrderStatus(orderId: number, newStatus: OrderStatus) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  if (!VALID_TRANSITIONS[order.status].includes(newStatus))
    throw new ApiError(422, 'INVALID_TRANSITION', `Cannot transition from ${order.status} to ${newStatus}`, { from: order.status, to: newStatus });
  await db.update(orders).set({ status: newStatus, updated_at: new Date() }).where(eq(orders.id, orderId));
  return fetchOrderDetail(db, orderId);
}
```

### 6. Routes with OpenAPI

Use `@hono/zod-openapi` to register routes. Each route has:
- `operationId` (e.g. `'createOrder'`)
- `request.body` or `request.query` schema
- `responses` with success + error schemas

```ts
// routes/orders.ts
import { createRoute, z } from '@hono/zod-openapi';

const createOrderRoute = createRoute({
  method: 'post',
  path: '/orders',
  operationId: 'createOrder',
  request: { body: { content: { 'application/json': { schema: CreateOrderSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: OrderDetailSchema } }, description: 'Created' },
    422: { content: { 'application/json': { schema: ApiErrorSchema } }, description: 'Validation error' },
  },
});
```

### 7. OpenAPI document endpoint

```ts
// src/openapi.ts
const app = new OpenAPIHono();
// ... register all routes
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Odyssey Restaurant API', version: '1.0.0' },
});
```

`/api/openapi.json` is the source consumed by Orval in spec 04.

### 8. Error middleware

```ts
// src/middleware/errorHandler.ts
app.onError((err, c) => {
  if (err instanceof ApiError)
    return c.json({ error: err.code, message: err.message, details: err.details }, err.status);
  console.error(err);
  return c.json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, 500);
});
```

### 9. Seed script

`src/db/seed.ts`:
1. Truncate in dependency order using a transaction.
2. Insert seed rows using `db.insert(table).values([...]).returning()`.
3. Capture returned IDs to use as FK references for subsequent inserts.
4. Spread `created_at` timestamps across 30 days using `subDays(new Date(), n)`.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| `integer` (cents) for money | Avoids float rounding errors; standard for financial data |
| Price/name snapshot in `order_items` | Historical orders remain accurate after menu price changes |
| `deleteMenuItem(id)` | Hard delete allowed; `order_items` store snapshots so historical orders are unaffected |
| `deleteCategory(id)` | Reject with 422 `CATEGORY_HAS_ITEMS` if category has menu items |
| Nullable `customer_id` on orders | Supports walk-in orders without requiring customer creation |
| `ApiError` class (not thrown plain Error) | Enables typed error responses with machine-readable codes |
| Transaction for order creation | Prevents partial inserts (order created but no items) |
| `pgEnum` for `order_status` | DB-enforced constraint; Drizzle generates correct TypeScript union |
| `VALID_TRANSITIONS` constant | Single source of truth for state machine; reused in tests |
