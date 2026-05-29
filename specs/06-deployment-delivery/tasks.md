# Tasks 06 — Deployment & Delivery

## wrangler.toml

- [x] Ensure `services/backend/wrangler.toml` has correct `name`, `main`, `compatibility_date`, `nodejs_compat`
- [x] Add `[env.production]` section with `NODE_ENV = "production"`
- [x] Confirm no secrets or connection strings in `wrangler.toml`

## Deployment Scripts

- [x] Add `"deploy:backend"`, `"deploy:frontend"`, `"deploy"` scripts to root `package.json`
- [ ] Add `"deploy": "wrangler deploy --env production"` to `services/backend/package.json`
- [x] Add `"export": "expo export --platform web --output-dir dist"` to `apps/dashboard/package.json`

## Environment Example Files

- [x] Verify `services/backend/.env.example` has all required vars documented
- [x] Verify `apps/dashboard/.env.example` has `EXPO_PUBLIC_API_BASE_URL` documented
- [x] Add `.env.deploy.example` at workspace root with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` placeholders + note about never committing these
- [x] Confirm all `.env*` files (except `.example`) are in `.gitignore`

## README

- [x] Write root `README.md` with:
  - [x] Project overview paragraph (what it is, what it demonstrates)
  - [x] Tech stack table or list
  - [ ] Architecture diagram (mermaid or ASCII) showing contract pipeline
  - [x] Prerequisites section (Node 20+, pnpm 9+, Docker Desktop)
  - [ ] Quick Start numbered steps (matching spec.md local guide exactly)
  - [ ] Scripts reference table (all pnpm scripts with descriptions)
  - [ ] Architecture Decisions section (brief, references spec 06 ADRs)
  - [x] Deploying section (brief steps, references spec 06 for full detail)
  - [ ] Known Tradeoffs & Incomplete Areas section
  - [ ] Optional: Loom walkthrough link placeholder

## Architecture Decision Records

- [x] Confirm 6 ADRs are written in `specs/06-deployment-delivery/spec.md`:
  - [x] ADR-001: Hono on Cloudflare Workers
  - [x] ADR-002: Drizzle ORM
  - [x] ADR-003: Orval for API client generation
  - [x] ADR-004: Integer cents for money
  - [x] ADR-005: No authentication
  - [x] ADR-006: Expo Router
- [ ] Link to ADRs from README
- [ ] Add Evaluation Criteria Mapping section to README (or link to spec 06 table)

## Dry-Run Verification

- [x] Follow README Quick Start from step 1 (fresh terminal, project root)
- [x] `pnpm install` — succeeds
- [x] `pnpm db:up` — Postgres starts
- [x] `pnpm db:migrate` — migrations apply cleanly
- [x] `pnpm seed` — seed data inserted
- [x] `pnpm gen:contract` — API client generated
- [x] `pnpm dev:backend` — starts on :8787
- [x] `pnpm dev:dashboard` — opens on :8081
- [ ] Update README if any step failed or was inaccurate

## Final Checks

- [x] `git status` — no `.env` files, no `openapi.json`, no `packages/api-client/src/generated/`
- [x] `pnpm lint` passes
- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes
- [x] All spec files exist: `specs/{00..06}/{spec,plan,tasks}.md` (21 files total)
- [x] `.specify/memory/constitution.md` exists
- [ ] README is accurate and complete
