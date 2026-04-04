ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS goal_type VARCHAR(15)
    NOT NULL DEFAULT 'accumulation'
    CHECK (goal_type IN ('accumulation', 'measurement'));

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS start_value NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
