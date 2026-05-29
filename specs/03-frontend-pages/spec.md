# Spec 03 — Frontend Pages

## What

Build the five dashboard pages (Home, Orders, CRM, Menu, Settings) as fully interactive screens with real data from the generated API hooks, proper loading/empty/error states, and consistent use of the design system primitives.

## Why

The pages are the user-facing proof that the entire stack works end-to-end. They must demonstrate not just that data fetches, but that the UI handles every state gracefully, edit flows are smooth, and the product feels like a real internal operations tool — not a prototype.

---

## App Structure

Using Expo Router (file-based routing):

```
apps/dashboard/src/app/
├── _layout.tsx              # Root layout: ThemeProvider + DensityProvider + QueryClientProvider + ToastContainer
├── (dashboard)/
│   ├── _layout.tsx          # Dashboard shell: Sidebar + main content area
│   ├── index.tsx            # Home page (redirects to /home or is the home)
│   ├── home.tsx             # Home / KPI overview
│   ├── orders/
│   │   ├── index.tsx        # Orders list
│   │   └── [id].tsx         # Order detail
│   ├── crm/
│   │   ├── index.tsx        # Customer list
│   │   └── [id].tsx         # Customer detail
│   ├── menu/
│   │   └── index.tsx        # Menu management
│   └── settings.tsx         # Settings
├── ui-library.tsx           # UI Library (spec 01)
└── +not-found.tsx
```

---

## Shared Screen Architecture

Every page follows the same pattern:

```
Page component (screen)
  └── usePageData() hook       ← data fetching + derived state
  └── PageHeader component     ← title, breadcrumb, actions
  └── Content components       ← presentational, receive data as props
       └── Loading state       ← skeleton while fetching
       └── Error state         ← error message + retry
       └── Empty state         ← when list is empty
       └── Data state          ← actual content
```

**Rule**: No `useListOrders()` or similar hooks inside presentational components. All API hooks are called in page-level components or dedicated `useXxxPage()` hooks.

---

## Page 1: Home (`/home`)

### Purpose
KPI overview for the restaurant operator. Answers "how are we doing today?"

### Layout
- 4 KPI cards across the top (2×2 on mobile).
- "Recent Orders" table below (last 10 orders).
- "Popular Items" list on the right (or below on narrow screens).

### KPI Cards
| Metric | Value | Trend |
|---|---|---|
| Total Orders (today) | count | vs yesterday (from API) |
| Revenue (today) | formatted currency | vs yesterday (from API) |
| Pending Orders | count | — (action indicator) |
| Popular Items | top item name | — |

### Data source

**Single hook** — all Home page data comes from one API call:

`useGetHomeSummary()` → `HomeSummary` (see spec 02):

```ts
{
  total_orders_today:      number;
  total_orders_yesterday:  number;   // used to compute KPI trend arrows
  revenue_today_cents:     number;
  revenue_yesterday_cents: number;   // used to compute KPI trend arrows
  pending_orders:          number;
  popular_items:           { name: string; quantity_sold: number }[];
  recent_orders:           OrderSummary[];  // last 10 orders — powers Recent Orders table
}
```

**Do not** make a separate `useListOrders()` call on the Home page. The Recent Orders table renders `recent_orders` from the summary response.

**KPI trend display**: `KPICard` computes trend direction by comparing today vs yesterday values from the API (e.g. orders up 20% → green up arrow). No additional API call needed.

### States
- Loading: KPI cards show `SkeletonCard`, table shows `TableSkeleton`.
- Error: `ErrorState` with retry.
- Empty (no orders ever): `EmptyState` with "Create your first order" CTA.

---

## Page 2: Orders (`/orders`)

### Purpose
List and manage all orders. The operator's primary operational screen.

### Layout
- `PageHeader` with title "Orders" and "New Order" button (opens Drawer).
- Filter bar: status filter chips + date range picker + search by customer name.
- Orders table with columns: Order #, Customer, Items, Total, Status (Badge), Created At, Actions.
- Clicking a row opens the Order Detail view (sub-route `/orders/[id]`).

### URL State (query params)
All filter state is synced to URL:
- `?status=pending,accepted` (comma-separated)
- `?date_from=2024-01-01&date_to=2024-01-31`
- `?search=john`
- `?page=2`

