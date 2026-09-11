-- Phase 5: User notification preferences

CREATE TABLE IF NOT EXISTS comms.notification_preferences (
  id                   TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id      TEXT         NOT NULL,
  user_id              TEXT         NOT NULL,

  -- Channel opt-ins
  in_app_enabled       BOOLEAN      NOT NULL DEFAULT true,
  email_enabled        BOOLEAN      NOT NULL DEFAULT true,
  sms_enabled          BOOLEAN      NOT NULL DEFAULT false,
  whatsapp_enabled     BOOLEAN      NOT NULL DEFAULT false,
  push_enabled         BOOLEAN      NOT NULL DEFAULT false,

  -- Language
  language             VARCHAR(10)  NOT NULL DEFAULT 'en',

  -- Quiet hours
  quiet_hours_enabled  BOOLEAN      NOT NULL DEFAULT false,
  quiet_hours_start    VARCHAR(5),
  quiet_hours_end      VARCHAR(5),
  quiet_days           TEXT[]       NOT NULL DEFAULT '{}',

  -- Muted categories
  muted_categories     TEXT[]       NOT NULL DEFAULT '{}',

  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON comms.notification_preferences (organization_id, user_id);
