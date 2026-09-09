-- Phase 2: Payroll — attendance & leave integration
-- Add LOP, leave breakdown, and overtime fields to payroll_records

ALTER TABLE hr.payroll_records
  ALTER COLUMN present_days TYPE DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS absent_days       INTEGER,
  ADD COLUMN IF NOT EXISTS half_day_count    INTEGER,
  ADD COLUMN IF NOT EXISTS paid_leave_days   DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS unpaid_leave_days DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS lop_days          DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS lop_amount        DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS overtime_hours    DECIMAL(6,2);
