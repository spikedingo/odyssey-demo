#!/usr/bin/env bash
# Odyssey local setup — idempotent post-clone bootstrap
# Exit codes: 0=ok 1=generic 2=prereq 3=docker/postgres 4=migrate/seed 5=gen:contract
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

log() { echo "[setup] $*"; }
fail() { log "ERROR: $*"; exit "${2:-1}"; }

USE_DOCKER=true
if [[ "${SKIP_DOCKER:-}" == "1" ]]; then
  USE_DOCKER=false
fi

# --- Prerequisites ---
log "Checking prerequisites..."
command -v node >/dev/null 2>&1 || fail "node not found" 2
command -v pnpm >/dev/null 2>&1 || fail "pnpm not found" 2

NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node.js 20+ required (found $(node -v))" 2

PNPM_MAJOR="$(pnpm -v | cut -d. -f1)"
[[ "$PNPM_MAJOR" -ge 9 ]] || fail "pnpm 9+ required (found $(pnpm -v))" 2

if $USE_DOCKER; then
  command -v docker >/dev/null 2>&1 || fail "docker not found (set SKIP_DOCKER=1 for Neon)" 2
fi

# --- Install ---
log "Installing dependencies..."
CI=true pnpm install --force

# --- Environment files ---
log "Creating .env files from examples..."
cp -n services/backend/.env.example services/backend/.env 2>/dev/null || true
cp -n apps/dashboard/.env.example apps/dashboard/.env 2>/dev/null || true

[[ -f services/backend/.env ]] || fail "services/backend/.env missing" 1
[[ -f apps/dashboard/.env ]] || fail "apps/dashboard/.env missing" 1

# --- Postgres ---
if $USE_DOCKER; then
  log "Starting Docker Postgres..."
  if ! pnpm db:up; then
    fail "pnpm db:up failed" 3
  fi

  log "Waiting for Postgres to become healthy (max 60s)..."
  healthy=false
  for _ in $(seq 1 30); do
    status="$(docker compose ps --format json 2>/dev/null | head -1 || true)"
    if docker compose ps postgres 2>/dev/null | grep -q "(healthy)"; then
      healthy=true
      break
    fi
    if docker compose exec -T postgres pg_isready -U odyssey >/dev/null 2>&1; then
      healthy=true
      break
    fi
    sleep 2
  done

  if ! $healthy; then
    fail "Postgres did not become healthy within 60s. Run: docker compose logs postgres" 3
  fi
  log "Postgres is ready."
else
  log "Skipping Docker (SKIP_DOCKER=1)."
fi

# --- Migrate + seed ---
log "Running migrations..."
if ! pnpm db:migrate; then
  fail "pnpm db:migrate failed" 4
fi

log "Seeding database..."
if ! pnpm seed; then
  fail "pnpm seed failed" 4
fi

# --- Contract generation ---
log "Generating API client (OpenAPI + Orval)..."
if ! pnpm gen:contract; then
  fail "pnpm gen:contract failed" 5
fi

log "Setup complete."
exit 0
