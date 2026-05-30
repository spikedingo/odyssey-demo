# Setup Guide — Fresh Clone to Running App

This document describes everything required to clone this repository on a new machine, run the full stack locally, and load the same demo data shown in the dashboard today.

**Automated setup:** In Cursor, invoke the **odyssey-local-setup** skill (`.cursor/skills/odyssey-local-setup/SKILL.md`) or run `pnpm setup:local`. The skill handles install, database, seed, contract generation, verification, and starting dev servers—with automated troubleshooting on failure.

**Last verified:** 2026-05-30 (against `pnpm seed`, `pnpm gen:contract`, and live API responses on port 8787).

---

## Overview

Odyssey is a pnpm + Turborepo monorepo:

| Component | Path | Dev URL |
|---|---|---|
| Backend API | `services/backend` | http://localhost:8787 |
| Dashboard (Expo Web) | `apps/dashboard` | http://localhost:8081 |
| Design system | `packages/ui` | — |
| Generated API client | `packages/api-client` | generated at setup time |

**Data source of truth:** `services/backend/src/db/seed.ts`.  
Run `pnpm seed` after migrations to get deterministic demo data. The seed is **idempotent** — it truncates tables and resets auto-increment IDs, so re-running it restores the canonical dataset.

---

## Prerequisites

Install these before cloning:

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | 20+ | Runtime for all packages |
| **pnpm** | 9+ (repo pins `9.15.0`) | Package manager / workspace |
| **Docker Desktop** | latest | Local Postgres (default path) |

Enable Corepack (recommended) so pnpm matches the repo:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

Verify:

```bash
node -v    # v20.x or higher
pnpm -v    # 9.x
docker -v  # if using Docker Postgres
```

### Alternative: Neon (cloud Postgres)

