// ─── Academic Year ────────────────────────────────────────────────────────────

export interface AcademicYear {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  isCurrent: boolean;
}

// ─── Campus ───────────────────────────────────────────────────────────────────

export interface Campus {
  id: string;
  name: string;
  code: string;
  status: string;
}

// ─── Classes & Sections ───────────────────────────────────────────────────────

export interface AcademicClass {
  id: string;
  name: string;
  code: string;
  level?: number | null;
  displayOrder?: number | null;
  status: string;
  sections?: Section[];
  _count?: { studentEnrollments: number };
}

export interface Section {
  id: string;
  name: string;
  code: string;
  capacity?: number | null;
  status: string;
  academicClassId: string;
  campusId: string;
  campus?: { id: string; name: string; code: string };
  _count?: { studentEnrollments: number };
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export type SubjectType = 'CORE' | 'ELECTIVE' | 'CO_CURRICULAR' | 'LANGUAGE';

export interface Subject {
  id: string;
  name: string;
  code: string;
  subjectType: SubjectType;
  description?: string | null;
  status: string;
}

// ─── Class Subjects ───────────────────────────────────────────────────────────

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  academicYearId: string;
  isOptional: boolean;
  maxMarks?: number | null;
  passingMarks?: number | null;
  weightage?: number | null;
  status: string;
  subject?: Subject;
  class?: AcademicClass;
  academicYear?: AcademicYear;
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export type CalendarEventType = 'HOLIDAY' | 'EXAM' | 'EVENT' | 'MEETING' | 'OTHER';

export interface CalendarEvent {
  id: string;
  organizationId: string;
  academicYearId: string;
  title: string;
  description?: string | null;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string;
  isSchoolClosed: boolean;
  campusId?: string | null;
  campus?: { id: string; name: string } | null;
}

// ─── Teacher Assignments ──────────────────────────────────────────────────────

export interface TeacherAssignment {
  id: string;
  academicYearId: string;
  teacherId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  isClassTeacher: boolean;
  startDate: string;
  endDate?: string | null;
  status: string;
  teacher?: {
    id: string;
    person?: { firstName: string; lastName: string };
  };
  class?: { id: string; name: string; code: string };
  section?: { id: string; name: string; code: string };
  subject?: { id: string; name: string; code: string; subjectType: SubjectType };
  academicYear?: { id: string; name: string };
}

export interface SectionCoverage {
  sectionId: string;
  sectionName: string;
  sectionCode: string;
  classTeacher: { teacherId: string; teacherName: string } | null;
}

export interface ClassTeacherCoverage {
  classId: string;
  className: string;
  classCode: string;
  sections: SectionCoverage[];
}

// ─── Promotion ────────────────────────────────────────────────────────────────

export type PromotionOutcome = 'PROMOTED' | 'HELD_BACK' | 'TRANSFERRED';

export interface PromotionResult {
  id: string;
  promotionRunId: string;
  studentId: string;
  enrollmentId: string;
  outcome: PromotionOutcome;
  notes?: string | null;
  student?: {
    id: string;
    admissionNumber: string;
    person?: { firstName: string; lastName: string } | null;
  } | null;
}

export interface PromotionRun {
  id: string;
  organizationId: string;
  fromYearId: string;
  toYearId: string;
  fromClassId: string;
  toClassId: string;
  status: 'DRAFT' | 'FINALIZED';
  notes?: string | null;
  createdAt: string;
  fromYear?: { id: string; name: string } | null;
  toYear?: { id: string; name: string } | null;
  fromClass?: { id: string; name: string } | null;
  toClass?: { id: string; name: string } | null;
  results?: PromotionResult[];
  _count?: { results: number };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface AcademicsStats {
  totalClasses: number;
  totalSections: number;
  totalSubjects: number;
  totalStudents: number;
  avgClassSize: number;
  sectionsNearCapacity: number;
  classesWithoutSubjects: number;
}
