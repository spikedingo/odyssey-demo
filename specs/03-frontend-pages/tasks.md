# Tasks 03 — Frontend Pages

## Providers & Shell

- [x] Write `apps/dashboard/src/app/_layout.tsx` — QueryClientProvider + ThemeProvider + DensityProvider + ToastContainer + Stack
- [x] Write `apps/dashboard/src/app/(dashboard)/_layout.tsx` — Sidebar shell + Slot
- [x] Write `Sidebar` component (in packages/ui or screens/): nav items (Home, Orders, CRM, Menu, Settings), active state, density-aware
- [x] Write `apps/dashboard/src/app/(dashboard)/index.tsx` — redirect to `/home`
- [ ] Write `apps/dashboard/src/app/+not-found.tsx` — 404 page

## Utilities

- [ ] Write `apps/dashboard/src/utils/currency.ts` — `formatCents(n)` → `"$12.50"`
- [ ] Write `apps/dashboard/src/utils/dates.ts` — `formatDate(iso)`, `relativeTime(iso)` (e.g. "2 hours ago")
- [ ] Write `apps/dashboard/src/utils/orderStatus.ts` — `getAvailableActions(status)` using `VALID_TRANSITIONS` from `@odyssey/types`

## Hooks

- [ ] Write `apps/dashboard/src/hooks/useOrderFilters.ts` — reads/writes `status`, `date_from`, `date_to`, `search`, `page` URL params via Expo Router
- [ ] Write `apps/dashboard/src/hooks/useOrderActions.ts` — wraps `useUpdateOrderStatus` with optimistic state + error handling
- [ ] Write `apps/dashboard/src/hooks/useMenuItems.ts` — wraps `useListMenuItems` + `useListCategories`
- [ ] Write `apps/dashboard/src/hooks/useCustomers.ts` — wraps `useListCustomers` with debounced search

## Home Page

- [x] Write `apps/dashboard/src/app/(dashboard)/home.tsx` — calls `useGetHomeSummary`
- [ ] Write `screens/Home/KPIGrid.tsx` — 2×2 grid of KPICard components
- [ ] Write `screens/Home/RecentOrdersTable.tsx` — renders `recent_orders` from `useGetHomeSummary()` (not a separate orders query)
- [ ] Write `screens/Home/PopularItemsList.tsx` — top 5 items by quantity sold
- [x] Home loading state: skeleton cards + table skeleton
- [ ] Home empty state: EmptyState with "Create Order" CTA

## Orders Page

- [x] Write `apps/dashboard/src/app/(dashboard)/orders/index.tsx` — calls `useListOrders` with filter params
- [ ] Write `screens/Orders/OrderFilters.tsx` — status chip multi-select, date range, search input; changes update URL params
- [ ] Write `screens/Orders/OrdersTable.tsx` — columns: #, Customer, Items, Total, Status (Badge), Created At
- [x] Table loading: `TableSkeleton` 5 rows
- [ ] Table empty (with filters): "No orders match filters" EmptyState + "Clear Filters" action
- [ ] Table empty (no orders): "No orders yet" EmptyState + "Create Order" action
- [x] Write `apps/dashboard/src/app/(dashboard)/orders/[id].tsx` — calls `useGetOrder(id)`
- [ ] Write `screens/Orders/OrderDetailScreen.tsx` — metadata, items table, total, status actions
- [ ] Write `screens/Orders/OrderStatusActions.tsx` — renders action buttons from `getAvailableActions(status)`, confirmation Modal
- [ ] Write `screens/Orders/NewOrderDrawer.tsx` — CustomerSelector + ItemSelector + notes + total
- [ ] Write `screens/Orders/CustomerSelector.tsx` — search dropdown (useListCustomers debounced) + "Walk-in" option + "New Customer" link
- [ ] Write `screens/Orders/ItemSelector.tsx` — grouped by category, +/- qty controls, running subtotal
- [x] NewOrderDrawer submit: calls `useCreateOrder`, success → toast + navigate to order detail
- [ ] Order detail 404 error state: ErrorState with back link

## CRM Page

- [x] Write `apps/dashboard/src/app/(dashboard)/crm/index.tsx`
- [ ] Write `screens/CRM/CRMScreen.tsx` — SearchInput + CustomersTable + "Add Customer" button
- [ ] Write `screens/CRM/CustomersTable.tsx` — Name, Email, Orders (count), Total Spend, Last Order
- [ ] Write `screens/CRM/CustomerFormModal.tsx` — create/edit form (name required, email optional, phone optional)
- [x] Write `apps/dashboard/src/app/(dashboard)/crm/[id].tsx`
- [ ] Write `screens/CRM/CustomerDetailScreen.tsx` — header + StatsStrip + RecentOrders table + "View All Orders" link
- [ ] Write `screens/CRM/CustomerStatsStrip.tsx` — Total Orders | Total Spend | Member Since | Last Order
- [ ] CRM list empty state: EmptyState with "Add Customer"
- [x] Customer detail 404: ErrorState

## Menu Page

- [x] Write `apps/dashboard/src/app/(dashboard)/menu/index.tsx`
- [ ] Write `screens/Menu/MenuScreen.tsx` — CategoryTabs + MenuItemGrid + "Add Item" + "Add Category" buttons
- [ ] Write `screens/Menu/MenuItemGrid.tsx` — grid of MenuItemCards, filter by active category tab
- [ ] Write `screens/Menu/MenuItemCard.tsx` — image placeholder, name, price, availability Badge, Edit button
- [ ] Write `screens/Menu/MenuItemDrawer.tsx` — form (category, name, description, price, availability, image URL) + Delete with confirmation
- [ ] Write `screens/Menu/CategoryFormModal.tsx` — small modal (name, sort_order)
- [ ] Menu loading: `SkeletonCard` grid
- [ ] Menu empty: EmptyState per category
- [ ] Unavailable items: dimmed styling + "Unavailable" Badge

## Settings Page

- [x] Write `apps/dashboard/src/app/(dashboard)/settings.tsx`
- [ ] Write `screens/Settings/SettingsScreen.tsx` — section layout
- [ ] Write `screens/Settings/SettingsForm.tsx` — controlled form fields, dirty detection, Save button
- [ ] Write `screens/Settings/OpeningHoursGrid.tsx` — 7 rows (Mon–Sun), each with open/close time + closed toggle
- [ ] Settings loading: SkeletonText placeholders for each field
- [ ] Settings dirty banner: "You have unsaved changes"
- [ ] Save success: toast; save error: inline error banner

## Global / Cross-Cutting

- [ ] Density toggle in dashboard header — icon button cycling comfortable/balanced/compact
- [ ] Theme toggle in dashboard header (or accessible from Settings)
- [x] Verify: all pages handle API error (mock error, verify ErrorState + retry works)
- [ ] Verify: all pages handle empty data (run without seed, verify EmptyState renders)

## Verification

- [x] `pnpm dev:dashboard` — all 5 pages load in Expo web
- [x] `/ui-library` accessible from nav (dev section in Sidebar)
- [x] Selecting status filter on Orders page → URL `?status=pending` updates, table filters
- [x] Refreshing Orders page with `?status=pending` → filter still applied
- [x] Creating an order → success toast, redirects to order detail
- [x] Accepting a pending order → status badge changes to "Accepted"
- [x] `pnpm --filter=dashboard typecheck` — zero errors
