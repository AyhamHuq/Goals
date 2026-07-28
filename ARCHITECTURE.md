# Architecture Reference

## Full Database Schema

```sql
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id              UUID NOT NULL REFERENCES groups(id),
    display_name          VARCHAR(100) NOT NULL,
    avatar_color          VARCHAR(7) NOT NULL DEFAULT '#1976d2',
    sort_order            SMALLINT NOT NULL DEFAULT 0,
    last_active_at        TIMESTAMPTZ,
    push_reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);

CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id),
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, name)
);

CREATE TABLE IF NOT EXISTS goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    category_id     UUID REFERENCES categories(id),
    period_key      CHAR(7) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    target_value    NUMERIC(10,2) NOT NULL,
    unit            VARCHAR(50) NOT NULL,
    frequency_type  VARCHAR(10) NOT NULL CHECK (frequency_type IN ('total','daily','weekly')),
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_period ON goals(user_id, period_key);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category_id);

CREATE TABLE IF NOT EXISTS progress_entries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id      UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    value        NUMERIC(10,2) NOT NULL,
    logged_for   DATE NOT NULL,
    note         VARCHAR(500),
    logged_unit  VARCHAR(50),    -- original unit entered by user (if different from goal unit)
    logged_value NUMERIC(10,2),  -- original value entered by user before conversion
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_progress_goal ON progress_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_logged_for ON progress_entries(goal_id, logged_for);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint    TEXT NOT NULL UNIQUE,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Internal migration tracking (managed by migrate.ts, not part of app schema)
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Migration System

Migrations live in `server/src/db/migrations/` as numbered SQL files (`001_initial.sql`, etc.).

`server/src/db/migrate.ts` exports `runMigrations()`:
- Called automatically on server startup (before `app.listen`)
- Idempotent: tracks applied files in `schema_migrations`, skips already-applied ones
- Each migration runs in a transaction — rolls back on error
- Can also be run standalone: `npm run migrate`

To add a migration: create `002_add_something.sql` in the migrations directory. It will be picked up on next startup.

## API Reference

### Health

```
GET /health
→ { status: 'ok', sandbox: false, timestamp: '2026-04-04T...' }
```

Used by the Docker healthcheck and local backend checks. In production, Caddy routes public DNS to the client container, so `https://goals.ayhamhuq.com/health` is handled by the React SPA unless the proxy is extended to expose backend health directly.

### Users

```
GET /api/users
→ User[]  (ordered by sort_order)

PATCH /api/users/:id/touch
→ 204  (updates last_active_at = NOW())
```

### Categories

```
GET /api/categories?group_id=<uuid>
→ Category[]  (ordered by sort_order)

POST /api/categories
Body: { group_id: uuid, name: string, icon?: string }
→ 201 Category
```

### Goals

```
GET /api/goals?user_id=<uuid>&period_key=<YYYY-MM>
→ Goal[]  (with category_name, category_icon joined)

POST /api/goals
Body: { user_id, category_id?, period_key, title, target_value, unit, frequency_type }
→ 201 Goal

PUT /api/goals/:id
Body: { title?, target_value?, unit?, frequency_type?, category_id? }
→ Goal  (404 if not found)

DELETE /api/goals/:id
→ 204  (404 if not found)

POST /api/goals/copy-from-previous
Body: { user_id, from_period_key, to_period_key }
→ 201 { copied: number }
```

### Progress

```
GET /api/progress?goal_id=<uuid>
→ ProgressEntry[]

POST /api/progress
Body: { goal_id, value, logged_for (YYYY-MM-DD), note?, logged_unit?, logged_value? }
→ 201 ProgressEntry

PUT /api/progress/:id
Body: { value?, logged_for?, note?, logged_unit?, logged_value? }
→ ProgressEntry

DELETE /api/progress/:id
→ 204
```

### Dashboard

```
GET /api/dashboard/personal?user_id=<uuid>&period_key=<YYYY-MM>
→ PersonalDashboardResponse

GET /api/dashboard/group?group_id=<uuid>&period_key=<YYYY-MM>
→ GroupDashboardUserSummary[]
```

### History

```
GET /api/history?user_id=<uuid>
→ string[]  (distinct period_keys where user has goals, desc)

GET /api/history/:period_key?user_id=<uuid>
→ PersonalDashboardResponse  (same shape as personal dashboard, read-only intent)
```

### Push Notifications

