# Family Goal Tracker - Implementation Plan

## Context

Building a lightweight web app for a family of 5-7 people to set monthly goals, track daily progress, and view each other's progress for accountability. Deploying to Hetzner CX23 via Docker Compose.

## Stack

- **Frontend:** React (Vite) + TypeScript + Material UI (Inter font, indigo/pink palette)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16
- **Data fetching:** @tanstack/react-query
- **Validation:** zod (server-side)
- **Deployment:** Docker Compose (nginx + node + postgres)
- **Notifications:** Twilio SMS (stubbed in MVP via `smsService.ts`, implement in V2)

## Database Schema

```sql
-- Future-proofed with group_id even though MVP has one group
groups (id UUID PK, name, created_at)
users (id UUID PK, group_id FK, display_name, avatar_color, phone, sort_order, last_active_at, created_at)
categories (id UUID PK, group_id FK, name, icon, sort_order, UNIQUE(group_id, name))
goals (id UUID PK, user_id FK, category_id FK, period_key CHAR(7), title, target_value NUMERIC, unit, frequency_type CHECK(total|daily|weekly), is_archived BOOL, created_at, updated_at)
progress_entries (id UUID PK, goal_id FK CASCADE, value NUMERIC, logged_for DATE, note, created_at, updated_at)
```

Key decisions:
- `period_key` as `'YYYY-MM'` string — simple to query/sort
- No `current_value` column on goals — always computed as `SUM(progress_entries.value)`
- `logged_for` allows backdating progress entries
- Goals editable anytime (trust-based system)

## Frequency Math (server-side)

```
total:    percentage = current / target * 100
daily:    total_target = target * days_in_month; expected = target * days_elapsed
weekly:   total_target = target * ceil(days_in_month/7); expected = target * weeks_elapsed
```

Both `percentage` and `on_track` (current >= expected) computed in `dashboardService.ts`.

## API Endpoints

| Area | Endpoints |
|------|-----------|
| Health | `GET /health` |
| Users | `GET /api/users`, `PATCH /api/users/:id/touch` |
| Categories | `GET /api/categories`, `POST /api/categories` |
| Goals | `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id`, `POST /api/goals/copy-from-previous` |
| Progress | `GET/POST /api/progress`, `PUT/DELETE /api/progress/:id` |
| Dashboard | `GET /api/dashboard/personal`, `GET /api/dashboard/group` |
| History | `GET /api/history`, `GET /api/history/:period_key` |

## Frontend Components

```
App (ErrorBoundary, ToastProvider)
├── UserSelectScreen (avatar grid, localStorage persistence)
├── Layout
│   ├── TopAppBar (user avatar/switcher, period selector, Personal/Group tabs)
│   ├── BottomNavigation (mobile: Dashboard / Add Goal / History)
│   └── MainContent
│       ├── PersonalDashboard (greeting, stats bar, GoalCards, loading/empty states)
│       ├── GroupDashboard (per-user accordion cards with avg progress)
│       ├── GoalFormDialog (create/edit, fullScreen on mobile)
│       ├── ProgressLogDialog (log with date picker, toast on success)
│       ├── ProgressHistoryDrawer (bottom drawer, inline edit, delete with confirm)
│       └── HistoryView (month grid cards → ArchivedMonthDetail read-only)
```

Mobile-first: BottomNav on mobile, full-width cards, fullScreen dialogs on small screens.

## Project Structure

