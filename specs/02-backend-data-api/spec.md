# Spec 02 — Backend Data Model & API

## What

Design and implement the backend of the restaurant operations system: Drizzle ORM schema, drizzle-zod validators, Hono HTTP routes with OpenAPI decorations, service-layer business logic (state machine, total verification, availability checks), and a seed script.

## Why

The backend is the authoritative source of all data shapes and business rules. The schema drives the entire contract pipeline (spec 04). The service layer enforces rules that clients must not be trusted to enforce themselves (order totals, valid state transitions, item availability).

---

## Database Schema (Drizzle)

All tables in `services/backend/src/db/schema.ts`.

### `settings`
```ts
export const settings = pgTable('settings', {
  id:                  serial('id').primaryKey(),
  restaurant_name:     text('restaurant_name').notNull(),
  prep_time_minutes:   integer('prep_time_minutes').notNull().default(15),
  auto_accept:         boolean('auto_accept').notNull().default(false),
  service_available:   boolean('service_available').notNull().default(true),
  delivery_available:  boolean('delivery_available').notNull().default(true),
  opening_hours:       jsonb('opening_hours').notNull(),  // { mon: {open:'09:00',close:'22:00'}, ... }
  created_at:          timestamp('created_at').notNull().defaultNow(),
  updated_at:          timestamp('updated_at').notNull().defaultNow(),
});
```

### `categories`
```ts
export const categories = pgTable('categories', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  sort_order:  integer('sort_order').notNull().default(0),
  created_at:  timestamp('created_at').notNull().defaultNow(),
});
```

### `menu_items`
```ts
export const menu_items = pgTable('menu_items', {
  id:           serial('id').primaryKey(),
  category_id:  integer('category_id').notNull().references(() => categories.id),
  name:         text('name').notNull(),
  description:  text('description'),
  price_cents:  integer('price_cents').notNull(),  // stored in cents
  available:    boolean('available').notNull().default(true),
  image_url:    text('image_url'),
  created_at:   timestamp('created_at').notNull().defaultNow(),
  updated_at:   timestamp('updated_at').notNull().defaultNow(),
});
```

### `customers`
```ts
export const customers = pgTable('customers', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  email:       text('email').unique(),
  phone:       text('phone'),
  created_at:  timestamp('created_at').notNull().defaultNow(),
  updated_at:  timestamp('updated_at').notNull().defaultNow(),
});
```

### `orders`
```ts
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
]);

export const orders = pgTable('orders', {
  id:              serial('id').primaryKey(),
  customer_id:     integer('customer_id').references(() => customers.id),  // nullable = walk-in
  status:          orderStatusEnum('status').notNull().default('pending'),
  subtotal_cents:  integer('subtotal_cents').notNull(),
  total_cents:     integer('total_cents').notNull(),
  notes:           text('notes'),
  created_at:      timestamp('created_at').notNull().defaultNow(),
  updated_at:      timestamp('updated_at').notNull().defaultNow(),
});
```

### `order_items`
```ts
export const order_items = pgTable('order_items', {
  id:               serial('id').primaryKey(),
  order_id:         integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menu_item_id:     integer('menu_item_id').notNull().references(() => menu_items.id),
  menu_item_name:   text('menu_item_name').notNull(),  // snapshot at time of order
  unit_price_cents: integer('unit_price_cents').notNull(),  // snapshot at time of order
  quantity:         integer('quantity').notNull(),
});
```

> **Note on order_items snapshots**: `menu_item_name` and `unit_price_cents` are copied from `menu_items` at order creation time. This ensures historical orders are not affected by future price changes.

---

## Zod Validators (drizzle-zod)

In `services/backend/src/db/validators.ts`:

```ts
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const SelectCategorySchema = createSelectSchema(categories);
export const InsertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1).max(100),
});

export const SelectMenuItemSchema = createSelectSchema(menu_items);
export const InsertMenuItemSchema = createInsertSchema(menu_items, {
  name:        z.string().min(1).max(200),
  price_cents: z.number().int().positive(),
  category_id: z.number().int().positive(),
});
export const UpdateMenuItemSchema = InsertMenuItemSchema.partial().required({ id: true });

export const SelectCustomerSchema = createSelectSchema(customers);
export const InsertCustomerSchema = createInsertSchema(customers, {
  name:  z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
});

export const OrderItemInputSchema = z.object({
  menu_item_id: z.number().int().positive(),
  quantity:     z.number().int().min(1).max(100),
});

export const CreateOrderSchema = z.object({
  customer_id:   z.number().int().positive().optional(),  // walk-in = omit
  items:         z.array(OrderItemInputSchema).min(1),
  notes:         z.string().max(500).optional(),
  total_cents:   z.number().int().positive(),  // client-provided, server verifies
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled']),
});

export const SelectOrderSchema = createSelectSchema(orders);

export const SelectSettingsSchema = createSelectSchema(settings);
export const UpdateSettingsSchema = createInsertSchema(settings).partial().omit({ id: true, created_at: true, updated_at: true });

export const HomeSummarySchema = z.object({
  total_orders_today:        z.number().int(),
  total_orders_yesterday:    z.number().int(),
  revenue_today_cents:       z.number().int(),
  revenue_yesterday_cents:   z.number().int(),
  pending_orders:            z.number().int(),
  popular_items:             z.array(z.object({
    name:           z.string(),
    quantity_sold:  z.number().int(),
  })).max(5),
  recent_orders:             z.array(z.object({
    id:             z.number().int(),
    status:         z.string(),
    customer_name:  z.string().nullable(),
    item_count:     z.number().int(),
    total_cents:    z.number().int(),
    created_at:     z.string().datetime(),
  })).max(10),
});
```