```
GET /api/push/vapid-public-key
→ { publicKey: string }

POST /api/push/subscribe
Body: { user_id: uuid, endpoint: string, p256dh: string, auth: string }
→ 201

DELETE /api/push/unsubscribe
Body: { endpoint: string }
→ 204
```

### User Preferences

```
PATCH /api/users/:id/preferences
Body: { push_reminders_enabled?: boolean, reminder_hour?: number }
→ 200 User
```

## API Response Shapes

### PersonalDashboardResponse
```json
{
  "period_key": "2026-04",
  "days_in_month": 30,
  "days_elapsed": 4,
  "weeks_elapsed": 0.57,
  "goals": [
    {
      "id": "uuid",
      "title": "Read books",
      "category": { "id": "uuid", "name": "Reading" },
      "target_value": 4,
      "unit": "books",
      "frequency_type": "total",
      "current_value": 1,
      "expected_value": null,
      "percentage": 25,
      "on_track": null,
      "recent_entries": [
        { "id": "uuid", "value": 1, "logged_for": "2026-04-02", "note": null, "logged_unit": null, "logged_value": null }
      ]
    }
  ]
}
```

### GroupDashboardUserSummary
```json
{
  "user": { "id": "uuid", "display_name": "Alice", "avatar_color": "#5C6BC0" },
  "goals_summary": {
    "total_goals": 5,
    "completed": 1,
    "on_track": 3,
    "avg_percentage": 42.5
  }
}
```

## Frequency Calculation Logic

Implemented in `server/src/services/frequencyCalc.ts` (56 unit tests).

```typescript
// total: no pacing
percentage = (current / target) * 100
expectedValue = null
onTrack = null

// daily: target is per-day
totalTarget = target * daysInMonth
expectedValue = target * daysElapsed          // daysElapsed = differenceInDays(ref, monthStart) + 1
percentage = (current / totalTarget) * 100
onTrack = current >= expectedValue

// weekly: target is per-week
weeksInMonth = Math.ceil(daysInMonth / 7)
totalTarget = target * weeksInMonth
weeksElapsed = daysElapsed / 7
expectedValue = target * weeksElapsed
percentage = (current / totalTarget) * 100
onTrack = current >= expectedValue
```

Edge cases handled:
- Zero target → percentage = 0 (no division by zero)
- `referenceDate` clamped to `[monthStart, monthEnd]` so past/future period queries are stable
- `daysElapsed` minimum 1 (day 1 of month has 1 day elapsed)

## Streak Tracking

`server/src/services/streakService.ts` exports `getUserStreak(userId, referenceDate?)`.

Computed on-the-fly from `progress_entries` — no cached column needed. Uses a SQL query for distinct `logged_for` dates across all of the user's goals, then walks backward counting consecutive days.

**Grace period:** if a user logged yesterday but not yet today, the streak is still alive. It only resets when the last logged day is 2+ days ago. The streak is included in the `PersonalDashboardResponse` as `streak: number` and displayed as a flame chip in the stats bar.

## Push Notification / Reminder Service

### Web Push (`server/src/services/pushService.ts`)

Sends Web Push notifications via the `web-push` npm package using VAPID authentication. Requires `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_EMAIL` env vars.

### Daily Reminders (`server/src/services/reminderService.ts`)

Exports `sendDailyReminders(currentHour, today)`. Runs via `node-cron` every hour at `:00` (server/src/index.ts). For each user with `push_reminders_enabled=true` and `reminder_hour` matching the current hour:
1. Skips if they already logged progress today
2. Skips if `notification_log` already has an entry for today (idempotent)
3. Computes their streak, composes an encouraging message
4. Sends a Web Push notification to all of the user's subscribed devices and records in `notification_log`

### User Preferences API

`PATCH /api/users/:id/preferences` — update `push_reminders_enabled`, `reminder_hour`.

### Push Subscription API

```
GET /api/push/vapid-public-key
→ { publicKey: string }

POST /api/push/subscribe
Body: { user_id: uuid, endpoint: string, p256dh: string, auth: string }
→ 201

DELETE /api/push/unsubscribe
Body: { endpoint: string }
→ 204
```

### Daily Completions Table

```sql
CREATE TABLE daily_completions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    completed_date  DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, completed_date)
);
```

Users mark a day as done via **`POST /api/daily-completions`**. This drives the streak — not raw progress entries. GET/DELETE endpoints support range queries and undo.

### Notification Log Table

```sql
CREATE TABLE notification_log (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(20) NOT NULL,   -- 'push_reminder'
    sent_for          DATE NOT NULL,
    sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, notification_type, sent_for)  -- prevents double-sends
);
```

