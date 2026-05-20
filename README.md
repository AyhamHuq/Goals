# Family Goal Tracker

A lightweight web app for small, trusted groups (families, close friends) to set monthly goals, track daily progress, and hold each other accountable through shared visibility.

## What It Does

- **Monthly goals**: Each user creates goals with a title, category (Weight Loss, Fitness, Arabic Learning, Quran, Professional Learning), target value, unit, and frequency (total, daily, or weekly).
- **Multi-unit logging**: Log progress in any compatible unit (e.g. log Quran pages or juz, Fitness minutes or hours or steps). Values are converted to the goal's stored unit automatically.
- **Progress logging**: Log incremental progress with support for backdating. Current value is always `SUM` of entries — never cached.
- **Personal dashboard**: Goals with progress bars, percentage complete, pacing indicators (on-track vs behind), and a greeting.
- **Group dashboard**: Every group member's goals and avg progress side-by-side.
- **History**: Browse past months — read-only with final completion stats.
- **Monthly lifecycle**: New month shows an empty state; copy goals from last month in one click.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Material UI v5 (Inter font, indigo/pink theme) |
| Data Fetching | @tanstack/react-query v5 + axios |
| Backend | Node.js + Express + TypeScript |
| Validation | zod |
| Database | PostgreSQL 16 |
| Deployment | Docker Compose (nginx + Express + Postgres) on Hetzner CX23 |

## Project Structure

```
Goals/
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/             # Axios functions per resource
│   │   ├── hooks/           # React Query hooks + mutations
│   │   ├── context/         # UserContext, PeriodContext
│   │   ├── components/
│   │   │   ├── dashboard/   # PersonalDashboard, GroupDashboard, GoalCard
│   │   │   ├── goals/       # GoalFormDialog
│   │   │   ├── progress/    # ProgressLogDialog, ProgressHistoryDrawer, QuickLogButton
│   │   │   └── history/     # HistoryView, ArchivedMonthDetail
│   │   ├── theme.ts         # MUI theme (indigo/pink, Inter, 12px radius)
│   │   ├── ErrorBoundary.tsx
│   │   └── Toast.tsx        # Global snackbar system
│   ├── Dockerfile           # Multi-stage: Node build → nginx serve
│   └── nginx.conf           # Static files + /api/* proxy
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts      # pg.Pool from DATABASE_URL
│   │   │   ├── migrate.ts   # Auto-runs on startup; idempotent
│   │   │   └── migrations/  # 001_initial.sql (full schema)
│   │   ├── routes/          # users, categories, goals, progress, dashboard, history
│   │   ├── services/
│   │   │   ├── dashboardService.ts  # Aggregation + pacing
│   │   │   ├── frequencyCalc.ts     # Pure frequency math (56 tests)
│   │   │   └── pushService.ts       # Web Push via web-push + VAPID
│   │   └── middleware/      # errorHandler, validate (zod)
│   ├── seed.ts              # 1 group, 6 users, 8 categories
│   └── Dockerfile
│
├── db/
│   ├── init.sql             # Placeholder — schema managed by migrate.ts
│   └── init-sandbox.sql     # Creates goals_sandbox DB on first Postgres init
│
├── docker-compose.yml           # Base: 3 services, healthchecks, env-var config
├── docker-compose.prod.yml      # Override: production web-network alias
├── docker-compose.staging.yml   # Override: goals_staging DB + staging web-network alias
├── docker-compose.sandbox.yml   # Override: goals_sandbox DB (local dev only)
├── .env.example                 # All required vars
└── dev.sh                       # Local dev setup script
```

## Quick Start (Local Dev)

```bash
./dev.sh          # normal mode — uses goals DB
./dev.sh sandbox  # sandbox mode — uses goals_sandbox DB, real data untouched
```

Normal mode starts the database, runs migrations + seed, and launches both dev servers. Sandbox mode does the same but against a separate `goals_sandbox` database. An amber banner appears in the UI when sandbox is active.

### Manual setup

```bash
# 1. Copy env
cp .env.example .env

# 2. Generate VAPID keys for Web Push and add them to .env
npx web-push generate-vapid-keys
# Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL to .env

# 3. Start the database
docker compose up db -d

# 4. Install + migrate + seed
cd server && npm install && npm run migrate && npm run seed && cd ..

# 5. Start the backend (hot reload)
cd server && npm run dev

# 6. In another terminal, start the frontend
cd client && npm install && npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:3001 · Health: http://localhost:3001/health

## Deployment

The app runs on a single Hetzner CX23 server with two isolated environments — **staging** and **production** — sharing the same machine via Docker Compose project isolation. Production is served at `https://goals.ayhamhuq.com`.

```
https://goals.ayhamhuq.com          → prod app    (Portfolio Caddy → goals prod client)
https://admin-goals.ayhamhuq.com    → prod admin  (Portfolio Caddy → goals prod client)
https://staging-goals.ayhamhuq.com  → staging app (Portfolio Caddy → goals staging client)
```

