# Family Goal Tracker

A lightweight web app for small, trusted groups (families, close friends) to set monthly goals, track daily progress, and hold each other accountable through shared visibility.

## What It Does

- **Monthly goals**: Each user creates goals with a title, category, target value, unit, and frequency (total, daily, or weekly).
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
| Deployment | Docker Compose (nginx + Express + Postgres) |

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
│   │   │   └── smsService.ts        # Twilio stub (TWILIO_ENABLED=false)
│   │   └── middleware/      # errorHandler, validate (zod)
│   ├── seed.ts              # 1 group, 6 users, 8 categories
│   └── Dockerfile
│
├── db/
│   └── init.sql             # Placeholder — schema managed by migrate.ts
│
├── docker-compose.yml       # 3 services, healthchecks, env-var config
├── .env.example             # All required vars
└── dev.sh                   # Local dev setup script
```

## Quick Start (Local Dev)

```bash
./dev.sh
```

This starts the database, runs migrations + seed, and launches both dev servers.

### Manual setup

```bash
# 1. Copy env
cp .env.example .env

# 2. Start the database
docker compose up db -d

# 3. Install + migrate + seed
cd server && npm install && npm run migrate && npm run seed && cd ..

# 4. Start the backend (hot reload)
cd server && npm run dev

# 5. In another terminal, start the frontend
cd client && npm install && npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:3001 · Health: http://localhost:3001/health

## Production Deployment

```bash
cp .env.example .env
# Set DB_PASSWORD, APP_PORT (default 80), NODE_ENV=production

docker compose up --build -d
```

Migrations run automatically on server startup. Seed is only needed once:
```bash
docker compose exec server node -e "require('./dist/seed')"
```

## API

All endpoints under `/api`. Full reference in [ARCHITECTURE.md](./ARCHITECTURE.md).

| Area | Key Endpoints |
|------|--------------|
| Health | `GET /health` |
| Users | `GET /api/users`, `PATCH /api/users/:id/touch` |
| Categories | `GET/POST /api/categories` |
| Goals | `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id`, `POST /api/goals/copy-from-previous` |
| Progress | `GET/POST /api/progress`, `PUT/DELETE /api/progress/:id` |
| Dashboard | `GET /api/dashboard/personal`, `GET /api/dashboard/group` |
| History | `GET /api/history`, `GET /api/history/:period_key` |

## Key Design Decisions

- **No authentication**: User selected from a dropdown, persisted in `localStorage`. Trust-based.
- **No cached progress**: `current_value` is always `SUM(progress_entries.value)` — computed server-side.
- **Pacing computed server-side**: `dashboardService.ts` handles all frequency math so the client is purely presentational.
- **Migrations on startup**: Server calls `runMigrations()` before `listen()` — zero manual steps in production.
- **Twilio stubbed**: `smsService.ts` logs to console until `TWILIO_ENABLED=true` in V2.

## Development Practices

- TDD — tests first, then implementation
- Feature branches only — never commit to main directly
- PRs require: Summary (what) + Motivation (why), `AyhamHuq` as reviewer, Claude review comment
- Docs updated alongside code changes

## Roadmap

- **V2**: Authentication (OAuth), real Twilio SMS, admin role
- **V3**: Comments, streak tracking, pacing suggestions
- **V4**: Category leaderboards, shared group goals
- **V5**: Charts, heatmaps, PWA / offline support

See [PLAN.md](./PLAN.md) for full phase breakdown and [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.
