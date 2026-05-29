# Tasks 05 — Testing & DX

## Backend Test Infrastructure

- [x] Add `odyssey_test` database: `docker exec odyssey-postgres-1 psql -U odyssey -c "CREATE DATABASE odyssey_test;"`
- [x] Add `"db:setup-test"` script to `services/backend/package.json`
- [ ] Write `services/backend/vitest.config.ts` — node env, singleThread, setupFiles
- [x] Write `services/backend/src/__tests__/setup.ts` — test DB connection, run migrations beforeAll, truncate beforeEach
- [ ] Write `services/backend/src/__tests__/factories.ts` — `createCategory`, `createMenuItem`, `createCustomer`, `createOrder` helpers
- [ ] Create `services/backend/.env.test` (gitignored) with `TEST_DATABASE_URL`
- [ ] Add `"test": "vitest run"` and `"test:watch": "vitest"` to backend `package.json`

## Backend Test Suites

### Order Creation Tests
- [x] Write `src/__tests__/orderService.test.ts`:
  - [x] Test: creates order with valid items (returns OrderDetail, status 'pending', correct total)
  - [x] Test: rejects unavailable item (ITEM_UNAVAILABLE error)
  - [ ] Test: rejects non-existent item (ITEM_NOT_FOUND error)
  - [x] Test: rejects wrong total_cents (TOTAL_MISMATCH error)
  - [x] Test: snapshots item price (price change after order doesn't affect order_item.unit_price_cents)
  - [ ] Test: creates walk-in order with no customer_id (customer_id=null)

### Order Status Transition Tests
- [ ] Add to `src/__tests__/orderService.test.ts`:
  - [ ] Parameterized test: all 8 valid transitions pass
  - [ ] Parameterized test: all 6 invalid transitions throw INVALID_TRANSITION
  - [ ] Test: non-existent order returns NOT_FOUND

### Validator Tests
- [ ] Write `src/__tests__/validators.test.ts` (no DB needed — pure Zod tests):
  - [x] InsertMenuItemSchema rejects negative price_cents
  - [ ] InsertMenuItemSchema rejects empty name
  - [ ] CreateOrderSchema rejects empty items array
  - [ ] CreateOrderSchema rejects items with quantity=0
  - [ ] UpdateOrderStatusSchema rejects 'pending' as a transition target

### Home Summary Tests
- [ ] Write `src/__tests__/homeService.test.ts`:
  - [ ] Test: correct today's order count
  - [ ] Test: correct today's revenue (sum of total_cents for non-cancelled orders only)
  - [x] Test: cancelled orders excluded from revenue
  - [ ] Test: correct pending order count
  - [ ] Test: recent_orders returns last 10 by created_at desc

## Frontend Test Infrastructure

- [ ] Install jest-expo, @testing-library/react-native, @testing-library/jest-native in `apps/dashboard`
- [x] Write `apps/dashboard/jest.config.js`
- [ ] Install same test deps in `packages/ui`
- [x] Write `packages/ui/jest.config.js`
- [x] Add `"test": "jest --passWithNoTests"` to both package.json files

## Frontend Test Suites

### Order Status Utility Tests
- [ ] Write `apps/dashboard/src/__tests__/utils/orderStatus.test.ts`:
  - [x] `getAvailableActions('pending')` contains 'accepted' and 'cancelled'
  - [x] `getAvailableActions('completed')` returns empty array
  - [ ] `getAvailableActions('cancelled')` returns empty array
  - [ ] `getAvailableActions('preparing')` contains only 'ready'
  - [ ] Cancel action variant is 'danger'

### Currency Utility Tests
- [ ] Write `apps/dashboard/src/__tests__/utils/currency.test.ts`:
  - [x] formatCents(1250) → '$12.50'
  - [x] formatCents(0) → '$0.00'
  - [ ] formatCents(100) → '$1.00'
  - [ ] formatCents(999) → '$9.99'

### Badge Component Tests
- [ ] Write `packages/ui/src/__tests__/Badge.test.tsx`:
  - [ ] Renders label text
  - [ ] All 7 order statuses render without crashing
  - [ ] success variant renders (no crash)

### EmptyState Component Tests
- [ ] Write `packages/ui/src/__tests__/EmptyState.test.tsx`:
  - [ ] Renders title and subtitle
  - [ ] Action button fires callback when pressed
  - [ ] No button rendered when action prop not provided

## DX Scripts Verification

- [x] Add `test:backend` and `test:frontend` scripts to root `package.json`
- [x] `pnpm test` from workspace root — runs all test suites
- [x] `pnpm test:backend` — backend Vitest passes
- [x] `pnpm test:frontend` — frontend Jest passes
- [x] `pnpm lint` — ESLint passes across all packages
- [x] `pnpm typecheck` — TypeScript check passes across all packages
- [x] `pnpm gen:contract` — full pipeline succeeds

## Documentation

- [ ] Add `## Running Tests` section to root README with:
  - [ ] Prerequisites: running Postgres (`pnpm db:up`)
  - [ ] `pnpm db:setup-test` to create test database
  - [ ] `pnpm test` to run all tests
  - [ ] `pnpm test:backend` / `pnpm test:frontend` for individual suites
  - [ ] Watch mode: `pnpm --filter=backend exec vitest`
