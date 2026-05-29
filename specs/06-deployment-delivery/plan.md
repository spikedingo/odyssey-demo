# Plan 06 — Deployment & Delivery

## Approach

This spec is primarily documentation and script work. No new application code is written here. The plan is: write all docs/scripts → verify locally → confirm README is accurate by doing a dry-run.

---

## Step-by-Step

### 1. `wrangler.toml` additions

Ensure `services/backend/wrangler.toml` has:
- `name`, `main`, `compatibility_date`, `compatibility_flags = ["nodejs_compat"]`
- No secrets inline (they go via `wrangler secret put`)
- An `[env.production]` section if different config is needed for prod vs dev

```toml
name = "odyssey-backend"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "development"

[env.production]
vars = { NODE_ENV = "production" }
```

### 2. Deployment scripts

Add to root `package.json` under `scripts`:
```json
"deploy:backend":  "pnpm --filter=backend run deploy",
"deploy:frontend": "pnpm --filter=dashboard run export && wrangler pages deploy apps/dashboard/dist --project-name odyssey-dashboard",
"deploy":          "pnpm deploy:backend && pnpm deploy:frontend"
```

Add to `services/backend/package.json`:
```json
"deploy": "wrangler deploy --env production"
```

Add to `apps/dashboard/package.json`:
```json
"export": "expo export --platform web --output-dir dist"
```

### 3. Architecture Decision Records

The 6 ADRs are written inline in `spec.md`. They should also be referenced from the README.

No separate ADR files needed for this scope (inline in spec is sufficient).

### 4. README

Write `README.md` at workspace root. Structure:

```markdown
# Odyssey Restaurant Dashboard

> A fullstack restaurant operations dashboard built with pnpm + Turborepo,
> Expo + React Native Web, Hono on Cloudflare Workers, PostgreSQL + Drizzle ORM,
> and a generated API contract pipeline (drizzle-zod → OpenAPI → Orval → React Query).

## Stack
[table or list]

## Architecture
[mermaid or ASCII diagram of contract pipeline]

## Prerequisites
[node/pnpm/docker requirements]

## Quick Start
[numbered steps from spec.md]

## Scripts Reference
[table of all pnpm scripts]

## Architecture Decisions
[brief summary of key ADRs with links to specs/06...]

## Deploying
[brief deployment steps with links to spec]

## Known Tradeoffs
[bullet list]
```

### 5. Dry-run verification

After writing all docs:
1. Open a fresh terminal, navigate to the project root.
2. Follow the README Quick Start steps exactly.
3. Note any discrepancies or errors.
4. Update the README to fix any issues found.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| No CI/CD pipeline defined | Not required by the assignment; deployment is documented but not automated |
| Secrets via `wrangler secret put` | Workers Secrets are encrypted at rest and not visible in source; correct approach |
| Neon for prod DB (not local Postgres) | Cloudflare Workers can't connect to `localhost`; needs a cloud DB |
| Pages for frontend | Cloudflare Pages integrates with Workers; same account, same edge network |
