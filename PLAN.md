# Family Goal Tracker - Implementation Plan

## Context

Building a lightweight web app for a family of 5-7 people to set monthly goals, track daily progress, and view each other's progress for accountability. Greenfield project — empty directory, deploying to Hetzner CX23 via Docker Compose.

## Stack

- **Frontend:** React (Vite) + TypeScript + Material UI
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16
- **Data fetching:** @tanstack/react-query
- **Validation:** zod (server-side)
- **Deployment:** Docker Compose (nginx + node + postgres)
- **Notifications:** Twilio SMS (stub in MVP, implement in V2)

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

Both `percentage` and `on_track` (current >= expected) computed in dashboard service.

## API Endpoints

| Area | Endpoints |
|------|-----------|
| Users | `GET /api/users`, `PATCH /api/users/:id/touch` |
| Categories | `GET /api/categories`, `POST /api/categories` |
| Goals | `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id`, `POST /api/goals/copy-from-previous` |
| Progress | `GET/POST /api/progress`, `PUT/DELETE /api/progress/:id` |
| Dashboard | `GET /api/dashboard/personal`, `GET /api/dashboard/group` |
| History | `GET /api/history`, `GET /api/history/:period_key` |

## Frontend Components

```
App
├── UserSelectScreen (dropdown, localStorage persistence)
├── Layout
│   ├── TopAppBar (user avatar, period selector, view toggle)
│   ├── BottomNavigation (mobile: Dashboard / Add Goal / History)
│   └── MainContent
│       ├── PersonalDashboard (GoalCards with progress bars, QuickLogButton)
│       ├── GroupDashboard (UserGoalSummary per user, CategoryComparison)
│       ├── GoalFormDialog (create/edit)
│       ├── ProgressLogDialog (log with date picker)
│       ├── ProgressHistoryDrawer (view/edit/delete entries)
│       └── HistoryView (past months, archived goals)
```

Mobile-first: BottomNav on mobile, full-width cards, fullScreen dialogs on small screens.

## Project Structure

```
Goals/
├── docker-compose.yml
├── .env.example
├── client/          (Vite + React + MUI)
│   ├── src/
│   │   ├── api/     (axios client functions)
│   │   ├── hooks/   (react-query hooks)
│   │   ├── context/ (UserContext, PeriodContext)
│   │   ├── components/ (dashboard/, goals/, progress/, history/)
│   │   ├── utils/   (frequency math, date helpers)
│   │   └── types/
│   ├── Dockerfile
│   └── nginx.conf
├── server/          (Express + pg)
│   ├── src/
│   │   ├── db/      (pool, migrations)
│   │   ├── routes/
│   │   ├── services/ (goalService, dashboardService, frequencyCalc)
│   │   └── middleware/ (errorHandler, validate)
│   ├── seed.ts
│   └── Dockerfile
└── db/
    └── init.sql
```

## Monthly Lifecycle

- Goals belong to a `period_key`. Current period = server clock `YYYY-MM`.
- No automatic archival. Past periods are read-only in the UI.
- New month: empty state prompts "Create goals" or "Copy from last month."
- Mid-month joins: user creates goals with current period_key, pacing calculated from month start.

## Implementation Order

### Phase 1: Scaffolding + Database
- Init git repo, `.gitignore`
- Scaffold server (Express + TypeScript + pg + zod)
- Scaffold client (Vite + React + TypeScript + MUI)
- `docker-compose.yml` with postgres service
- Migration `001_initial.sql` with full schema
- Seed script (1 group, 5-7 users, default categories)

### Phase 2: Backend API
- Express setup (app, config, error handler, db pool)
- Users routes → Categories routes → Goals CRUD → Progress CRUD
- Dashboard service (frequency math, aggregation)
- History endpoints

### Phase 3: Frontend - Shell + User Selection
- MUI theme (mobile-first), contexts, router
- UserSelectScreen, Layout, TopAppBar, BottomNav

### Phase 4: Frontend - Personal Dashboard
- API client + react-query hooks
- PersonalDashboard, GoalCard, QuickLogButton
- ProgressLogDialog, GoalFormDialog, ProgressHistoryDrawer

### Phase 5: Frontend - Group Dashboard
- GroupDashboard, UserGoalSummary, CategoryComparison

### Phase 6: History + Monthly Flow
- HistoryView, ArchivedMonthDetail, PeriodSelector
- "Copy from last month" flow

### Phase 7: Docker + Deployment
- Dockerfiles (multi-stage for client), nginx.conf
- Full docker-compose with all 3 services
- Deploy to Hetzner

### Phase 8: Polish
- Loading/empty/error states
- Responsive tweaks on real devices
- Twilio SMS stub (env vars, send function, no actual calls)

## Verification

1. `docker compose up --build` — all 3 services start healthy
2. Select a user from dropdown → lands on personal dashboard
3. Create a goal (each frequency type) → appears in dashboard
4. Log progress → progress bar updates, % recalculates, on-track indicator works
5. Switch to group view → see all users' goals with progress
6. Navigate to a past month → read-only, shows final stats
7. New month → empty state, "copy from last month" works
8. Test on mobile viewport → bottom nav, full-width cards, fullScreen dialogs

## Critical Files

- `server/src/db/migrations/001_initial.sql` — schema, everything depends on this
- `server/src/services/dashboardService.ts` — core business logic (aggregation + frequency math)
- `client/src/components/dashboard/PersonalDashboard.tsx` — primary user view
- `client/src/components/UserSelectScreen.tsx` — app entry point
- `docker-compose.yml` — deployment orchestration

---

## Future Enhancements (V2+)

- Authentication (OAuth/email+password)
- Twilio SMS notifications (foundation stubbed in MVP)
- Admin role (unlock/edit goals, manage users)
- Social features (comments, likes, encouragement feed)
- Streak tracking, pacing suggestions
- Category leaderboards, shared group goals
- Calendar view, charts, GitHub-style heatmaps
- PWA support for offline + push notifications
