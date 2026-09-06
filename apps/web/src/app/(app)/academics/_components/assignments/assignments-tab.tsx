'use client';

import * as React from 'react';
import { Spinner } from '@/components/ui';
import { SubjectTypeBadge } from '@/components/ui/subject-type-badge';
import {
  useClasses,
  useTeacherAssignments,
  useClassTeacherCoverage,
} from '@/lib/hooks/use-academics';
import type { AcademicClass, TeacherAssignment } from '@/lib/types/academics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function teacherName(a: TeacherAssignment): string {
  const p = a.teacher?.person;
  if (!p) return '—';
  return `${p.firstName} ${p.lastName}`;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 28 }}>📋</span>
      <p style={{ fontSize: 13, color: '#6b7480', margin: 0 }}>{message}</p>
    </div>
  );
}

// ─── View toggle pill ─────────────────────────────────────────────────────────

type View = 'by-class' | 'by-teacher';

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        background: '#f2f4f6',
        borderRadius: 8,
        padding: 3,
        width: 'fit-content',
      }}
    >
      {(['by-class', 'by-teacher'] as View[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: view === v ? 600 : 400,
            background: view === v ? '#fff' : 'transparent',
            color: view === v ? '#2c322f' : '#8a929b',
            boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {v === 'by-class' ? 'By Class' : 'By Teacher'}
        </button>
      ))}
    </div>
  );
}

// ─── Class list item ──────────────────────────────────────────────────────────

function ClassListItem({
  cls,
  selected,
  onClick,
  assignmentCount,
}: {
  cls: AcademicClass;
  selected: boolean;
  onClick: () => void;
  assignmentCount: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 14px',
        borderRadius: 8,
        border: selected ? '1.5px solid #9bbdaa' : '1.5px solid transparent',
        background: selected ? '#eef5f1' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.12s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{ fontSize: 13, fontWeight: 600, color: selected ? '#2c5c3e' : '#2c322f' }}
        >
          {cls.name}
        </span>
        <span
          style={{
            fontSize: 11,
            color: assignmentCount > 0 ? '#5d7f6b' : '#c5c0b6',
            fontWeight: 500,
          }}
        >
          {assignmentCount}
        </span>
      </div>
      <span style={{ fontSize: 11, color: '#8a929b', fontFamily: 'monospace' }}>{cls.code}</span>
    </button>
  );
}

// ─── Subject assignments table ────────────────────────────────────────────────

