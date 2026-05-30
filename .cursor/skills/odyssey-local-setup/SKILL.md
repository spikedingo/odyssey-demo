---
name: odyssey-local-setup
description: >-
  Bootstrap odyssey-demo after clone: install deps, env files, Docker Postgres,
  migrate, seed, generate API client, verify demo data, start dev servers.
  Use when the user clones the repo, asks for local setup, fresh environment,
  post-clone run, or odyssey 运维/环境搭建.
disable-model-invocation: true
---

# Odyssey Local Setup

Automated post-clone bootstrap for the Odyssey Restaurant monorepo. Human-readable reference: [SETUP_FROM_CLONE.md](../../../SETUP_FROM_CLONE.md).

## Hard Rules

1. **Never skip verification** — run `scripts/verify.sh` before claiming success.
2. **Never commit** `.env`, `openapi.json`, or `packages/api-client/src/generated/` (gitignored).
3. **Execute scripts first**; read [troubleshooting.md](troubleshooting.md) only when a script exits non-zero.
4. **Report progress** with the phase checklist in chat after each phase.
5. **Evidence before fixes** — diagnose with commands, apply one fix, retry from the indicated phase. Max 3 retry cycles before escalating to the user with logs.

## Parse User Intent

| User says | Mode |
|---|---|
| default / "setup" / "clone 后运行" | Full setup → verify → start dev servers |
| "reset" / "clean setup" | `reset.sh` → full setup → verify → dev |
| "verify-only" / "check setup" | `verify.sh` → start dev if ports down → API smoke |

## Phase Checklist

Copy and update in chat:

```
Odyssey Local Setup
- [ ] Phase 0: Preflight
- [ ] Phase 1: Setup (setup.sh)
- [ ] Phase 2: Verify (verify.sh)
- [ ] Phase 3: Dev servers + API smoke
```

---

## Phase 0: Preflight

Run from repo root:

```bash
node -v    # require v20+
pnpm -v    # require v9+
docker -v  # required for default Docker Postgres path
```

Check ports (warn if occupied — see troubleshooting):

```bash
lsof -i :5432 -i :8787 -i :8081 2>/dev/null | grep LISTEN || true
```

**Pass:** Node 20+, pnpm 9+, Docker available (unless user chose Neon).

**Neon escape hatch:** If Docker unavailable or port 5432 blocked, ask user for `DATABASE_URL`, write `services/backend/.env`, skip `db:up` in setup, continue migrate/seed.

---

## Phase 1: Setup

```bash
bash .cursor/skills/odyssey-local-setup/scripts/setup.sh
```

Or: `pnpm setup:local`

**Pass:** exit code 0.

**Exit codes:** `1` generic · `2` prereq · `3` docker/postgres · `4` migrate/seed · `5` gen:contract

---

## Phase 2: Verify

```bash
bash .cursor/skills/odyssey-local-setup/scripts/verify.sh
```

Or: `pnpm verify:local`

**Pass:** exit code 0 — artifacts exist, Postgres healthy, DB row counts match seed baseline.

---

## Phase 3: Dev Servers + API Smoke

Start in **background** (two separate shells):

```bash
pnpm dev:backend    # http://localhost:8787
pnpm dev:dashboard  # http://localhost:8081
```

Wait until ports listen, then run API smoke:

```bash
curl -sf http://localhost:8787/health
curl -sf http://localhost:8787/api/v1/settings | grep -q 'Sakura Garden'
curl -sf http://localhost:8787/api/v1/home/summary | grep -q 'pending_orders'
```

**Pass:** both ports listening; curl commands succeed; settings returns `"restaurant_name":"Sakura Garden"`.

---

## Success Report

Post this template when all phases pass:

```markdown
## Odyssey local setup complete

- Backend: http://localhost:8787/health
- Dashboard: http://localhost:8081
- Restaurant: Sakura Garden
- Data: 12 menu items, 8 customers, 20 orders, 3 pending

Next: open Dashboard sidebar pages or run `pnpm test` (requires `pnpm db:setup-test` first).
```

---

## Optional Post-Setup

Only if user asks:

```bash
pnpm db:setup-test
pnpm lint && pnpm typecheck && pnpm test
```

---

## On Failure

1. Note the failing phase and exit code.
2. Read [troubleshooting.md](troubleshooting.md) for the matching symptom.
3. Run diagnosis commands listed there.
4. Apply **one** fix; retry from the indicated phase.
5. After 3 failed cycles, stop and report: phase, exit code, commands run, full error output.

## Additional Resources

- Full manual guide: [SETUP_FROM_CLONE.md](../../../SETUP_FROM_CLONE.md)
- Seed source of truth: [services/backend/src/db/seed.ts](../../../services/backend/src/db/seed.ts)
- Reset to fresh-clone artifacts: `bash .cursor/skills/odyssey-local-setup/scripts/reset.sh` or `pnpm reset:local`
