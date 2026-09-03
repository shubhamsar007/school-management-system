-- Employee HR Expansion Migration
-- Adds new fields to employees table and creates 14 new HR sub-resource tables
-- All ID columns use TEXT (matching Prisma's String @id @default(uuid()) convention)

-- ─── Extend employees table ────────────────────────────────────────────────────

ALTER TABLE hr.employees
  ADD COLUMN IF NOT EXISTS leaving_reason        TEXT,
  ADD COLUMN IF NOT EXISTS employment_type       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS probation_start       DATE,
  ADD COLUMN IF NOT EXISTS probation_end         DATE,
  ADD COLUMN IF NOT EXISTS confirmation_date     DATE,
  ADD COLUMN IF NOT EXISTS contract_start        DATE,
  ADD COLUMN IF NOT EXISTS contract_end          DATE,
  ADD COLUMN IF NOT EXISTS notice_period_days    INT,
  ADD COLUMN IF NOT EXISTS work_location         VARCHAR(100);

-- ─── Qualifications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_qualifications (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id          TEXT NOT NULL REFERENCES hr.employees(id),
  degree               VARCHAR(200) NOT NULL,
  institution          VARCHAR(200) NOT NULL,
  university           VARCHAR(200),
  specialization       VARCHAR(200),
  start_year           INT NOT NULL,
  end_year             INT,
  percentage           DECIMAL(5, 2),
  grade                VARCHAR(20),
  certificate_file_id  TEXT,
  verification_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Experience ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_experiences (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id         TEXT NOT NULL REFERENCES hr.employees(id),
  organization        VARCHAR(200) NOT NULL,
  designation         VARCHAR(200) NOT NULL,
  department          VARCHAR(200),
  start_date          DATE NOT NULL,
  end_date            DATE,
  responsibilities    TEXT,
  reason_for_leaving  VARCHAR(200),
  certificate_file_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Emergency Contacts ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_emergency_contacts (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id     TEXT NOT NULL REFERENCES hr.employees(id),
  name            VARCHAR(200) NOT NULL,
  relationship    VARCHAR(100) NOT NULL,
  phone           VARCHAR(30) NOT NULL,
  alternate_phone VARCHAR(30),
  address         TEXT,
  priority        INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Lifecycle Events ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_lifecycle_events (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id    TEXT NOT NULL REFERENCES hr.employees(id),
  event_type     VARCHAR(50) NOT NULL,
  from_status    VARCHAR(50),
  to_status      VARCHAR(50) NOT NULL,
  effective_date DATE NOT NULL,
  reason         TEXT,
  remarks        TEXT,
  performed_by   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Bank Details ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_bank_details (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id    TEXT NOT NULL REFERENCES hr.employees(id),
  bank_name      VARCHAR(200) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  ifsc_code      VARCHAR(20) NOT NULL,
  account_type   VARCHAR(20) NOT NULL DEFAULT 'SAVINGS',
  is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Performance Reviews ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.performance_reviews (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL,
  employee_id      TEXT NOT NULL REFERENCES hr.employees(id),
  academic_year_id TEXT NOT NULL,
  review_type      VARCHAR(30) NOT NULL,
  reviewed_by      TEXT NOT NULL,
  review_date      DATE NOT NULL,
  overall_rating   DECIMAL(3, 1),
  remarks          TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.performance_criteria (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  review_id     TEXT NOT NULL REFERENCES hr.performance_reviews(id) ON DELETE CASCADE,
  criteria_name VARCHAR(200) NOT NULL,
  rating        DECIMAL(3, 1) NOT NULL,
  remarks       TEXT
);

CREATE TABLE IF NOT EXISTS hr.performance_goals (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  review_id TEXT NOT NULL REFERENCES hr.performance_reviews(id) ON DELETE CASCADE,
  goal      TEXT NOT NULL,
  target    VARCHAR(500),
  status    VARCHAR(20) NOT NULL DEFAULT 'PENDING'
);

-- ─── Training Records ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.training_records (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id          TEXT NOT NULL REFERENCES hr.employees(id),
  title                VARCHAR(255) NOT NULL,
  training_type        VARCHAR(30) NOT NULL,
  provider             VARCHAR(200),
  start_date           DATE NOT NULL,
  end_date             DATE,
  duration_hours       INT,
  certificate_file_id  TEXT,
  expiry_date          DATE,
  verification_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Assets ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_assets (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL,
  employee_id      TEXT NOT NULL REFERENCES hr.employees(id),
  asset_type       VARCHAR(50) NOT NULL,
  asset_code       VARCHAR(100),
  description      VARCHAR(500),
  issue_date       DATE NOT NULL,
  expected_return  DATE,
  returned_date    DATE,
  condition        VARCHAR(20) NOT NULL DEFAULT 'GOOD',
  return_condition VARCHAR(20),
  issued_by        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Onboarding ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_onboarding (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id  TEXT NOT NULL UNIQUE REFERENCES hr.employees(id),
  status       VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.onboarding_tasks (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  onboarding_id TEXT NOT NULL REFERENCES hr.employee_onboarding(id) ON DELETE CASCADE,
  task_name     VARCHAR(255) NOT NULL,
  category      VARCHAR(50) NOT NULL,
  is_required   BOOLEAN NOT NULL DEFAULT TRUE,
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  completed_by  TEXT,
  remarks       TEXT
);

-- ─── Offboarding ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr.employee_offboarding (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id       TEXT NOT NULL UNIQUE REFERENCES hr.employees(id),
  exit_type         VARCHAR(30) NOT NULL,
  exit_date         DATE NOT NULL,
  last_working_date DATE NOT NULL,
  reason            TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'INITIATED',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr.offboarding_tasks (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  offboarding_id TEXT NOT NULL REFERENCES hr.employee_offboarding(id) ON DELETE CASCADE,
  task_name      VARCHAR(255) NOT NULL,
  category       VARCHAR(50) NOT NULL,
  is_required    BOOLEAN NOT NULL DEFAULT TRUE,
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  completed_by   TEXT,
  remarks        TEXT
);
