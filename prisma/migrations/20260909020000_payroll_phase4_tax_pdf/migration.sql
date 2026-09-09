-- Phase 4: Tax/TDS engine — tds_amount + tax_regime on payroll_records

ALTER TABLE hr.payroll_records
  ADD COLUMN IF NOT EXISTS tds_amount  DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS tax_regime  VARCHAR(10);

-- Employee investment declarations per financial year
CREATE TABLE IF NOT EXISTS hr.tax_declarations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL,
  employee_id      UUID NOT NULL,
  financial_year   VARCHAR(9) NOT NULL,
  tax_regime       VARCHAR(10) NOT NULL DEFAULT 'NEW',
  section_80c      DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hra_exemption    DECIMAL(12, 2) NOT NULL DEFAULT 0,
  other_deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tax_declarations_org_emp_fy_unique
    UNIQUE (organization_id, employee_id, financial_year)
);

-- Per-payroll-record TDS computation audit snapshot
CREATE TABLE IF NOT EXISTS hr.tax_calculations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id  UUID NOT NULL UNIQUE
                     REFERENCES hr.payroll_records(id) ON DELETE CASCADE,
  tax_declaration_id UUID REFERENCES hr.tax_declarations(id),
  tax_regime         VARCHAR(10) NOT NULL,
  annualized_gross   DECIMAL(14, 2) NOT NULL,
  total_exemptions   DECIMAL(12, 2) NOT NULL DEFAULT 0,
  taxable_income     DECIMAL(14, 2) NOT NULL,
  income_tax_annual  DECIMAL(12, 2) NOT NULL,
  rebate_87a         DECIMAL(12, 2) NOT NULL DEFAULT 0,
  surcharge          DECIMAL(12, 2) NOT NULL DEFAULT 0,
  education_cess     DECIMAL(12, 2) NOT NULL,
  total_annual_tax   DECIMAL(12, 2) NOT NULL,
  monthly_tds        DECIMAL(12, 2) NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_declarations_employee
  ON hr.tax_declarations (organization_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_record
  ON hr.tax_calculations (payroll_record_id);
