# Spec 06 — Deployment & Delivery

## What

Document the deployment targets, provide deployment scripts, write the local setup guide, explain architecture decisions, note tradeoffs and incomplete areas, and deliver a complete README.

## Why

A project that only runs locally is harder to evaluate. Clear deployment documentation demonstrates production readiness thinking. Architecture decision notes and honest tradeoff documentation show engineering maturity — that the developer understood the choices, not just followed a recipe.

---

## Deployment Targets

| Component | Platform | Method |
|---|---|---|
| `services/backend` | Cloudflare Workers | `wrangler deploy` |
| `apps/dashboard` (web build) | Cloudflare Pages | `wrangler pages deploy` |
| Database | Neon (cloud Postgres) | Neon console / connection string swap |

> Scope: This spec covers deployment documentation and scripts. Actual deployment is optional — the primary deliverable is a locally runnable project with clear deployment instructions.

---

## Backend Deployment (Cloudflare Workers)

### Pre-requisites
1. Cloudflare account (free tier is sufficient).
2. `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (with Workers and Pages edit permissions).
3. Neon project with a production database URL.

### `wrangler.toml` (production additions)

```toml
name = "odyssey-backend"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "production"

# Secrets (set via wrangler CLI, NOT in wrangler.toml):
# DATABASE_URL — set with: wrangler secret put DATABASE_URL
```

### Deployment steps

```bash
# 1. Set the database secret (one-time)
cd services/backend
wrangler secret put DATABASE_URL
# Paste your Neon connection string when prompted

# 2. Deploy
wrangler deploy

# 3. Run migrations against production DB
# (Drizzle-kit migrate requires direct DB access — run from local with prod DATABASE_URL)
DATABASE_URL=<neon-prod-url> pnpm db:migrate

# 4. (Optional) Seed production data
DATABASE_URL=<neon-prod-url> pnpm seed
```

### Verify
```bash
curl https://odyssey-backend.<account>.workers.dev/health
# → {"status":"ok","timestamp":"..."}
```

---

## Frontend Deployment (Cloudflare Pages)

### Build the Expo web app

```bash
cd apps/dashboard
EXPO_PUBLIC_API_BASE_URL=https://odyssey-backend.<account>.workers.dev expo export --platform web
# Outputs to dist/
```

### Deploy to Cloudflare Pages

```bash
wrangler pages deploy dist --project-name odyssey-dashboard
```

Or set up the Pages project in the Cloudflare dashboard to deploy from the `dist/` folder of the `apps/dashboard` build.

### Environment variable for Pages

In Cloudflare Pages → Settings → Environment variables:
```
EXPO_PUBLIC_API_BASE_URL = https://odyssey-backend.<account>.workers.dev
```

---

## Deployment Scripts

Add to root `package.json`:

```json
"deploy:backend":  "pnpm --filter=backend run deploy",
"deploy:frontend": "pnpm --filter=dashboard run build && wrangler pages deploy apps/dashboard/dist --project-name odyssey-dashboard",
"deploy":          "pnpm deploy:backend && pnpm deploy:frontend"
```

Add to `services/backend/package.json`:
```json
"deploy": "wrangler deploy"
```

Add to `apps/dashboard/package.json`:
```json
"deploy": "expo export --platform web && wrangler pages deploy dist --project-name odyssey-dashboard"
```

---

## Local Development Guide

Full local setup from zero:

### Prerequisites
- Node.js 20+ (`node --version`)
- pnpm 9+ (`pnpm --version`; install with `npm i -g pnpm`)
- Docker Desktop (for local Postgres)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/odyssey-demo.git
cd odyssey-demo

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp services/backend/.env.example services/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env
# .env files are pre-filled for local Docker — no changes needed for local dev

# 4. Start database
pnpm db:up
# Wait ~5 seconds for Postgres to be healthy

# 5. Run migrations
pnpm db:migrate

# 6. Seed data
pnpm seed
# Inserts 3 categories, 12 menu items, 8 customers, 20 orders

# 7. Generate API client (requires backend to be buildable)
pnpm gen:contract

# 8. Start both servers
# In terminal 1:
pnpm dev:backend    # Hono on http://localhost:8787
# In terminal 2:
pnpm dev:dashboard  # Expo web on http://localhost:8081

# 9. Open in browser
open http://localhost:8081
```

### Verify everything is working

```bash
# API health check
curl http://localhost:8787/health

# API OpenAPI spec
curl http://localhost:8787/api/openapi.json | jq '.info'

# Run all tests (ensure db:up first)
pnpm db:setup-test
pnpm test
```

---

## Architecture Decision Records

### ADR-001: Hono on Cloudflare Workers (not Node.js)
**Decision**: Use Hono framework deployed to Cloudflare Workers.

**Rationale**: Workers run at the edge, close to users. Hono is extremely lightweight (no overhead), has first-class TypeScript support, and its `@hono/zod-openapi` extension makes OpenAPI registration frictionless. The `nodejs_compat` flag resolves the `postgres` driver compatibility.

**Tradeoff**: Workers have CPU/memory limits and no persistent filesystem. Long-running operations must be avoided. Drizzle connections are ephemeral per request (acceptable for this use case).

---

### ADR-002: Drizzle ORM (not Prisma)
**Decision**: Use Drizzle ORM with the `postgres` driver.

**Rationale**: Drizzle generates minimal runtime overhead, has excellent TypeScript inference, and `drizzle-zod` provides automatic Zod schema derivation — which is the cornerstone of our contract pipeline. Prisma's generated client is too large for Workers.

**Tradeoff**: Drizzle's query builder is lower-level than Prisma. More verbose for complex queries, but appropriate for this scope.

---

