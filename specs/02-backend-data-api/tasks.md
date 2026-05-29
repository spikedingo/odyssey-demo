# Tasks 02 — Backend Data Model & API

## DB Setup

- [x] Install backend dependencies: `hono`, `@hono/zod-openapi`, `drizzle-orm`, `drizzle-zod`, `drizzle-kit`, `postgres`, `zod`, `vitest`, `tsx`, `wrangler`
- [x] Write `services/backend/src/db/index.ts` — postgres + drizzle client, reads `DATABASE_URL`
- [x] Write `drizzle.config.ts` in `services/backend/`

## Schema

- [x] Write `src/db/schema.ts` with all tables:
  - [x] `settings` table (id, restaurant_name, prep_time_minutes, auto_accept, service_available, delivery_available, opening_hours jsonb, timestamps)
  - [x] `categories` table (id, name, sort_order, created_at)
  - [x] `menu_items` table (id, category_id FK, name, description, price_cents, available, image_url, timestamps)
  - [x] `customers` table (id, name, email unique, phone, timestamps)
  - [x] `orderStatusEnum` pgEnum with all 7 values
  - [x] `orders` table (id, customer_id nullable FK, status enum, subtotal_cents, total_cents, notes, timestamps)
  - [x] `order_items` table (id, order_id cascade FK, menu_item_id FK, menu_item_name snapshot, unit_price_cents snapshot, quantity)
- [x] Run `pnpm drizzle-kit generate:pg` — generates SQL migration files
- [x] Write `src/db/migrate.ts` — migration runner
- [x] `pnpm db:migrate` — applies migrations to local Postgres, verify all tables created

## Validators

- [x] Write `src/db/validators.ts`:
  - [x] `SelectCategorySchema`, `InsertCategorySchema`
  - [x] `SelectMenuItemSchema`, `InsertMenuItemSchema`, `UpdateMenuItemSchema`
  - [x] `SelectCustomerSchema`, `InsertCustomerSchema`
  - [x] `OrderItemInputSchema`
  - [x] `CreateOrderSchema` (with items[], total_cents for server verification)
  - [x] `UpdateOrderStatusSchema` (enum: all statuses except pending)
  - [x] `SelectOrderSchema`
  - [x] `SelectSettingsSchema`, `UpdateSettingsSchema`
  - [x] `HomeSummarySchema` (with yesterday fields, recent_orders, popular_items)
  - [x] `ApiErrorSchema` (for OpenAPI error responses)
  - [x] `OrderDetailSchema`, `OrderSummarySchema` (composed response shapes)
  - [x] `CustomerWithStatsSchema`, `CustomerDetailSchema`

## Service Layer

- [x] Write `src/services/orderService.ts`:
  - [x] `VALID_TRANSITIONS` constant (state machine map)
  - [x] `fetchOrderDetail(db, orderId)` — helper that fetches order + items + customer name
  - [x] `createOrder(input)` — validates items available, verifies total, inserts in transaction
  - [x] `transitionOrderStatus(orderId, newStatus)` — enforces VALID_TRANSITIONS, returns updated order
- [x] Write `src/services/menuService.ts`:
  - [x] `getMenuItems(filters)` — list with optional category_id + available filter
  - [x] `createMenuItem(input)` — insert, return new item
  - [x] `updateMenuItem(id, input)` — partial update
  - [x] `deleteMenuItem(id)` — hard delete allowed (order_items use snapshots; historical orders unaffected)
- [x] Write `src/services/categoryService.ts`:
  - [x] `getCategories()` — list ordered by sort_order
  - [x] `createCategory(input)`
  - [x] `deleteCategory(id)` — reject with 422 `CATEGORY_HAS_ITEMS` if category has menu items
- [x] Write `src/services/customerService.ts`:
  - [x] `getCustomers(filters)` — list with search + pagination, includes order_count + total_spend_cents
  - [x] `getCustomerDetail(id)` — customer + recent 5 orders + lifetime stats
  - [x] `createCustomer(input)`
  - [x] `updateCustomer(id, input)`
- [x] Write `src/services/settingsService.ts`:
  - [x] `getSettings()` — returns single settings row (auto-creates default if missing)
  - [x] `updateSettings(input)`
- [x] Write `src/middleware/errorHandler.ts` — `ApiError` class + Hono `onError` handler
- [x] Write `src/services/homeService.ts`:
  - [x] `getHomeSummary()` — total orders today/yesterday, revenue today/yesterday (non-cancelled only), pending count, popular items (top 5), recent orders (last 10)

## Routes

- [x] Write `src/routes/health.ts` — `GET /health`
- [x] Write `src/routes/categories.ts` — GET list, POST create, DELETE by id
- [x] Write `src/routes/menuItems.ts` — GET list (with query filters), POST create, PATCH :id, DELETE :id
- [x] Write `src/routes/customers.ts` — GET list (with search/pagination), POST create, GET :id, PATCH :id
- [x] Write `src/routes/orders.ts` — GET list (with status/date/customer filters + pagination), POST create, GET :id, PATCH :id/status
- [x] Write `src/routes/settings.ts` — GET, PATCH
- [x] Write `src/routes/home.ts` — `GET /home/summary` returning `HomeSummarySchema`
- [x] Each route uses `@hono/zod-openapi` `createRoute()` with operationId, request schema, response schemas

## OpenAPI + App Entry

- [ ] Write `src/openapi.ts` — `OpenAPIHono` app with all routes mounted
- [x] Add `app.doc('/api/openapi.json', { ... })` endpoint
- [x] Write `src/index.ts` — exports default Hono app for Wrangler
- [x] Verify `GET /api/openapi.json` returns valid OpenAPI 3.0 JSON

## Seed Script

- [x] Write `src/db/seed.ts`:
  - [x] Truncate tables in dependency order (transaction)
  - [x] Insert 1 settings row
  - [x] Insert 3 categories
  - [x] Insert 12 menu items (mix categories, 1 unavailable item)
  - [x] Insert 8 customers
  - [x] Insert 20 orders with items (all statuses represented, timestamps spread 30 days)
- [x] `pnpm seed` — runs without error on clean DB
- [x] `pnpm seed` twice — idempotent, no errors

## Verification

- [x] `GET /health` → 200
- [x] `POST /orders` with unavailable item → 422 `ITEM_UNAVAILABLE`
- [x] `POST /orders` with wrong total_cents → 422 `TOTAL_MISMATCH`
- [x] `PATCH /orders/1/status` body `{status:"accepted"}` on pending order → 200
- [x] `PATCH /orders/1/status` body `{status:"completed"}` on pending order → 422 `INVALID_TRANSITION`
- [x] `GET /orders?status=pending` → only pending orders
- [x] `GET /customers/1` includes `order_count` and `total_spend_cents`
- [x] `GET /home/summary` → returns all HomeSummary fields including recent_orders and yesterday comparison
- [x] `GET /home/summary` revenue excludes cancelled orders
- [x] `pnpm --filter=backend typecheck` — zero errors
