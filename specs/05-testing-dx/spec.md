# Spec 05 — Testing & Developer Experience

## What

Define the testing strategy and DX tooling for the project: targeted backend Vitest tests covering key business logic, frontend tests for important components and utilities, and clear local development scripts.

## Why

We don't need exhaustive coverage — we need disciplined coverage of the behaviors that matter most. The backend tests prove that the service layer enforces correctness (state machine, total verification, availability). The frontend tests prove that utility logic and key components behave correctly. Both give reviewers confidence that the code was written with testing in mind, not bolted on.

---

## Backend Tests (Vitest)

Location: `services/backend/src/__tests__/`

Test runner: **Vitest** with a test database (separate `odyssey_test` DB, or use SQLite for unit tests).

### Test Database Strategy

**Option A (integration tests with Postgres)**: Spin up a test DB (`odyssey_test`), run migrations, seed minimal data, run tests, truncate after each test. Slower but tests real SQL behavior.

**Option B (unit tests with mocked DB)**: Mock the `db` object to return predefined responses. Faster, no DB required, but less realistic.

**Chosen**: Option A for service-layer tests (they test SQL logic). Use `beforeEach` truncate + targeted insert per test group. The `DATABASE_URL` for tests reads from `TEST_DATABASE_URL` env (defaults to `odyssey_test` on localhost).

---

### Test Suite 1: Order Creation

File: `src/__tests__/orderService.test.ts`

```ts
describe('createOrder', () => {
  test('creates order with valid items', async () => {
    // Setup: insert category, menu item (available)
    // Call: createOrder({ items: [{ menu_item_id: X, quantity: 2 }], total_cents: X.price*2 })
    // Assert: returns OrderDetail with status 'pending', correct items, correct total
  });

  test('rejects order with unavailable menu item', async () => {
    // Setup: insert menu item with available=false
    // Call: createOrder with that item
    // Assert: throws ApiError with code 'ITEM_UNAVAILABLE'
  });

  test('rejects order with non-existent menu item', async () => {
    // Call: createOrder with menu_item_id=99999 (does not exist)
    // Assert: throws ApiError with code 'ITEM_NOT_FOUND'
  });

  test('rejects order when total_cents does not match computed', async () => {
    // Setup: item with price_cents=1000
    // Call: createOrder({ items: [{ id: X, qty: 1 }], total_cents: 999 })  // wrong total
    // Assert: throws ApiError with code 'TOTAL_MISMATCH'
  });

  test('snapshots item name and price correctly', async () => {
    // Setup: create item with price_cents=500, place order
    // Then: update item price to 999
    // Assert: order_item still has unit_price_cents=500
  });

  test('creates walk-in order (no customer_id)', async () => {
    // Call: createOrder without customer_id
    // Assert: order created with customer_id=null
  });
});
```

### Test Suite 2: Order Status Transitions

File: `src/__tests__/orderService.test.ts` (continued)

```ts
describe('transitionOrderStatus', () => {
  test.each([
    ['pending',   'accepted'],
    ['pending',   'cancelled'],
    ['accepted',  'preparing'],
    ['accepted',  'cancelled'],
    ['preparing', 'ready'],
    ['ready',     'out_for_delivery'],
    ['ready',     'completed'],
    ['out_for_delivery', 'completed'],
  ])('allows %s → %s', async (from, to) => {
    // Setup: order with status=from
    // Call: transitionOrderStatus(id, to)
    // Assert: order status updated to 'to'
  });

  test.each([
    ['pending',          'preparing'],
    ['pending',          'completed'],
    ['preparing',        'accepted'],
    ['completed',        'cancelled'],
    ['cancelled',        'accepted'],
    ['out_for_delivery', 'pending'],
  ])('rejects invalid transition %s → %s', async (from, to) => {
    // Assert: throws ApiError with code 'INVALID_TRANSITION'
  });

  test('returns 404 for non-existent order', async () => {
    // Call: transitionOrderStatus(99999, 'accepted')
    // Assert: throws ApiError with code 'NOT_FOUND'
  });
});
```

### Test Suite 3: Menu Item Validation

File: `src/__tests__/menuService.test.ts`

```ts
describe('menu validators', () => {
  test('InsertMenuItemSchema rejects negative price', () => {
    const result = InsertMenuItemSchema.safeParse({ name: 'Soup', price_cents: -100, category_id: 1 });
    expect(result.success).toBe(false);
  });

  test('InsertMenuItemSchema rejects empty name', () => {
    const result = InsertMenuItemSchema.safeParse({ name: '', price_cents: 500, category_id: 1 });
    expect(result.success).toBe(false);
  });

  test('CreateOrderSchema rejects empty items array', () => {
    const result = CreateOrderSchema.safeParse({ items: [], total_cents: 0 });
    expect(result.success).toBe(false);
  });
});
```

### Test Suite 4: Home Summary (integration)

File: `src/__tests__/homeService.test.ts`

```ts
describe('getHomeSummary', () => {
  test('returns correct order count for today', async () => { ... });
  test('returns correct revenue for today (non-cancelled orders only)', async () => { ... });
  test('excludes cancelled orders from revenue', async () => { ... });
  test('returns correct pending count', async () => { ... });
  test('returns up to 10 recent orders sorted by created_at desc', async () => { ... });
});
```

