# Odyssey Local Setup — Troubleshooting

Read this file **only when a setup phase fails**. Apply one fix at a time, then retry from the indicated phase.

Full manual reference: [SETUP_FROM_CLONE.md](../../../SETUP_FROM_CLONE.md)

---

## Exit Code Reference

| Code | Script | Meaning |
|------|--------|---------|
| 2 | setup.sh / verify.sh | Prerequisites or missing artifacts |
| 3 | setup.sh / verify.sh | Docker / Postgres connectivity |
| 4 | setup.sh / verify.sh | Migrate, seed, or data mismatch |
| 5 | setup.sh | Contract generation failed |

---

## Decision Tree

### setup.sh exit 2 — Prerequisites

**Symptoms:** `node not found`, `pnpm not found`, Node < 20, pnpm < 9

**Diagnose:**
```bash
node -v && pnpm -v
corepack enable && corepack prepare pnpm@9.15.0 --activate
```

**Fix:** Install Node 20+ and enable pnpm 9+ via Corepack.

**Retry from:** Phase 0

---

### setup.sh exit 3 — Docker / Postgres

#### Port 5432 already in use

**Symptoms:** `pnpm db:up` fails; Postgres never healthy

**Diagnose:**
```bash
lsof -i :5432
docker compose logs postgres
```

**Fix (pick one):**
1. Stop conflicting service: `kill <PID>` from lsof output
2. **Neon path:** set `DATABASE_URL` in `services/backend/.env`, then re-run with `SKIP_DOCKER=1 bash .cursor/skills/odyssey-local-setup/scripts/setup.sh`
3. Change port in `docker-compose.yml` (e.g. `5433:5432`) and update `DATABASE_URL`

**Retry from:** Phase 1 (setup.sh)

#### Docker Postgres unhealthy

**Symptoms:** "Postgres did not become healthy within 60s"

**Diagnose:**
```bash
docker compose ps
docker compose logs postgres
```

**Fix:**
```bash
pnpm db:down -v
pnpm db:up
# wait for healthy, then:
pnpm db:migrate && pnpm seed
```

**Retry from:** migrate step (or full setup.sh)

#### Docker not running

**Symptoms:** `Cannot connect to the Docker daemon`

**Fix:** Start Docker Desktop, or use Neon with `SKIP_DOCKER=1`.

**Retry from:** Phase 1

---

### setup.sh exit 4 — Migrate / Seed

**Symptoms:** `pnpm db:migrate` or `pnpm seed` fails; connection refused

**Diagnose:**
```bash
docker compose ps postgres
docker compose exec -T postgres pg_isready -U odyssey
cat services/backend/.env
```

**Fix:**
1. Ensure Postgres is up and healthy
2. Confirm `DATABASE_URL` matches running Postgres
3. Re-run: `pnpm db:migrate && pnpm seed`

**Retry from:** migrate step

---

### setup.sh exit 5 — gen:contract

**Symptoms:** OpenAPI export or Orval generation fails; dashboard cannot import hooks

**Diagnose:**
```bash
pnpm --filter=backend typecheck
ls -la openapi.json packages/api-client/src/generated/ 2>/dev/null || true
```

**Fix:**
```bash
pnpm install
pnpm gen:contract
```

If backend typecheck fails, fix reported errors first.

**Retry from:** gen:contract step

---

### verify.sh exit 2 — Missing artifacts

**Symptoms:** Missing `.env`, `openapi.json`, or `generated/`

**Fix:**
```bash
cp services/backend/.env.example services/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env
pnpm gen:contract
```

**Retry from:** Phase 2 (verify.sh)

---

### verify.sh exit 4 — Data mismatch

**Symptoms:** Wrong row counts; restaurant name not "Sakura Garden"

**Diagnose:**
```bash
docker compose exec -T postgres psql -U odyssey -d odyssey -c "SELECT COUNT(*) FROM menu_items;"
docker compose exec -T postgres psql -U odyssey -d odyssey -c "SELECT COUNT(*) FROM orders;"
docker compose exec -T postgres psql -U odyssey -d odyssey -c "SELECT restaurant_name FROM settings;"
```

**Fix:**
```bash
pnpm seed
```

If still wrong:
```bash
pnpm reset:local
pnpm setup:local
```

**Retry from:** Phase 1 or Phase 2

---

### Phase 3 — Port 8787 or 8081 in use

**Symptoms:** Dev server fails to bind; curl smoke fails

**Diagnose:**
```bash
lsof -i :8787
lsof -i :8081
curl -sf http://localhost:8787/health || echo "backend down"
```

**Fix:**
```bash
kill <PID>   # from lsof
```

Or change backend port in `services/backend` wrangler dev and update `EXPO_PUBLIC_API_BASE_URL` in `apps/dashboard/.env`.

**Retry from:** Phase 3

---

### Dashboard white screen / Metro bundling failed (HTTP 500)

**Symptoms:** Browser shows blank page; `curl -I http://localhost:8081` returns `500 Internal Server Error`; Metro log shows `Unable to resolve module @expo-google-fonts/inter` (or other pnpm-scoped packages).

**Cause:** pnpm's isolated `node_modules` layout — Metro cannot resolve packages that live only under `.pnpm/` without hoisting or explicit `extraNodeModules` mapping.

**Diagnose:**
```bash
curl -sI http://localhost:8081 | head -1
# check dashboard terminal for "Web Bundling failed"
ls node_modules/@expo-google-fonts/inter 2>/dev/null || echo "not hoisted"
```

**Fix:**
```bash
# Repo includes .npmrc with public-hoist-pattern for Expo packages
CI=true pnpm install --force
# kill stale dev servers, then restart:
pnpm dev:dashboard
```

If still failing, confirm `apps/dashboard/metro.config.js` maps dependencies via `extraNodeModules`.

**Retry from:** Phase 1 (reinstall) + Phase 3

---

### Dashboard blank / missing API client hooks

**Symptoms:** Missing module errors for `@odyssey/api-client`; blank page after bundle succeeds

**Diagnose:**
```bash
ls packages/api-client/src/generated/
curl -sf http://localhost:8787/health
grep EXPO_PUBLIC_API_BASE_URL apps/dashboard/.env
```

**Fix:**
```bash
pnpm gen:contract
# restart dev:dashboard
```

Confirm `EXPO_PUBLIC_API_BASE_URL=http://localhost:8787` (no `/api/v1` suffix).

**Retry from:** Phase 1 (gen:contract) + Phase 3

---

### API returns 404

**Symptoms:** curl to `/orders` returns 404

**Cause:** Business routes use `/api/v1/*` prefix.

**Fix:** Use `http://localhost:8787/api/v1/orders`, not `/orders`.

**Retry from:** Phase 3 smoke test

---

### curl smoke: pending_orders check fails

**Symptoms:** home/summary returns but pending count unexpected

**Note:** Seed creates 3 pending orders (IDs 1, 8, 15). If you accepted orders via UI/API, re-seed:

```bash
pnpm seed
```

**Retry from:** Phase 2 + Phase 3

---

## Escalation Template

After 3 failed retry cycles, report to user:

```markdown
## Setup blocked at Phase X

- **Exit code:** N
- **Command:** ...
- **Error output:** (paste last 20 lines)
- **Diagnosis run:** (list commands)
- **Fixes attempted:** 1) ... 2) ... 3) ...
- **Suggested next step:** ...
```
