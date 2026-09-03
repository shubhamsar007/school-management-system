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
employment_status ENUM(
  -- Lifecycle states (primary)
  'DRAFT',           -- record created, not yet active
  'ONBOARDING',      -- joined, completing onboarding checklist
  'PROBATION',       -- within probation period
  'CONFIRMED',       -- probation passed, permanent employee
  'ACTIVE',          -- regular active employee
  'EXIT_INITIATED',  -- resignation/termination initiated
  'EXITED',          -- formally exited
  'ARCHIVED',        -- historical record only
  -- Transient states (overlay on ACTIVE)
  'ON_LEAVE',        -- currently on approved leave
  'SUSPENDED'        -- disciplinary suspension
)
employment_type ENUM('FULL_TIME','PART_TIME','CONTRACT','VISITING')
probation_start DATE
probation_end DATE
confirmation_date DATE
contract_start DATE
contract_end DATE
notice_period_days INT
work_location VARCHAR(100)
reporting_manager_id FK → employees.id   -- self-referential
leaving_date DATE
leaving_reason TEXT
created_at, updated_at, deleted_at
UNIQUE (organization_id, employee_number)

-- employee_qualifications
id UUID PK
employee_id FK → employees.id NOT NULL
degree VARCHAR(200) NOT NULL       -- 'B.Sc Mathematics', 'M.Ed', 'CTET'
institution VARCHAR(200) NOT NULL
university VARCHAR(200)
specialization VARCHAR(200)
start_year INT NOT NULL
end_year INT                       -- NULL = ongoing
percentage DECIMAL(5,2)
grade VARCHAR(20)
certificate_file_id FK → files.id  -- uploaded certificate
verification_status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING'
created_at, updated_at

