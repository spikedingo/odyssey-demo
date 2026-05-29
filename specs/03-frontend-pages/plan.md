# Plan 03 — Frontend Pages

## Approach

Build pages in this order: shell/layout first (so all pages have navigation), then Home (simplest data), then Menu (CRUD with Drawer), then Orders (most complex: list + detail + state machine + URL state), then CRM (moderate complexity), then Settings (form only).

---

## File Structure

```
apps/dashboard/src/
├── app/
│   ├── _layout.tsx                  # Root: providers stack
│   ├── (dashboard)/
│   │   ├── _layout.tsx              # Sidebar shell
│   │   ├── home.tsx                 # Home page
│   │   ├── orders/
│   │   │   ├── index.tsx            # Orders list
│   │   │   └── [id].tsx             # Order detail
│   │   ├── crm/
│   │   │   ├── index.tsx            # Customer list
│   │   │   └── [id].tsx             # Customer detail
│   │   ├── menu/
│   │   │   └── index.tsx            # Menu management
│   │   └── settings.tsx
│   └── ui-library.tsx
├── screens/
│   ├── Home/
│   │   ├── HomeScreen.tsx           # Orchestrator
│   │   ├── KPIGrid.tsx
│   │   ├── RecentOrdersTable.tsx
│   │   └── PopularItemsList.tsx
│   ├── Orders/
│   │   ├── OrdersScreen.tsx
│   │   ├── OrdersTable.tsx
│   │   ├── OrderFilters.tsx         # Status chips, date range, search
│   │   ├── OrderDetailScreen.tsx
│   │   ├── OrderDetailHeader.tsx
│   │   ├── OrderItemsTable.tsx
│   │   ├── OrderStatusActions.tsx   # "Accept", "Cancel", etc. buttons
│   │   ├── NewOrderDrawer.tsx
│   │   ├── ItemSelector.tsx         # menu item +/- quantity controls
│   │   └── CustomerSelector.tsx
│   ├── CRM/
│   │   ├── CRMScreen.tsx
│   │   ├── CustomersTable.tsx
│   │   ├── CustomerDetailScreen.tsx
│   │   ├── CustomerStatsStrip.tsx
│   │   ├── CustomerRecentOrders.tsx
│   │   └── CustomerFormModal.tsx
│   ├── Menu/
│   │   ├── MenuScreen.tsx
│   │   ├── MenuItemGrid.tsx
│   │   ├── MenuItemCard.tsx
│   │   ├── MenuItemDrawer.tsx
│   │   └── CategoryFormModal.tsx
│   ├── Settings/
│   │   ├── SettingsScreen.tsx
│   │   ├── SettingsForm.tsx
│   │   └── OpeningHoursGrid.tsx
│   └── UILibrary/                   # (from spec 01)
│       └── ...
├── hooks/
│   ├── useOrderFilters.ts           # Parses/serializes URL query params
│   ├── useHomeSummary.ts
│   ├── useOrderDetail.ts
│   ├── useOrderActions.ts
│   ├── useMenuItems.ts
│   ├── useCustomers.ts
│   └── useSettings.ts
└── utils/
    ├── currency.ts                  # formatCents(n) → "$12.50"
    ├── dates.ts                     # formatDate, relativeTime
    └── orderStatus.ts               # getAvailableActions(status) using VALID_TRANSITIONS
```

---

## Step-by-Step

### 1. Root layout

```tsx
// app/_layout.tsx
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DensityProvider>
          <ToastContainer />
          <Stack screenOptions={{ headerShown: false }} />
        </DensityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### 2. Dashboard shell layout

```tsx
// app/(dashboard)/_layout.tsx
export default function DashboardLayout() {
  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.content}>
        <Slot />  {/* Expo Router outlet */}
      </View>
    </View>
  );
}
```

`Sidebar` reads the current route from `usePathname()` to determine active nav item.

### 3. URL filter state (`hooks/useOrderFilters.ts`)

```ts
import { useLocalSearchParams, useRouter } from 'expo-router';

