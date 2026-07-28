ALTER TABLE gift_card_challenges
    ADD COLUMN IF NOT EXISTS gift_card_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS gift_card_amount VARCHAR(50),
    ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS leader_name VARCHAR(100);
