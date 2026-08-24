# School Management System — Master Plan

> Repository: https://github.com/shubhamsar007/school-management-system
> Plan created: 2026-08-24
> Status: Pre-implementation (approved for build)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Stakeholders & Roles](#2-stakeholders--roles)
3. [Technology Stack](#3-technology-stack)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Overall Architecture](#5-overall-architecture)
6. [Module Scope — v1 / v2 / v3](#6-module-scope--v1--v2--v3)
7. [Database Architecture](#7-database-architecture)
8. [Complete Database Schema](#8-complete-database-schema)
9. [Schema Issues — Identified & Resolved](#9-schema-issues--identified--resolved)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Substitute Teacher Algorithm](#11-substitute-teacher-algorithm)
12. [API Design](#12-api-design)
13. [Background Jobs & Queues](#13-background-jobs--queues)
14. [Notification Engine](#14-notification-engine)
15. [File Storage Architecture](#15-file-storage-architecture)
16. [Development Phases](#16-development-phases)
17. [Deployment Architecture](#17-deployment-architecture)
18. [Open Decisions](#18-open-decisions)

---

## 1. Project Overview

A **modular, multi-tenant School ERP** that covers the complete lifecycle of a school — students, staff, academics, finance, operations, and communication. Not a CRUD student tracker. A system of record for every person, every process, and every transaction in a school.

**Design principles:**
- TypeScript everywhere (frontend + backend + shared types)
- Multi-tenant from day one (organization → campus hierarchy)
- Academic-year-aware for all business data
- Immutable financial history
- Event-driven internal communication (future extensibility without rewrites)
- Enrollment-based academic history (never a `student.class_id`)
- Person-centric people architecture (no data duplication)
- Modular monolith (not microservices — a school is not Netflix)

---

## 2. Stakeholders & Roles

| Role | Primary Responsibilities |
|---|---|
| **Super Admin** | Full system control — school setup, user management, system configuration, global reports |
| **Principal** | Academic oversight, staff management, leave approvals, school-wide reports |
| **Vice Principal** | Delegate of principal, timetable oversight, discipline |
| **Teacher** | Class schedule, attendance marking, homework, exam marks, leave requests |
| **Accountant** | Fee collection, invoices, receipts, payroll processing, financial reports |
| **Receptionist** | Admissions, visitor log, parent inquiries, announcement management |
| **Librarian** | Book catalog, issue/return, fines, membership |
| **Transport Staff** | Route management, vehicle assignment, student transport log |
| **Student** | View schedule, results, attendance, homework, fee status |
| **Parent / Guardian** | Child's academic progress, fee payment, meeting booking, notifications |

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Language | **TypeScript** | End-to-end type safety across frontend, backend, shared packages |
| Frontend Framework | **Next.js 15 (App Router)** | SSR, RSC, file-based routing, excellent DX |
| UI Library | **Tailwind CSS + shadcn/ui** | Composable, accessible, no runtime CSS-in-JS |
| Data Fetching | **TanStack Query v5** | Server state management, caching, optimistic updates |
| Tables | **TanStack Table v8** | Headless, works with shadcn, handles large datasets |
| Forms | **React Hook Form + Zod** | Performance, validation, schema-driven |
| Charts | **Recharts** | Composable, React-native, good enough for ERP analytics |
| Backend Framework | **NestJS** | Modules, DI, guards, interceptors — essential for large ERP. Chosen over Fastify+tRPC due to scale of domain logic |
| Database | **PostgreSQL 16+** | Relational ERP data, JSONB for flexible fields, excellent for reporting |
| ORM | **Prisma** | TypeScript-first, excellent DX, migrations, multi-schema support |
| Cache | **Redis 7** | Sessions, rate limiting, job queues, frequently read data |
| Job Queue | **BullMQ** | Built on Redis, handles PDF generation, bulk email, payroll runs |
| File Storage | **Cloudflare R2** | S3-compatible, no egress fees, global CDN |
| Email | **Resend** | Developer-first, React Email templates |
| SMS | **Twilio** | Reliable, global, WhatsApp Business API also available |
| Monorepo | **Turborepo + pnpm** | Fast builds, workspace dependency management |
| Containers | **Docker** | Dev parity, deployment consistency |
| Reverse Proxy / CDN | **Cloudflare** | DDoS, caching, DNS, SSL termination |
| Testing | **Vitest + Playwright** | Unit/integration + E2E |
| CI/CD | **GitHub Actions** | Free for public repos, integrates well |

---

## 4. Monorepo Structure

```
school-management-system/
│
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   ├── api/                    # NestJS backend
│   └── worker/                 # BullMQ job processor
│
├── packages/
│   ├── ui/                     # Shared shadcn/ui components + design system
│   ├── types/                  # Shared TypeScript types & interfaces
│   ├── validation/             # Shared Zod schemas (reused in API DTOs + forms)
│   ├── config/                 # Shared ESLint, TypeScript, Tailwind config
│   ├── database/               # Prisma client + generated types
│   └── utils/                  # Shared utilities (date, currency, formatting)
│
├── prisma/
│   ├── schema.prisma           # Main Prisma schema
│   ├── migrations/             # Database migrations
│   └── seed/                   # Seed scripts
│
├── docs/                       # Architecture decisions, API docs
├── docker/
│   ├── docker-compose.yml      # Full stack for local dev
│   ├── docker-compose.prod.yml
│   └── Dockerfile.*            # Per-app Dockerfiles
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Backend module structure (inside `apps/api/src/modules/`)

```
modules/
├── identity/         # Auth, JWT, sessions
├── organization/     # Organizations, campuses, settings
├── iam/              # Users, roles, permissions, RBAC
├── people/           # Persons (shared entity)
├── students/         # Student profiles, guardians, enrollment
├── employees/        # Employee profiles, departments, designations
├── academics/        # Classes, sections, subjects, timetable
├── attendance/       # Student + staff attendance
├── leave/            # Leave types, requests, approvals
├── substitution/     # Substitute teacher algorithm + assignment
├── admissions/       # Enquiry → application → enrollment pipeline
├── examinations/     # Exams, marks, results, grading
├── homework/         # Homework + submissions
├── fees/             # Fee structures, invoices, payments
├── payroll/          # Salary structures, payroll runs
├── library/          # Books, copies, transactions
├── transport/        # Routes, vehicles, student assignments
├── inventory/        # Stock items, assets
├── communication/    # Announcements, notifications, PTM
├── health/           # Student health records
├── documents/        # File uploads, document verification
├── reports/          # Report generation, exports
├── audit/            # Audit logs, domain events
└── settings/         # Organization-level settings
```

---

## 5. Overall Architecture

```
                        Internet
                           │
                      Cloudflare
                           │
              ┌────────────┴────────────┐
              │                         │
         Next.js Web App           Next.js API Routes
         (Static + SSR)            (BFF if needed)
              │                         │
              └────────────┬────────────┘
                           │ HTTPS / REST
                           ▼
                      NestJS API
                      /api/v1/...
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    Identity           Academic           Finance
    Module             Module             Module
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         PostgreSQL      Redis        R2
         (primary DB)   (cache/queue) (files)
              │
         BullMQ Workers
         (async jobs)
              │
    ┌─────────┼─────────┐
    │         │         │
  Email      SMS    WhatsApp
 (Resend) (Twilio) (Twilio)
```

**Internal event flow:**

```
API Request
    │
Controller (validate input)
    │
Service (business logic)
    │
Repository (DB via Prisma)
    │
EventEmitter (NestJS internal events)
    │
Event Handlers (other modules subscribe)
    │
BullMQ Job (async: email, PDF, SMS)
    │
Worker processes job
```

---

## 6. Module Scope — v1 / v2 / v3

### v1 — Core System (Build first)

| Module | Description |
|---|---|
| Auth & IAM | Login, JWT refresh, RBAC, campus-scoped roles |
| Organization Setup | School profile, academic year, campuses, settings |
| People | Person profiles (shared entity) |
| Students | Admission number, enrollment, guardian linking |
| Employees | Staff profiles, departments, designations |
| Academic Config | Classes, sections, subjects, class-subject mapping |
| Teacher Assignments | Subject-class-section-teacher mapping |
| Timetable | Weekly schedule, period definition, room assignment |
| Student Attendance | Daily marking, bulk marking, absence notifications |
| Staff Attendance | Daily marking |
| Leave Management | Leave types, application, principal approval, balances |
| Substitute Teacher | Algorithm-driven suggestions, manual override, confirmation |
| Fee Management | Structures, invoices, collection, receipts, reminders |
| Basic Notifications | Email + SMS (attendance, fee, leave events) |
| Core Reports | Attendance summary, fee collection, student list |
| Audit Logs | All mutations tracked |

### v2 — Academic & Parent Layer

| Module | Description |
|---|---|
| Examinations | Scheduling, marks entry, result computation, report cards |
| Grading System | Configurable grade rules per organization |
| Homework | Assign, submit, grade |
| Parent Portal | Child overview, attendance, fees, results |
| PTM Scheduling | Slot booking, teacher availability, reminders |
| Admissions Pipeline | Enquiry → Application → Documents → Approval → Enrollment |
| Payroll | Salary structures, payroll runs, payslips |
| Health Records | Student medical info, emergency contacts |
| Advanced Reports | Custom filters, PDF/Excel export |

### v3 — Operations & Intelligence

| Module | Description |
|---|---|
| Transport | Routes, vehicles, student assignment |
| Library | Catalog, issue/return, fines |
| Inventory & Assets | Stock, asset register, maintenance |
| Visitor Management | Visitor log, host notification |
| Hostel | Room allocation, warden, hostel fees |
| WhatsApp Notifications | Via Twilio/Meta API |
| In-App Messaging | Staff ↔ Staff, Teacher ↔ Principal |
| BI / Analytics | Trend analysis, risk indicators |
| Mobile App | React Native or PWA hardening |
| Biometric Integration | Attendance via biometric device |

---

## 7. Database Architecture

### ID Strategy
- Every table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- UUIDs are used externally (no separate slug/public ID needed at this scale)
- Prisma handles UUID generation

### Standard Fields
```
-- All business tables
id           UUID
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by   UUID (references users.id, nullable for system actions)
updated_by   UUID (references users.id, nullable)

-- Entities that can be archived/soft-deleted
deleted_at   TIMESTAMPTZ NULL
```

### Tenant Isolation
- Every tenant-owned table: `organization_id UUID NOT NULL`
- Campus-specific tables: `campus_id UUID NOT NULL`
- Academic-year-bound tables: `academic_year_id UUID NOT NULL`
- Row-level security enforced at application layer (NestJS guards)

### PostgreSQL Schemas (logical separation)

| Schema | Tables |
|---|---|
| `core` | organizations, campuses, addresses, settings, audit_logs, domain_events |
| `iam` | persons, users, roles, permissions, role_permissions, user_roles |
| `hr` | employees, departments, designations, employee_types, salary structures, payroll |
| `academics` | academic_years, classes, sections, subjects, class_subjects, teacher_assignments, timetables, periods, rooms, buildings |
| `students` | students, guardians, student_guardians, student_enrollments, houses, student_house_memberships |
| `attendance` | student_attendance, employee_attendance, leave_types, leave_balances, leave_requests, substitution tables |
| `admissions` | admission_enquiries, admission_applications, admission_documents |
| `finance` | fee_heads, fee_structures, fee_invoices, fee_payments, payment_allocations, fee_refunds |
| `examinations` | exam_types, exams, exam_subjects, exam_marks, exam_results, grading_systems, grade_rules, homework |
| `ops` | library, transport, inventory, assets, visitors |
| `comms` | notifications, notification_templates, announcements, ptm_schedules, ptm_bookings |
| `storage` | files, documents |
| `health` | student_health_records |

---

## 8. Complete Database Schema

### CORE

```sql
-- organizations
id UUID PK
name VARCHAR(200) NOT NULL
code VARCHAR(50) UNIQUE
type VARCHAR(50) NOT NULL           -- SCHOOL, COLLEGE, COACHING
email VARCHAR(255)
phone VARCHAR(30)
website VARCHAR(255)
timezone VARCHAR(50) DEFAULT 'Asia/Kolkata'
currency CHAR(3) DEFAULT 'INR'
country CHAR(2) DEFAULT 'IN'
status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'
created_at, updated_at, deleted_at

-- campuses
id UUID PK
organization_id FK → organizations.id
name VARCHAR(200) NOT NULL
code VARCHAR(50) NOT NULL
address_id FK → addresses.id
phone VARCHAR(30)
email VARCHAR(255)
principal_employee_id FK → employees.id  -- set after employees created
status ENUM('ACTIVE','INACTIVE')
created_at, updated_at, deleted_at
UNIQUE (organization_id, code)

-- addresses
id UUID PK
address_line_1 VARCHAR(255) NOT NULL
address_line_2 VARCHAR(255)
landmark VARCHAR(255)
city VARCHAR(100) NOT NULL
district VARCHAR(100)
state VARCHAR(100) NOT NULL
postal_code VARCHAR(20) NOT NULL
country CHAR(2) DEFAULT 'IN'
latitude DECIMAL(10,8)
longitude DECIMAL(11,8)
created_at, updated_at
```

### IAM (Identity & Access Management)

```sql
-- persons  [NOTE: no organization_id — person is global, intentional for SaaS]
id UUID PK
first_name VARCHAR(100) NOT NULL
middle_name VARCHAR(100)
last_name VARCHAR(100) NOT NULL
date_of_birth DATE
gender ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')
profile_photo_file_id FK → files.id
email VARCHAR(255)           -- nullable: young students will have no email
phone VARCHAR(30)            -- nullable: young students will have no phone
alternate_phone VARCHAR(30)
blood_group VARCHAR(5)
nationality VARCHAR(50) DEFAULT 'Indian'
created_at, updated_at, deleted_at

-- users  [one person can have accounts across multiple organizations in SaaS]
id UUID PK
organization_id FK → organizations.id NOT NULL
person_id FK → persons.id NOT NULL
username VARCHAR(100)
email VARCHAR(255) NOT NULL
password_hash VARCHAR(255) NOT NULL
status ENUM('ACTIVE','INACTIVE','SUSPENDED','LOCKED')
failed_login_attempts INT DEFAULT 0
locked_until TIMESTAMPTZ
last_login_at TIMESTAMPTZ
created_at, updated_at, deleted_at
UNIQUE (organization_id, email)

-- roles
id UUID PK
organization_id FK → organizations.id NOT NULL
name VARCHAR(100) NOT NULL
code VARCHAR(50) NOT NULL
description TEXT
is_system_role BOOLEAN DEFAULT false   -- system roles cannot be deleted
created_at, updated_at
UNIQUE (organization_id, code)

-- permissions
id UUID PK
module VARCHAR(100) NOT NULL       -- 'students', 'fees', 'timetable'
resource VARCHAR(100) NOT NULL     -- 'student', 'invoice', 'entry'
action VARCHAR(50) NOT NULL        -- 'view', 'create', 'update', 'delete', 'export'
description TEXT
-- Example: students / student / view

-- role_permissions
role_id FK → roles.id
permission_id FK → permissions.id
PRIMARY KEY (role_id, permission_id)

-- user_roles  [campus_id allows campus-scoped roles]
id UUID PK
user_id FK → users.id NOT NULL
role_id FK → roles.id NOT NULL
campus_id FK → campuses.id     -- NULL = all campuses in org
UNIQUE (user_id, role_id, campus_id)
```

### HR (Human Resources)

```sql
-- employee_types
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL
code VARCHAR(50) NOT NULL
category ENUM('TEACHING','NON_TEACHING','SUPPORT','TRANSPORT','ADMINISTRATION')
description TEXT
status ENUM('ACTIVE','INACTIVE')

-- departments
id UUID PK
organization_id FK
campus_id FK → campuses.id
name VARCHAR(100) NOT NULL
code VARCHAR(50) NOT NULL
head_employee_id FK → employees.id
status ENUM('ACTIVE','INACTIVE')
created_at, updated_at

-- designations
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL       -- 'Principal', 'PGT Mathematics', 'TGT English'
code VARCHAR(50) NOT NULL
description TEXT
status ENUM('ACTIVE','INACTIVE')

-- employees
id UUID PK
organization_id FK → organizations.id NOT NULL
person_id FK → persons.id NOT NULL
employee_number VARCHAR(50) NOT NULL
employee_type_id FK → employee_types.id
department_id FK → departments.id
designation_id FK → designations.id
campus_id FK → campuses.id
joining_date DATE NOT NULL
employment_status ENUM('ACTIVE','ON_LEAVE','SUSPENDED','RESIGNED','TERMINATED','RETIRED')
reporting_manager_id FK → employees.id   -- self-referential
leaving_date DATE
created_at, updated_at, deleted_at
UNIQUE (organization_id, employee_number)
```

### ACADEMICS

```sql
-- academic_years
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL     -- '2026-27'
code VARCHAR(20) NOT NULL
start_date DATE NOT NULL
end_date DATE NOT NULL
status ENUM('UPCOMING','ACTIVE','CLOSED')
is_current BOOLEAN DEFAULT false
created_at, updated_at
UNIQUE (organization_id, code)

-- academic_classes
id UUID PK
organization_id FK
name VARCHAR(50) NOT NULL      -- 'Nursery', 'Class 1', 'Class 12'
code VARCHAR(20) NOT NULL
level INT                      -- numeric order for sorting
display_order INT
status ENUM('ACTIVE','INACTIVE')
created_at, updated_at

-- sections  [permanent — no academic_year_id; year context comes from enrollment]
id UUID PK
campus_id FK → campuses.id NOT NULL
academic_class_id FK → academic_classes.id NOT NULL
name VARCHAR(10) NOT NULL      -- 'A', 'B', 'C'
code VARCHAR(10) NOT NULL
capacity INT
status ENUM('ACTIVE','INACTIVE')
created_at, updated_at
UNIQUE (campus_id, academic_class_id, code)

-- subjects
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL
code VARCHAR(50) NOT NULL
subject_type ENUM('THEORY','PRACTICAL','LANGUAGE','ACTIVITY','ELECTIVE')
description TEXT
status ENUM('ACTIVE','INACTIVE')
UNIQUE (organization_id, code)

-- class_subjects  [which subjects are taught in which classes per year]
id UUID PK
academic_year_id FK
class_id FK → academic_classes.id
subject_id FK → subjects.id
is_optional BOOLEAN DEFAULT false
max_marks DECIMAL(6,2)
passing_marks DECIMAL(6,2)
weightage DECIMAL(5,2)         -- for result calculation
status ENUM('ACTIVE','INACTIVE')
UNIQUE (academic_year_id, class_id, subject_id)

-- teacher_assignments
id UUID PK
academic_year_id FK
teacher_id FK → employees.id NOT NULL
class_id FK → academic_classes.id NOT NULL
section_id FK → sections.id NOT NULL
subject_id FK → subjects.id NOT NULL
is_class_teacher BOOLEAN DEFAULT false
start_date DATE NOT NULL
end_date DATE
status ENUM('ACTIVE','ENDED')
-- UNIQUE (academic_year_id, section_id, subject_id) WHERE status = 'ACTIVE'
-- enforced at application layer since SQL partial unique on enum is vendor-specific

-- buildings
id UUID PK
campus_id FK → campuses.id NOT NULL
name VARCHAR(100) NOT NULL
code VARCHAR(20) NOT NULL
description TEXT
status ENUM('ACTIVE','INACTIVE')   -- added
created_at, updated_at             -- added

-- rooms
id UUID PK
campus_id FK → campuses.id NOT NULL
building_id FK → buildings.id
name VARCHAR(100) NOT NULL
code VARCHAR(20) NOT NULL
room_type ENUM('CLASSROOM','LAB','LIBRARY','AUDITORIUM','STAFF_ROOM','OFFICE','STORE')
capacity INT
status ENUM('ACTIVE','INACTIVE','MAINTENANCE')
created_at, updated_at

-- periods
id UUID PK
campus_id FK → campuses.id NOT NULL
name VARCHAR(50) NOT NULL
period_number INT NOT NULL
start_time TIME NOT NULL
end_time TIME NOT NULL
period_type ENUM('CLASS','BREAK','LUNCH','ASSEMBLY','ACTIVITY')
created_at, updated_at

-- timetables
id UUID PK
organization_id FK
campus_id FK
academic_year_id FK
name VARCHAR(100) NOT NULL
effective_from DATE NOT NULL
effective_to DATE             -- NULL = current/active
status ENUM('DRAFT','ACTIVE','ARCHIVED')
created_at, updated_at

-- timetable_entries
id UUID PK
timetable_id FK → timetables.id NOT NULL
day_of_week SMALLINT NOT NULL  -- 1=Monday ... 7=Sunday
period_id FK → periods.id NOT NULL
class_id FK → academic_classes.id NOT NULL
section_id FK → sections.id NOT NULL
subject_id FK → subjects.id
teacher_id FK → employees.id
room_id FK → rooms.id

-- Conflict constraints (enforced at DB + application layer):
-- UNIQUE (timetable_id, day_of_week, period_id, section_id)   → section can't have 2 classes
-- UNIQUE (timetable_id, day_of_week, period_id, teacher_id)   → teacher can't be in 2 places
-- UNIQUE (timetable_id, day_of_week, period_id, room_id)      → room can't have 2 classes
```

### STUDENTS

```sql
-- students
id UUID PK
organization_id FK NOT NULL
person_id FK → persons.id NOT NULL
admission_number VARCHAR(50) NOT NULL
registration_number VARCHAR(50)
admission_date DATE NOT NULL
joining_date DATE
student_status ENUM('ACTIVE','LEFT','GRADUATED','TRANSFERRED','DECEASED','SUSPENDED')
leaving_date DATE
leaving_reason TEXT
current_campus_id FK → campuses.id
house_id FK → houses.id
created_at, updated_at, deleted_at
UNIQUE (organization_id, admission_number)
-- NOTE: No class/section here. Academic placement is in student_enrollments.

-- guardians
id UUID PK
person_id FK → persons.id NOT NULL
occupation VARCHAR(100)
employer VARCHAR(200)
annual_income DECIMAL(12,2)
education VARCHAR(100)
created_at, updated_at, deleted_at

-- student_guardians  [a student can have multiple guardians]
id UUID PK
student_id FK → students.id NOT NULL
guardian_id FK → guardians.id NOT NULL
relationship ENUM('FATHER','MOTHER','GRANDPARENT','SIBLING','UNCLE','AUNT','GUARDIAN','OTHER')
is_primary BOOLEAN DEFAULT false
is_emergency_contact BOOLEAN DEFAULT false
can_pickup BOOLEAN DEFAULT false
can_receive_notifications BOOLEAN DEFAULT true
created_at, updated_at
UNIQUE (student_id, guardian_id)

-- student_enrollments  [the key join table — student × academic year × class × section]
id UUID PK
student_id FK → students.id NOT NULL
academic_year_id FK → academic_years.id NOT NULL
campus_id FK → campuses.id NOT NULL
class_id FK → academic_classes.id NOT NULL
section_id FK → sections.id NOT NULL
roll_number VARCHAR(20)
class_teacher_id FK → employees.id
enrollment_date DATE NOT NULL
status ENUM('ACTIVE','TRANSFERRED','PROMOTED','FAILED','LEFT','GRADUATED')
promotion_status ENUM('PROMOTED','FAILED','LATERAL') -- set at year end
created_at, updated_at
UNIQUE (student_id, academic_year_id)

-- houses  [sports/activity houses]
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL
code VARCHAR(20) NOT NULL
color VARCHAR(20)
description TEXT
status ENUM('ACTIVE','INACTIVE')

-- student_house_memberships
id UUID PK
student_id FK
house_id FK
academic_year_id FK
UNIQUE (student_id, academic_year_id)
```

### ATTENDANCE

```sql
-- student_attendance
id UUID PK
student_id FK → students.id NOT NULL
enrollment_id FK → student_enrollments.id NOT NULL
date DATE NOT NULL
status ENUM('PRESENT','ABSENT','LATE','HALF_DAY','HOLIDAY','SUSPENDED')
check_in_time TIME
check_out_time TIME
remarks TEXT
marked_by FK → employees.id
created_at, updated_at
UNIQUE (student_id, date)

-- [Period-wise attendance — separate model, not modifying above]
-- attendance_sessions, attendance_records added in v2

-- employee_attendance
id UUID PK
employee_id FK → employees.id NOT NULL
campus_id FK NOT NULL
date DATE NOT NULL
status ENUM('PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE','HOLIDAY')
check_in_time TIME
check_out_time TIME
work_hours DECIMAL(4,2)
remarks TEXT
marked_by FK → employees.id
created_at, updated_at
UNIQUE (employee_id, date)
```

### LEAVE & SUBSTITUTION

```sql
-- leave_types
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL
code VARCHAR(50) NOT NULL
applicable_to ENUM('TEACHING','NON_TEACHING','ALL')
annual_limit INT
is_paid BOOLEAN DEFAULT true
carry_forward BOOLEAN DEFAULT false
status ENUM('ACTIVE','INACTIVE')

-- leave_balances
id UUID PK
employee_id FK → employees.id NOT NULL
leave_type_id FK → leave_types.id NOT NULL
academic_year_id FK NOT NULL
allocated INT NOT NULL DEFAULT 0
used INT NOT NULL DEFAULT 0
remaining INT GENERATED ALWAYS AS (allocated - used) STORED
UNIQUE (employee_id, leave_type_id, academic_year_id)

-- leave_requests  [employee-only; not polymorphic — cleaner FK integrity]
id UUID PK
organization_id FK NOT NULL
employee_id FK → employees.id NOT NULL   -- simplified from applicant_type/applicant_id
leave_type_id FK NOT NULL
start_date DATE NOT NULL
end_date DATE NOT NULL
total_days INT NOT NULL
reason TEXT
status ENUM('PENDING','APPROVED','REJECTED','CANCELLED','WITHDRAWN')
approved_by FK → employees.id
approved_at TIMESTAMPTZ
rejection_reason TEXT
created_at, updated_at

-- substitution_requests  [created when a teacher leave is approved]
id UUID PK
organization_id FK NOT NULL
leave_request_id FK → leave_requests.id NOT NULL
academic_year_id FK NOT NULL
date DATE NOT NULL
status ENUM('PENDING','PARTIALLY_ASSIGNED','FULLY_ASSIGNED','CANCELLED')
created_at, updated_at

-- substitution_assignments  [one per timetable period that needs coverage]
id UUID PK
substitution_request_id FK → substitution_requests.id NOT NULL
timetable_entry_id FK → timetable_entries.id NOT NULL
original_teacher_id FK → employees.id NOT NULL
substitute_teacher_id FK → employees.id
algorithm_score DECIMAL(6,2)       -- total score from algorithm
status ENUM('SUGGESTED','CONFIRMED','DECLINED','COMPLETED','CANCELLED')
assigned_by FK → employees.id      -- NULL = auto-assigned by algorithm
notified_at TIMESTAMPTZ
confirmed_at TIMESTAMPTZ
created_at, updated_at

-- substitution_candidate_scores  [algorithm audit trail per request]
id UUID PK
substitution_request_id FK NOT NULL
candidate_employee_id FK → employees.id NOT NULL
subject_proficiency_score DECIMAL(5,2)    -- max 40
workload_score DECIMAL(5,2)               -- max 30
fairness_score DECIMAL(5,2)               -- max 20
department_affinity_score DECIMAL(5,2)    -- max 10
total_score DECIMAL(6,2)
disqualified_reason TEXT    -- NULL if qualified
created_at
```

### ADMISSIONS

```sql
-- admission_enquiries
id UUID PK
organization_id FK NOT NULL
campus_id FK
academic_year_id FK
student_name VARCHAR(200) NOT NULL
parent_name VARCHAR(200)
phone VARCHAR(30) NOT NULL
email VARCHAR(255)
class_interested_id FK → academic_classes.id
source ENUM('WALK_IN','PHONE','WEBSITE','REFERRAL','SOCIAL_MEDIA','OTHER')
status ENUM('NEW','CONTACTED','INTERESTED','APPLICATION_SENT','CONVERTED','NOT_INTERESTED','LOST')
assigned_to FK → employees.id
notes TEXT
created_at, updated_at

-- admission_applications
id UUID PK
organization_id FK NOT NULL
enquiry_id FK → admission_enquiries.id
application_number VARCHAR(50) NOT NULL UNIQUE
academic_year_id FK NOT NULL
class_id FK NOT NULL
student_person_id FK → persons.id
status ENUM('DRAFT','SUBMITTED','UNDER_REVIEW','INTERVIEW_SCHEDULED','APPROVED','REJECTED','WAITLISTED','WITHDRAWN')
submitted_at TIMESTAMPTZ
approved_at TIMESTAMPTZ
rejected_at TIMESTAMPTZ
rejection_reason TEXT
created_at, updated_at
UNIQUE (organization_id, application_number)

-- admission_documents
id UUID PK
application_id FK → admission_applications.id NOT NULL
document_type ENUM('BIRTH_CERTIFICATE','AADHAAR','TRANSFER_CERTIFICATE','MARK_SHEET','PHOTO','OTHER')
file_id FK → files.id NOT NULL
verification_status ENUM('PENDING','VERIFIED','REJECTED')
verified_by FK → employees.id
verified_at TIMESTAMPTZ
remarks TEXT
```

### FINANCE

```sql
-- fee_heads
id UUID PK
organization_id FK NOT NULL
name VARCHAR(100) NOT NULL       -- 'Tuition Fee', 'Transport Fee'
code VARCHAR(50) NOT NULL
category ENUM('TUITION','ADMISSION','TRANSPORT','LIBRARY','EXAM','ANNUAL','SPORTS','HOSTEL','ACTIVITY','OTHER')
is_refundable BOOLEAN DEFAULT false
status ENUM('ACTIVE','INACTIVE')
UNIQUE (organization_id, code)

-- fee_structures
id UUID PK
organization_id FK NOT NULL
academic_year_id FK NOT NULL
class_id FK → academic_classes.id NOT NULL
name VARCHAR(200) NOT NULL
status ENUM('DRAFT','ACTIVE','ARCHIVED')

-- fee_structure_items
id UUID PK
fee_structure_id FK NOT NULL
fee_head_id FK NOT NULL
amount DECIMAL(12,2) NOT NULL
frequency ENUM('ONE_TIME','MONTHLY','QUARTERLY','HALF_YEARLY','ANNUALLY')
due_day INT     -- day of month when due

-- student_fee_assignments
id UUID PK
student_id FK → students.id NOT NULL
enrollment_id FK → student_enrollments.id NOT NULL
fee_structure_id FK NOT NULL
discount_amount DECIMAL(12,2) DEFAULT 0
scholarship_amount DECIMAL(12,2) DEFAULT 0
effective_from DATE NOT NULL
effective_to DATE
status ENUM('ACTIVE','SUPERSEDED')

-- fee_invoices
id UUID PK
organization_id FK NOT NULL
student_id FK NOT NULL
enrollment_id FK NOT NULL
invoice_number VARCHAR(50) NOT NULL
invoice_date DATE NOT NULL
due_date DATE NOT NULL
subtotal DECIMAL(12,2) NOT NULL
discount DECIMAL(12,2) DEFAULT 0
fine DECIMAL(12,2) DEFAULT 0
total DECIMAL(12,2) NOT NULL
-- REMOVED: balance column — computed from total - SUM(payment_allocations) at query time
status ENUM('DRAFT','ISSUED','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED','REFUNDED')
created_at, updated_at
UNIQUE (organization_id, invoice_number)

-- fee_invoice_items
id UUID PK
invoice_id FK NOT NULL
fee_head_id FK NOT NULL
description VARCHAR(255)
amount DECIMAL(12,2) NOT NULL
discount DECIMAL(12,2) DEFAULT 0
net_amount DECIMAL(12,2) NOT NULL

-- fee_payments
id UUID PK
organization_id FK NOT NULL
student_id FK NOT NULL
receipt_number VARCHAR(50) NOT NULL
amount DECIMAL(12,2) NOT NULL
payment_method ENUM('CASH','ONLINE','CHEQUE','BANK_TRANSFER','DD','UPI')
transaction_reference VARCHAR(255)
payment_date DATE NOT NULL
received_by FK → employees.id NOT NULL
gateway_response JSONB     -- store payment gateway response
status ENUM('PENDING','COMPLETED','FAILED','REFUNDED')
created_at, updated_at
UNIQUE (organization_id, receipt_number)

-- payment_allocations  [one payment can cover multiple invoices]
id UUID PK
payment_id FK → fee_payments.id NOT NULL
invoice_id FK → fee_invoices.id NOT NULL
amount DECIMAL(12,2) NOT NULL

-- fee_refunds
id UUID PK
payment_id FK → fee_payments.id NOT NULL   -- never delete original payment
refund_number VARCHAR(50) NOT NULL
amount DECIMAL(12,2) NOT NULL
reason TEXT NOT NULL
refund_method ENUM('CASH','ONLINE','BANK_TRANSFER','CHEQUE')
transaction_reference VARCHAR(255)
status ENUM('PENDING','APPROVED','PROCESSED','REJECTED')
approved_by FK → employees.id
processed_at TIMESTAMPTZ
```

### PAYROLL

```sql
-- salary_components
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL
code VARCHAR(50) NOT NULL
component_type ENUM('EARNING','DEDUCTION')
calculation_type ENUM('FIXED','PERCENTAGE_OF_BASIC','PERCENTAGE_OF_GROSS')
is_taxable BOOLEAN DEFAULT true
status ENUM('ACTIVE','INACTIVE')

-- salary_structures
id UUID PK
employee_id FK → employees.id NOT NULL
effective_from DATE NOT NULL
effective_to DATE
basic_salary DECIMAL(12,2) NOT NULL
gross_salary DECIMAL(12,2) NOT NULL
status ENUM('ACTIVE','SUPERSEDED')

-- employee_salary_components
id UUID PK
salary_structure_id FK NOT NULL
salary_component_id FK NOT NULL
amount DECIMAL(12,2)
percentage DECIMAL(5,2)

-- payroll_runs
id UUID PK
organization_id FK NOT NULL
period_start DATE NOT NULL     -- using dates instead of month/year integers
period_end DATE NOT NULL
status ENUM('DRAFT','PROCESSING','COMPLETED','APPROVED','PAID')
processed_by FK → employees.id
processed_at TIMESTAMPTZ
UNIQUE (organization_id, period_start, period_end)

-- payroll_records
id UUID PK
payroll_run_id FK NOT NULL
employee_id FK NOT NULL
working_days INT
present_days INT
basic DECIMAL(12,2)
gross DECIMAL(12,2)
total_deductions DECIMAL(12,2)
net_salary DECIMAL(12,2)
status ENUM('PENDING','APPROVED','PAID','HELD')

-- payroll_items
id UUID PK
payroll_record_id FK NOT NULL
salary_component_id FK NOT NULL
amount DECIMAL(12,2) NOT NULL
```

### EXAMINATIONS

```sql
-- exam_types
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL
code VARCHAR(50) NOT NULL
-- Examples: UNIT_TEST, MID_TERM, FINAL, PRACTICAL, PROJECT

-- grading_systems
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL    -- 'CBSE 10-point', 'Percentage-based'
is_default BOOLEAN DEFAULT false

-- grade_rules
id UUID PK
grading_system_id FK NOT NULL
grade VARCHAR(5) NOT NULL     -- 'A+', 'A', 'B', 'C'
min_percentage DECIMAL(5,2) NOT NULL
max_percentage DECIMAL(5,2) NOT NULL
grade_point DECIMAL(4,2)
remark VARCHAR(50)

-- exams
id UUID PK
organization_id FK NOT NULL
academic_year_id FK NOT NULL
name VARCHAR(200) NOT NULL
exam_type_id FK NOT NULL
grading_system_id FK
start_date DATE NOT NULL
end_date DATE NOT NULL
status ENUM('SCHEDULED','ONGOING','COMPLETED','RESULTS_PUBLISHED','CANCELLED')

-- exam_subjects  [exam schedule per class+subject]
id UUID PK
exam_id FK NOT NULL
class_id FK NOT NULL
subject_id FK NOT NULL
exam_date DATE
start_time TIME
end_time TIME
max_marks DECIMAL(6,2) NOT NULL
passing_marks DECIMAL(6,2) NOT NULL
weightage DECIMAL(5,2) DEFAULT 100

-- exam_marks
id UUID PK
exam_subject_id FK NOT NULL
student_id FK NOT NULL
marks DECIMAL(6,2)
grade VARCHAR(5)              -- computed from grading_system
is_absent BOOLEAN DEFAULT false
remarks TEXT
entered_by FK → employees.id
verified_by FK → employees.id
created_at, updated_at
UNIQUE (exam_subject_id, student_id)

-- exam_results  [aggregated result per student per exam]
id UUID PK
exam_id FK NOT NULL
student_id FK NOT NULL
total_marks DECIMAL(8,2)
max_total_marks DECIMAL(8,2)
percentage DECIMAL(5,2)
grade VARCHAR(5)
grade_point DECIMAL(4,2)
-- rank removed from stored data — computed dynamically:
-- RANK() OVER (PARTITION BY section_id ORDER BY percentage DESC)
result_status ENUM('PASS','FAIL','COMPARTMENT','ABSENT','WITHHELD')
UNIQUE (exam_id, student_id)
```

### HOMEWORK

```sql
-- homework
id UUID PK
organization_id FK NOT NULL
teacher_id FK → employees.id NOT NULL
class_id FK NOT NULL
section_id FK NOT NULL
subject_id FK NOT NULL
title VARCHAR(255) NOT NULL
description TEXT
assigned_date DATE NOT NULL
due_date DATE NOT NULL
max_marks DECIMAL(6,2)
status ENUM('DRAFT','PUBLISHED','CLOSED')

-- homework_submissions
id UUID PK
homework_id FK NOT NULL
student_id FK NOT NULL
submitted_at TIMESTAMPTZ
marks DECIMAL(6,2)
remarks TEXT
status ENUM('PENDING','SUBMITTED','LATE','GRADED','MISSING')
UNIQUE (homework_id, student_id)

-- homework_submission_files  [multiple files per submission]
id UUID PK
submission_id FK → homework_submissions.id NOT NULL
file_id FK → files.id NOT NULL
sort_order INT DEFAULT 0
```

### HEALTH

```sql
-- student_health_records
id UUID PK
organization_id FK NOT NULL
student_id FK → students.id NOT NULL
blood_group VARCHAR(5)
height_cm DECIMAL(5,2)
weight_kg DECIMAL(5,2)
vision_left VARCHAR(20)
vision_right VARCHAR(20)
known_allergies TEXT[]
medical_conditions TEXT[]
medications TEXT[]
special_needs TEXT
emergency_contact_name VARCHAR(200)
emergency_contact_phone VARCHAR(30)
doctor_name VARCHAR(200)
doctor_phone VARCHAR(30)
insurance_provider VARCHAR(200)
insurance_policy_number VARCHAR(100)
recorded_at DATE
recorded_by FK → employees.id
created_at, updated_at
```

### COMMUNICATION

```sql
-- announcements
id UUID PK
organization_id FK NOT NULL
campus_id FK               -- NULL = all campuses
title VARCHAR(255) NOT NULL
content TEXT NOT NULL
audience_type ENUM('ALL','STUDENTS','PARENTS','TEACHERS','STAFF','CLASS_SPECIFIC')
target_class_id FK         -- if CLASS_SPECIFIC
publish_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
created_by FK → users.id NOT NULL
status ENUM('DRAFT','PUBLISHED','EXPIRED','ARCHIVED')

-- notification_templates
id UUID PK
organization_id FK
name VARCHAR(100) NOT NULL
event_type VARCHAR(100) NOT NULL   -- 'STUDENT_ABSENT', 'FEE_DUE', 'EXAM_RESULT'
channel ENUM('EMAIL','SMS','WHATSAPP','IN_APP')
subject VARCHAR(255)
body TEXT NOT NULL                 -- supports template variables: {{student_name}}
status ENUM('ACTIVE','INACTIVE')

-- notifications
id UUID PK
organization_id FK NOT NULL
recipient_user_id FK → users.id NOT NULL
event_type VARCHAR(100) NOT NULL
title VARCHAR(255) NOT NULL
message TEXT NOT NULL
channel ENUM('EMAIL','SMS','WHATSAPP','IN_APP')
status ENUM('PENDING','SENT','DELIVERED','FAILED','READ')
sent_at TIMESTAMPTZ
read_at TIMESTAMPTZ

-- notification_deliveries  [per-provider delivery tracking]
id UUID PK
notification_id FK NOT NULL
provider VARCHAR(50) NOT NULL      -- 'resend', 'twilio', 'internal'
provider_message_id VARCHAR(255)
status ENUM('QUEUED','SENT','DELIVERED','FAILED','BOUNCED')
error_message TEXT
sent_at TIMESTAMPTZ
delivered_at TIMESTAMPTZ

-- ptm_schedules  [Parent-Teacher Meeting events]
id UUID PK
organization_id FK NOT NULL
campus_id FK NOT NULL
academic_year_id FK NOT NULL
name VARCHAR(200) NOT NULL
date DATE NOT NULL
slot_duration_minutes INT DEFAULT 15
status ENUM('DRAFT','OPEN','CLOSED','COMPLETED')
created_by FK → users.id
created_at, updated_at

-- ptm_teacher_slots
id UUID PK
ptm_schedule_id FK NOT NULL
teacher_id FK → employees.id NOT NULL
start_time TIME NOT NULL
end_time TIME NOT NULL
is_available BOOLEAN DEFAULT true

-- ptm_bookings
id UUID PK
ptm_schedule_id FK NOT NULL
teacher_id FK → employees.id NOT NULL
student_id FK → students.id NOT NULL
guardian_id FK → guardians.id NOT NULL
slot_start TIMESTAMPTZ NOT NULL
slot_end TIMESTAMPTZ NOT NULL
status ENUM('BOOKED','COMPLETED','CANCELLED','NO_SHOW')
meeting_notes TEXT
created_at, updated_at
UNIQUE (ptm_schedule_id, teacher_id, slot_start)
```

### STORAGE

```sql
-- files
id UUID PK
organization_id FK
storage_provider ENUM('R2','S3','LOCAL')
storage_key VARCHAR(500) NOT NULL      -- object key in bucket
original_name VARCHAR(255) NOT NULL
mime_type VARCHAR(100) NOT NULL
size_bytes BIGINT NOT NULL
checksum VARCHAR(64)                   -- SHA-256 for dedup/integrity
uploaded_by FK → users.id
created_at

-- documents  [business meaning attached to a file]
id UUID PK
organization_id FK NOT NULL
file_id FK → files.id NOT NULL
document_type VARCHAR(100) NOT NULL
entity_type VARCHAR(100) NOT NULL      -- 'STUDENT', 'EMPLOYEE', 'VEHICLE'
entity_id UUID NOT NULL
verification_status ENUM('PENDING','VERIFIED','REJECTED','EXPIRED')
verified_by FK → employees.id
verified_at TIMESTAMPTZ
expiry_date DATE
created_at, updated_at
```

### AUDIT

```sql
-- audit_logs
id UUID PK
organization_id FK
user_id FK → users.id
action ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','APPROVE','REJECT')
entity_type VARCHAR(100) NOT NULL
entity_id UUID
old_values JSONB                    -- null on CREATE
new_values JSONB                    -- null on DELETE
ip_address INET
user_agent TEXT
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- domain_events  [internal event bus for module decoupling]
id UUID PK
organization_id FK
event_type VARCHAR(200) NOT NULL    -- 'student.admitted', 'fee.paid', 'leave.approved'
aggregate_type VARCHAR(100) NOT NULL
aggregate_id UUID NOT NULL
payload JSONB NOT NULL
occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
processed_at TIMESTAMPTZ
status ENUM('PENDING','PROCESSED','FAILED','SKIPPED')

-- settings
id UUID PK
organization_id FK NOT NULL
key VARCHAR(200) NOT NULL
value JSONB NOT NULL
value_type ENUM('STRING','NUMBER','BOOLEAN','JSON','ARRAY')
category VARCHAR(100) NOT NULL
updated_by FK → users.id
updated_at TIMESTAMPTZ
UNIQUE (organization_id, key)
```

---

## 9. Schema Issues — Identified & Resolved

| # | Issue | Original Design | Resolution |
|---|---|---|---|
| 1 | `persons.email/phone` for minor students | Fields present | Keep nullable. Young students (Class 1) will have NULL email/phone. Guardian contact is separate on `student_guardians`. Do not conflate. |
| 2 | `sections` without `academic_year_id` | No year on sections | **Sections are permanent structures.** Year context flows through `student_enrollments`. Class 8-A always exists; only enrollment changes per year. Confirmed. |
| 3 | `timetable_entries` missing conflict constraints | No uniqueness defined | **Three constraints added:** (timetable+day+period+section), (timetable+day+period+teacher), (timetable+day+period+room). Enforced at DB and application layer. |
| 4 | `fee_invoices.balance` stored field | `balance` column present | **Removed.** Balance is computed at query time: `total - SUM(payment_allocations WHERE invoice_id = this)`. Stored balance drifts under concurrent writes. |
| 5 | `exam_results.rank` ambiguity | `rank` column with no scope | **Removed from stored data.** Rank is computed dynamically in queries: `RANK() OVER (PARTITION BY section_id ORDER BY percentage DESC)`. Scope is explicit in query. |
| 6 | `homework_submissions` single file | `file_id` on submission row | **Replaced** with `homework_submission_files` table. One submission → many files. |
| 7 | `leave_requests` polymorphic relationship | `applicant_type` + `applicant_id` | **Simplified to `employee_id` FK.** Only employees take leave. Polymorphic FK cannot be enforced by PostgreSQL referential integrity. |
| 8 | `buildings` missing standard fields | No `status`, `created_at`, `updated_at` | **Added** `status`, `created_at`, `updated_at` for consistency. |
| 9 | `persons` without `organization_id` | No org isolation on persons | **Intentional.** Person is a global entity. In SaaS, the same person can be a parent at School A and a teacher at School B without duplicating personal data. `users` table carries `organization_id` for access control. |
| 10 | Missing substitute teacher tables | No schema for the "interesting feature" | **Added** `substitution_requests`, `substitution_assignments`, `substitution_candidate_scores`. |
| 11 | Missing PTM tables | Not in schema | **Added** `ptm_schedules`, `ptm_teacher_slots`, `ptm_bookings`. |
| 12 | Missing health records | Mentioned in architecture, not in schema | **Added** `student_health_records`. |
| 13 | `payroll_runs` using `month` + `year` integers | Two separate int columns | **Replaced** with `period_start DATE` + `period_end DATE`. Handles non-calendar month payrolls and is unambiguous. |

---

## 10. Authentication & Authorization

### Authentication Flow

```
Login Request (email + password)
        ↓
Verify credentials
        ↓
Issue Access Token (JWT, 15 min TTL)
     +  Refresh Token (opaque, 30 days, stored in Redis)
        ↓
Client stores:
  - Access Token in memory (not localStorage)
  - Refresh Token in HttpOnly cookie
        ↓
Authenticated Request → Bearer access token in Authorization header
        ↓
Token expires → Silent refresh using refresh token cookie
        ↓
Refresh token rotation: old invalidated, new issued
```

### JWT Payload

```json
{
  "sub": "user_uuid",
  "org": "organization_uuid",
  "campus": ["campus_uuid_1", "campus_uuid_2"],  // campuses user has access to
  "roles": ["TEACHER", "CLASS_TEACHER"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

### RBAC

```
User
 └── UserRoles (user_id + role_id + campus_id)
        └── Role
               └── RolePermissions
                      └── Permission (module + resource + action)
```

**Permission check example:**

```
Can this user view student fee records?
→ Check user's roles (scoped to request campus)
→ Check if any role has permission: module=fees, resource=invoice, action=view
→ Allow or deny
```

**Resource-level access** (teacher sees only their sections):

- NestJS guard resolves permission
- Service layer applies row-level filter: `WHERE teacher_id = authenticated_user.employee_id`

---

## 11. Substitute Teacher Algorithm

**Trigger:** Leave request approved for a teacher who has timetable entries on leave days.

**Step 1: Identify affected periods**

```
affected_periods = timetable_entries
  WHERE teacher_id = leaving_teacher
    AND day_of_week IN (days of leave)
    AND timetable.status = ACTIVE
```

**Step 2: Build candidate pool**

```
candidates = employees
  WHERE employment_status = ACTIVE
    AND campus_id = affected_section.campus_id
    AND employee_id != leaving_teacher
    AND employee_id NOT IN (
      -- Already on leave that day
      leave_requests WHERE date_range overlaps AND status = APPROVED
    )
    AND employee_id NOT IN (
      -- Already has a class at this period
      timetable_entries WHERE day = X AND period_id = Y
    )
```

**Step 3: Score each candidate**

```
Subject Proficiency Score    (max 40 pts)
  → Has teacher taught this subject before? (teacher_assignments history)
  → Full 40 pts if same subject, scaled for related subjects

Workload Score               (max 30 pts)
  → Count existing periods this week
  → More free periods = higher score

Fairness Score               (max 20 pts)
  → Count times this teacher has been a substitute this academic year
  → Fewer substitutions = higher score

Department Affinity Score    (max 10 pts)
  → Same department as leaving teacher = 10 pts
  → Different department = 0 pts

Total = sum of above (max 100)
```

**Step 4: Present ranked list to principal/admin**

- Top 3 candidates shown with scores
- Manual override always available
- Human confirmation required before assignment
- Confirmed substitute notified via SMS/email
- Score audit trail stored in `substitution_candidate_scores`

---

## 12. API Design

### Base URL

```
https://api.school.com/api/v1/
```

### Convention

- REST with JSON
- `GET` for reads, `POST` for creates, `PATCH` for partial updates, `DELETE` for soft-deletes
- Pagination: `?page=1&limit=20`
- Filtering: `?status=ACTIVE&class_id=uuid`
- Sorting: `?sort=created_at&order=desc`
- Response envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 450 }
}
```

- Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

### Key Routes

```
Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

Students
GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/students/:id
PATCH  /api/v1/students/:id
GET    /api/v1/students/:id/enrollments
GET    /api/v1/students/:id/attendance
GET    /api/v1/students/:id/fees
GET    /api/v1/students/:id/results

Employees
GET    /api/v1/employees
POST   /api/v1/employees
GET    /api/v1/employees/:id
PATCH  /api/v1/employees/:id
GET    /api/v1/employees/:id/attendance
GET    /api/v1/employees/:id/leaves

Timetable
GET    /api/v1/timetables
POST   /api/v1/timetables
GET    /api/v1/timetables/:id/entries
POST   /api/v1/timetables/:id/entries
GET    /api/v1/timetables/teacher/:teacherId   -- teacher's weekly schedule
GET    /api/v1/timetables/section/:sectionId   -- section's weekly schedule

Attendance
POST   /api/v1/attendance/students/bulk        -- mark whole class
GET    /api/v1/attendance/students             -- filter by date/class/section
POST   /api/v1/attendance/employees/bulk

Leave
GET    /api/v1/leaves/requests
POST   /api/v1/leaves/requests
PATCH  /api/v1/leaves/requests/:id/approve
PATCH  /api/v1/leaves/requests/:id/reject

Substitution
GET    /api/v1/substitutions/requests
GET    /api/v1/substitutions/requests/:id/candidates   -- ranked candidates
POST   /api/v1/substitutions/assignments               -- confirm a substitute

Fees
GET    /api/v1/fees/structures
POST   /api/v1/fees/structures
GET    /api/v1/fees/invoices
POST   /api/v1/fees/invoices/generate          -- generate for class/year
POST   /api/v1/fees/payments
GET    /api/v1/fees/payments/:id/receipt       -- PDF receipt

Exams
GET    /api/v1/exams
POST   /api/v1/exams
POST   /api/v1/exams/:id/marks/bulk            -- bulk marks entry
GET    /api/v1/exams/:id/results
```

---

## 13. Background Jobs & Queues

**Stack:** Redis 7 + BullMQ

| Queue | Jobs | Trigger |
|---|---|---|
| `notifications` | Send email, SMS, WhatsApp, in-app | Domain events |
| `reports` | Generate PDF report cards, fee receipts, salary slips | User request |
| `bulk-operations` | Bulk fee invoice generation, bulk attendance import | Scheduled / user |
| `payroll` | Payroll run processing for large staff | Payroll run created |
| `reminders` | Fee due reminders, PTM reminders | Scheduled (cron) |
| `data-export` | Excel/CSV exports for large datasets | User request |

**Worker app** (`apps/worker`) runs BullMQ workers independently from the API.

---

## 14. Notification Engine

```
Domain Event fires (e.g., fee.payment_received)
           ↓
NotificationService picks it up
           ↓
Looks up notification_templates for this event_type
           ↓
Renders template with event payload variables
           ↓
Creates notification record
           ↓
Pushes to 'notifications' BullMQ queue
           ↓
Worker processes job
     ↓             ↓            ↓
  Resend          Twilio      In-App
  (Email)         (SMS)      (WebSocket)
           ↓
Creates notification_delivery record
```

**Template variables example:**

```
Template: "Dear {{guardian_name}}, {{student_name}}'s fee of ₹{{amount}} is due on {{due_date}}."
Event payload: { guardian_name, student_name, amount, due_date }
```

---

## 15. File Storage Architecture

```
FileStorageService (interface)
        │
        └── CloudflareR2Adapter (implements interface)
              │
              └── r2.school.com/
                      ├── org_id/students/profile_photos/
                      ├── org_id/students/documents/
                      ├── org_id/employees/documents/
                      ├── org_id/admissions/applications/
                      ├── org_id/report-cards/
                      ├── org_id/salary-slips/
                      └── org_id/homework/submissions/
```

- Files uploaded to R2 directly via presigned URLs (API issues presigned URL, browser uploads directly — no bandwidth through API server)
- `files` table stores metadata only
- `documents` table links files to business entities
- File access: presigned download URLs with short TTL (15 minutes)
- Private by default — no public URLs

---

## 16. Development Phases

### Phase 1 — Foundation (Week 1-2)

- Monorepo setup (Turborepo + pnpm)
- Docker compose (PostgreSQL, Redis, API, Web)
- Prisma schema Layer 1 (organizations, campuses, persons, users, roles, permissions)
- NestJS app scaffold + module structure
- Next.js app scaffold + layout
- Auth (login, JWT, refresh tokens, logout)
- RBAC middleware + guards
- Organization + campus CRUD
- Deployment: basic CI/CD pipeline

### Phase 2 — People & Academic Config (Week 3-4)

- Prisma schema Layer 2
- Employee CRUD + departments + designations
- Student CRUD + guardian linking
- Academic years, classes, sections, subjects
- Class-subject mapping
- Teacher assignments
- Basic UI: dashboards, people tables

### Phase 3 — Timetable & Attendance (Week 5-6)

- Timetable builder (periods, entries, conflict detection)
- Student attendance (bulk marking, daily view)
- Employee attendance
- Leave types + balances + request/approval workflow
- **Substitute teacher algorithm + assignment UI**
- Notifications: attendance alerts to parents

### Phase 4 — Finance (Week 7-9)

- Fee heads + structures + items
- Student fee assignment
- Invoice generation (manual + bulk)
- Payment collection + receipt generation (PDF)
- Payment allocations
- Fee refunds
- Overdue tracking + automated reminders
- Payroll: salary structures + components
- Payroll runs + payslip generation (PDF)
- Finance reports

### Phase 5 — Examinations & Academics (Week 10-12)

- Exam types + grading systems
- Exam scheduling
- Marks entry (single + bulk import)
- Result computation
- Report card generation (PDF)
- Homework creation + submission tracking
- Admissions pipeline (enquiry → application → enrollment)

### Phase 6 — Parent Portal & Communication (Week 13-14)

- Parent user accounts + portal UI
- Child academic dashboard (attendance, results, fees, homework)
- PTM scheduling + slot booking
- Announcement system
- In-app notification center

### Phase 7 — Operations & Polish (Week 15+)

- Library module
- Transport module
- Student health records
- Visitor management
- Advanced reports + custom export
- Performance optimization
- E2E testing
- Security audit

---

## 17. Deployment Architecture

### Development

```yaml
# docker-compose.yml
services:
  postgres:   image: postgres:16-alpine
  redis:      image: redis:7-alpine
  api:        build: ./apps/api
  worker:     build: ./apps/worker
  web:        build: ./apps/web
```

### Production

```
Cloudflare (DNS + CDN + DDoS protection)
        │
        ├── Next.js Web (Vercel or VPS)
        │
        └── NestJS API (VPS / Railway / Render)
                │
                ├── Managed PostgreSQL (Supabase / Neon / Railway)
                ├── Managed Redis (Upstash / Railway)
                ├── BullMQ Workers (same VPS or separate)
                └── Cloudflare R2 (file storage)
```

### Environment Variables

```
# Database
DATABASE_URL
REDIS_URL

# Auth
JWT_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_TTL=900          # 15 minutes
JWT_REFRESH_TTL=2592000     # 30 days

# Storage
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME

# Email
RESEND_API_KEY

# SMS
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER

# App
NODE_ENV
API_URL
WEB_URL
```

---

## 18. Open Decisions

The following were outstanding at time of plan creation. Confirm before implementation begins.

| # | Decision | Options | Recommended |
|---|---|---|---|
| 1 | **Multi-tenant from day one?** | Yes / Single-tenant first | Yes — `organization_id` on every table from day one |
| 2 | **Online payments (v1)?** | Razorpay / Stripe / Cash-only | Cash-only for v1, add gateway in v2 |
| 3 | **Exam depth (v1)?** | Simple marks entry vs full GPA | Simple marks + percentage + pass/fail for v1 |
| 4 | **Board type** | CBSE / ICSE / State / Custom | Build grading as configurable (grading_systems table) — supports all |
| 5 | **Academic year format** | April–March (India) | Yes — but stored as ISO dates, so flexible |
| 6 | **Target school size** | <500 / 500-2000 / 2000+ students | Design for 2000, validate on smaller |
| 7 | **WhatsApp notifications (v1)?** | Yes / v2 | v2 — Email + SMS for v1 |
| 8 | **Student self-service portal (v1)?** | Yes / v2 | v2 — Parent portal first |
| 9 | **Biometric attendance integration** | Yes / Manual / v3 | v3 — Manual marking for v1 |
| 10 | **Prisma multi-schema** | One schema / PostgreSQL schemas | PostgreSQL schemas (enable `multiSchema` preview feature) |

---

*Plan version: 1.0 — ready for implementation after open decisions are confirmed.*