-- employee_experience  [previous employment history]
id UUID PK
employee_id FK → employees.id NOT NULL
organization VARCHAR(200) NOT NULL
designation VARCHAR(200) NOT NULL
department VARCHAR(200)
start_date DATE NOT NULL
end_date DATE                      -- NULL = current (shouldn't happen for previous jobs)
responsibilities TEXT
reason_for_leaving VARCHAR(200)
certificate_file_id FK → files.id
created_at, updated_at

-- employee_emergency_contacts
id UUID PK
employee_id FK → employees.id NOT NULL
name VARCHAR(200) NOT NULL
relationship VARCHAR(100) NOT NULL
phone VARCHAR(30) NOT NULL
alternate_phone VARCHAR(30)
address TEXT
priority INT DEFAULT 1             -- 1=primary, 2=secondary
created_at, updated_at

-- employee_lifecycle_events  [status changes become historical events]
id UUID PK
employee_id FK → employees.id NOT NULL
event_type ENUM(
  'JOINED','ONBOARDING_COMPLETED','PROBATION_STARTED','CONFIRMED',
  'PROMOTED','TRANSFERRED','DEPARTMENT_CHANGED','DESIGNATION_CHANGED',
  'SALARY_REVISED','SUSPENDED','REINSTATED',
  'RESIGNED','TERMINATED','RETIRED','ARCHIVED'
)
from_status VARCHAR(50)            -- previous employment_status
to_status VARCHAR(50) NOT NULL     -- new employment_status
effective_date DATE NOT NULL
reason TEXT
remarks TEXT
performed_by FK → employees.id     -- HR/admin who recorded the event
created_at

-- employee_bank_details  [for payroll disbursement]
id UUID PK
employee_id FK → employees.id NOT NULL
bank_name VARCHAR(200) NOT NULL
account_number VARCHAR(100) NOT NULL
ifsc_code VARCHAR(20) NOT NULL
account_type ENUM('SAVINGS','CURRENT') DEFAULT 'SAVINGS'
is_primary BOOLEAN DEFAULT false
created_at, updated_at

-- performance_reviews
id UUID PK
organization_id FK NOT NULL
employee_id FK → employees.id NOT NULL
academic_year_id FK NOT NULL
review_type ENUM('ANNUAL','HALF_YEARLY','QUARTERLY','PROBATION_END')
reviewed_by FK → employees.id NOT NULL   -- the reviewer
review_date DATE NOT NULL
overall_rating DECIMAL(3,1)              -- 0.0 to 5.0
remarks TEXT
status ENUM('DRAFT','SUBMITTED','ACKNOWLEDGED','CLOSED') DEFAULT 'DRAFT'
created_at, updated_at

-- performance_criteria  [configurable criteria per review]
id UUID PK
review_id FK → performance_reviews.id NOT NULL
criteria_name VARCHAR(200) NOT NULL    -- 'Teaching Quality', 'Student Engagement'
rating DECIMAL(3,1) NOT NULL
remarks TEXT

-- performance_goals
id UUID PK
review_id FK → performance_reviews.id NOT NULL
goal TEXT NOT NULL
target VARCHAR(500)
status ENUM('PENDING','IN_PROGRESS','ACHIEVED','NOT_ACHIEVED') DEFAULT 'PENDING'

-- training_records  [professional development log]
id UUID PK
employee_id FK → employees.id NOT NULL
title VARCHAR(255) NOT NULL
training_type ENUM('TRAINING','WORKSHOP','CERTIFICATION','SEMINAR','CONFERENCE')
provider VARCHAR(200)
start_date DATE NOT NULL
end_date DATE
duration_hours INT
certificate_file_id FK → files.id
expiry_date DATE                   -- for certifications that expire
verification_status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING'
created_at, updated_at

-- employee_assets  [items issued to employee]
id UUID PK
organization_id FK NOT NULL
employee_id FK → employees.id NOT NULL
asset_type ENUM('LAPTOP','ID_CARD','ACCESS_CARD','TABLET','KEYS','TEACHING_EQUIPMENT','UNIFORM','OTHER')
asset_code VARCHAR(100)
description VARCHAR(500)
issue_date DATE NOT NULL
expected_return DATE
returned_date DATE
condition ENUM('GOOD','FAIR','DAMAGED') DEFAULT 'GOOD'
return_condition ENUM('GOOD','FAIR','DAMAGED')
issued_by FK → employees.id
created_at, updated_at

-- employee_onboarding  [one checklist per employee]
id UUID PK
employee_id FK → employees.id NOT NULL UNIQUE
status ENUM('IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'IN_PROGRESS'
completed_at TIMESTAMPTZ
created_at, updated_at

-- onboarding_tasks
id UUID PK
onboarding_id FK → employee_onboarding.id NOT NULL
task_name VARCHAR(255) NOT NULL
category ENUM('PERSONAL','EMPLOYMENT','DOCUMENT','SYSTEM_ACCESS','ASSET','ORIENTATION')
is_required BOOLEAN DEFAULT true
is_completed BOOLEAN DEFAULT false
completed_at TIMESTAMPTZ
completed_by FK → employees.id
remarks TEXT

-- employee_offboarding
id UUID PK
employee_id FK → employees.id NOT NULL UNIQUE
exit_type ENUM('RESIGNATION','TERMINATION','RETIREMENT','TRANSFER')
exit_date DATE NOT NULL
last_working_date DATE NOT NULL
reason TEXT
status ENUM('INITIATED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'INITIATED'
created_at, updated_at

-- offboarding_tasks
id UUID PK
offboarding_id FK → employee_offboarding.id NOT NULL
task_name VARCHAR(255) NOT NULL
category ENUM('KNOWLEDGE_TRANSFER','ASSIGNMENT_HANDOVER','ASSET_RETURN','LEAVE_SETTLEMENT','PAYROLL_SETTLEMENT','ACCESS_REVOKE','DOCUMENT_ISSUE')
is_required BOOLEAN DEFAULT true
is_completed BOOLEAN DEFAULT false
completed_at TIMESTAMPTZ
completed_by FK → employees.id
remarks TEXT
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
GET    /api/v1/employees                                  -- list: ?search, department, designation, type, status, campus, page, limit
POST   /api/v1/employees                                  -- create employee
GET    /api/v1/employees/stats                            -- KPI dashboard counts
GET    /api/v1/employees/:id                              -- full profile
PATCH  /api/v1/employees/:id                             -- update core fields
DELETE /api/v1/employees/:id                             -- soft-delete

-- Sub-resources (mirrors student module pattern)
GET    /api/v1/employees/:id/qualifications
POST   /api/v1/employees/:id/qualifications
PATCH  /api/v1/employees/:id/qualifications/:qId
DELETE /api/v1/employees/:id/qualifications/:qId

GET    /api/v1/employees/:id/experience
POST   /api/v1/employees/:id/experience
PATCH  /api/v1/employees/:id/experience/:expId
DELETE /api/v1/employees/:id/experience/:expId

GET    /api/v1/employees/:id/emergency-contacts
POST   /api/v1/employees/:id/emergency-contacts
PATCH  /api/v1/employees/:id/emergency-contacts/:contactId
DELETE /api/v1/employees/:id/emergency-contacts/:contactId

GET    /api/v1/employees/:id/assignments               -- teacher assignments
POST   /api/v1/employees/:id/assignments
DELETE /api/v1/employees/:id/assignments/:assignmentId

GET    /api/v1/employees/:id/attendance                -- delegates to attendance module
GET    /api/v1/employees/:id/leaves                    -- delegates to leave module
GET    /api/v1/employees/:id/payroll                   -- delegates to payroll module
-- Timetable: reuse GET /api/v1/timetables/teacher/:id (already in plan)

GET    /api/v1/employees/:id/performance
POST   /api/v1/employees/:id/performance
PATCH  /api/v1/employees/:id/performance/:reviewId

GET    /api/v1/employees/:id/training
POST   /api/v1/employees/:id/training
PATCH  /api/v1/employees/:id/training/:recordId
DELETE /api/v1/employees/:id/training/:recordId

GET    /api/v1/employees/:id/assets
POST   /api/v1/employees/:id/assets
PATCH  /api/v1/employees/:id/assets/:assetId

GET    /api/v1/employees/:id/documents                -- uses documents table (entity_type='EMPLOYEE')

GET    /api/v1/employees/:id/lifecycle-events
POST   /api/v1/employees/:id/lifecycle-events         -- status change with reason

GET    /api/v1/employees/:id/onboarding
PATCH  /api/v1/employees/:id/onboarding/tasks/:taskId -- complete/uncomplete a task

POST   /api/v1/employees/:id/offboarding              -- initiate offboarding
PATCH  /api/v1/employees/:id/offboarding/tasks/:taskId

GET    /api/v1/employees/:id/bank-details
POST   /api/v1/employees/:id/bank-details
PATCH  /api/v1/employees/:id/bank-details/:detailId
DELETE /api/v1/employees/:id/bank-details/:detailId

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

- Prisma schema Layer 2 (employees, students, academics, HR sub-models)
- Employee CRUD + departments + designations + employee types
- Employee qualifications, experience, emergency contacts
- Employee lifecycle events (status changes with history)
- Employee onboarding/offboarding checklists
- Student CRUD + guardian linking
- Academic years, classes, sections, subjects
- Class-subject mapping
- Teacher assignments (with workload tracking)
- Basic UI: dashboards, people tables, employee profile skeleton

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

---

## 19. Frontend API Layer Strategy

**Decision: TanStack Query v5 + typed API client**

### Why TanStack Query (not raw fetch, not SWR, not tRPC)

| Option | Reason rejected |
|---|---|
| Raw `fetch` in components | No caching, no deduplication, loading/error state written by hand in every component — does not scale across 14 modules |
| SWR | Good for simple read-heavy apps. Lacks first-class mutation support, optimistic updates, and query invalidation patterns needed for an ERP with complex write operations |
| tRPC | Excellent type safety but requires the backend to speak tRPC. Our backend is NestJS REST — wrapping it with a tRPC layer adds complexity without real benefit at this stage |
| TanStack Query v5 | Industry standard for React server-state management. Built-in caching, background refetch, loading/error states, optimistic updates, and query invalidation. Pairs perfectly with our REST API. |

### Structure

```
apps/web/src/
├── lib/
│   ├── api-client.ts          ← base fetch wrapper (auth headers, base URL, error handling)
│   └── hooks/
│       ├── use-students.ts    ← useStudents(), useStudent(id), useStudentStats()
│       ├── use-academics.ts   ← useClasses(), useSections(classId)
│       ├── use-academic-years.ts
│       └── ...                ← one file per module, added as modules are built
```

### Why a typed API client wrapper (not fetch directly in hooks)

- One place to attach the `Authorization: Bearer <token>` header
- One place to handle 401 → redirect to login
- One place to parse the response envelope (`{ success, data, meta }`)
- Hooks stay clean — they only describe *what* to fetch, not *how*

### Query key convention

```ts
// Consistent keys enable targeted invalidation
['students', { orgId }]               // list
['students', id]                       // single student
['students', 'stats', { orgId }]      // KPI stats
['students', id, 'enrollments']        // enrollments sub-resource
['students', id, 'guardians']          // guardians sub-resource
['academics', 'classes', { orgId }]    // class list
['academics', 'sections', classId]     // sections for a class
```

---

## 20. Student Module — Implementation Plan

### What the user confirmed they want

Based on design discussion, the Students section should have:

**URL structure (clean, no separate pages per class)**
```
/students                        → landing (Overview tab)
/students?class=8                → Classes tab filtered to Class 8
/students?class=8&section=A      → All Students tab filtered
/students/:studentId             → Student profile
```

**Three-tab landing page**

```
Students                                    + Add Student
Academic Year: 2026-27 ▼

[Overview]  [Classes]  [All Students]
```

### Tab 1 — Overview

KPI cards (6 stats):
```
Total Students    Active Students    New Admissions
1,248             1,210              86

Boys              Girls              Inactive
642               606                38
```

Charts:
- Bar chart: Students by Class (Class 1 → Class 10 with student count)
- Inline breakdown: Students by Section within each class

Lists:
- Recent Admissions (last 5–10 students added)
- Students Requiring Attention (pending status, incomplete profile)

### Tab 2 — Classes

Hierarchical drill-down rendered on one page using URL params (no page navigation):

**Level 1 — Class list:**
```
Class 1    4 Sections    128 Students   →
Class 2    4 Sections    135 Students   →
...
Class 10   4 Sections    177 Students   →
```

**Level 2 — Section list (click a class):**
```
← Class 8
Section A    38 Students   →
Section B    36 Students   →
Section C    37 Students   →
Section D    36 Students   →
```

**Level 3 — Student list (click a section):**
```
← Class 8 / Section A
Photo | Student | Roll | Gender | Status | Actions
```

### Tab 3 — All Students

Full searchable, filterable, paginated table.

**Search:** student name, admission number, parent name

**Basic filters:** Academic Year, Class, Section, Gender, Status

**Advanced filters (collapsed by default):**
House, Admission Date range, Age, Blood Group, Transport Required, Hostel Student, Scholarship, Fee Status, Attendance Status

**Table columns:** Student (avatar + name + email), Admission No., Class, Section, Parent, Phone, Status, Actions (View, Edit)

**Bulk operations (when rows selected):**
Assign Section, Change House, Promote, Transfer, Generate ID Cards, Export, Send Notification, Upload Documents, Deactivate

Destructive bulk actions (Deactivate, Transfer) require confirmation modal + permission check.

### Student Profile (`/students/:id`)

```
← Students

[Photo]  Rahul Sharma
         Admission No: ADM-1024  |  Class 8-A  |  Roll No: 17
         Status: Active

[Edit Student]  [More Actions ▼]
```

**Tabs:**

| Tab | Source | Status |
|---|---|---|
| Overview | Aggregates from all modules | Build now (summary only) |
| Personal | `GET /v1/students/:id` → person fields | Build now |
| Parents & Guardians | `GET /v1/students/:id/guardians` | Build now |
| Enrollment | `GET /v1/students/:id/enrollments` | Build now |
| Documents | `GET /v1/documents?entity=STUDENT&entityId=:id` | Build now (basic) |
| Health | `GET /v1/students/:id/health` | Build now (read-only, no backend yet) |
| Discipline | Future module | Placeholder tab |
| Activities | Future module | Placeholder tab |
| Communication | Future module | Placeholder tab |
| History / Audit | Future module | Placeholder tab |

Tabs for Academic, Attendance, Examinations, and Fees **do not duplicate** those modules. The profile shows a summary widget that links to the respective module.

### APIs needed — gap analysis

| Feature | API Status | Action needed |
|---|---|---|
| KPI stats (total, active, boys, girls, new admissions, inactive) | ❌ Missing | Add `GET /v1/students/stats` |
| Student list with filters + pagination + search | ❌ Missing query params | Add query DTO to `GET /v1/students` |
| Student list filtered by classId + sectionId + academicYearId | ❌ Missing | Same — add as query params |
| Academic year list | ✅ `GET /v1/organizations/:id/academic-years` | Ready |
| Class list | ✅ `GET /v1/academics/classes` | Ready |
| Sections per class | ✅ `GET /v1/academics/classes/:classId/sections` | Ready |
| Student detail | ✅ `GET /v1/students/:id` | Ready |
| Guardians | ✅ `GET /v1/students/:id/guardians` | Ready |
| Enrollment history | ✅ `GET /v1/students/:id/enrollments` | Ready |
| Bulk operations | ❌ None exist | Phase 3 — add bulk endpoints |
| Add Student (multi-step form) | ✅ `POST /v1/students` | Ready |

### Build order

**Phase 1 — Backend gaps (do first)**
1. Add query params + pagination to `GET /v1/students` (search, classId, sectionId, academicYearId, status, gender, page, limit)
2. Add `GET /v1/students/stats` endpoint

**Phase 2 — Frontend: landing page**
3. API client setup (`lib/api-client.ts`)
4. Query hooks (`use-students.ts`, `use-academics.ts`, `use-academic-years.ts`)
5. Three-tab Students page (Overview, Classes, All Students) connected to real API

**Phase 3 — Frontend: student profile**
6. Student profile page with Overview, Personal, Parents, Enrollment tabs
7. Add Student multi-step form / drawer

**Phase 4 — Advanced (later)**
8. Bulk operations (needs new API endpoints)
9. Documents, Health tabs
10. Advanced filters (House, Transport, Hostel, etc.)

*Plan version: 1.1 — Student module plan and API layer strategy added 2026-08-31.*

---

## 21. Teachers & Staff Module — Implementation Plan

### Design principles

- Visual and interaction design must mirror the student module exactly — same component patterns, same tab layout, same filter/search UX
- Every sub-resource (qualifications, experience, emergency contacts, etc.) follows the same sub-resource API pattern as students (guardians, enrollments)
- All tab data is fetched independently via TanStack Query so each tab loads without blocking others
- Shared UI components live in `apps/web/src/components/shared/` and are imported by both student and teacher modules — one file to change, both modules update
- Status changes are never overwrites — they produce a lifecycle event record so full history is always available

### URL structure

```
/teachers                          → landing page (3 tabs)
/teachers/:employeeId              → Employee 360° profile (15 tabs)
```

### Landing page — three tabs

```
Teachers & Staff                            [+ Add Employee]
Academic Year: 2026-27 ▼

[Overview]  [Directory]  [Departments]
```

### Tab 1 — Overview

KPI cards (two rows):
```
Total Staff    Active    On Leave    Absent Today    Present Today
87             82        4           3               79

Teachers    Non-Teaching    New Joiners    Probation Ending    Contracts Expiring
72          15              6              2                   1
```

Charts:
- Bar chart: Staff by Department (mirrors Students by Class chart)
- Line chart: Monthly attendance trend (last 6 months, staff average %)

Lists:
- New Joiners this month (last 5, with avatar + name + designation + joined date)
- Attention Required (contract expiring ≤30 days, probation ending ≤10 days, missing documents, attendance below threshold)

### Tab 2 — Directory

Mirrors the All Students tab exactly in structure.

**Search:** name, employee ID, phone, email

**Filters:** Department, Designation, Employee Type, Employment Status, Campus, Employment Type (Full-time/Part-time/Contract)

**Columns:** Employee (avatar + name + designation) | Employee ID | Department | Subjects | Status | Joined | Actions

**Sub-tabs within Directory:**
```
[All Staff (87)]  [Teachers (72)]  [Non-Teaching (15)]  [Former (12)]
```

**Bulk operations (when rows selected):**
Assign Department, Assign Campus, Change Status, Export, Send Notification

### Tab 3 — Departments

Hierarchical drill-down mirroring the Classes tab.

**Level 1 — Department list:**
```
Academic Department     3 Sub-departments    52 Employees   →
Administration          –                    12 Employees   →
Finance                 –                    5 Employees    →
```

**Level 2 — Employees in department:**
```
← Academic Department
[Avatar] Rahul Sharma    Mathematics Teacher    ACTIVE    →
[Avatar] Priya Gupta     Science Teacher        ACTIVE    →
```

Clicking a row navigates to `/teachers/:id`.

---

### Employee 360° Profile (`/teachers/:id`)

```
← Teachers & Staff

[Large Avatar]  Rahul Sharma
                EMP-2024-0012 · Mathematics Teacher · Academic Department
                8-A Class Teacher · 2026–27
                                                         [Edit Employee]  [More Actions ▼]
                ACTIVE
```

**Tab strip (15 tabs):**

```
[Overview] [Personal] [Employment] [Qualifications] [Experience]
[Assignments] [Timetable] [Attendance] [Leave] [Payroll]
[Documents] [Performance] [Training] [Assets] [History]
```

---

### Tab: Overview

The employee command center. Aggregates live data from all sub-resources.

```
Today's Attendance          Today's Classes     Weekly Workload
Present — 08:42 AM          5 periods           28 / 32 periods

Leave Balance               Current Net Salary  Latest Rating
Casual: 8 remaining         ₹48,500             4.2 / 5.0
```

Today's Schedule (read from timetable):
```
08:00   Mathematics — 8-A
09:00   Mathematics — 7-B
10:00   Free period
11:00   Mathematics — 9-A
```

Alerts (system-generated, shown only if applicable):
```
⚠  Contract expires in 28 days
⚠  B.Ed verification pending
✓  All documents verified
```

Recent Activity (from lifecycle events + audit log):
```
Today         Checked in 08:42
Yesterday     Leave request approved
Aug 30        Teaching assignment added — 9-A Mathematics
Aug 20        Salary revised ₹45,000 → ₹48,500
```

---

### Tab: Personal

Two-column layout matching student personal tab.

**Personal Information section:**
Name (first / middle / last / preferred), DOB, Gender, Blood Group, Nationality, Marital Status, Profile Photo

**Contact Information section:**
Personal Phone, Work Phone, Personal Email, Work Email, Alternate Phone

**Address section:**
Current Address (line 1, line 2, city, state, postal code, country), Permanent Address (same fields + "Same as current" toggle)

**Emergency Contacts section:**
List of emergency contacts (add/edit/remove).
Each contact: Name, Relationship, Phone, Alternate Phone, Priority badge (Primary / Secondary)

---

### Tab: Employment

**Employment Details section:**
Employee ID, Employee Type, Employment Type (Full-time/Part-time/Contract/Visiting), Department, Designation, Campus, Reporting Manager, Joining Date, Work Location

**Lifecycle section:**
Current Status badge, Probation Start/End, Confirmation Date, Contract Start/End, Notice Period

**Status History (lifecycle events, most recent first):**
```
Sept 1, 2026    CONFIRMED         Probation completed successfully
Apr 1, 2024     PROBATION         Joined — probation begins
```

---

### Tab: Qualifications

Table of qualification records.
```
Degree          Institution          Year      Grade    Status      Actions
B.Sc Maths      XYZ University       2015–18   82%      ✓ Verified  Edit | Delete
M.Ed            ABC College          2018–20   78%      ✓ Verified
CTET            CBSE                 2021      Pass     Pending     Edit | Delete
```

[+ Add Qualification] button opens a modal (same pattern as Add Guardian).

Each record: Degree, Institution, University, Specialization, Start Year, End Year, Percentage/Grade, Certificate upload, Verification Status.

---

### Tab: Experience

Timeline of previous employment.
```
2021 – 2024    Senior Teacher — ABC Public School
               Mathematics Department
               3 years · Left: Better opportunity

2018 – 2021    Teacher — XYZ High School
               Mathematics + Science
               3 years · Left: Career growth
```

Total experience computed: 6 years (previous) + current tenure.

[+ Add Experience] button.

---

### Tab: Assignments

Current academic year's teaching assignments + workload.

**Workload bar:**
```
Assigned: ████████████████████░░░░  28 / 32 periods/week
```

**Assignment table:**
```
Class    Section    Subject        Is Class Teacher    Start Date    Status
8        A          Mathematics    Yes (Class Teacher) Apr 1, 2026   ACTIVE
7        B          Mathematics    No                  Apr 1, 2026   ACTIVE
9        A          Mathematics    No                  Apr 1, 2026   ACTIVE
```

**History toggle:** Show assignments from previous years.

[+ Add Assignment] button with conflict detection (same subject/section already assigned, workload exceeded).

---

### Tab: Timetable

Read-only view of the teacher's weekly timetable. Data from `GET /api/v1/timetables/teacher/:id`.

```
         Monday      Tuesday     Wednesday   Thursday    Friday
08:00    8-A Math    7-B Math    8-A Math    9-A Math    8-A Math
09:00    7-B Math    Free        9-A Math    Free        7-B Math
10:00    Free        8-A Math    Free        8-A Math    Free
```

Link: "View Full Timetable →" → navigates to `/timetable`.

---

### Tab: Attendance

Monthly calendar + analytics. Mirrors student attendance tab design.

**Summary cards:**
```
Present    Absent    Late    Half Day    WFH     Leave
18         1         2       0           3       2
```

**Attendance % bar:** 88% this month

**Monthly trend (last 6 months):**
```
Apr 96%  May 94%  Jun 91%  Jul 95%  Aug 88%  Sep —
```

**Detail table:** Date | Check-in | Check-out | Work Hours | Status | Remarks

---

### Tab: Leave

**Leave Balance cards (one per leave type):**
```
Casual Leave        Sick Leave         Earned Leave
Used: 4 / 12        Used: 2 / 10       Used: 0 / 15
Remaining: 8        Remaining: 8       Remaining: 15
```

**Leave Request history table:**
Leave Type | From | To | Days | Reason | Status | Approved By

[+ Apply Leave] button (only available if user has permission or is viewing own profile).

---

### Tab: Payroll

**Current Salary Structure:**
```
Basic Salary        ₹28,000
HRA                 ₹11,200   (40% of basic)
Conveyance          ₹1,600    (fixed)
─────────────────────────────
Gross               ₹40,800
PF Deduction        ₹3,360    (12% of basic)
─────────────────────────────
Net Salary          ₹37,440
```

Effective from: Apr 1, 2026

**Salary History:** Previous structures with effective date ranges.

**Payslip History table:** Month | Working Days | Present | Gross | Deductions | Net | Download

**Bank Details:** Bank name, account (masked), IFSC — with edit action.

---

### Tab: Documents

List of uploaded documents with category grouping.

**Categories:** Identity | Employment | Qualifications | Verification | Other

Each document: Document type | File name | Uploaded date | Expiry date | Status badge | View | Delete

Status badges: PENDING (yellow) | VERIFIED (green) | REJECTED (red) | EXPIRED (red)

[+ Upload Document] button.

---

### Tab: Performance

**Review history:**
```
2025–26    Annual Review     Overall: 4.2 / 5.0    CLOSED
2024–25    Annual Review     Overall: 4.0 / 5.0    CLOSED
```

**Review detail (expandable):**
```
Teaching Quality       4.4 / 5.0
Student Engagement     4.1 / 5.0
Lesson Planning        4.5 / 5.0
Assessment Quality     4.2 / 5.0
Attendance             4.8 / 5.0
Parent Communication   4.0 / 5.0
```

Goals for the period listed below criteria.

[+ Start Review] button (restricted to HR/Principal role).

---

### Tab: Training

Timeline of professional development records.
```
Aug 15, 2026    Advanced Mathematics Pedagogy (Workshop)
                Duration: 8 hours · Certificate: Verified

Jun 2025        CTET Refresher (Certification)
                Expires: Jun 2028 · Certificate: Verified
```

[+ Add Training Record] button.

Expiry alerts shown inline for records expiring within 60 days.

---

### Tab: Assets

**Currently issued assets:**
```
Asset         Code          Issued       Condition    Expected Return
Laptop        LT-2024-042   Apr 1, 2024  Good         —
ID Card       ID-2024-312   Apr 1, 2024  Good         —
Access Card   AC-2024-099   Apr 1, 2024  Good         —
```

[+ Issue Asset] button.

On offboarding, this tab drives the asset return checklist automatically.

---

### Tab: History

Full chronological timeline of all significant events for this employee.

```
Sept 2, 2026
  ✓  Checked in — 08:41 AM

Aug 30, 2026
  ✓  Leave approved — Casual Leave (Aug 28–29)
     Approved by: Principal Sharma

Aug 20, 2026
  ✓  Teaching assignment added — 9-A Mathematics

Aug 10, 2026
  ✓  Training certificate uploaded — CTET Refresher

Jul 1, 2026
  ✓  Salary revised — ₹45,000 → ₹48,500 net
     Recorded by: HR Admin

Apr 1, 2024
  ✓  Joined — Probation started
```

Sources: lifecycle_events table + audit_logs, merged and sorted by date.

---

### Shared reusable components

Create in `apps/web/src/components/shared/` — imported by both student and teacher modules. One file = one source of truth.

| Component | File | Reused by |
|---|---|---|
| `ProfileHeader` | `profile-header.tsx` | Student profile, Employee profile |
| `InfoSection` | `info-section.tsx` | All personal/employment tabs |
| `InfoRow` | `info-row.tsx` | Inside `InfoSection` |
| `ContactCard` | `contact-card.tsx` | Student personal, Employee personal |
| `EmergencyContactList` | `emergency-contact-list.tsx` | Student health, Employee personal |
| `DocumentListItem` | `document-list-item.tsx` | Student docs, Employee docs |
| `AttendanceSummaryCard` | `attendance-summary-card.tsx` | Student attendance, Employee attendance |
| `MonthlyTrendChart` | `monthly-trend-chart.tsx` | Student attendance, Employee attendance |
| `LeaveBalanceCard` | `leave-balance-card.tsx` | Employee leave tab |
| `ModuleLinksGrid` | `module-links-grid.tsx` | Student overview, Employee overview |
| `TimelineList` | `timeline-list.tsx` | Student history, Employee history |
| `TimelineEvent` | `timeline-event.tsx` | Inside `TimelineList` |
| `AlertBanner` | `alert-banner.tsx` | Employee overview (expiry alerts) |
| `WorkloadBar` | `workload-bar.tsx` | Employee assignments tab |
| `ChecklistItem` | `checklist-item.tsx` | Onboarding + offboarding tasks |
| `StatsGrid` | `stats-grid.tsx` | Both landing page KPI sections |

### API hooks file

Create `apps/web/src/lib/hooks/use-employees.ts` mirroring `use-students.ts`.

Key hooks:

```ts
useEmployeeStats()                         // GET /v1/employees/stats
useEmployees(params)                       // GET /v1/employees with filters
useEmployee(id)                            // GET /v1/employees/:id
useEmployeeQualifications(id)             // GET /v1/employees/:id/qualifications
useEmployeeExperience(id)                 // GET /v1/employees/:id/experience
useEmployeeEmergencyContacts(id)          // GET /v1/employees/:id/emergency-contacts
useEmployeeAssignments(id)                // GET /v1/employees/:id/assignments
useEmployeeAttendance(id, params)         // GET /v1/employees/:id/attendance
useEmployeeLeaves(id)                     // GET /v1/employees/:id/leaves
useEmployeePayroll(id)                    // GET /v1/employees/:id/payroll
useEmployeePerformance(id)                // GET /v1/employees/:id/performance
useEmployeeTraining(id)                   // GET /v1/employees/:id/training
useEmployeeAssets(id)                     // GET /v1/employees/:id/assets
useEmployeeDocuments(id)                  // GET /v1/employees/:id/documents
useEmployeeLifecycleEvents(id)            // GET /v1/employees/:id/lifecycle-events
useEmployeeTimetable(id)                  // GET /v1/timetables/teacher/:id
```

Query key convention:
```ts
['employees', 'stats']
['employees', 'list', params]
['employees', id]
['employees', id, 'qualifications']
['employees', id, 'experience']
['employees', id, 'emergency-contacts']
['employees', id, 'assignments']
['employees', id, 'attendance', params]
['employees', id, 'leaves']
['employees', id, 'payroll']
['employees', id, 'performance']
['employees', id, 'training']
['employees', id, 'assets']
['employees', id, 'documents']
['employees', id, 'lifecycle-events']
```

### APIs needed — gap analysis

| Feature | Status | Action |
|---|---|---|
| Employee stats (KPI counts) | ❌ Missing | Add `GET /v1/employees/stats` |
| Employee list with full filters | ⚠️ No query params | Expand existing endpoint |
| Employee profile page (frontend) | ❌ Missing | Build `/teachers/[id]/page.tsx` |
| Qualifications CRUD | ❌ Missing | New schema + endpoints |
| Experience CRUD | ❌ Missing | New schema + endpoints |
| Emergency contacts CRUD | ❌ Missing | New schema + endpoints |
| Lifecycle events | ❌ Missing | New schema + endpoints |
| Onboarding checklist | ❌ Missing | New schema + endpoints |
| Offboarding workflow | ❌ Missing | New schema + endpoints |
| Performance reviews | ❌ Missing | New schema + endpoints |
| Training records | ❌ Missing | New schema + endpoints |
| Employee assets | ❌ Missing | New schema + endpoints |
| Bank details | ❌ Missing | New schema + endpoints |
| Timetable view on profile | ⚠️ API exists | Frontend only — reuse `/timetables/teacher/:id` |
| Attendance tab on profile | ⚠️ API exists | Frontend only — reuse attendance module |
| Leave tab on profile | ⚠️ API exists | Frontend only — reuse leave module |
| Payroll tab on profile | ⚠️ API exists | Frontend only — reuse payroll module |
| Documents tab on profile | ⚠️ Generic API exists | Frontend only — filter by entity_type='EMPLOYEE' |

### Build order

**Phase A — Schema & Backend (prerequisite for everything)**
1. Add new models to `prisma/schema.prisma` and run migration
2. Expand `Employee.employmentStatus` enum + add employment type/lifecycle fields
3. `GET /v1/employees/stats` endpoint
4. `GET /v1/employees` query params (search, department, designation, type, status, campus, page, limit)
5. Sub-resource endpoints: qualifications, experience, emergency-contacts, lifecycle-events

**Phase B — Landing page (wire mock data to real API)**
6. Create `use-employees.ts` hooks
7. Connect existing `teachers/page.tsx` to real API
8. Build `OverviewTab` (KPI cards + attendance chart + new joiners + alerts)
9. Build `DepartmentsTab` (mirrors ClassesTab)

**Phase C — Employee profile page (core)**
10. `/teachers/[id]/page.tsx` with `ProfileHeader` and tab scaffold
11. `OverviewTab` — today's summary + schedule + alerts + recent activity
12. `PersonalTab` — personal info + emergency contacts
13. `EmploymentTab` — employment details + lifecycle history
14. `QualificationsTab` + `ExperienceTab`
15. `AssignmentsTab` with workload bar

**Phase D — Module integration tabs (read-only)**
16. `AttendanceTab` — monthly analytics (calls attendance module API)
17. `LeaveTab` — balances + history (calls leave module API)
18. `PayrollTab` — salary structure + payslip history (calls payroll module API)
19. `TimetableTab` — weekly schedule (calls timetable module API)
20. `DocumentsTab` — uploaded files (calls documents API)

**Phase E — Advanced tabs**
21. `PerformanceTab` + `TrainingTab` (needs Phase A schema)
22. `AssetsTab`
23. `OnboardingTab` / `OffboardingTab`
24. `HistoryTab` — timeline from lifecycle_events + audit_logs

*Plan version: 1.2 — Teachers & Staff module plan added 2026-09-02.*
