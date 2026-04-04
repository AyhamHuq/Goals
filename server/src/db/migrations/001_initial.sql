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
