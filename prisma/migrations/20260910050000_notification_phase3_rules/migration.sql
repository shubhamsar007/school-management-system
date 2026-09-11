-- Phase 3: Notification automation rules
-- Uses TEXT (not UUID) to match Prisma's String @id @default(uuid()) mapping

CREATE TABLE IF NOT EXISTS comms.notification_rules (
  id              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT         NOT NULL,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  event_type      VARCHAR(100) NOT NULL,
  template_id     TEXT,
  audience_type   VARCHAR(30)  NOT NULL,
  channels        TEXT[]       NOT NULL DEFAULT '{}',
  priority        VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
  category        VARCHAR(30)  NOT NULL DEFAULT 'GENERAL',
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_rules_org
  ON comms.notification_rules (organization_id);

CREATE INDEX IF NOT EXISTS idx_notification_rules_event_type
  ON comms.notification_rules (organization_id, event_type)
  WHERE is_active = true;
