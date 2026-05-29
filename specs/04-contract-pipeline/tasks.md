# Tasks 04 — Contract Generation Pipeline

## `packages/types`

- [x] Write `packages/types/src/index.ts`:
  - [x] `OrderStatus` union type (7 values)
  - [x] `ORDER_STATUS_LABELS` display map
  - [x] `VALID_TRANSITIONS` map (for frontend use)
  - [x] `DensityLevel` type (`'comfortable' | 'balanced' | 'compact'`)
- [x] `pnpm --filter=types typecheck` — zero errors

## Backend OpenAPI Export

- [x] Write `services/backend/src/openapi-export.ts` — calls `app.getOpenAPIDocument()`, writes `openapi.json` to workspace root
- [x] Add `"build:openapi": "tsx src/openapi-export.ts"` to `services/backend/package.json`
- [x] Test: `pnpm --filter=backend run build:openapi` → `openapi.json` written to workspace root
- [ ] Verify `openapi.json` validates as OpenAPI 3.0 (use `swagger-cli validate` or equivalent)
- [x] Confirm all route tags are present in the spec (health, categories, menu-items, customers, orders, settings, home)
- [x] Confirm all operationIds are unique and match naming convention

## `packages/api-client` Setup

- [x] Install `orval` as dev dependency in `packages/api-client`
- [x] Write `packages/api-client/orval.config.ts` — tags-split, react-query, fetch, custom mutator
- [x] Write `packages/api-client/src/customFetch.ts` — reads `EXPO_PUBLIC_API_BASE_URL`, adds Content-Type, throws `ApiClientError` on non-ok
- [x] Write `packages/api-client/src/index.ts` — barrel re-export from `generated/` sub-paths + `customFetch`
- [x] Update `.gitignore` to exclude `packages/api-client/src/generated/`

## Code Generation

- [x] Run `pnpm gen:contract` from workspace root — succeeds end-to-end
- [x] Verify `packages/api-client/src/generated/endpoints/orders.ts` exists and exports:
  - [x] `useListOrders` (query hook)
  - [x] `useCreateOrder` (mutation hook)
  - [x] `useGetOrder` (query hook)
  - [x] `useUpdateOrderStatus` (mutation hook)
- [x] Verify `packages/api-client/src/generated/endpoints/customers.ts` exports `useListCustomers`, `useGetCustomer`, `useCreateCustomer`
- [x] Verify `packages/api-client/src/generated/endpoints/menuItems.ts` exports `useListMenuItems`, `useCreateMenuItem`, `useUpdateMenuItem`
- [x] Verify `packages/api-client/src/generated/endpoints/settings.ts` exports `useGetSettings`, `useUpdateSettings`
- [x] Verify `packages/api-client/src/generated/endpoints/home.ts` exports `useGetHomeSummary`
- [x] Verify `packages/api-client/src/generated/model/` contains typed interfaces (order.ts, customer.ts, menuItem.ts, …)
- [x] `OrderDetail` type has `status` typed as the 7-value union, not plain `string`

## Root Script Wiring

- [x] Root `package.json` `"gen:contract"` script calls `build:openapi` → `orval` → `typecheck` in sequence
- [x] `pnpm gen:contract` run twice produces identical typecheck result (idempotent)

## Dashboard Integration Check

- [x] Verify `apps/dashboard` `package.json` lists `packages/api-client` as workspace dependency
- [x] Search `apps/dashboard/src/` for any manually declared API response types — should find zero
- [x] Verify no `import ... from 'services/backend'` or `../../services/` in dashboard source

## Verification

- [x] `pnpm gen:contract` — end-to-end success
- [x] `pnpm --filter=api-client typecheck` — zero errors post-generation
- [x] `packages/api-client/src/generated/` does not appear in `git status`
- [x] `openapi.json` does not appear in `git status` (gitignored)