### ADR-003: Orval for API client generation (not tRPC or manual)
**Decision**: Use Orval to generate React Query hooks from an OpenAPI spec.

**Rationale**: tRPC would require coupling frontend to backend code (not suitable for a Workers deployment where code can't be imported cross-service). Orval bridges the gap: backend emits a standard OpenAPI spec; Orval generates a fully typed client. This is the approach specified in the assignment.

**Tradeoff**: Generation step adds tooling complexity. The `gen:contract` script must be re-run after any API changes. Engineers must remember to do this (or CI enforces it).

---

### ADR-004: Monetary values stored as integer cents
**Decision**: All prices and totals are stored as integers representing cents (e.g., $12.50 → 1250).

**Rationale**: Floating-point arithmetic on decimals causes rounding errors. Integer cents are exact. Display layer divides by 100.

**Tradeoff**: All API consumers and display code must handle the cents↔dollars conversion. The `formatCents` utility centralizes this.

---

### ADR-005: No authentication
**Decision**: No login/auth in this implementation.

**Rationale**: The assignment is for a single-restaurant internal tool and does not specify authentication as a requirement. Adding auth (JWT, session, Privy) would consume significant time without demonstrating the core evaluation criteria.

**Tradeoff**: Not production-safe for a real deployment. Adding auth would require: an auth provider (Privy/Auth0/Clerk), protected route middleware in Hono, and a login screen in the dashboard.

---

### ADR-006: Expo Router with file-based routing
**Decision**: Use Expo Router (file-based) for dashboard navigation.

**Rationale**: Provides URL-based navigation on web (essential for filter state in URL params), works on native without code changes, and reduces navigation boilerplate. It's the standard for new Expo apps.

**Tradeoff**: Expo Router is relatively new; some edge cases in web behavior may require workarounds.

---

## Tradeoffs & Known Incomplete Areas

| Area | What's missing | Effort to add |
|---|---|---|
| Authentication | No login screen, no JWT/session, all routes public | Medium (Privy + Hono middleware + login screen) |
| Image upload for menu items | Only URL field; no file upload | Medium (Cloudflare R2 + upload UI) |
| Real-time order updates | Polling only; no WebSocket/SSE | Medium (Cloudflare Durable Objects or SSE) |
| Multi-restaurant / multi-tenant | Single `settings` row; no tenant isolation | Large (entire auth + data model redesign) |
| Mobile native testing | Expo web tested; native untested | Small (run `expo start`, test on simulator) |
| Production seed safety | `pnpm seed` truncates and re-inserts; unsafe for production with real data | Small (add a `--safe` flag that checks for existing data) |
| Pagination in UI | API supports `?page=&limit=`, frontend may not fully wire all pagination controls | Small |
| Delivery address on orders | Orders have no delivery address field | Small (add column + form field) |
| Order cancellation refund flow | No financial state tracking beyond order total | Out of scope |
| Full text search | Customer search is a SQL `ILIKE`; not full-text indexed | Small (add Postgres tsvector index) |

---

## Evaluation Criteria Mapping

Maps assignment evaluation criteria to specs for reviewer convenience:

| Assignment criterion | Primary spec(s) | How to verify |
|---|---|---|
| Fidelity to required stack | `00-foundation-monorepo`, `04-contract-pipeline` | `pnpm install`, `pnpm gen:contract`, no forbidden deps (Next.js, Prisma, tRPC) |
| Design system quality & scalability | `01-design-system-ui-library` | Visit `/ui-library`, check tokens + primitives + Light/Dark |
| Component reusability & frontend structure | `01`, `03-frontend-pages` | UI in `packages/ui`, pages use hooks not inline fetch |
| Visual polish & UX quality | `01`, `03` | Interactive flows, empty/error/loading states, Drawer/Modal |
| Backend modeling & API design | `02-backend-data-api` | Schema, state machine, service layer, OpenAPI routes |
| Type safety & contract discipline | `constitution`, `04-contract-pipeline` | No handwritten DTOs; `gen:contract` idempotent |
| End-to-end integration quality | `03`, `04` | All 5 pages backed by generated hooks + real API |
| Testing & engineering rigor | `05-testing-dx` | `pnpm test` passes backend + frontend key flows |
| Speed, focus, scope management | `06` tradeoffs table | Honest incomplete areas; MVP scope documented |

---

## README Structure

The root `README.md` covers:
1. Project overview (what it is, what it demonstrates).
2. Tech stack summary.
3. **Note on repo structure**: assignment lists `packages/shared`, `types`, `api-client`; this project adds `packages/ui` as the shared design-system package (implements "shared packages for UI/utilities/types").
4. Architecture diagram (text-based or mermaid).
5. Prerequisites.
6. Local quick-start (numbered steps).
7. Script reference table.
8. Links to specs (`/specs/`) and constitution (`.specify/memory/constitution.md`).
9. Architecture decisions (brief, link to full ADRs in this spec).
10. Known tradeoffs / incomplete areas.
11. Optional: Loom walkthrough link.

---

## Acceptance Criteria

- [ ] `README.md` at workspace root is complete and accurate.
- [ ] Following README from a clean checkout (no prior setup) successfully starts both servers and opens the dashboard.
- [ ] `pnpm seed` instructions in README are accurate and idempotent.
- [ ] `wrangler.toml` is correct and does not contain secrets.
- [ ] `deploy:backend` script is documented and functional (even if not run in CI).
- [ ] Architecture decisions section explains at least 4 key choices with rationale and tradeoffs.
- [ ] Tradeoffs / incomplete areas table is honest and specific.
- [ ] All `.env.example` files are committed and correctly document required variables.
- [ ] No secrets appear in any committed file.
