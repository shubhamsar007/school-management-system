-- Substitute pools
CREATE TABLE attendance.substitute_pools (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT        NOT NULL,
  name             VARCHAR(120) NOT NULL,
  description      TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  pool_bonus_pts   INTEGER     NOT NULL DEFAULT 5,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE attendance.substitute_pool_members (
  pool_id      TEXT        NOT NULL REFERENCES attendance.substitute_pools(id) ON DELETE CASCADE,
  employee_id  TEXT        NOT NULL,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pool_id, employee_id)
);

-- Date-range unavailability overrides (distinct from weekly availability)
CREATE TABLE attendance.teacher_unavailability_overrides (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id  TEXT        NOT NULL,
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE attendance.substitution_audit_logs (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT        NOT NULL,
  request_id       TEXT        REFERENCES attendance.substitution_requests(id) ON DELETE SET NULL,
  assignment_id    TEXT        REFERENCES attendance.substitution_assignments(id) ON DELETE SET NULL,
  action           VARCHAR(80) NOT NULL,
  actor            TEXT,
  details          JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_audit_request    ON attendance.substitution_audit_logs(request_id);
CREATE INDEX idx_sub_audit_assignment ON attendance.substitution_audit_logs(assignment_id);
CREATE INDEX idx_sub_audit_org        ON attendance.substitution_audit_logs(organization_id, created_at DESC);
