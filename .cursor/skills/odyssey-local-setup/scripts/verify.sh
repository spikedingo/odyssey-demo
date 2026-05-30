#!/usr/bin/env bash
# Odyssey local setup verification — artifacts + DB row counts
# Exit codes: 0=ok 1=generic 2=artifact 3=postgres 4=data
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

log() { echo "[verify] $*"; }
fail() { log "FAIL: $*"; exit "${2:-1}"; }

# --- Required artifacts ---
log "Checking generated artifacts and env files..."

for f in \
  services/backend/.env \
  apps/dashboard/.env \
  openapi.json \
  packages/api-client/src/generated/endpoints/health/health.ts; do
  [[ -e "$f" ]] || fail "Missing required file: $f" 2
done

log "All required artifacts present."

# --- Postgres connectivity ---
DATABASE_URL="${DATABASE_URL:-postgresql://odyssey:odyssey@localhost:5432/odyssey}"

if command -v docker >/dev/null 2>&1 && docker compose ps postgres 2>/dev/null | grep -q "Up"; then
  log "Checking Postgres via docker compose exec..."
  if ! docker compose exec -T postgres pg_isready -U odyssey >/dev/null 2>&1; then
    fail "Postgres container running but not accepting connections" 3
  fi

  query() {
    docker compose exec -T postgres psql -U odyssey -d odyssey -tAc "$1" 2>/dev/null | tr -d '[:space:]'
  }
  query_text() {
    docker compose exec -T postgres psql -U odyssey -d odyssey -tAc "$1" 2>/dev/null | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
  }
else
  log "Checking Postgres via psql (direct connection)..."
  if ! command -v psql >/dev/null 2>&1; then
    log "WARN: psql not available and Docker postgres not running; skipping DB row checks."
    log "Verify complete (artifacts only)."
    exit 0
  fi

  query() {
    psql "$DATABASE_URL" -tAc "$1" 2>/dev/null | tr -d '[:space:]'
  }
  query_text() {
    psql "$DATABASE_URL" -tAc "$1" 2>/dev/null | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
  }
fi

# --- Row count assertions (seed baseline) ---
log "Checking seed data row counts..."

menu_count="$(query "SELECT COUNT(*) FROM menu_items;")"
customer_count="$(query "SELECT COUNT(*) FROM customers;")"
order_count="$(query "SELECT COUNT(*) FROM orders;")"
restaurant_name="$(query_text "SELECT restaurant_name FROM settings LIMIT 1;")"

[[ "$menu_count" == "12" ]] || fail "Expected 12 menu_items, got '${menu_count}'" 4
[[ "$customer_count" == "8" ]] || fail "Expected 8 customers, got '${customer_count}'" 4
[[ "$order_count" == "20" ]] || fail "Expected 20 orders, got '${order_count}'" 4
[[ "$restaurant_name" == "Sakura Garden" ]] || fail "Expected restaurant_name 'Sakura Garden', got '${restaurant_name}'" 4

log "Seed data OK: 12 menu items, 8 customers, 20 orders, restaurant '${restaurant_name}'."
log "Verify complete."
exit 0
