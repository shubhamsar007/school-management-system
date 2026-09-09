-- Phase 3: Payroll — adjustments engine (bonuses, overtime, arrears, reimbursements, loans)

-- Add adjustment & loan aggregate columns to payroll_records
ALTER TABLE hr.payroll_records
  ADD COLUMN IF NOT EXISTS total_adjustments    DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS total_loan_deductions DECIMAL(12,2);

-- Payroll adjustments (bonuses, overtime pay, arrears, reimbursements, deductions)
CREATE TABLE IF NOT EXISTS hr.payroll_adjustments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL,
  employee_id      UUID NOT NULL,
  adjustment_type  VARCHAR(30) NOT NULL,
  sub_type         VARCHAR(50),
  description      TEXT,
  amount           DECIMAL(12,2) NOT NULL,
  effective_period VARCHAR(7) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  approved_by      UUID,
  approved_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  payroll_record_id UUID,
  created_by       UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee loans & salary advances
CREATE TABLE IF NOT EXISTS hr.employee_loans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID NOT NULL,
  employee_id        UUID NOT NULL,
  loan_type          VARCHAR(30) NOT NULL,
  principal_amount   DECIMAL(12,2) NOT NULL,
  outstanding_amount DECIMAL(12,2) NOT NULL,
  monthly_deduction  DECIMAL(12,2) NOT NULL,
  start_date         DATE NOT NULL,
  end_date           DATE,
  reason             TEXT,
  status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  approved_by        UUID,
  approved_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly loan installment records
CREATE TABLE IF NOT EXISTS hr.loan_installments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id       UUID NOT NULL REFERENCES hr.employee_loans(id),
  payroll_run_id UUID,
  amount        DECIMAL(12,2) NOT NULL,
  paid_at       TIMESTAMPTZ,
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  CONSTRAINT loan_installments_loan_id_payroll_run_id_unique
    UNIQUE (loan_id, payroll_run_id)
);