---

## Frontend Tests

Location: `apps/dashboard/src/__tests__/`

Test runner: **Jest** with `@testing-library/react-native`.

### Test Suite 1: Order Status Utilities

File: `src/__tests__/utils/orderStatus.test.ts`

```ts
describe('getAvailableActions', () => {
  test('pending order has accept and cancel actions', () => {
    const actions = getAvailableActions('pending');
    expect(actions.map(a => a.nextStatus)).toEqual(expect.arrayContaining(['accepted', 'cancelled']));
  });

  test('completed order has no actions', () => {
    expect(getAvailableActions('completed')).toHaveLength(0);
  });

  test('cancelled order has no actions', () => {
    expect(getAvailableActions('cancelled')).toHaveLength(0);
  });

  test('cancel action has danger variant', () => {
    const cancelAction = getAvailableActions('pending').find(a => a.nextStatus === 'cancelled');
    expect(cancelAction?.variant).toBe('danger');
  });
});
```

### Test Suite 2: Currency Utility

File: `src/__tests__/utils/currency.test.ts`

```ts
describe('formatCents', () => {
  test('formats 1250 as $12.50', () => {
    expect(formatCents(1250)).toBe('$12.50');
  });
  test('formats 0 as $0.00', () => {
    expect(formatCents(0)).toBe('$0.00');
  });
  test('formats 100 as $1.00', () => {
    expect(formatCents(100)).toBe('$1.00');
  });
});
```

### Test Suite 3: Badge Component

File: `packages/ui/src/__tests__/Badge.test.tsx`

```ts
describe('Badge', () => {
  test('renders order status label correctly', () => {
    const { getByText } = render(<Badge variant="order-status" orderStatus="pending" label="Pending" />);
    expect(getByText('Pending')).toBeTruthy();
  });

  test('renders all 7 order statuses without crashing', () => {
    const statuses: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
    statuses.forEach(status => {
      expect(() => render(<Badge variant="order-status" orderStatus={status} label={status} />)).not.toThrow();
    });
  });
});
```

### Test Suite 4: EmptyState Component

File: `packages/ui/src/__tests__/EmptyState.test.tsx`

```ts
describe('EmptyState', () => {
  test('renders title and subtitle', () => {
    const { getByText } = render(
      <EmptyState icon={FolderIcon} title="No items" subtitle="Add your first item." />
    );
    expect(getByText('No items')).toBeTruthy();
    expect(getByText('Add your first item.')).toBeTruthy();
  });

  test('renders action button when provided', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState icon={FolderIcon} title="Empty" subtitle="" action={{ label: 'Add', onPress }} />
    );
    fireEvent.press(getByText('Add'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not render action button when not provided', () => {
    const { queryByRole } = render(<EmptyState icon={FolderIcon} title="Empty" subtitle="" />);
    expect(queryByRole('button')).toBeNull();
  });
});
```

---

## DX Scripts

All runnable from workspace root:

| Command | Description |
|---|---|
| `pnpm dev:dashboard` | Starts Expo web dev server (hot reload) |
| `pnpm dev:backend` | Starts Hono on Wrangler dev (`localhost:8787`) |
| `pnpm db:up` | Starts Postgres via Docker Compose |
| `pnpm db:down` | Stops and removes Postgres container |
| `pnpm db:migrate` | Runs Drizzle migrations |
| `pnpm seed` | Runs seed script (idempotent) |
| `pnpm gen:contract` | Full contract pipeline: backend build → Orval gen → typecheck |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm test` | All tests (backend Vitest + frontend Jest) |
| `pnpm test:backend` | Backend tests only |
| `pnpm test:frontend` | Frontend/UI tests only |

### Local Quick-Start (single-line)

```bash
pnpm install && pnpm db:up && sleep 3 && pnpm db:migrate && pnpm seed
# Then in two terminals:
pnpm dev:backend   # terminal 1
pnpm dev:dashboard # terminal 2
```

Or with concurrent dev:
```bash
pnpm install && pnpm db:up && sleep 3 && pnpm db:migrate && pnpm seed && pnpm turbo run dev --filter=dashboard --filter=backend --concurrency=2
```

---

## Acceptance Criteria

### Backend Tests
- [ ] `pnpm test:backend` runs and passes all test suites.
- [ ] `createOrder` with unavailable item → test asserts `ITEM_UNAVAILABLE` code.
- [ ] `createOrder` with wrong total → test asserts `TOTAL_MISMATCH` code.
- [ ] All 8 valid state transitions covered by parameterized tests.
- [ ] All 6 invalid state transitions covered by parameterized tests.
- [ ] Price snapshot test verifies order item price is not affected by later price change.

### Frontend Tests
- [ ] `pnpm test:frontend` runs and passes.
- [ ] `getAvailableActions('completed')` returns empty array.
- [ ] `formatCents(1250)` returns `'$12.50'`.
- [ ] `EmptyState` with action → action button fires callback.

### DX
- [ ] All 11 scripts listed in acceptance criteria run from workspace root without error.
- [ ] `pnpm dev:backend` starts in under 10 seconds.
- [ ] `pnpm dev:dashboard` starts and opens in browser without error.
- [ ] `pnpm gen:contract` completes and `packages/api-client/src/generated/` is populated.
