-- SubstitutionPolicy: org-level configurable substitution settings
CREATE TABLE attendance.substitution_policies (
  id                    TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id       TEXT         NOT NULL UNIQUE,
  max_subs_per_day      INTEGER      NOT NULL DEFAULT 2,
  max_subs_per_week     INTEGER      NOT NULL DEFAULT 6,
  auto_assign_threshold INTEGER      NOT NULL DEFAULT 85,
  escalate_after_minutes INTEGER     NOT NULL DEFAULT 5,
  fairness_window_days  INTEGER      NOT NULL DEFAULT 7,
  weight_subject        INTEGER      NOT NULL DEFAULT 40,
  weight_workload       INTEGER      NOT NULL DEFAULT 30,
  weight_fairness       INTEGER      NOT NULL DEFAULT 20,
  weight_dept           INTEGER      NOT NULL DEFAULT 10,
  mode                  VARCHAR(20)  NOT NULL DEFAULT 'HYBRID',
  notify_teacher        BOOLEAN      NOT NULL DEFAULT true,
  notify_parents        BOOLEAN      NOT NULL DEFAULT false,
  subject_match_required BOOLEAN     NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);
