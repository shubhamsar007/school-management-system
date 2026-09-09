-- Make leave_request_id nullable on substitution_requests
-- (allows manual substitution requests not tied to a formal leave record)
ALTER TABLE attendance.substitution_requests
  ALTER COLUMN leave_request_id DROP NOT NULL;

-- Add decline_reason to substitution_assignments
ALTER TABLE attendance.substitution_assignments
  ADD COLUMN decline_reason TEXT;

-- Add escalated_at to substitution_requests
ALTER TABLE attendance.substitution_requests
  ADD COLUMN escalated_at TIMESTAMPTZ;
