# Architecture Reference

## Full Database Schema

```sql
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id),
    display_name    VARCHAR(100) NOT NULL,
    avatar_color    VARCHAR(7) NOT NULL DEFAULT '#1976d2',
    phone           VARCHAR(20),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    last_active_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    value       NUMERIC(10,2) NOT NULL,
    logged_for  DATE NOT NULL,
    note        VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_progress_goal ON progress_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_logged_for ON progress_entries(goal_id, logged_for);

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

Used by Docker healthcheck and load balancers.

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
Body: { goal_id, value, logged_for (YYYY-MM-DD), note? }
→ 201 ProgressEntry

PUT /api/progress/:id
Body: { value?, logged_for?, note? }
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
        { "id": "uuid", "value": 1, "logged_for": "2026-04-02", "note": null }
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

## SMS Service (Twilio Stub)

`server/src/services/smsService.ts` exports `sendSms({ to, message })`.

- When `TWILIO_ENABLED=false` (default): logs to console, returns immediately
- When `TWILIO_ENABLED=true`: throws a not-implemented error (placeholder for V2 integration)

To activate in V2: uncomment the Twilio client code and install the `twilio` npm package.

## Docker Compose Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    nginx      │────▶│   Express    │────▶│  Postgres 16 │
│   (client)    │     │   (server)   │     │    (db)      │
│  :${APP_PORT} │     │    :3001     │     │   :5432      │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ├── Serves React build (static files)
       └── Proxies /api/* → Express server

All services: restart: unless-stopped, healthcheck configured
Startup order: db healthy → server healthy → client starts
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `goals` | PostgreSQL password |
| `APP_PORT` | `80` | Host port for the client/nginx |
| `NODE_ENV` | `production` | Node environment |
| `TWILIO_ENABLED` | `false` | Set `true` to enable real SMS in V2 |
| `TWILIO_ACCOUNT_SID` | — | Twilio credentials (V2) |
| `TWILIO_AUTH_TOKEN` | — | Twilio credentials (V2) |
| `TWILIO_FROM_NUMBER` | — | Twilio sender number (V2) |

## Key Dependencies

### Server
- express, cors, dotenv
- pg (node-postgres)
- zod (validation)
- date-fns (date math in frequency calc)
- typescript, tsx (dev), ts-jest + jest + supertest (tests)

### Client
- react 18, react-dom, react-router-dom v6
- @mui/material v5, @mui/icons-material, @emotion/react, @emotion/styled
- @tanstack/react-query v5
- axios
- date-fns
- Inter font (Google Fonts CDN)
- typescript, vite, vitest (dev)