```
Goals/
├── docker-compose.yml              # 3 services with healthchecks, env-var config, restart policies
├── docker-compose.sandbox.yml      # Override: points server at goals_sandbox DB + sets SANDBOX=true
├── .env.example                    # All required + optional vars (DB_PASSWORD, APP_PORT, Twilio)
├── dev.sh                          # Local development setup script (start|sandbox|stop|reset|...)
├── client/                     (Vite + React + MUI)
│   ├── src/
│   │   ├── api/                (axios client functions per resource)
│   │   ├── hooks/              (react-query hooks for all data + mutations)
│   │   ├── context/            (UserContext, PeriodContext)
│   │   ├── components/
│   │   │   ├── dashboard/      (PersonalDashboard, GroupDashboard, GoalCard)
│   │   │   ├── goals/          (GoalFormDialog)
│   │   │   ├── progress/       (ProgressLogDialog, ProgressHistoryDrawer, QuickLogButton)
│   │   │   └── history/        (HistoryView, ArchivedMonthDetail)
│   │   ├── utils/              (frequency labels, date helpers)
│   │   ├── types/              (shared TypeScript interfaces)
│   │   ├── theme.ts            (MUI theme — indigo/pink, Inter font, 12px radius)
│   │   ├── ErrorBoundary.tsx
│   │   └── Toast.tsx           (global snackbar system)
│   ├── Dockerfile              (multi-stage: Node build → nginx serve)
│   └── nginx.conf              (static files + /api/* proxy to server)
├── server/                     (Express + pg)
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts         (pg.Pool from DATABASE_URL)
│   │   │   ├── migrate.ts      (runs on startup; idempotent via schema_migrations table)
│   │   │   └── migrations/     (001_initial.sql — full schema)
│   │   ├── routes/             (users, categories, goals, progress, dashboard, history)
│   │   ├── services/
│   │   │   ├── dashboardService.ts   (aggregation + frequency math)
│   │   │   ├── frequencyCalc.ts      (pure function; 56 tests)
│   │   │   └── smsService.ts         (Twilio stub; real sending gated by TWILIO_ENABLED)
│   │   └── middleware/         (errorHandler, validate)
│   ├── seed.ts                 (1 group, 6 users, 8 categories)
│   └── Dockerfile              (multi-stage; copies migrations SQL into dist/)
└── db/
    ├── init.sql                (placeholder — schema managed by migrate.ts)
    └── init-sandbox.sql        (creates goals_sandbox DB on first Postgres init)
```

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Scaffolding + Database | ✅ Done |
| 2 | Backend API (all routes + 56 tests) | ✅ Done |
| 3 | Frontend Shell + User Selection | ✅ Done |
| 4 | Personal Dashboard | ✅ Done |
| 5 | Group Dashboard | ✅ Done |
| 6 | History + Monthly Flow | ✅ Done |
| 7 | Docker + Deployment config | ✅ Done |
| 8 | Polish (loading/empty/error states, UI) | ✅ Done |
| 9 | Sandbox mode (isolated goals_sandbox DB) | ✅ Done |

## Verification

1. `./dev.sh` — starts DB, runs migrations + seed, launches dev servers
   `./dev.sh sandbox` — same but against `goals_sandbox`; amber banner shows in UI
2. `docker compose up --build` — all 3 services start healthy (check `/health`)
3. Select a user → lands on personal dashboard with greeting
4. Create a goal (each frequency type) → appears with correct pacing
5. Log progress → bar updates, % recalculates, toast confirms
6. Switch to group view → all users' summaries visible
7. Navigate to past month → read-only, shows final stats
8. New month → empty state, "copy from last month" works
9. Mobile viewport → bottom nav, full-width cards, fullScreen dialogs

## Critical Files

- `server/src/db/migrations/001_initial.sql` — schema, everything depends on this
- `server/src/db/migrate.ts` — runs on every server start; idempotent
- `server/src/services/dashboardService.ts` — core business logic
- `server/src/services/frequencyCalc.ts` — frequency math (56 unit tests)
- `client/src/components/dashboard/PersonalDashboard.tsx` — primary user view
- `client/src/theme.ts` — visual identity for the whole app
- `docker-compose.yml` — deployment orchestration

---

## Future Enhancements (V2+)

- Authentication (OAuth/email+password)
- Twilio SMS notifications (stub already in `smsService.ts`)
- Admin role (unlock/edit goals, manage users)
- Social features (comments, likes, encouragement feed)
- Streak tracking, pacing suggestions
- Category leaderboards, shared group goals
- Calendar view, charts, GitHub-style heatmaps
- PWA support for offline + push notifications
- Code-split MUI bundle (currently ~581 kB, addressable with lazy imports)