function AssignmentsTable({ assignments }: { assignments: TeacherAssignment[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            {['Subject', 'Type', 'Teacher', 'Start Date', 'End Date'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#8a929b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #ecedf0',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #f2f4f6' }}>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#14181c' }}>
                  {a.subject?.name ?? '—'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#8a929b',
                    display: 'block',
                    fontFamily: 'monospace',
                  }}
                >
                  {a.subject?.code}
                </span>
              </td>
              <td style={{ padding: '9px 12px' }}>
                {a.subject && <SubjectTypeBadge type={a.subject.subjectType} />}
              </td>
              <td style={{ padding: '9px 12px', fontSize: 13, color: '#2c322f' }}>
                {teacherName(a)}
              </td>
              <td style={{ padding: '9px 12px', fontSize: 12, color: '#6b7480' }}>
                {fmtDate(a.startDate)}
              </td>
              <td style={{ padding: '9px 12px', fontSize: 12, color: '#6b7480' }}>
                {fmtDate(a.endDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── By Class view ────────────────────────────────────────────────────────────

function ByClassView({
  classes,
  assignments,
  classTeacherMap,
}: {
  classes: AcademicClass[];
  assignments: TeacherAssignment[];
  classTeacherMap: Map<string, string>;
}) {
  const [selectedClassId, setSelectedClassId] = React.useState('');

  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      const first = classes[0];
      if (first) setSelectedClassId(first.id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  // Count per class for the left panel badge
  const countByClass = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assignments) {
      m.set(a.classId, (m.get(a.classId) ?? 0) + 1);
    }
    return m;
  }, [assignments]);

  // Assignments for the selected class
  const classAssignments = assignments.filter((a) => a.classId === selectedClassId);

  // Group by sectionId for the right panel
  const bySection = React.useMemo(() => {
    const m = new Map<string, TeacherAssignment[]>();
    for (const a of classAssignments) {
      if (!m.has(a.sectionId)) m.set(a.sectionId, []);
      m.get(a.sectionId)!.push(a);
    }
    return m;
  }, [classAssignments]);

  const sections = selectedClass?.sections ?? [];

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid #ecedf0',
        borderRadius: 10,
        overflow: 'hidden',
        minHeight: 400,
      }}
    >
      {/* Left: class list */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid #ecedf0',
          overflowY: 'auto',
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          background: '#fcfcfc',
        }}
      >
        {classes.map((cls) => (
          <ClassListItem
            key={cls.id}
            cls={cls}
            selected={cls.id === selectedClassId}
            onClick={() => setSelectedClassId(cls.id)}
            assignmentCount={countByClass.get(cls.id) ?? 0}
          />
        ))}
        {classes.length === 0 && (
          <p style={{ fontSize: 12, color: '#c5c0b6', padding: 8 }}>No classes found.</p>
        )}
      </div>

      {/* Right: per-section assignments */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
        {!selectedClass ? (
          <EmptyState message="Select a class to view assignments" />
        ) : classAssignments.length === 0 ? (
          <EmptyState message={`No teacher assignments for ${selectedClass.name} this year`} />
        ) : sections.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sections.map((section) => {
              const sectionAssignments = bySection.get(section.id) ?? [];
              const ctName = classTeacherMap.get(section.id);
              return (
                <div key={section.id}>
                  {/* Section header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                      paddingBottom: 8,
                      borderBottom: '1px solid #ecedf0',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#14181c' }}>
                      Section {section.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#8a929b',
                        fontFamily: 'monospace',
                      }}
                    >
                      {section.code}
                    </span>
                    {ctName ? (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          background: '#eef5f1',
                          color: '#33604a',
                          border: '1px solid #9bbdaa',
                          borderRadius: 12,
                          padding: '2px 10px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Class Teacher: {ctName}
                      </span>
                    ) : (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          background: '#fef3f2',
                          color: '#b42318',
                          border: '1px solid #fecdca',
                          borderRadius: 12,
                          padding: '2px 10px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        No Class Teacher
                      </span>
                    )}
                  </div>

                  {sectionAssignments.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#c5c0b6', padding: '6px 0' }}>
                      No subject assignments for this section.
                    </p>
                  ) : (
                    <AssignmentsTable assignments={sectionAssignments} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Class has no sections defined — flat table
          <AssignmentsTable assignments={classAssignments} />
        )}
      </div>
    </div>
  );
}

// ─── By Teacher view ──────────────────────────────────────────────────────────

function ByTeacherView({ assignments }: { assignments: TeacherAssignment[] }) {
  const byTeacher = React.useMemo(() => {
    const m = new Map<string, { name: string; assignments: TeacherAssignment[] }>();
    for (const a of assignments) {
      const id = a.teacherId;
      const name = teacherName(a);
      if (!m.has(id)) m.set(id, { name, assignments: [] });
      m.get(id)!.assignments.push(a);
    }
    return Array.from(m.entries())
      .map(([teacherId, data]) => ({ teacherId, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  if (byTeacher.length === 0) {
    return <EmptyState message="No teacher assignments for this academic year" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {byTeacher.map(({ teacherId, name, assignments: ta }) => {
        const uniqueClasses = new Set(ta.map((a) => a.classId)).size;
        const uniqueSubjects = new Set(ta.map((a) => a.subjectId)).size;
        const initial = name.charAt(0).toUpperCase();

        return (
          <div
            key={teacherId}
            style={{ border: '1px solid #e6e8eb', borderRadius: 10, overflow: 'hidden' }}
          >
            {/* Teacher header */}
            <div
              style={{
                padding: '12px 16px',
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: '1px solid #ecedf0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#dce9e3',
                  color: '#33604a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#14181c', margin: 0 }}>
                  {name}
                </p>
                <p style={{ fontSize: 11, color: '#8a929b', margin: '2px 0 0' }}>
                  {uniqueClasses} class{uniqueClasses !== 1 ? 'es' : ''} ·{' '}
                  {uniqueSubjects} subject{uniqueSubjects !== 1 ? 's' : ''} ·{' '}
                  {ta.length} assignment{ta.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Assignments table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Class', 'Section', 'Subject', 'Type', 'Class Teacher', 'Period'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#8a929b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #f2f4f6',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ta.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <td
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#2c322f',
                      }}
                    >
                      {a.class?.name}
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#6b7480' }}>
                      {a.section?.name}
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 13, color: '#2c322f' }}>
                      {a.subject?.name}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      {a.subject && <SubjectTypeBadge type={a.subject.subjectType} />}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      {a.isClassTeacher ? (
                        <span
                          style={{
                            fontSize: 11,
                            background: '#eef5f1',
                            color: '#33604a',
                            borderRadius: 10,
                            padding: '2px 8px',
                            fontWeight: 600,
                          }}
                        >
                          Yes
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#c5c0b6' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 12, color: '#8a929b' }}>
                      {fmtDate(a.startDate)}
                      {a.endDate ? ` – ${fmtDate(a.endDate)}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─── Class Teacher Coverage grid ──────────────────────────────────────────────

function ClassTeacherCoverageGrid({ yearId }: { yearId: string }) {
  const { data: coverage = [], isLoading } = useClassTeacherCoverage(yearId);

  if (isLoading || coverage.length === 0) return null;

  const totalSections = coverage.reduce((acc, c) => acc + c.sections.length, 0);
  const coveredSections = coverage.reduce(
    (acc, c) => acc + c.sections.filter((s) => s.classTeacher !== null).length,
    0,
  );
  const uncoveredSections = totalSections - coveredSections;

  return (
    <div
      style={{
        border: '1px solid #e6e8eb',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 20,
        background: '#fafafa',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#8a929b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: 0,
          }}
        >
          Class Teacher Coverage
        </p>
        <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
          <span style={{ color: '#33604a', fontWeight: 600 }}>
            {coveredSections} of {totalSections} covered
          </span>
          {uncoveredSections > 0 && (
            <span style={{ color: '#b42318', fontWeight: 600 }}>
              {uncoveredSections} missing
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {coverage.map((cls) =>
          cls.sections.map((s) => (
            <div
              key={s.sectionId}
              title={
                s.classTeacher
                  ? `${cls.className} ${s.sectionName}: ${s.classTeacher.teacherName}`
                  : `${cls.className} ${s.sectionName}: No class teacher assigned`
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                background: s.classTeacher ? '#eef5f1' : '#fef3f2',
                color: s.classTeacher ? '#33604a' : '#b42318',
                border: `1px solid ${s.classTeacher ? '#9bbdaa' : '#fecdca'}`,
                cursor: 'default',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: s.classTeacher ? '#33604a' : '#b42318',
                  flexShrink: 0,
                }}
              />
              {cls.className} {s.sectionName}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function AssignmentsTab({ yearId }: { yearId: string }) {
  const [view, setView] = React.useState<View>('by-class');

  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: assignments = [], isLoading: assignmentsLoading } = useTeacherAssignments(
    yearId || undefined,
  );

  // Build sectionId → class teacher name map from assignments
  const classTeacherMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const a of assignments) {
      if (a.isClassTeacher) {
        const p = a.teacher?.person;
        if (p) m.set(a.sectionId, `${p.firstName} ${p.lastName}`);
      }
    }
    return m;
  }, [assignments]);

  if (!yearId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 260,
          color: '#8a929b',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 28 }}>📅</span>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#4a5260' }}>
          Select an Academic Year
        </p>
        <p style={{ fontSize: 13 }}>
          Choose a year from the selector above to view teaching assignments.
        </p>
      </div>
    );
  }

  const isLoading = classesLoading || assignmentsLoading;

  return (
    <div>
      {/* Class teacher coverage grid */}
      <ClassTeacherCoverageGrid yearId={yearId} />

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#14181c', margin: 0 }}>
            Teaching Assignments
          </p>
          <p style={{ fontSize: 12, color: '#8a929b', margin: '2px 0 0' }}>
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} this year
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner size="md" />
        </div>
      ) : view === 'by-class' ? (
        <ByClassView
          classes={classes}
          assignments={assignments}
          classTeacherMap={classTeacherMap}
        />
      ) : (
        <ByTeacherView assignments={assignments} />
      )}
    </div>
  );
}
