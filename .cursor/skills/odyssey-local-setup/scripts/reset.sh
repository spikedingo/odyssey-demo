#!/usr/bin/env bash
# Odyssey local reset — return to fresh-clone artifact state
# Exit codes: 0=ok 1=generic
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

log() { echo "[reset] $*"; }

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti ":$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    log "Stopping processes on port $port..."
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
  fi
}

log "Stopping dev servers (best effort)..."
kill_port 8787
kill_port 8081

log "Stopping Postgres and removing volumes..."
pnpm db:down -v 2>/dev/null || docker compose down -v 2>/dev/null || true

log "Removing generated and local-only artifacts..."
rm -f openapi.json
rm -rf packages/api-client/src/generated/
rm -f services/backend/.env apps/dashboard/.env
rm -rf .turbo .wrangler services/backend/.wrangler apps/dashboard/.expo
rm -rf node_modules \
  apps/dashboard/node_modules \
  services/backend/node_modules \
  packages/api-client/node_modules \
  packages/ui/node_modules \
  packages/types/node_modules \
  packages/shared/node_modules \
  2>/dev/null || true

if git rev-parse --git-dir >/dev/null 2>&1; then
  log "Restoring tracked .expo files..."
  git checkout -- apps/dashboard/.expo/ 2>/dev/null || true
fi

log "Reset complete. Run setup.sh or pnpm setup:local to bootstrap again."
exit 0