On page load, URL params are parsed and used to initialize filter state. Changing filters updates the URL (no hard navigation).

### Order Detail (`/orders/[id]`)
- Back link to orders list.
- Order metadata: ID, created, status badge, customer name (or "Walk-in").
- Order items table: item name, qty, unit price, line total.
- Order total.
- Status action bar: shows available next statuses as action buttons (from `VALID_TRANSITIONS`).
  - E.g., for `pending` order: "Accept Order" + "Cancel Order" buttons.
  - On click: opens confirmation Modal, then calls `useUpdateOrderStatus` mutation.
- Notes field (read-only on detail view).

### New Order Drawer
Opens from "New Order" button. Contains:
- Customer selector: search-as-you-type dropdown to find existing customer, or "Walk-in" option.
- "Or create new customer" inline link (opens nested Modal with customer create form).
- Item selector: list of available menu items with +/- quantity controls. Items are grouped by category.
- Order summary panel: running subtotal, item count.
- Notes textarea.
- "Place Order" button (disabled until ≥1 item). Calls `useCreateOrder`. On success: closes Drawer, shows success Toast, navigates to new order detail.

### States
- Orders table loading: `TableSkeleton` with 5 rows.
- Orders table empty (no results for filters): `EmptyState` "No orders match your filters" with "Clear Filters" button.
- Orders table empty (no orders at all): `EmptyState` "No orders yet" with "Create First Order" button.
- Order detail loading: skeleton layout.
- Order detail error (404): `ErrorState` "Order not found" with back link.
- Status mutation loading: action buttons show spinner, disabled.

---

## Page 3: CRM (`/crm`)

### Purpose
View customer directory with order history and spend data.

### Layout
- `PageHeader` with title "Customers" and "Add Customer" button (opens Modal).
- `SearchInput` for filtering by name/email/phone.
- Customers table with columns: Name, Email, Phone, Orders, Total Spend, Last Order.
- Clicking a row navigates to Customer Detail (`/crm/[id]`).

