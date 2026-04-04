# Family Goal Tracker

A lightweight web app for small, trusted groups (families, close friends) to set monthly goals, track daily progress, and hold each other accountable through shared visibility.

## What It Does

- **Monthly goals**: Each user creates goals at the start of a month with a title, category, target value, unit, and frequency (total, daily, or weekly).
- **Progress logging**: Users log incremental progress (e.g., "+1 lesson", "+30 minutes") throughout the month, with support for backdating entries.
- **Personal dashboard**: View your own goals with progress bars, percentage complete, pacing indicators (on-track vs behind), and remaining amounts.
- **Group dashboard**: See every group member's goals and progress side-by-side, with category-based comparisons and "last active" indicators.
- **History**: Browse past months to see archived goals and final completion stats.
- **Monthly lifecycle**: At month boundary, users are prompted to create new goals or copy from the previous month. Past months become read-only.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, built with Vite |
| UI Framework | Material UI (MUI) |
| Data Fetching | @tanstack/react-query + axios |
| Backend | Node.js + Express + TypeScript |
| Validation | zod |
| Database | PostgreSQL 16 |
| Deployment | Docker Compose (nginx + Express + Postgres) |

## Project Structure

```
Goals/
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/             # Axios client functions (users, goals, progress, dashboard)
│   │   ├── hooks/           # React Query hooks for data fetching
│   │   ├── context/         # UserContext (selected user), PeriodContext (current month)
│   │   ├── components/
│   │   │   ├── dashboard/   # PersonalDashboard, GroupDashboard, GoalCard, CategoryComparison
│   │   │   ├── goals/       # GoalFormDialog, GoalList
│   │   │   ├── progress/    # ProgressLogDialog, ProgressHistoryDrawer, QuickLogButton
│   │   │   └── history/     # HistoryView, ArchivedMonthDetail
│   │   ├── utils/           # Frequency math, date helpers, formatters
│   │   └── types/           # Shared TypeScript interfaces
│   ├── Dockerfile           # Multi-stage: build with Node, serve with nginx
│   └── nginx.conf           # Serves static files, proxies /api/* to backend
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts      # PostgreSQL connection pool
│   │   │   ├── migrate.ts   # Migration runner
│   │   │   └── migrations/  # SQL migration files
│   │   ├── routes/          # Express route handlers (users, categories, goals, progress, dashboard)
│   │   ├── services/        # Business logic
│   │   │   ├── dashboardService.ts   # Core: aggregation, frequency math, pacing
│   │   │   ├── goalService.ts        # Goal CRUD, copy-from-previous
│   │   │   ├── progressService.ts    # Progress entry CRUD
│   │   │   └── frequencyCalc.ts      # Expected value and on-track calculations
│   │   └── middleware/      # Error handler, zod validation
│   ├── seed.ts              # Seeds default group, users, and categories
│   └── Dockerfile
│
├── db/
│   └── init.sql             # CREATE DATABASE, extensions
│
├── docker-compose.yml       # Orchestrates all 3 services
├── .env.example             # Required environment variables
├── CLAUDE.md                # Development practices for AI agents
├── PLAN.md                  # Implementation plan with phases
└── ARCHITECTURE.md          # Detailed technical reference (schema, API shapes, math)
```

## Database Design

Five tables, designed to support future multi-group and authentication features:

```
groups ──< users ──< goals ──< progress_entries
              │         │
              │         └──> categories
              └──────────────────┘ (via group_id)
```

- **groups**: Organizational unit. MVP has one ("Family"), but schema supports multiple.
- **users**: Real entities with `group_id`, not just names. Includes `phone` for future SMS.
- **categories**: Per-group (e.g., Fitness, Learning, Reading). Shared across users.
- **goals**: Belong to a user + `period_key` (e.g., `"2026-04"`). Include target value, unit, and frequency type.
- **progress_entries**: Incremental logs tied to a goal. `logged_for` allows backdating. Current progress is always `SUM(value)`, never a cached column.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full SQL schema.

## API Overview

All endpoints are under `/api`. The backend computes all aggregation and pacing server-side.

| Area | Key Endpoints | Purpose |
|------|--------------|---------|
| Users | `GET /users`, `PATCH /users/:id/touch` | List users for selection, update last-active timestamp |
| Categories | `GET /categories`, `POST /categories` | List/create goal categories |
| Goals | `GET/POST /goals`, `PUT/DELETE /goals/:id` | Full CRUD, plus `POST /goals/copy-from-previous` |
| Progress | `GET/POST /progress`, `PUT/DELETE /progress/:id` | Log, edit, and delete progress entries |
| Dashboard | `GET /dashboard/personal`, `GET /dashboard/group` | Aggregated views with computed percentages and pacing |
| History | `GET /history`, `GET /history/:period_key` | Past months listing and detail |

## Key Business Logic

### Frequency Types and Pacing

Goals have one of three frequency types. The server computes pacing differently for each:

| Type | Target Meaning | Total Target | Expected (pacing) | On Track? |
|------|---------------|-------------|-------------------|-----------|
| `total` | X per month | `target_value` | N/A | N/A |
| `daily` | X per day | `target * days_in_month` | `target * days_elapsed` | `current >= expected` |
| `weekly` | X per week | `target * weeks_in_month` | `target * weeks_elapsed` | `current >= expected` |

### Monthly Lifecycle

- No cron jobs or automatic archival.
- `period_key` (`YYYY-MM`) determines which month a goal belongs to. The current period is the server's clock.
- Past periods are read-only (enforced in UI).
- New month shows an empty state with options to create fresh goals or copy from last month.

### MVP Simplifications

- **No authentication**: Users select their name from a dropdown. Selection is persisted in `localStorage`.
- **Trust-based editing**: Goals and progress entries are editable/deletable anytime.
- **Single group**: One hardcoded group, but the schema supports multiple.

## Development

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 16 (or use the Docker Compose postgres service)

### Local Development

```bash
# Start the database
docker compose up db -d

# Run migrations and seed
cd server
npm install
npm run migrate
npm run seed

# Start the backend (dev mode with hot reload)
npm run dev

# In another terminal, start the frontend
cd client
npm install
npm run dev
```

### Production Deployment

```bash
# Configure environment
cp .env.example .env
# Edit .env with your DB_PASSWORD and other settings

# Build and run all services
docker compose up --build -d
```

### Development Practices

- **Test-driven development**: Write tests first, then implement.
- **Feature branches**: All work happens in feature branches, never directly on main.
- **Clean commits**: Only commit when code is in a good, working state.
- **Push when green**: Only push to remote after all tests pass.
- **PRs when ready**: Create a pull request when the feature is complete and tested.

## Roadmap

The MVP focuses on core goal tracking. Planned future enhancements:

- **V2**: Authentication (OAuth), Twilio SMS notifications, admin role
- **V3**: Social features (comments, likes), streak tracking, pacing suggestions
- **V4**: Category leaderboards, shared group goals, team challenges
- **V5**: Calendar view, charts, GitHub-style contribution heatmaps, PWA support

See [PLAN.md](./PLAN.md) for the full implementation plan and phasing.