## Deployment Architecture

### Production + Staging on One Server

Both environments run on the same Hetzner CX23 using Docker Compose project isolation:

```
Host (Hetzner CX23)
│
├── Docker project: goals-prod   (compose -p goals-prod -f docker-compose.yml -f docker-compose.prod.yml)
│   ├── client/nginx  :80   (Docker web alias: goals-prod-client)
│   ├── server        :3001 (internal only)
│   └── db            :5432 (internal only)   database: goals
│
└── Docker project: goals-staging (compose -p goals-staging -f docker-compose.yml -f docker-compose.staging.yml)
    ├── client/nginx  :80   (Docker web alias: goals-staging-client)
    ├── server        :3001 (internal only)
    └── db            :5432 (internal only)   database: goals_staging
```

The `-p` (project name) flag gives each stack its own namespaced containers, network, and volume (`goals-prod_pgdata` vs `goals-staging_pgdata`), so the two environments are fully isolated at the data layer.

Caddy is owned by the sibling Portfolio deployment and terminates HTTPS on the shared Docker `web` network. Production serves `goals.ayhamhuq.com` and `admin-goals.ayhamhuq.com`, both reverse-proxied to the production Goals client container. Staging can use `staging-goals.ayhamhuq.com` and `admin-staging-goals.ayhamhuq.com`, both reverse-proxied to the staging Goals client container. HTTPS is required for the Web Push API and the PWA service worker.

The admin dashboard is intentionally hostname-based: the React app enters admin mode when the hostname starts with `admin.` or `admin-`. That means `admin-goals.ayhamhuq.com` is the production admin entrypoint; `/admin` on `goals.ayhamhuq.com` is not an admin route. The production admin name is hyphenated so it remains a first-level subdomain covered by Cloudflare Universal SSL.

### Per-Environment Docker Compose

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base: 3 services, healthchecks, shared config |
| `docker-compose.prod.yml` | Override: adds the `goals-prod-client` alias on the external `web` network |
| `docker-compose.staging.yml` | Override: `goals_staging` DB, `NODE_ENV=staging`, and `goals-staging-client` alias |
| `docker-compose.sandbox.yml` | Local dev only: `goals_sandbox` DB, `SANDBOX=true` |

### Single-Stack Internal Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    nginx      │────▶│   Express    │────▶│  Postgres 16 │
│   (client)    │     │   (server)   │     │    (db)      │
│      :80      │     │    :3001     │     │   :5432      │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ├── Serves React build (static files)
       └── Proxies /api/* → Express server

All services: restart: unless-stopped, healthcheck configured
Startup order: db healthy → server healthy → client starts
```

### CI/CD Pipeline

Defined in `.github/workflows/ci.yml`:

| Trigger | Jobs run |
|---------|----------|
| PR to `main` | All test/lint/typecheck/build jobs |
| PR to `main` | All jobs + `deploy-staging` from the PR branch |
| Push to `main` (merged PR) | All jobs + `deploy-prod` |

Deploy jobs SSH into the server, reset `/opt/goals` to the deployed ref (`github.head_ref` for staging, `main` for production), and run `docker compose up -d --build --remove-orphans`.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `goals` | PostgreSQL password |
| `NODE_ENV` | `production` | Node environment (`production` / `staging`) |
| `VAPID_PUBLIC_KEY` | — | VAPID public key for Web Push (generate with `npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | — | VAPID private key for Web Push |
| `VAPID_EMAIL` | — | Contact email sent with Web Push requests (e.g. `mailto:you@example.com`) |
| `TZ` | `America/New_York` | Server timezone for reminder scheduling |
| `ADMIN_PIN` | — | PIN required by `/api/admin/auth` for the admin dashboard |

## Key Dependencies

### Server
- express, cors, dotenv
- pg (node-postgres)
- zod (validation)
- date-fns (date math in frequency calc)
- web-push (Web Push / VAPID notifications)
- node-cron (hourly reminder scheduler)
- typescript, tsx (dev), ts-jest + jest + supertest (tests)

### Client
- react 18, react-dom, react-router-dom v6
- @mui/material v5, @mui/icons-material, @emotion/react, @emotion/styled
- @tanstack/react-query v5
- axios
- date-fns
- Inter font (Google Fonts CDN)
- PWA manifest + service worker (`public/sw.js`) for push notification support
- typescript, vite, vitest (dev)
