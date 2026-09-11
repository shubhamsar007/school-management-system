-- Phase 7: Advanced — escalation fields on rules, scheduled messages, inbound messages

-- Add audience_target + escalation fields to notification_rules
ALTER TABLE "comms"."notification_rules"
  ADD COLUMN "audience_target"        VARCHAR(255),
  ADD COLUMN "escalate_after_minutes" INTEGER,
  ADD COLUMN "escalate_to_type"       VARCHAR(30),
  ADD COLUMN "escalate_channels"      TEXT[] NOT NULL DEFAULT '{}';

-- Scheduled notifications
CREATE TABLE "comms"."notification_schedules" (
  "id"               TEXT NOT NULL,
  "organization_id"  TEXT NOT NULL,
  "name"             VARCHAR(200) NOT NULL,
  "description"      TEXT,
  "recurrence"       VARCHAR(20) NOT NULL DEFAULT 'ONCE',
  "scheduled_at"     TIMESTAMPTZ,
  "cron_expression"  VARCHAR(100),
  "next_run_at"      TIMESTAMPTZ,
  "last_run_at"      TIMESTAMPTZ,
  "run_count"        INTEGER NOT NULL DEFAULT 0,
  "title"            VARCHAR(255) NOT NULL,
  "message"          TEXT NOT NULL,
  "audience_type"    VARCHAR(30) NOT NULL,
  "audience_target"  VARCHAR(255),
  "template_id"      TEXT,
  "channels"         TEXT[] NOT NULL DEFAULT '{}',
  "priority"         VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  "category"         VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
  "is_active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "notification_schedules_pkey" PRIMARY KEY ("id")
);

-- Inbound messages (two-way channel)
CREATE TABLE "comms"."inbound_messages" (
  "id"               TEXT NOT NULL,
  "organization_id"  TEXT NOT NULL,
  "channel"          VARCHAR(20) NOT NULL,
  "from_address"     VARCHAR(255) NOT NULL,
  "body"             TEXT NOT NULL,
  "provider_msg_id"  VARCHAR(255),
  "status"           VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
  "processed_at"     TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "inbound_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_schedules_org_active_next" ON "comms"."notification_schedules"("organization_id", "is_active", "next_run_at");
CREATE INDEX "inbound_messages_org_channel" ON "comms"."inbound_messages"("organization_id", "channel");