---

## API Routes (Hono + OpenAPI)

All routes registered in `services/backend/src/routes/` and mounted on the Hono app.

Base URL: `http://localhost:8787/api/v1`

### Health
```
GET /health
→ 200 { status: 'ok', timestamp: string }
```

### Categories
```
GET    /categories               → 200 Category[]
POST   /categories               → 201 Category
DELETE /categories/:id           → 204
```

### Menu Items
```
GET    /menu-items               → 200 MenuItem[]  (query: ?category_id=, ?available=)
POST   /menu-items               → 201 MenuItem
PATCH  /menu-items/:id           → 200 MenuItem
DELETE /menu-items/:id           → 204
```

### Customers
```
GET    /customers                → 200 CustomerWithStats[]  (query: ?search=, ?page=, ?limit=)
POST   /customers                → 201 Customer
GET    /customers/:id            → 200 CustomerDetail  (with recent orders + totals)
PATCH  /customers/:id            → 200 Customer
```

`CustomerWithStats` includes `order_count: number` and `total_spend_cents: number` via aggregation.

### Orders
```
GET    /orders                   → 200 { data: OrderSummary[], total: number, page: number, limit: number }
        query: ?status=, ?customer_id=, ?date_from=, ?date_to=, ?page=, ?limit=
POST   /orders                   → 201 OrderDetail
GET    /orders/:id               → 200 OrderDetail
PATCH  /orders/:id/status        → 200 OrderDetail
```

`OrderSummary`: `id`, `status`, `customer_name` (nullable), `item_count`, `total_cents`, `created_at`.

`OrderDetail`: full order with `items[]` (each item with name, unit_price_cents, quantity, line_total_cents).

### Settings
```
GET    /settings                 → 200 Settings
PATCH  /settings                 → 200 Settings
```

### Home
```
GET    /home/summary             → 200 HomeSummary
```

`HomeSummary` response shape (matches `HomeSummarySchema`):

```ts
type HomeSummary = {
  total_orders_today:      number;   // orders created today (local calendar day, UTC)
  total_orders_yesterday:  number;   // orders created yesterday
  revenue_today_cents:     number;   // sum of total_cents for today's non-cancelled orders
  revenue_yesterday_cents: number;   // sum of total_cents for yesterday's non-cancelled orders
  pending_orders:          number;   // count of orders with status = 'pending' (all time)
  popular_items:           { name: string; quantity_sold: number }[];  // top 5 by qty sold (all time, excludes cancelled)
  recent_orders:           OrderSummary[];  // last 10 orders by created_at desc
};
```

**Revenue definition (canonical)**: Sum of `orders.total_cents` where `status != 'cancelled'` and `created_at` falls within the target calendar day (today or yesterday). Includes pending/accepted/preparing/ready/out_for_delivery/completed — any non-cancelled status counts toward revenue for dashboard KPI purposes.

**Popular items definition**: Aggregate `order_items.quantity` grouped by `menu_item_name`, excluding orders with `status = 'cancelled'`, ordered by total quantity desc, limit 5.

---

## Service Layer Business Logic

### `services/backend/src/services/orderService.ts`

#### `createOrder(input: CreateOrderInput)`

1. Fetch all referenced `menu_items` by ID.
2. Reject any items where `available = false` → HTTP 422 with `{ error: 'ITEM_UNAVAILABLE', item_id: n }`.
3. Reject any item IDs not found → HTTP 422 with `{ error: 'ITEM_NOT_FOUND', item_id: n }`.
4. Compute `computed_subtotal = Σ(item.price_cents × qty)`.
5. Compare `computed_subtotal` with `input.total_cents`. If mismatch → HTTP 422 with `{ error: 'TOTAL_MISMATCH', computed: n, submitted: m }`.
6. Insert `orders` row with `subtotal_cents = total_cents = computed_subtotal`, status `'pending'`.
7. Insert all `order_items` rows with price/name snapshots.
8. Return full `OrderDetail`.

#### `transitionOrderStatus(orderId, newStatus)`

Valid transitions (canonical, from constitution):

```ts
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ['accepted', 'cancelled'],
  accepted:         ['preparing', 'cancelled'],
  preparing:        ['ready'],
  ready:            ['out_for_delivery', 'completed'],
  out_for_delivery: ['completed'],
  completed:        [],
  cancelled:        [],
};
```

