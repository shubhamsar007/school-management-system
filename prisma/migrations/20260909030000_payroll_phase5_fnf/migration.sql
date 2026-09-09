-- CreateTable: fnf_settlements
CREATE TABLE "hr"."fnf_settlements" (
    "id"                      TEXT          NOT NULL,
    "organization_id"         TEXT          NOT NULL,
    "employee_id"             TEXT          NOT NULL,
    "separation_date"         DATE          NOT NULL,
    "separation_type"         VARCHAR(30)   NOT NULL,
    "last_working_day"        DATE          NOT NULL,
    "notice_period_days"      INTEGER       NOT NULL DEFAULT 0,
    "partial_month_days"      INTEGER       NOT NULL,
    "partial_month_salary"    DECIMAL(12,2) NOT NULL,
    "pending_leave_days"      DECIMAL(5,2)  NOT NULL DEFAULT 0,
    "leave_encashment_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gratuity_amount"         DECIMAL(12,2) NOT NULL DEFAULT 0,
    "loan_recovery_amount"    DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_payable"           DECIMAL(12,2) NOT NULL,
    "total_deductions"        DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_settlement"          DECIMAL(12,2) NOT NULL,
    "status"                  VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    "notes"                   TEXT,
    "approved_by"             TEXT,
    "approved_at"             TIMESTAMPTZ,
    "created_by"              TEXT          NOT NULL,
    "created_at"              TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              TIMESTAMPTZ   NOT NULL,

    CONSTRAINT "fnf_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fnf_settlements_organization_id_employee_id_idx"
    ON "hr"."fnf_settlements"("organization_id", "employee_id");
