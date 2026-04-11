CREATE TABLE IF NOT EXISTS likes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id       UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    liked_for     DATE NOT NULL,
    liker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(goal_id, liked_for, liker_user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_goal ON likes(goal_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(liker_user_id);
