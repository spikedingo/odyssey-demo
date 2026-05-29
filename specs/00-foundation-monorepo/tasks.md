# Tasks 00 — Foundation & Monorepo

## Setup

> Implement IN PLACE at the existing repo root `/Users/spikedingo/odyssey-demo`. Do NOT create an `odyssey-restaurant/` subdirectory. `.specify/memory/` and `specs/` already exist — do not overwrite or recreate them.

- [x] `git init` (skip if already a repo) + `pnpm init` at repo root, then replace root `package.json` per spec.md
- [x] Create `pnpm-workspace.yaml` with `apps/*`, `services/*`, `packages/*`
- [x] Create directory skeleton (`apps/dashboard/src`, `services/backend/src`, `packages/{shared,types,ui,api-client}/src`) — `.specify/memory` and `specs/` already exist
- [x] All workspace packages use scoped `@odyssey/<dir>` names (`@odyssey/shared`, `@odyssey/types`, `@odyssey/ui`, `@odyssey/api-client`); `backend` and `dashboard` stay unscoped

## Root Config Files

- [x] Write root `package.json` with all scripts from spec.md
- [x] Write `turbo.json` with pipeline definitions from spec.md
- [x] Write `tsconfig.base.json` with strict settings from spec.md
- [x] Write `.prettierrc`
- [x] Write root `.eslintrc.js` (TypeScript + import plugin)
- [x] Write `.gitignore` (node_modules, dist, .turbo, *.env, packages/api-client/src/, .wrangler/)

## Packages

- [x] `packages/shared` (name `@odyssey/shared`): `package.json`, `tsconfig.json`, `src/index.ts` placeholder
- [x] `packages/types` (name `@odyssey/types`): `package.json`, `tsconfig.json`, `src/index.ts` placeholder
- [x] `packages/ui` (name `@odyssey/ui`): `package.json` (react/react-native + `@odyssey/shared` workspace dep), `tsconfig.json`, `src/index.ts` placeholder
- [x] `packages/api-client` (name `@odyssey/api-client`): `package.json` (@tanstack/react-query + `@odyssey/types` workspace dep), `tsconfig.json`, note in README that `src/` is generated

## Backend Service

- [x] `services/backend/package.json` with all scripts and dependencies from plan.md
- [x] `services/backend/tsconfig.json` extending base
- [x] `services/backend/wrangler.toml` with nodejs_compat
- [x] `services/backend/src/index.ts` stub (Hono app, single health-check route)
- [x] `services/backend/.env.example`
- [x] `services/backend/.env` (gitignored, created from .env.example)

## Dashboard App

- [x] `apps/dashboard/package.json` with Expo + React Native Web deps
- [x] `apps/dashboard/tsconfig.json` extending base
- [x] `apps/dashboard/app.json` (Expo config)
- [x] `apps/dashboard/src/` — entry point stub
- [x] `apps/dashboard/.env.example`

## Database

- [x] Write `docker-compose.yml` (postgres:16-alpine, port 5432)
- [x] Verify `pnpm db:up` starts Postgres successfully
- [x] Add Neon switching instructions to `services/backend/README.md`

## Verification

- [x] `pnpm install` — zero peer dependency errors
- [x] `pnpm lint` — passes
- [x] `pnpm typecheck` — passes
- [x] `pnpm db:up` — Postgres starts and health-check passes
- [x] `pnpm dev:backend` — Hono stub starts on port 8787, `GET /health` returns 200
- [x] `pnpm dev:dashboard` — Expo web starts
- [x] Confirm `.env` not in `git status`
- [x] Confirm `packages/api-client/src/` not in `git status`

## Documentation

- [x] Write root `README.md` with prerequisites + quick start
- [x] Copy `constitution.md` to `.specify/memory/constitution.md`
