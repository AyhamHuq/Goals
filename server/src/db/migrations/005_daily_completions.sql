CREATE TABLE IF NOT EXISTS daily_completions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    completed_date  DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_completions_user
  ON daily_completions(user_id, completed_date);
