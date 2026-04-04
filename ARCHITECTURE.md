# Architecture Reference

## Full Database Schema

```sql
CREATE TABLE groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id),
    display_name    VARCHAR(100) NOT NULL,
    avatar_color    VARCHAR(7) NOT NULL DEFAULT '#1976d2',
    phone           VARCHAR(20),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    last_active_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_group ON users(group_id);

CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id),
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, name)
);

CREATE TABLE goals (
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
CREATE INDEX idx_goals_user_period ON goals(user_id, period_key);
CREATE INDEX idx_goals_category ON goals(category_id);

CREATE TABLE progress_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    value       NUMERIC(10,2) NOT NULL,
    logged_for  DATE NOT NULL,
    note        VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_progress_goal ON progress_entries(goal_id);
CREATE INDEX idx_progress_logged_for ON progress_entries(goal_id, logged_for);
```

## API Response Shapes

### Personal Dashboard Response
```json
{
  "period_key": "2026-04",
  "days_in_month": 30,
  "days_elapsed": 3,
  "weeks_elapsed": 0.43,
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

## Frequency Calculation Logic

```typescript
// total: no pacing, just percentage
percentage = (current / target) * 100

// daily: target is per-day
totalTarget = target * daysInMonth
expected = target * daysElapsed
percentage = (current / totalTarget) * 100
onTrack = current >= expected

// weekly: target is per-week
weeksInMonth = Math.ceil(daysInMonth / 7)
totalTarget = target * weeksInMonth
weeksElapsed = daysElapsed / 7
expected = target * weeksElapsed
percentage = (current / totalTarget) * 100
onTrack = current >= expected
```

## Docker Compose Architecture

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│  nginx   │────▶│  Express │────▶│ Postgres │
│ (client) │     │ (server) │     │   (db)   │
│  :80     │     │  :3001   │     │  :5432   │
└─────────┘     └──────────┘     └──────────┘
     │
     ├── Serves React build (static files)
     └── Proxies /api/* to Express server
```

## Key Dependencies

### Server
- express, cors, dotenv
- pg (node-postgres)
- zod (validation)
- date-fns (date math)
- typescript, tsx (dev)

### Client
- react, react-dom, react-router-dom
- @mui/material, @mui/icons-material, @emotion/react, @emotion/styled
- @tanstack/react-query
- axios
- date-fns
- typescript, vite (dev)
