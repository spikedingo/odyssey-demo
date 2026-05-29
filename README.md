# Odyssey Restaurant Dashboard

Operations dashboard for restaurant staff — orders, CRM, menu, and settings — built as a type-safe monorepo with an automated contract pipeline from Drizzle → OpenAPI → Orval.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Expo + React Native Web, Expo Router |
| Backend | Hono on Cloudflare Workers, Drizzle ORM, Postgres |
| Contract | OpenAPI 3 + Orval-generated React Query hooks |
| UI | `@odyssey/ui` design system (tokens, theme, primitives) |
| Tooling | pnpm workspace, Turborepo, Vitest, Jest |

## Architecture

```
Drizzle schema → drizzle-zod → Hono OpenAPI → openapi.json → Orval → packages/api-client → apps/dashboard
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (local Postgres) **or** Neon cloud Postgres

## Quick Start

```bash
pnpm install
cp services/backend/.env.example services/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env

pnpm db:up          # skip if using Neon
pnpm db:migrate
pnpm seed
pnpm gen:contract   # generate API client hooks

pnpm dev:backend    # terminal 1 → http://localhost:8787
pnpm dev:dashboard  # terminal 2 → Expo web
```

Open http://localhost:8081 (Expo web) — navigate via sidebar to Home, Orders, CRM, Menu, Settings, or `/ui-library`.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev:dashboard` | Start Expo web dashboard |
| `pnpm dev:backend` | Start Hono/Wrangler dev server (:8787) |
| `pnpm gen:contract` | Export OpenAPI + regenerate `@odyssey/api-client` |
| `pnpm db:up` / `pnpm db:down` | Docker Postgres |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:setup-test` | Create `odyssey_test` database |
| `pnpm seed` | Idempotent seed (20 orders, 8 customers, 12 menu items) |
| `pnpm lint` | ESLint across workspace |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm test` | Backend Vitest + frontend Jest |
| `pnpm deploy:backend` | Deploy Workers via Wrangler |
| `pnpm deploy:frontend` | Export static web bundle |

## Project Structure

```
apps/dashboard/          Expo RN Web app
services/backend/        Hono API + Drizzle + seed
packages/ui/             Design system
packages/api-client/     Generated hooks (gitignored src/generated/)
packages/types/          Shared enums + UI constants
packages/shared/         formatCents, formatDate utilities
specs/                   Implementation specs
.specify/memory/         Architecture constitution
```

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `DATABASE_URL` | `services/backend/.env` | Postgres connection |
| `EXPO_PUBLIC_API_BASE_URL` | `apps/dashboard/.env` | API base for generated hooks |
| `TEST_DATABASE_URL` | test runs | Defaults to `odyssey_test` DB |

## Deployment

See `.env.deploy.example`. Backend deploys with Wrangler (`pnpm deploy:backend`); frontend exports static web assets (`pnpm deploy:frontend`).

## Specs

Detailed requirements live in `/specs`. Start with `specs/IMPLEMENTATION.md` for wave order and verification gates.

## Known Tradeoffs

- Dark theme and density toggles are functional but not fully polished on every screen.
- KPI trend arrows on Home use today vs yesterday from a single `useGetHomeSummary()` call.
- Local dev requires Docker for Postgres unless using Neon.
