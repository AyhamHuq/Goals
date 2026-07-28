CREATE TABLE IF NOT EXISTS gift_card_challenges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id),
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'judging', 'completed', 'cancelled')),
    winner_id   UUID REFERENCES users(id),
    awarded_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gcc_group_status ON gift_card_challenges(group_id, status);
