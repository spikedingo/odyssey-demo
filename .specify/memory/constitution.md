# Architecture Constitution — Odyssey Restaurant Dashboard

This document is the source of truth for architectural decisions, constraints, and engineering discipline across all specs and implementation. All contributors (human and AI) must follow these rules. Violations are bugs, not style preferences.

---

## 1. Non-Negotiable Architecture: The Contract Pipeline

The entire type system flows in one direction. This is not optional.

```
Drizzle schema
  ↓  (drizzle-zod infers Zod schemas from table definitions)
drizzle-zod validators
  ↓  (Hono routes register OpenAPI operations using those validators)
Hono/OpenAPI spec (openapi.json)
  ↓  (Orval reads the spec and generates typed client + React Query hooks)
packages/api-client  (generated — DO NOT HAND-EDIT)
  ↓
apps/dashboard (consumes only generated types and hooks)
```

**Rule**: If a type or shape exists in the backend, it must not be manually re-created in the frontend. The only acceptable source of frontend API types is the Orval-generated output in `packages/api-client`.

---

## 2. Package Dependency Direction

```
apps/dashboard
  → packages/api-client   (generated hooks + types from Orval)
  → packages/ui           (shared UI primitives)
  → packages/shared       (non-API utility code)
  → packages/types        (shared non-generated types, e.g. enums used before generation)

services/backend
  → packages/shared
  → packages/types

packages/api-client       (generated — depends on packages/types for base types only)
packages/ui               → packages/shared
packages/shared           (no internal package dependencies)
packages/types            (no internal package dependencies)
```

**Rule**: No circular dependencies. `apps` may depend on `packages`. `packages` may depend on each other only along the direction above. `services` never depends on `apps`.

---

## 3. Type Safety Discipline

- All Drizzle table columns must have explicit types; no `any` in schema files.
- All Hono route handlers must declare typed request/response shapes via drizzle-zod-derived Zod schemas.
- `zod.infer<typeof Schema>` is the only acceptable way to derive TypeScript types from Zod schemas. No `as unknown as T` casts.
- The frontend must import response types only from `packages/api-client` or `packages/types`. Never from `services/backend`.
- `noImplicitAny`, `strictNullChecks`, and `strict: true` are enabled across all tsconfig files.

---

## 4. Layering Rules

### Backend (`services/backend`)
- Route handler: validates input (Zod) → calls service function → returns typed response.
- Service layer: contains business logic (state machine transitions, total verification, availability checks).
- Route handlers must not contain business logic directly.
- Schema file: defines Drizzle tables only. No business logic.

### Frontend (`apps/dashboard`)
- Screen/page components: layout + orchestration only. Render presentational components, call hooks.
- Custom hooks / query hooks: data fetching, mutation, derived state. No JSX.
- Presentational components (`packages/ui`): receive typed props, render UI. No direct API calls.
- Business logic (e.g. derived status labels, transition rules for display) lives in hooks or utility functions, not in page components.

---

## 5. The AVOID List

The following patterns are forbidden. If you find one in the codebase, treat it as a bug.

| Pattern | Why forbidden |
|---|---|
| Handwritten TypeScript DTOs mirroring backend response shapes | Types must come from generated code |
| Duplicated status/enum types in frontend and backend | Single source for wire shapes: Drizzle → Orval. `packages/types` holds UI-only constants (`ORDER_STATUS_LABELS`, `VALID_TRANSITIONS`) that OpenAPI cannot express — must stay in sync with Drizzle `pgEnum` (see spec 04) |
| `fetch()` called directly in page/screen components as the main pattern | All data fetching goes through generated React Query hooks |
| Hand-editing files in `packages/api-client` | This directory is generated; edits will be overwritten |
| Business logic inside `Screen` or `Page` components | Belongs in service layer (backend) or hooks (frontend) |
| `any` type in TypeScript | Use `unknown` with type guards if shape is truly unknown |
| Env secrets committed to source | All secrets go in `.env` (gitignored); `.env.example` documents keys |
| Skipping server-side total verification | Client-provided totals are not trusted; backend always recalculates |
| Allowing arbitrary order status jumps | All transitions go through the state machine enforced in the service layer |

---

## 6. Order State Machine (Canonical Reference)

The only valid order status values and transitions:

```
pending
  → accepted   (restaurant accepts the order)
  → cancelled  (from pending only — auto-reject path)

accepted
  → preparing
  → cancelled

preparing
  → ready

ready
  → out_for_delivery
  → completed   (dine-in / pickup path)

out_for_delivery
  → completed

completed   ← terminal state, no transitions
cancelled   ← terminal state, no transitions
```

Attempting any other transition returns HTTP 422 with a typed error body.

---

## 7. Financial Calculation Rules

- All monetary values are stored as integers in **cents** (e.g. $12.50 → 1250).
- `subtotal = Σ(item.unit_price_cents × item.quantity)` — computed server-side on order creation.
- `total = subtotal` (no tax, no service charge in v1).
- If the client submits a `total` value in the order payload, the server verifies it matches the computed value; mismatch returns HTTP 422.
- UI displays values divided by 100 with currency formatting; it never stores or sends float dollars.

---

## 8. Generated Code Policy

- `packages/api-client/src/` is fully generated by Orval. The directory must contain a `.gitkeep` or README noting it is generated.
- Running `pnpm gen:contract` from the workspace root must regenerate all generated artifacts idempotently.
- The CI/CD pipeline (or local pre-commit hook) should verify that `packages/api-client` is up to date relative to the OpenAPI spec.

---

## 9. Environment Variable Convention

| Variable | Location | Description |
|---|---|---|
| `DATABASE_URL` | `services/backend/.env` | Postgres connection string |
| `EXPO_PUBLIC_API_BASE_URL` | `apps/dashboard/.env` | Base URL for backend API (Expo public env var) |
| `CLOUDFLARE_ACCOUNT_ID` | CI / `.env.deploy` | For `wrangler` deployments |
| `CLOUDFLARE_API_TOKEN` | CI / `.env.deploy` | For `wrangler` deployments |

All `.env` files are gitignored. `.env.example` files are committed and document every required key with placeholder values.

---

## 10. Seed Data Contract

A `pnpm seed` command (delegated to `services/backend`) must:
1. Be idempotent (safe to run multiple times; uses upsert or truncate+insert).
2. Produce enough data to make every dashboard page non-empty: ≥3 categories, ≥12 menu items, ≥8 customers, ≥20 orders spread across all status values and at least 14 days of timestamps.
3. Be runnable independently of the full dev stack (only needs `DATABASE_URL`).