### Customer Detail (`/crm/[id]`)
- Back link.
- Customer header: name, email, phone, edit button (opens Edit Modal).
- Stats strip: Total Orders | Total Spend | First Order | Last Order.
- Recent Orders table: last 5 orders (Order #, Date, Status, Total).
  - "View All Orders" link → navigates to `/orders?customer_id=X`.

### Add/Edit Customer Modal
- Fields: Name (required), Email (optional), Phone (optional).
- Validation: name min 1 char; email format check; phone max 30 chars.
- Submit calls `useCreateCustomer` or `useUpdateCustomer`.
- On success: close modal, show toast, refresh customer list.

### States
- Table loading: `TableSkeleton`.
- Table empty: `EmptyState` "No customers yet" with "Add Customer" button.
- Customer detail loading: skeleton.
- Customer detail error (404): `ErrorState`.

---

## Page 4: Menu (`/menu`)

### Purpose
Manage menu categories and items.

### Layout
- `PageHeader` with "Menu" title.
- Category tabs (`TabBar`) across the top: one tab per category + "All" tab.
- Grid/list of menu items for selected category (or all items).
- Each item card shows: image (or placeholder), name, description snippet, price, availability badge, Edit button.
- "Add Item" button in header (opens Drawer).
- "Add Category" button in header (opens small Modal).

### Menu Item Drawer (Add / Edit)
Right-side Drawer. Form fields:
- Category (Select, required).
- Name (Input, required, max 200).
- Description (TextArea, optional, max 500).
- Price (Input, numeric, in dollars — converted to cents on submit).
- Availability (Toggle switch).
- Image URL (Input, optional).
- Save button. Calls `useCreateMenuItem` or `useUpdateMenuItem`.
- Delete button (edit mode only) — opens confirmation Modal before calling delete.

### Add Category Modal
Small modal. Fields:
- Category name (required).
- Sort order (number, optional).
- Save calls `useCreateCategory`.

### States
- Items loading: grid of `SkeletonCard` components.
- Items empty for category: `EmptyState` "No items in this category" with "Add Item" button.
- Unavailable items shown with dimmed styling + "Unavailable" badge.

---

## Page 5: Settings (`/settings`)

### Purpose
Configure restaurant-level operational settings.

### Layout
- `PageHeader` with "Settings".
- Settings form (no separate edit modal — inline edit with Save button at bottom).
- Sections:
  1. **Restaurant Info**: name field.
  2. **Order Handling**: prep time (minutes), auto-accept toggle.
  3. **Availability**: service available toggle, delivery available toggle.
  4. **Opening Hours**: 7-day grid (Mon–Sun), each row has open/close time inputs + closed toggle.

### Behavior
- Form loads current settings via `useGetSettings()`.
- All fields are editable inline.
- "Save Changes" button at bottom. Calls `useUpdateSettings` mutation.
- On success: success Toast.
- On error: inline error banner.
- Unsaved changes indicator: if form is dirty (changed from loaded values), show subtle banner "You have unsaved changes".

### States
- Loading: form fields show `SkeletonText` placeholders.
- Error loading: `ErrorState` with retry.
- Saving: "Save Changes" button shows spinner.

---

## Cross-Page Patterns

### Navigation (Sidebar)
- Items: Home, Orders, CRM, Menu, Settings, divider, UI Library (dev only).
- Active item highlighted with `primary` color left border + `primarySubtle` background.
- Sidebar collapses to icon-only on narrow screens.

### Empty State Pattern
```tsx
<EmptyState
  icon={ShoppingCartIcon}
  title="No orders yet"
  subtitle="Orders you create will appear here."
  action={{ label: 'Create Order', onPress: openNewOrderDrawer }}
/>
```

### Error State Pattern
```tsx
<ErrorState
  message="Failed to load orders"
  onRetry={() => refetch()}
/>
```

### Loading Pattern (tables)
```tsx
{isLoading ? <TableSkeleton rows={5} /> : <DataTable columns={columns} data={data} />}
```

### Confirmation Modal Pattern
Used for destructive actions (cancel order, delete menu item):
```tsx
<Modal open={open} title="Cancel Order?" size="sm">
  <Text>This action cannot be undone.</Text>
  <ModalFooter>
    <Button variant="ghost" onPress={close}>Keep Order</Button>
    <Button variant="danger" loading={isLoading} onPress={confirm}>Cancel Order</Button>
  </ModalFooter>
</Modal>
```

### Density Toggle
A small control in the dashboard header (icon button) that cycles through density levels and persists to `localStorage` on web.

---

## Acceptance Criteria

### Home
- [ ] KPI cards display correct values from `useGetHomeSummary()` (single API call).
- [ ] KPI trend arrows compare today vs yesterday fields from API.
- [ ] Recent Orders table renders `recent_orders` from summary (no separate list call).
- [ ] Loading state shows skeleton cards.
- [ ] Empty state shown when no orders exist.

### Orders
- [ ] Filter by status updates the table and the URL query param.
- [ ] Refreshing the page with `?status=pending` in URL restores the filter.
- [ ] Order detail shows correct items and totals.
- [ ] Accepting a pending order (click "Accept", confirm) → order status updates to `accepted`.
- [ ] Cancelling a completed order → action button not shown (no valid transition).
- [ ] New Order Drawer: adding items updates running subtotal.
- [ ] New Order Drawer: submitting places order and shows success toast.
- [ ] New Order Drawer: adding an item that is unavailable — should not be selectable (filtered from list).

### CRM
- [ ] Customer list shows `order_count` and `total_spend_cents` formatted.
- [ ] Search by name filters the list.
- [ ] Customer detail shows last 5 orders.
- [ ] "View All Orders" link navigates to `/orders?customer_id=X`.

### Menu
- [ ] Category tabs filter items correctly.
- [ ] "All" tab shows all items.
- [ ] Adding a new item via Drawer → item appears in list.
- [ ] Toggling availability in edit Drawer → item shows "Unavailable" badge.
- [ ] Deleting an item with confirmation → item removed from list.

### Settings
- [ ] Settings form pre-fills with current API values.
- [ ] Dirty state indicator shows when form is changed.
- [ ] Saving shows spinner, then success toast on success.
- [ ] Opening hours grid is editable per day.

### Global
- [ ] All pages have correct empty states (with no seed data: delete seed and verify).
- [ ] All pages handle API errors gracefully (retry button works).
- [ ] Theme toggle (in header or settings) switches Light/Dark across all pages.
- [ ] Density toggle changes visible spacing in tables.