If you prefer not to run Docker, create a free Postgres instance at [neon.tech](https://neon.tech) and use its connection string instead. See [Database options](#database-options) below.

---

## Step-by-Step Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url> odyssey-demo
cd odyssey-demo
pnpm install
```

### 2. Create environment files

`.env` files are **gitignored** and are not included in the repo. Copy the examples:

```bash
cp services/backend/.env.example services/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env
```

| File | Variable | Default | Notes |
|---|---|---|---|
| `services/backend/.env` | `DATABASE_URL` | `postgresql://odyssey:odyssey@localhost:5432/odyssey` | Postgres connection |
| `services/backend/.env` | `NODE_ENV` | `development` | — |
| `apps/dashboard/.env` | `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:8787` | **Do not** append `/api/v1` — hooks add the prefix |

### 3. Start Postgres

**Option A — Docker (default, recommended for local dev):**

```bash
pnpm db:up
```

This starts Postgres 16 via `docker-compose.yml`:

- Host: `localhost:5432`
- Database: `odyssey`
- User / password: `odyssey` / `odyssey`

Wait until the container is healthy before migrating:

```bash
docker compose ps
```

**Option B — Neon (skip Docker):**

1. Create a Neon project and copy the connection string.
2. Set in `services/backend/.env`:
   ```
   DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require
   ```
3. Skip `pnpm db:up`.

### 4. Apply migrations

```bash
pnpm db:migrate
```

Migrations live in `services/backend/drizzle/` (currently `0000_*.sql` and `0001_*.sql`).

### 5. Load demo data (required for dashboard content)

```bash
pnpm seed
```

This command:

1. Runs migrations first (Turbo dependency).
2. Truncates all business tables with `RESTART IDENTITY`.
3. Inserts the canonical demo dataset (see [Expected seed data](#expected-seed-data) below).

You can safely re-run `pnpm seed` at any time to reset the database to the same baseline.

### 6. Generate the API client (required — not in git)

These paths are **gitignored** and do not exist after clone:

- `openapi.json` (repo root)
- `packages/api-client/src/generated/`

Generate them:

```bash
pnpm gen:contract
```

This runs: backend OpenAPI export → Orval code generation → api-client typecheck.

> **Without this step, the dashboard will fail to compile** because it imports `@odyssey/api-client` hooks from the generated folder.

### 7. Start the dev servers (two terminals)

**Terminal 1 — Backend:**

```bash
pnpm dev:backend
```

Verify: http://localhost:8787/health → `{"status":"ok",...}`

**Terminal 2 — Dashboard:**

```bash
pnpm dev:dashboard
```

Open http://localhost:8081 in your browser.

Navigate via the sidebar: **Home**, **Orders**, **CRM**, **Menu**, **Settings**, and `/ui-library`.

---

## Expected Seed Data

After `pnpm seed`, the database contains:

| Entity | Count | Details |
|---|---|---|
| Restaurant settings | 1 | Name: **Sakura Garden**, prep time 20 min |
| Categories | 3 | Starters, Mains, Drinks |
| Menu items | 12 | See table below |
| Customers | 8 | Alice Chen … Henry Davis |
| Orders | 20 | Cycling through all 7 statuses |

### Menu items (stable IDs after seed)

| ID | Name | Price | Available |
|---|---|---|---|
| 1 | Edamame | $6.50 | yes |
| 2 | Gyoza | $9.50 | yes |
| 3 | Miso Soup | $4.50 | yes |
| 4 | Seaweed Salad | $7.50 | **no** (used for 422 tests) |
| 5 | Salmon Teriyaki | $24.50 | yes |
| 6 | Chicken Katsu | $18.50 | yes |
| 7 | Beef Ramen | $16.50 | yes |
| 8 | Vegetable Curry | $14.50 | yes |
| 9 | Green Tea | $3.50 | yes |
| 10 | Sake Flight | $18.00 | yes |
| 11 | Yuzu Soda | $5.50 | yes |
| 12 | Matcha Latte | $6.50 | yes |

### Orders (stable IDs and statuses after seed)

| ID | Status | Customer |
|---|---|---|
| 1 | pending | (guest) |
| 2 | accepted | Bob Martinez |
| 3 | preparing | Carol Williams |
| 4 | ready | David Kim |
| 5 | out_for_delivery | Eva Johnson |
| 6 | completed | (guest) |
| 7 | cancelled | Grace Park |
| 8 | pending | Henry Davis |
| 9 | accepted | Alice Chen |
| 10 | preparing | Bob Martinez |
| 11 | ready | (guest) |
| 12 | out_for_delivery | David Kim |
| 13 | completed | Eva Johnson |
| 14 | cancelled | Frank Lopez |
| 15 | pending | Grace Park |
| 16 | accepted | (guest) |
| 17 | preparing | Alice Chen |
| 18 | ready | Bob Martinez |
| 19 | out_for_delivery | Carol Williams |
| 20 | completed | David Kim |

### Home page KPIs (after fresh seed)

Order timestamps are computed relative to **when you run seed** (`Date.now()`). Absolute dates shift, but the relative pattern is stable:

- **Pending orders:** 3 (orders 1, 8, 15)
- **Recent orders table:** 10 most recent orders
- **Popular items:** derived from all 20 seeded orders
- **Today / yesterday KPIs:** 1 order each on the seed day and the prior day (orders 1 and 2)

If you have modified data through the UI or API, run `pnpm seed` again to match the canonical demo state.

---

## Verification Checklist

Run these after setup to confirm everything works:

### Health and data

```bash
# Backend health
curl -s http://localhost:8787/health

# Home summary (should return KPIs and 10 recent orders)
curl -s http://localhost:8787/api/v1/home/summary | python3 -m json.tool

# Settings (restaurant name should be "Sakura Garden")
curl -s http://localhost:8787/api/v1/settings | python3 -m json.tool
```

### Business rules (optional smoke test)

```bash
BASE=http://localhost:8787/api/v1

# Unavailable item → 422 ITEM_UNAVAILABLE
curl -s -X POST $BASE/orders \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"menu_item_id":4,"quantity":1}],"total_cents":750}'

# Accept pending order 15 → 200
curl -s -X PATCH $BASE/orders/15/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"accepted"}'
```

After the PATCH test, re-seed to restore order 15 to `pending`:

```bash
pnpm seed
```

### Frontend smoke test

1. **Home** — KPI cards populated; revenue calendar visible; recent orders clickable.
2. **Orders** — 20 orders listed; status filter updates URL (`?status=pending`).
3. **CRM** — 8 customers; search filters the list.
4. **Menu** — 12 items; Seaweed Salad shown as unavailable.
5. **Settings** — Restaurant name "Sakura Garden"; save shows toast.

### Automated checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```

For backend tests, create the test database first:

```bash
pnpm db:up
pnpm db:setup-test   # creates odyssey_test
pnpm test:backend    # 9 Vitest tests
pnpm test:frontend   # 6 Jest tests
```

---

## Files Not Committed (Generated / Local Only)

Ensure these stay out of git (already listed in `.gitignore`):

| Path | How to create |
|---|---|
| `services/backend/.env` | Copy from `.env.example` |
| `apps/dashboard/.env` | Copy from `.env.example` |
| `openapi.json` | `pnpm gen:contract` |
| `packages/api-client/src/generated/` | `pnpm gen:contract` |
| `node_modules/` | `pnpm install` |
| `.wrangler/`, `.turbo/`, `dist/` | Created during dev/build |

When preparing the repo for submission, confirm:

```bash
git status
# .env, openapi.json, and packages/api-client/src/generated/ should NOT appear
```

---

## Troubleshooting

### Port 5432 already in use

```bash
lsof -i :5432
```

Options: stop the conflicting service, use Neon instead, or change the port mapping in `docker-compose.yml` (and update `DATABASE_URL` accordingly).

### Port 8787 already in use

```bash
lsof -i :8787
kill <PID>
```

Or run the backend on another port and update `EXPO_PUBLIC_API_BASE_URL` in `apps/dashboard/.env`.

### Dashboard blank or TypeScript errors about missing hooks

You likely skipped contract generation:

```bash
pnpm gen:contract
```

Then restart `pnpm dev:dashboard`.

### API returns 404

Business routes are under **`/api/v1/*`**, not the root path.  
OpenAPI spec (when backend is running): http://localhost:8787/api/openapi.json

### `pnpm test:backend` fails

```bash
pnpm db:up
pnpm db:setup-test
pnpm test:backend
```

Test DB URL (default): `postgresql://odyssey:odyssey@localhost:5432/odyssey_test`

### Docker Postgres unhealthy

```bash
docker compose logs postgres
pnpm db:down && pnpm db:up
# wait for healthcheck, then:
pnpm db:migrate && pnpm seed
```

### Regenerate contracts after API changes

When backend routes or Zod schemas change:

```bash
pnpm gen:contract
```

Restart the dashboard dev server if hook signatures changed.

---

## Quick Reference — Root Scripts

| Command | Description |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm db:up` / `pnpm db:down` | Start/stop Docker Postgres |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm seed` | Reset and load demo data (idempotent) |
| `pnpm gen:contract` | Export OpenAPI + generate API client |
| `pnpm dev:backend` | Hono/Wrangler dev server (:8787) |
| `pnpm dev:dashboard` | Expo Web dashboard (:8081) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality gates |
| `pnpm db:setup-test` | Create `odyssey_test` for Vitest |

---

## Minimum Command Sequence (Copy-Paste)

For a reviewer cloning the repo for the first time:

```bash
git clone <your-repo-url> odyssey-demo && cd odyssey-demo

pnpm install
cp services/backend/.env.example services/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env

pnpm db:up
pnpm db:migrate
pnpm seed
pnpm gen:contract

# Terminal 1
pnpm dev:backend

# Terminal 2
pnpm dev:dashboard
# → open http://localhost:8081
```

This produces the same demo dataset (IDs, menu, customers, order statuses) as a fresh seed on any machine. KPI date labels reflect the local calendar day when seed was executed.
