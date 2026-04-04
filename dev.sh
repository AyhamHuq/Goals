#!/usr/bin/env bash
# dev.sh — Local development setup for Family Goal Tracker
# Usage:
#   ./dev.sh          — start everything (DB + both dev servers)
#   ./dev.sh stop     — stop the database container
#   ./dev.sh reset    — drop DB volume, re-migrate, re-seed, restart
#   ./dev.sh logs     — tail all docker compose logs

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[goals]${NC} $*"; }
ok()     { echo -e "${GREEN}[goals]${NC} $*"; }
warn()   { echo -e "${YELLOW}[goals]${NC} $*"; }
error()  { echo -e "${RED}[goals]${NC} $*"; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"  # ensure CWD is always valid (prevents npm uv_cwd errors in WSL)
COMPOSE_FILES=(-f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.dev.yml")

# ── Prerequisites ─────────────────────────────────────────────────────────────

check_deps() {
  local missing=()
  command -v docker   >/dev/null 2>&1 || missing+=("docker")
  command -v node     >/dev/null 2>&1 || missing+=("node (20+)")
  command -v npm      >/dev/null 2>&1 || missing+=("npm")
  if [[ ${#missing[@]} -gt 0 ]]; then
    error "Missing required tools: ${missing[*]}"
  fi

  local node_major
  node_major=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
  if [[ "$node_major" -lt 20 ]]; then
    error "Node 20+ required (found v$(node --version))"
  fi
}

# ── Environment ───────────────────────────────────────────────────────────────

setup_env() {
  if [[ ! -f "$ROOT/.env" ]]; then
    warn ".env not found — copying from .env.example"
    cp "$ROOT/.env.example" "$ROOT/.env"
    ok "Created .env — edit it if you need custom settings"
  fi
  # Export dev overrides (local DB, dev mode)
  export DATABASE_URL="${DATABASE_URL:-postgres://goals:goals@localhost:5432/goals}"
  export PORT="${PORT:-3001}"
  export NODE_ENV="${NODE_ENV:-development}"
}

# ── Database ──────────────────────────────────────────────────────────────────

start_db() {
  log "Starting PostgreSQL..."
  docker compose "${COMPOSE_FILES[@]}" up db -d

  log "Waiting for PostgreSQL to be healthy..."
  local attempts=0
  until docker compose "${COMPOSE_FILES[@]}" exec -T db \
      pg_isready -U goals -d goals -q 2>/dev/null; do
    attempts=$((attempts + 1))
    if [[ $attempts -ge 30 ]]; then
      error "PostgreSQL did not become ready in time"
    fi
    sleep 1
  done
  ok "PostgreSQL is ready"
}

stop_db() {
  log "Stopping database..."
  docker compose "${COMPOSE_FILES[@]}" stop db
  ok "Database stopped"
}

reset_db() {
  warn "Resetting database — all data will be lost!"
  read -r -p "Continue? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }
  docker compose "${COMPOSE_FILES[@]}" down -v
  start_db
  run_migrate
  run_seed
}

# ── Server dependencies ───────────────────────────────────────────────────────

install_deps() {
  if [[ ! -d "$ROOT/server/node_modules" ]]; then
    log "Installing server dependencies..."
    npm --prefix "$ROOT/server" install --silent
    ok "Server deps installed"
  fi
  if [[ ! -d "$ROOT/client/node_modules" ]]; then
    log "Installing client dependencies..."
    npm --prefix "$ROOT/client" install --silent
    ok "Client deps installed"
  fi
}

# ── Migrations & seed ─────────────────────────────────────────────────────────

run_migrate() {
  log "Running migrations..."
  npm --prefix "$ROOT/server" run migrate
  ok "Migrations complete"
}

run_seed() {
  log "Seeding database..."
  npm --prefix "$ROOT/server" run seed
  ok "Seed complete — 1 group, 6 users, 8 categories"
}

check_seeded() {
  local count
  count=$(docker compose "${COMPOSE_FILES[@]}" exec -T db \
    psql -U goals -d goals -tAc "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
  count=$(echo "$count" | tr -d '[:space:]')
  if [[ "$count" -eq 0 ]]; then
    warn "Database is empty — running seed..."
    run_seed
  else
    ok "Database has $count users — skipping seed"
  fi
}

# ── Dev servers ───────────────────────────────────────────────────────────────

start_dev_servers() {
  ok ""
  ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  ok "  Family Goal Tracker — dev mode"
  ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  ok "  Frontend : http://localhost:5173"
  ok "  Backend  : http://localhost:3001"
  ok "  Health   : http://localhost:3001/health"
  ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  ok "  Press Ctrl+C to stop both servers"
  ok ""

  # Start backend in background, capture its PID
  npm --prefix "$ROOT/server" run dev &
  SERVER_PID=$!

  # Give the server a moment to bind before starting the client
  sleep 2

  # Start frontend (blocks until Ctrl+C)
  npm --prefix "$ROOT/client" run dev &
  CLIENT_PID=$!

  # Trap Ctrl+C to clean up both processes
  trap 'log "Shutting down..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; wait; ok "Done"' INT TERM

  wait $SERVER_PID $CLIENT_PID
}

# ── Sandbox DB ────────────────────────────────────────────────────────────────

ensure_sandbox_db() {
  log "Ensuring sandbox database exists..."
  docker compose "${COMPOSE_FILES[@]}" exec -T db \
    psql -U goals -d postgres -c "CREATE DATABASE goals_sandbox OWNER goals;" 2>/dev/null \
    || true  # already exists — that's fine
  ok "Sandbox DB ready"
}

# ── Entrypoint ────────────────────────────────────────────────────────────────

cmd="${1:-start}"

case "$cmd" in
  start)
    check_deps
    setup_env
    install_deps
    start_db
    run_migrate
    check_seeded
    start_dev_servers
    ;;
  stop)
    stop_db
    ;;
  reset)
    check_deps
    setup_env
    install_deps
    reset_db
    start_dev_servers
    ;;
  sandbox)
    check_deps
    setup_env
    export SANDBOX=true
    export DATABASE_URL="postgres://goals:${DB_PASSWORD:-goals}@localhost:5432/goals_sandbox"
    COMPOSE_FILES=(-f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.dev.yml" -f "$ROOT/docker-compose.sandbox.yml")
    install_deps
    start_db
    ensure_sandbox_db
    run_migrate
    check_seeded
    ok ""
    ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    warn "  SANDBOX MODE — data saves to goals_sandbox"
    warn "  Real database is untouched"
    ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    start_dev_servers
    ;;
  logs)
    docker compose "${COMPOSE_FILES[@]}" logs -f
    ;;
  seed)
    setup_env
    run_seed
    ;;
  migrate)
    setup_env
    run_migrate
    ;;
  *)
    echo "Usage: $0 [start|sandbox|stop|reset|logs|seed|migrate]"
    echo ""
    echo "  start    Start DB + run migrations + launch dev servers (default)"
    echo "  sandbox  Start in sandbox mode (uses goals_sandbox DB, real DB untouched)"
    echo "  stop     Stop the database container"
    echo "  reset    Wipe DB, re-migrate, re-seed, restart dev servers"
    echo "  logs     Tail docker compose logs"
    echo "  seed     Run seed script only"
    echo "  migrate  Run migrations only"
    exit 1
    ;;
esac
