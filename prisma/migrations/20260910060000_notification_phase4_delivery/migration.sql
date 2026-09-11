-- Phase 4: Delivery engine — idempotency, retry tracking, provider config

-- 1. Idempotency key on notifications
ALTER TABLE comms.notifications
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_idempotency_key
  ON comms.notifications (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 2. Retry tracking on notification_deliveries
ALTER TABLE comms.notification_deliveries
  ADD COLUMN IF NOT EXISTS retry_count   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_retry
  ON comms.notification_deliveries (status, next_retry_at)
  WHERE status IN ('FAILED', 'RETRYING');

-- 3. Provider configuration table (TEXT PKs to match Prisma mapping)
CREATE TABLE IF NOT EXISTS comms.notification_provider_configs (
  id              TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT         NOT NULL,
  channel         VARCHAR(20)  NOT NULL,
  provider_name   VARCHAR(50)  NOT NULL,
  is_enabled      BOOLEAN      NOT NULL DEFAULT false,
  credentials     JSONB        NOT NULL DEFAULT '{}',
  priority        INTEGER      NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, channel, provider_name)
);

CREATE INDEX IF NOT EXISTS idx_provider_configs_org
  ON comms.notification_provider_configs (organization_id, channel)
  WHERE is_enabled = true;
