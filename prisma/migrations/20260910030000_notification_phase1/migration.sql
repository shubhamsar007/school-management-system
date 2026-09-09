-- Phase 1: Strengthen Notification model with category, priority, and deep-link fields
ALTER TABLE comms.notifications
  ADD COLUMN IF NOT EXISTS category    VARCHAR(30)  NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS priority    VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS entity_id   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS action_url  VARCHAR(500);
