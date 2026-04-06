ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sms_reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_hour SMALLINT NOT NULL DEFAULT 20;

CREATE TABLE IF NOT EXISTS notification_log (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(20) NOT NULL,
    sent_for          DATE NOT NULL,
    sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    twilio_sid        VARCHAR(50),
    UNIQUE(user_id, notification_type, sent_for)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