export function useOrderFilters() {
  const params = useLocalSearchParams<{ status?: string; date_from?: string; date_to?: string; search?: string; page?: string }>();
  const router = useRouter();

  const filters = {
    status:    params.status?.split(',').filter(Boolean) as OrderStatus[] ?? [],
    date_from: params.date_from ?? undefined,
    date_to:   params.date_to ?? undefined,
    search:    params.search ?? '',
    page:      Number(params.page ?? 1),
  };

  const setFilter = (key: string, value: string | undefined) => {
    router.setParams({ ...params, [key]: value });
  };

  return { filters, setFilter };
}
```

### 4. Currency and date utilities

```ts
// utils/currency.ts
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
```

### 5. Order status actions

```ts
// utils/orderStatus.ts
import { VALID_TRANSITIONS, ORDER_STATUS_LABELS } from '@odyssey/types';
import type { OrderStatus } from '@odyssey/types';

export function getAvailableActions(status: OrderStatus): { label: string; nextStatus: OrderStatus; variant: 'primary' | 'danger' }[] {
  return VALID_TRANSITIONS[status].map(next => ({
    nextStatus: next,
    label: next === 'cancelled' ? 'Cancel Order' : ORDER_STATUS_LABELS[next],
    variant: next === 'cancelled' ? 'danger' : 'primary',
  }));
}
```

### 6. Home page

`useGetHomeSummary()` → render KPIGrid (with trend from today/yesterday fields) + RecentOrdersTable (`recent_orders`) + PopularItemsList.

`KPICard` component: value + label + optional trend arrow computed from API yesterday comparison fields.

### 7. Menu page

- `useListMenuItems()` and `useListCategories()` at page level.
- Pass data to `MenuItemGrid`.
- `MenuItemDrawer` uses local `open` state. On save: `useCreateMenuItem` or `useUpdateMenuItem` mutation, `queryClient.invalidateQueries(['listMenuItems'])` on success.

### 8. Orders page

Most complex page. Key flows:

**List + filters**:
```tsx
const { filters, setFilter } = useOrderFilters();
const { data, isLoading } = useListOrders({ params: { status: filters.status.join(','), ... } });
```

**New Order Drawer**:
- `ItemSelector` maintains local `Map<menuItemId, quantity>` state.
- Subtotal computed locally from menu item prices.
- On submit: `total_cents = computedSubtotal` (server will verify; we pass the same value we computed).
- Calls `useCreateOrder({ onSuccess: (order) => { toast.success('Order created'); router.push(\`/orders/\${order.id}\`) } })`.

**Order status actions**:
- `getAvailableActions(order.status)` → render action buttons.
- Click → open confirmation modal with action label.
- Confirm → `useUpdateOrderStatus({ orderId, status: nextStatus })`.

### 9. CRM page

- `useListCustomers({ params: { search } })` with debounced search.
- `useGetCustomer(id)` for detail view.
- Customer form modal: controlled form with React state, `useCreateCustomer` / `useUpdateCustomer`.

### 10. Settings page

- `useGetSettings()` → initialize form state.
- `useForm` (or manual controlled state) tracks dirty fields.
- `useUpdateSettings` mutation on submit.
- Opening hours: array of `{ day, open, close, closed }` objects rendered as a grid.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Expo Router file-based routing | Natural for Expo + web URL parity; cleaner than manual navigation |
| `useLocalSearchParams` for filter URL sync | Expo Router's built-in; no extra library needed |
| Screens in `/screens/`, routes in `/app/` | Routes are thin; all logic in screens/hooks for testability |
| Hooks in `/hooks/` for page logic | Keeps page components lean; hooks are independently testable |
| `queryClient.invalidateQueries` on mutation | Simplest cache invalidation; correct for this scale |
| No form library (or minimal) | Forms here are simple; avoid the overhead of react-hook-form for this scope |
| `computedSubtotal` sent as `total_cents` | Client computes same value server will verify; catches bugs before request |