If `newStatus` is not in `VALID_TRANSITIONS[currentStatus]` → HTTP 422 with `{ error: 'INVALID_TRANSITION', from: current, to: newStatus }`.

Otherwise update `orders.status` and `updated_at`, return updated `OrderDetail`.

### `services/backend/src/services/homeService.ts`

#### `getHomeSummary()`

Computes all Home dashboard KPIs in a single query round-trip where possible:

1. **Today's orders count** — `COUNT(*)` where `created_at` is today.
2. **Yesterday's orders count** — same for yesterday (enables KPI trend on frontend).
3. **Today's revenue** — `SUM(total_cents)` where today AND `status != 'cancelled'`.
4. **Yesterday's revenue** — same for yesterday.
5. **Pending orders** — `COUNT(*)` where `status = 'pending'`.
6. **Popular items** — join `order_items` → `orders`, exclude cancelled, group by `menu_item_name`, order by sum(quantity) desc, limit 5.
7. **Recent orders** — last 10 orders by `created_at` desc, shaped as `OrderSummary[]`.

### `services/backend/src/services/menuService.ts`

#### `deleteMenuItem(id)`

**Policy (canonical)**: Hard delete is allowed. Menu items referenced in historical `order_items` are safe to delete because order line items store name/price snapshots. If the item has no orders referencing it, delete immediately. If referenced, still allow delete (historical orders remain intact via snapshots). Return 204 on success, 404 if not found.

#### `deleteCategory(id)`

Reject with HTTP 422 `{ error: 'CATEGORY_HAS_ITEMS' }` if any `menu_items` reference the category. Otherwise hard delete. Return 204.

---

## Error Response Shape

All error responses:
```ts
type ApiError = {
  error: string;       // machine-readable code (e.g. 'ITEM_UNAVAILABLE')
  message: string;     // human-readable description
  details?: unknown;   // optional: { item_id, computed, submitted, ... }
};
```

HTTP status codes:
- 400 — malformed request / validation failure
- 404 — resource not found
- 422 — semantic/business rule violation
- 500 — unexpected server error

---

## Seed Script

`services/backend/src/db/seed.ts`

Strategy: truncate all tables in dependency order (order_items → orders → menu_items → categories → customers → settings), then insert fresh data.

**Seed data**:
- 1 settings row (restaurant name: "Sakura Garden", prep 20min, auto_accept: false, service + delivery available).
- 3 categories: "Starters", "Mains", "Drinks".
- 12 menu items (~4 per category, mix of available/1 unavailable).
- 8 customers with realistic names, emails, phones.
- 20 orders spread across:
  - All 7 status values (at least 2 in each of `pending`, `accepted`, `preparing`, `ready`; at least 1 each of `out_for_delivery`, `completed`, `cancelled`).
  - `created_at` spanning the past 30 days.
  - Mix of walk-in (no customer_id) and linked customers.
  - 2–5 items per order.

---

## Acceptance Criteria

### Schema
- [ ] All 6 tables (settings, categories, menu_items, customers, orders, order_items) exist with correct columns and FK constraints.
- [ ] `pnpm db:migrate` runs without error on fresh database.
- [ ] `price_cents` and `*_cents` columns are integers, not floats.
- [ ] `order_items` has name + price snapshot columns.

### Validators
- [ ] `InsertMenuItemSchema` rejects `price_cents: -100`.
- [ ] `CreateOrderSchema` rejects empty `items` array.
- [ ] `UpdateOrderStatusSchema` rejects `status: 'pending'` (not a valid transition target).

### Service Layer
- [ ] `POST /orders` with an unavailable menu item → 422 `ITEM_UNAVAILABLE`.
- [ ] `POST /orders` with wrong `total_cents` → 422 `TOTAL_MISMATCH`.
- [ ] `PATCH /orders/:id/status` with invalid transition → 422 `INVALID_TRANSITION`.
- [ ] `PATCH /orders/:id/status` `pending → accepted` → 200 with updated status.
- [ ] `POST /orders` snapshots item name and price correctly (changing item price after order creation does not change the order).

### API
- [ ] `GET /orders?status=pending` returns only pending orders.
- [ ] `GET /customers/:id` includes `order_count` and `total_spend_cents`.
- [ ] `GET /menu-items?available=true` returns only available items.
- [ ] `GET /home/summary` returns `HomeSummary` with all fields populated after seed.
- [ ] `GET /home/summary` revenue excludes cancelled orders only.
- [ ] `GET /home/summary` `recent_orders` contains up to 10 most recent orders.
- [ ] All routes have OpenAPI operation IDs and response schemas registered.

### Seed
- [ ] `pnpm seed` succeeds on empty DB.
- [ ] `pnpm seed` run twice is idempotent (no duplicate data error).
- [ ] After seeding: `GET /orders` returns exactly 20 orders.
- [ ] After seeding: `GET /customers` returns exactly 8 customers.
