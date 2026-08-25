-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "academics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "admissions";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "attendance";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "comms";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "examinations";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finance";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "health";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "hr";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "iam";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "storage";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "students";

-- CreateTable
CREATE TABLE "core"."organizations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "website" VARCHAR(255),
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "country" CHAR(2) NOT NULL DEFAULT 'IN',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."campuses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "address_id" TEXT,
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "principal_employee_id" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."addresses" (
    "id" TEXT NOT NULL,
    "address_line_1" VARCHAR(255) NOT NULL,
    "address_line_2" VARCHAR(255),
    "landmark" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100),
    "state" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "country" CHAR(2) NOT NULL DEFAULT 'IN',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "key" VARCHAR(200) NOT NULL,
    "value" JSONB NOT NULL,
    "value_type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."domain_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "event_type" VARCHAR(200) NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "user_id" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam"."persons" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "profile_photo_file_id" TEXT,
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "alternate_phone" VARCHAR(30),
    "blood_group" VARCHAR(5),
    "nationality" VARCHAR(50) DEFAULT 'Indian',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam"."users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "username" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam"."roles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam"."permissions" (
    "id" TEXT NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam"."role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "iam"."user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "campus_id" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."employee_types" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "employee_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."departments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campus_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "head_employee_id" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."designations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."employees" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "employee_number" VARCHAR(50) NOT NULL,
    "employee_type_id" TEXT,
    "department_id" TEXT,
    "designation_id" TEXT,
    "campus_id" TEXT,
    "joining_date" DATE NOT NULL,
    "employment_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "reporting_manager_id" TEXT,
    "leaving_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."academic_years" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."academic_classes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "level" INTEGER,
    "display_order" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."sections" (
    "id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "academic_class_id" TEXT NOT NULL,
    "name" VARCHAR(10) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "capacity" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."subjects" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "subject_type" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."class_subjects" (
    "id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "max_marks" DECIMAL(6,2),
    "passing_marks" DECIMAL(6,2),
    "weightage" DECIMAL(5,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."teacher_assignments" (
    "id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "is_class_teacher" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."buildings" (
    "id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."rooms" (
    "id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "building_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "room_type" VARCHAR(30) NOT NULL,
    "capacity" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."periods" (
    "id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "period_number" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "period_type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."timetables" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academics"."timetable_entries" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "period_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "subject_id" TEXT,
    "teacher_id" TEXT,
    "room_id" TEXT,

    CONSTRAINT "timetable_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students"."students" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "admission_number" VARCHAR(50) NOT NULL,
    "registration_number" VARCHAR(50),
    "admission_date" DATE NOT NULL,
    "joining_date" DATE,
    "student_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "leaving_date" DATE,
    "leaving_reason" TEXT,
    "current_campus_id" TEXT,
    "house_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students"."guardians" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "occupation" VARCHAR(100),
    "employer" VARCHAR(200),
    "annual_income" DECIMAL(12,2),
    "education" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students"."student_guardians" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "relationship" VARCHAR(30) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_emergency_contact" BOOLEAN NOT NULL DEFAULT false,
    "can_pickup" BOOLEAN NOT NULL DEFAULT false,
    "can_receive_notifications" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students"."student_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "roll_number" VARCHAR(20),
    "class_teacher_id" TEXT,
    "enrollment_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "promotion_status" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students"."houses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "color" VARCHAR(20),
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students"."student_house_memberships" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "house_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,

    CONSTRAINT "student_house_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."student_attendance" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "check_in_time" TIME,
    "check_out_time" TIME,
    "remarks" TEXT,
    "marked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."employee_attendance" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "check_in_time" TIME,
    "check_out_time" TIME,
    "work_hours" DECIMAL(4,2),
    "remarks" TEXT,
    "marked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."leave_types" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "applicable_to" VARCHAR(30) NOT NULL,
    "annual_limit" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "carry_forward" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."leave_balances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."leave_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."substitution_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "leave_request_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "substitution_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."substitution_assignments" (
    "id" TEXT NOT NULL,
    "substitution_request_id" TEXT NOT NULL,
    "timetable_entry_id" TEXT NOT NULL,
    "original_teacher_id" TEXT NOT NULL,
    "substitute_teacher_id" TEXT,
    "algorithm_score" DECIMAL(6,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUGGESTED',
    "assigned_by" TEXT,
    "notified_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "substitution_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance"."substitution_candidate_scores" (
    "id" TEXT NOT NULL,
    "substitution_request_id" TEXT NOT NULL,
    "candidate_employee_id" TEXT NOT NULL,
    "subject_proficiency_score" DECIMAL(5,2) NOT NULL,
    "workload_score" DECIMAL(5,2) NOT NULL,
    "fairness_score" DECIMAL(5,2) NOT NULL,
    "department_affinity_score" DECIMAL(5,2) NOT NULL,
    "total_score" DECIMAL(6,2) NOT NULL,
    "disqualified_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "substitution_candidate_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage"."files" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "storage_provider" VARCHAR(20) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum" VARCHAR(64),
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage"."documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "document_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "expiry_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions"."admission_enquiries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campus_id" TEXT,
    "academic_year_id" TEXT,
    "student_name" VARCHAR(200) NOT NULL,
    "parent_name" VARCHAR(200),
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(255),
    "class_interested_id" TEXT,
    "source" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'NEW',
    "assigned_to" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions"."admission_applications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "enquiry_id" TEXT,
    "application_number" VARCHAR(50) NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_person_id" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions"."admission_documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "file_id" TEXT NOT NULL,
    "verification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."fee_heads" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "is_refundable" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "fee_heads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."fee_structures" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."fee_structure_items" (
    "id" TEXT NOT NULL,
    "fee_structure_id" TEXT NOT NULL,
    "fee_head_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" VARCHAR(20) NOT NULL,
    "due_day" INTEGER,

    CONSTRAINT "fee_structure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."student_fee_assignments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "fee_structure_id" TEXT NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "scholarship_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_fee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."fee_invoices" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fine" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."fee_invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "fee_head_id" TEXT NOT NULL,
    "description" VARCHAR(255),
    "amount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "fee_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."fee_payments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" VARCHAR(20) NOT NULL,
    "transaction_reference" VARCHAR(255),
    "payment_date" DATE NOT NULL,
    "received_by" TEXT NOT NULL,
    "gateway_response" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."payment_allocations" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."fee_refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "refund_number" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "refund_method" VARCHAR(20) NOT NULL,
    "transaction_reference" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "fee_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."salary_components" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "component_type" VARCHAR(20) NOT NULL,
    "calculation_type" VARCHAR(30) NOT NULL,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."salary_structures" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "basic_salary" DECIMAL(12,2) NOT NULL,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."employee_salary_components" (
    "id" TEXT NOT NULL,
    "salary_structure_id" TEXT NOT NULL,
    "salary_component_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "percentage" DECIMAL(5,2),

    CONSTRAINT "employee_salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."payroll_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."payroll_records" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "working_days" INTEGER,
    "present_days" INTEGER,
    "basic" DECIMAL(12,2) NOT NULL,
    "gross" DECIMAL(12,2) NOT NULL,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr"."payroll_items" (
    "id" TEXT NOT NULL,
    "payroll_record_id" TEXT NOT NULL,
    "salary_component_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."exam_types" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,

    CONSTRAINT "exam_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."grading_systems" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "grading_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."grade_rules" (
    "id" TEXT NOT NULL,
    "grading_system_id" TEXT NOT NULL,
    "grade" VARCHAR(5) NOT NULL,
    "min_percentage" DECIMAL(5,2) NOT NULL,
    "max_percentage" DECIMAL(5,2) NOT NULL,
    "grade_point" DECIMAL(4,2),
    "remark" VARCHAR(50),

    CONSTRAINT "grade_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."exams" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "exam_type_id" TEXT NOT NULL,
    "grading_system_id" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."exam_subjects" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "exam_date" DATE,
    "start_time" TIME,
    "end_time" TIME,
    "max_marks" DECIMAL(6,2) NOT NULL,
    "passing_marks" DECIMAL(6,2) NOT NULL,
    "weightage" DECIMAL(5,2) NOT NULL DEFAULT 100,

    CONSTRAINT "exam_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."exam_marks" (
    "id" TEXT NOT NULL,
    "exam_subject_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "marks" DECIMAL(6,2),
    "grade" VARCHAR(5),
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "entered_by" TEXT,
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."exam_results" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "total_marks" DECIMAL(8,2),
    "max_total_marks" DECIMAL(8,2),
    "percentage" DECIMAL(5,2),
    "grade" VARCHAR(5),
    "grade_point" DECIMAL(4,2),
    "result_status" VARCHAR(20) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."homework" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assigned_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "max_marks" DECIMAL(6,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."homework_submissions" (
    "id" TEXT NOT NULL,
    "homework_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "marks" DECIMAL(6,2),
    "remarks" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examinations"."homework_submission_files" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "homework_submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health"."student_health_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "blood_group" VARCHAR(5),
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "vision_left" VARCHAR(20),
    "vision_right" VARCHAR(20),
    "known_allergies" TEXT[],
    "medical_conditions" TEXT[],
    "medications" TEXT[],
    "special_needs" TEXT,
    "emergency_contact_name" VARCHAR(200),
    "emergency_contact_phone" VARCHAR(30),
    "doctor_name" VARCHAR(200),
    "doctor_phone" VARCHAR(30),
    "insurance_provider" VARCHAR(200),
    "insurance_policy_number" VARCHAR(100),
    "recorded_at" DATE,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms"."announcements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campus_id" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "audience_type" VARCHAR(30) NOT NULL,
    "target_class_id" TEXT,
    "publish_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms"."notification_templates" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms"."notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms"."notification_deliveries" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_message_id" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms"."ptm_schedules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "campus_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "date" DATE NOT NULL,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 15,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ptm_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms"."ptm_teacher_slots" (
    "id" TEXT NOT NULL,
    "ptm_schedule_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ptm_teacher_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comms"."ptm_bookings" (
    "id" TEXT NOT NULL,
    "ptm_schedule_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "slot_start" TIMESTAMP(3) NOT NULL,
    "slot_end" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
    "meeting_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ptm_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "core"."organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_organization_id_code_key" ON "core"."campuses"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "settings_organization_id_key_key" ON "core"."settings"("organization_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "users_person_id_key" ON "iam"."users"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_email_key" ON "iam"."users"("organization_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organization_id_code_key" ON "iam"."roles"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_resource_action_key" ON "iam"."permissions"("module", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_campus_id_key" ON "iam"."user_roles"("user_id", "role_id", "campus_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_person_id_key" ON "hr"."employees"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organization_id_employee_number_key" ON "hr"."employees"("organization_id", "employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_organization_id_code_key" ON "academics"."academic_years"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "sections_campus_id_academic_class_id_code_key" ON "academics"."sections"("campus_id", "academic_class_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_organization_id_code_key" ON "academics"."subjects"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_academic_year_id_class_id_subject_id_key" ON "academics"."class_subjects"("academic_year_id", "class_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_entries_timetable_id_day_of_week_period_id_sectio_key" ON "academics"."timetable_entries"("timetable_id", "day_of_week", "period_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_person_id_key" ON "students"."students"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_organization_id_admission_number_key" ON "students"."students"("organization_id", "admission_number");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_person_id_key" ON "students"."guardians"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_student_id_guardian_id_key" ON "students"."student_guardians"("student_id", "guardian_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_id_academic_year_id_key" ON "students"."student_enrollments"("student_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_house_memberships_student_id_academic_year_id_key" ON "students"."student_house_memberships"("student_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_student_id_date_key" ON "attendance"."student_attendance"("student_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "employee_attendance_employee_id_date_key" ON "attendance"."employee_attendance"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employee_id_leave_type_id_academic_year_id_key" ON "attendance"."leave_balances"("employee_id", "leave_type_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_applications_organization_id_application_number_key" ON "admissions"."admission_applications"("organization_id", "application_number");

-- CreateIndex
CREATE UNIQUE INDEX "fee_heads_organization_id_code_key" ON "finance"."fee_heads"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_organization_id_invoice_number_key" ON "finance"."fee_invoices"("organization_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_organization_id_receipt_number_key" ON "finance"."fee_payments"("organization_id", "receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_organization_id_period_start_period_end_key" ON "hr"."payroll_runs"("organization_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "exam_types_organization_id_code_key" ON "examinations"."exam_types"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "exam_marks_exam_subject_id_student_id_key" ON "examinations"."exam_marks"("exam_subject_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_exam_id_student_id_key" ON "examinations"."exam_results"("exam_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "homework_submissions_homework_id_student_id_key" ON "examinations"."homework_submissions"("homework_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "ptm_bookings_ptm_schedule_id_teacher_id_slot_start_key" ON "comms"."ptm_bookings"("ptm_schedule_id", "teacher_id", "slot_start");

-- AddForeignKey
ALTER TABLE "core"."campuses" ADD CONSTRAINT "campuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."campuses" ADD CONSTRAINT "campuses_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "core"."addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."settings" ADD CONSTRAINT "settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."domain_events" ADD CONSTRAINT "domain_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."users" ADD CONSTRAINT "users_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "iam"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "iam"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "iam"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "iam"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam"."user_roles" ADD CONSTRAINT "user_roles_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "core"."campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employee_types" ADD CONSTRAINT "employee_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."departments" ADD CONSTRAINT "departments_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "core"."campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."designations" ADD CONSTRAINT "designations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "iam"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_employee_type_id_fkey" FOREIGN KEY ("employee_type_id") REFERENCES "hr"."employee_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hr"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_designation_id_fkey" FOREIGN KEY ("designation_id") REFERENCES "hr"."designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "core"."campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "hr"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."academic_years" ADD CONSTRAINT "academic_years_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."academic_classes" ADD CONSTRAINT "academic_classes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."sections" ADD CONSTRAINT "sections_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "core"."campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."sections" ADD CONSTRAINT "sections_academic_class_id_fkey" FOREIGN KEY ("academic_class_id") REFERENCES "academics"."academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."subjects" ADD CONSTRAINT "subjects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."class_subjects" ADD CONSTRAINT "class_subjects_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academics"."academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."class_subjects" ADD CONSTRAINT "class_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academics"."academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."class_subjects" ADD CONSTRAINT "class_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "academics"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academics"."academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "hr"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academics"."academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "academics"."sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "academics"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."buildings" ADD CONSTRAINT "buildings_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "core"."campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."rooms" ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "academics"."buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."periods" ADD CONSTRAINT "periods_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "core"."campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."timetables" ADD CONSTRAINT "timetables_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academics"."academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."timetable_entries" ADD CONSTRAINT "timetable_entries_timetable_id_fkey" FOREIGN KEY ("timetable_id") REFERENCES "academics"."timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."timetable_entries" ADD CONSTRAINT "timetable_entries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "academics"."periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."timetable_entries" ADD CONSTRAINT "timetable_entries_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "academics"."sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."timetable_entries" ADD CONSTRAINT "timetable_entries_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "academics"."subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academics"."timetable_entries" ADD CONSTRAINT "timetable_entries_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "academics"."rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."students" ADD CONSTRAINT "students_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."students" ADD CONSTRAINT "students_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "iam"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."students" ADD CONSTRAINT "students_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "students"."houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."guardians" ADD CONSTRAINT "guardians_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "iam"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_guardians" ADD CONSTRAINT "student_guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "students"."guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_enrollments" ADD CONSTRAINT "student_enrollments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academics"."academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_enrollments" ADD CONSTRAINT "student_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "academics"."academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_enrollments" ADD CONSTRAINT "student_enrollments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "academics"."sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_house_memberships" ADD CONSTRAINT "student_house_memberships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."student_house_memberships" ADD CONSTRAINT "student_house_memberships_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "students"."houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."student_attendance" ADD CONSTRAINT "student_attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."student_attendance" ADD CONSTRAINT "student_attendance_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "students"."student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."employee_attendance" ADD CONSTRAINT "employee_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "attendance"."leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hr"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "attendance"."leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."substitution_requests" ADD CONSTRAINT "substitution_requests_leave_request_id_fkey" FOREIGN KEY ("leave_request_id") REFERENCES "attendance"."leave_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."substitution_assignments" ADD CONSTRAINT "substitution_assignments_substitution_request_id_fkey" FOREIGN KEY ("substitution_request_id") REFERENCES "attendance"."substitution_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance"."substitution_candidate_scores" ADD CONSTRAINT "substitution_candidate_scores_substitution_request_id_fkey" FOREIGN KEY ("substitution_request_id") REFERENCES "attendance"."substitution_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage"."documents" ADD CONSTRAINT "documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions"."admission_applications" ADD CONSTRAINT "admission_applications_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "admissions"."admission_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions"."admission_documents" ADD CONSTRAINT "admission_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "admissions"."admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions"."admission_documents" ADD CONSTRAINT "admission_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."fee_structure_items" ADD CONSTRAINT "fee_structure_items_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "finance"."fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."fee_structure_items" ADD CONSTRAINT "fee_structure_items_fee_head_id_fkey" FOREIGN KEY ("fee_head_id") REFERENCES "finance"."fee_heads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "finance"."fee_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."fee_invoice_items" ADD CONSTRAINT "fee_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."fee_invoice_items" ADD CONSTRAINT "fee_invoice_items_fee_head_id_fkey" FOREIGN KEY ("fee_head_id") REFERENCES "finance"."fee_heads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "finance"."fee_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."fee_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."fee_refunds" ADD CONSTRAINT "fee_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "finance"."fee_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employee_salary_components" ADD CONSTRAINT "employee_salary_components_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "hr"."salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."employee_salary_components" ADD CONSTRAINT "employee_salary_components_salary_component_id_fkey" FOREIGN KEY ("salary_component_id") REFERENCES "hr"."salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."payroll_records" ADD CONSTRAINT "payroll_records_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "hr"."payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."payroll_items" ADD CONSTRAINT "payroll_items_payroll_record_id_fkey" FOREIGN KEY ("payroll_record_id") REFERENCES "hr"."payroll_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr"."payroll_items" ADD CONSTRAINT "payroll_items_salary_component_id_fkey" FOREIGN KEY ("salary_component_id") REFERENCES "hr"."salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."grade_rules" ADD CONSTRAINT "grade_rules_grading_system_id_fkey" FOREIGN KEY ("grading_system_id") REFERENCES "examinations"."grading_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."exams" ADD CONSTRAINT "exams_exam_type_id_fkey" FOREIGN KEY ("exam_type_id") REFERENCES "examinations"."exam_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."exams" ADD CONSTRAINT "exams_grading_system_id_fkey" FOREIGN KEY ("grading_system_id") REFERENCES "examinations"."grading_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."exam_subjects" ADD CONSTRAINT "exam_subjects_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "examinations"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."exam_marks" ADD CONSTRAINT "exam_marks_exam_subject_id_fkey" FOREIGN KEY ("exam_subject_id") REFERENCES "examinations"."exam_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."exam_results" ADD CONSTRAINT "exam_results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "examinations"."exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."homework_submissions" ADD CONSTRAINT "homework_submissions_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "examinations"."homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."homework_submission_files" ADD CONSTRAINT "homework_submission_files_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "examinations"."homework_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examinations"."homework_submission_files" ADD CONSTRAINT "homework_submission_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comms"."notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "comms"."notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comms"."ptm_teacher_slots" ADD CONSTRAINT "ptm_teacher_slots_ptm_schedule_id_fkey" FOREIGN KEY ("ptm_schedule_id") REFERENCES "comms"."ptm_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comms"."ptm_bookings" ADD CONSTRAINT "ptm_bookings_ptm_schedule_id_fkey" FOREIGN KEY ("ptm_schedule_id") REFERENCES "comms"."ptm_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