Each environment is a fully independent Docker Compose project (`-p goals-prod` / `-p goals-staging`) with its own containers, network, volume, and database (`goals` / `goals_staging`).

The admin dashboard is selected by hostname in the React app (`admin.*` or `admin-*`). It must be served from `admin-goals.ayhamhuq.com`; `/admin` on the main hostname will not load the admin UI. The hyphenated admin hostname keeps the DNS name at the first subdomain level so Cloudflare Universal SSL can cover it without Total TLS.

### CI/CD Flow

- **Open/push to a PR** → tests run + auto-deploy to staging from the PR branch
- **Merge to `main`** → tests run + auto-deploy to production

### HTTPS Setup (Custom DNS + Caddy)

Web Push requires HTTPS. Caddy is owned by the sibling Portfolio deployment and terminates TLS for the custom DNS names, then proxies to the Goals client containers on the shared Docker `web` network:

1. Point `goals.ayhamhuq.com` and `admin-goals.ayhamhuq.com` at the Hetzner server.
2. Ensure the external Docker network exists: `docker network create web`.
3. Update the sibling Portfolio repo's `Caddyfile`, then redeploy Portfolio or reload Caddy.

Caddy handles TLS automatically via Let's Encrypt and reverse-proxies to the Goals client containers on the shared `web` network. The app containers do not publish host ports in production.

### First-Time Server Setup

```bash
# Install Docker, clone repo, create env files
mkdir -p /opt/goals/prod /opt/goals/staging
# /opt/goals/prod/.env  — DB_PASSWORD, NODE_ENV=production, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, ADMIN_PIN
# /opt/goals/staging/.env — DB_PASSWORD, NODE_ENV=staging, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, ADMIN_PIN

docker compose -p goals-staging --env-file /opt/goals/staging/.env \
  -f docker-compose.yml -f docker-compose.staging.yml up -d --build

docker compose -p goals-prod --env-file /opt/goals/prod/.env \
  -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Migrations run automatically on server startup. Seed is only needed once per environment:
```bash
docker compose -p goals-prod exec server node -e "require('./dist/seed')"
```

### GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `HETZNER_HOST` | Server IP |
| `HETZNER_USER` | SSH username |
| `HETZNER_SSH_KEY` | Private key contents (ed25519) |
| `ADMIN_PIN` | PIN injected into prod/staging env files for admin dashboard login |

## API

Application endpoints are under `/api`; the server healthcheck is at `/health` on the backend origin. Full reference in [ARCHITECTURE.md](./ARCHITECTURE.md).

| Area | Key Endpoints |
|------|--------------|
| Health | `GET /health` on the server/backend origin; includes `sandbox: bool` and is used by Docker healthchecks |
| Users | `GET /api/users`, `PATCH /api/users/:id/touch`, `PATCH /api/users/:id/preferences` |
| Categories | `GET/POST /api/categories` |
| Goals | `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id`, `POST /api/goals/copy-from-previous` |
| Progress | `GET/POST /api/progress`, `PUT/DELETE /api/progress/:id` |
| Dashboard | `GET /api/dashboard/personal`, `GET /api/dashboard/group` |
| History | `GET /api/history`, `GET /api/history/:period_key` |
| Push | `GET /api/push/vapid-public-key`, `POST /api/push/subscribe`, `DELETE /api/push/unsubscribe` |
| Admin | `POST /api/admin/auth`, `GET /api/admin/check`, analytics/export endpoints under `/api/admin/*` |

## Key Design Decisions

- **No authentication**: User selected from a dropdown, persisted in `localStorage`. Trust-based.
- **No cached progress**: `current_value` is always `SUM(progress_entries.value)` — computed server-side.
- **Pacing computed server-side**: `dashboardService.ts` handles all frequency math so the client is purely presentational.
- **Migrations on startup**: Server calls `runMigrations()` before `listen()` — zero manual steps in production.
- **PWA push notifications**: `pushService.ts` sends Web Push via VAPID. Requires HTTPS (Caddy + custom DNS). Users subscribe per-device; subscriptions stored in `push_subscriptions` table.
- **Admin dashboard**: Served from `admin-goals.ayhamhuq.com` and protected by `ADMIN_PIN`; the same client container renders admin mode based on the hostname.

## Development Practices

- TDD — tests first, then implementation
- Feature branches only — never commit to main directly
- PRs require: Summary (what) + Motivation (why), `AyhamHuq` as reviewer, Codex review comment
- Docs updated alongside code changes

## Roadmap

- ~~**V2**: Custom domain + Caddy reverse proxy (HTTPS via Let's Encrypt)~~ ✅ Done — `goals.ayhamhuq.com` active in production
- ~~**V2**: PWA push notifications replacing Twilio SMS~~ ✅ Done — `web-push` + VAPID, service worker, `push_subscriptions` table
- **V3**: Authentication (OAuth) and stronger admin authorization
- **V3**: Comments, pacing suggestions
- **V4**: Category leaderboards, shared group goals
- **V5**: Charts, heatmaps, PWA offline support

See [PLAN.md](./PLAN.md) for full phase breakdown and [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.
