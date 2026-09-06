'use client';

import * as React from 'react';
import { Button, Badge, Spinner } from '@/components/ui';
import { SubjectTypeBadge } from '@/components/ui/subject-type-badge';
import { useClasses, useClassSubjects, useAcademicYears, useOrganization } from '@/lib/hooks/use-academics';
import type { AcademicClass, ClassSubject } from '@/lib/types/academics';
import { AssignSubjectModal } from './assign-subject-modal';
import { EditClassSubjectModal } from './edit-class-subject-modal';
import { RemoveClassSubjectDialog } from './remove-class-subject-dialog';

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClassListItem({
  cls,
  selected,
  onClick,
}: {
  cls: AcademicClass;
  selected: boolean;
  onClick: () => void;
}) {
  const sectionCount = cls.sections?.length ?? 0;
  const studentCount = cls._count?.studentEnrollments ?? 0;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 14px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        background: selected ? '#d8e9de' : 'transparent',
        marginBottom: 2,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = '#f4f1e8';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: selected ? 600 : 500, color: selected ? '#33604a' : '#14181c' }}>
          {cls.name}
        </span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: selected ? '#5d7f6b' : '#8a929b' }}>
          {cls.code}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
        <span style={{ fontSize: 11, color: selected ? '#5d7f6b' : '#a9aca4' }}>
          {sectionCount} section{sectionCount !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: selected ? '#5d7f6b' : '#c5c0b6' }}>·</span>
        <span style={{ fontSize: 11, color: selected ? '#5d7f6b' : '#a9aca4' }}>
          {studentCount} students
        </span>
      </div>
    </button>
  );
}

// ─── Subject assignments table ─────────────────────────────────────────────────

const COL = '1fr 90px 120px 80px 80px 80px 80px 100px';
const HEADERS = ['SUBJECT', 'CODE', 'TYPE', 'OPTIONAL', 'MAX', 'PASS', 'WEIGHT', 'ACTIONS'];

function SubjectRow({
  cs,
  onEdit,
  onRemove,
}: {
  cs: ClassSubject;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: COL, minHeight: 50, borderBottom: '1px solid #f4f1e8' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fbf9f3'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* Subject name */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, fontWeight: 500, color: '#14181c' }}>
        {cs.subject?.name ?? '—'}
      </div>

      {/* Code */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 11, fontFamily: 'monospace', color: '#6b7480' }}>
        {cs.subject?.code ?? '—'}
      </div>

      {/* Type */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        {cs.subject ? <SubjectTypeBadge type={cs.subject.subjectType} /> : '—'}
      </div>

      {/* Optional */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        {cs.isOptional ? (
          <Badge variant="default">Optional</Badge>
        ) : (
          <span style={{ fontSize: 11, color: '#c5c0b6' }}>—</span>
        )}
      </div>

      {/* Max marks */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, color: '#2c322f' }}>
        {cs.maxMarks != null ? cs.maxMarks : <span style={{ color: '#c5c0b6' }}>—</span>}
      </div>

      {/* Pass marks */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, color: '#2c322f' }}>
        {cs.passingMarks != null ? cs.passingMarks : <span style={{ color: '#c5c0b6' }}>—</span>}
      </div>

      {/* Weightage */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, color: '#2c322f' }}>
        {cs.weightage != null ? `${cs.weightage}%` : <span style={{ color: '#c5c0b6' }}>—</span>}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px', gap: 8, fontSize: 12, fontWeight: 500 }}>
        <button className="hover:underline cursor-pointer text-[#2b5fa8]" onClick={onEdit}>
          Edit
        </button>
        <span style={{ color: '#d7dce1' }}>|</span>
        <button className="hover:underline cursor-pointer text-[#b3261e]" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SubjectSummaryBar({ assignments }: { assignments: ClassSubject[] }) {
  const core = assignments.filter((a) => a.subject?.subjectType === 'CORE').length;
  const elective = assignments.filter((a) => a.subject?.subjectType === 'ELECTIVE').length;
  const coCurr = assignments.filter((a) => a.subject?.subjectType === 'CO_CURRICULAR').length;
  const language = assignments.filter((a) => a.subject?.subjectType === 'LANGUAGE').length;
  const optional = assignments.filter((a) => a.isOptional).length;

  const pill = (label: string, count: number, color: string, bg: string) =>
    count > 0 ? (
      <span
        key={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 600,
          background: bg,
          color,
        }}
      >
        {count} {label}
      </span>
    ) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {pill('Core', core, '#33604a', '#d8e9de')}
      {pill('Elective', elective, '#3d6678', '#dfeaf1')}
      {pill('Co-Curr', coCurr, '#584a75', '#e6e1ef')}
      {pill('Language', language, '#8e5334', '#f2e0d2')}
      {optional > 0 && (
        <span style={{ fontSize: 11, color: '#8a929b', marginLeft: 4 }}>
          · {optional} optional
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CurriculumTabProps {
  yearId: string;
}

export function CurriculumTab({ yearId }: CurriculumTabProps) {
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ClassSubject | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<ClassSubject | null>(null);

  const { data: org } = useOrganization();
  const { data: years = [] } = useAcademicYears(org?.id);
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: assignments = [], isLoading: assignmentsLoading } = useClassSubjects(
    selectedClassId ?? undefined,
    yearId || undefined,
  );

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;
  const yearName = years.find((y) => y.id === yearId)?.name ?? '';

  // Auto-select first class when classes load
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      const first = classes[0];
      if (first) setSelectedClassId(first.id);
    }
  }, [classes, selectedClassId]);

  // ── No year selected ──
  if (!yearId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 280,
          gap: 8,
          color: '#8a929b',
        }}
      >
        <span style={{ fontSize: 28 }}>📅</span>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#4a5260' }}>Select an Academic Year</p>
        <p style={{ fontSize: 13 }}>
          Use the Academic Year selector above to view and manage curriculum.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          border: '1px solid #e6e8eb',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(20,24,28,0.06)',
          minHeight: 520,
        }}
      >
        {/* ── Left: Class list ── */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid #eef0f2',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid #eef0f2',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#a9aca4',
            }}
          >
            Classes
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
            {classesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spinner />
              </div>
            ) : classes.length === 0 ? (
              <p style={{ padding: 16, fontSize: 12, color: '#8a929b', textAlign: 'center' }}>
                No classes found.
              </p>
            ) : (
              classes.map((cls) => (
                <ClassListItem
                  key={cls.id}
                  cls={cls}
                  selected={cls.id === selectedClassId}
                  onClick={() => setSelectedClassId(cls.id)}
                />
              ))
            )}
          </div>

          {/* Footer note */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #eef0f2',
              fontSize: 11,
              color: '#8a929b',
            }}
          >
            {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* ── Right: Subject assignments ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {!selectedClass ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8a929b',
                fontSize: 13,
              }}
            >
              ← Select a class to view its curriculum
            </div>
          ) : (
            <>
              {/* Right header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid #eef0f2',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#14181c', margin: 0 }}>
                      {selectedClass.name}
                    </p>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#8a929b' }}>
                      {selectedClass.code}
                    </span>
                    <span style={{ fontSize: 12, color: '#8a929b' }}>·</span>
                    <span style={{ fontSize: 12, color: '#6b7480' }}>{yearName}</span>
                  </div>
                  {!assignmentsLoading && assignments.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <SubjectSummaryBar assignments={assignments} />
                    </div>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={() => setAssignOpen(true)}
                >
                  + Assign Subject
                </Button>
              </div>

              {/* Subject table */}
              {assignmentsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <Spinner />
                </div>
              ) : assignments.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                    gap: 8,
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#4a5260' }}>
                    No subjects assigned yet
                  </p>
                  <p style={{ fontSize: 13, color: '#8a929b', marginBottom: 12 }}>
                    Assign subjects to {selectedClass.name} for {yearName}.
                  </p>
                  <Button variant="primary" onClick={() => setAssignOpen(true)}>
                    + Assign First Subject
                  </Button>
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {/* Table header */}
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: COL,
                      background: '#fbf9f3',
                      borderBottom: '1px solid #efece2',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {HEADERS.map((h, i) => (
                      <div
                        key={h}
                        style={{
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 12px',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.09em',
                          color: '#a9aca4',
                          justifyContent: i === HEADERS.length - 1 ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {assignments.map((cs) => (
                    <SubjectRow
                      key={cs.id}
                      cs={cs}
                      onEdit={() => setEditTarget(cs)}
                      onRemove={() => setRemoveTarget(cs)}
                    />
                  ))}

                  {/* Footer */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderTop: '1px solid #f4f1e8',
                      fontSize: 11,
                      color: '#8a929b',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{assignments.length} subject{assignments.length !== 1 ? 's' : ''} assigned</span>
                    <span>
                      {assignments.filter((a) => a.maxMarks).length} with marks configuration
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedClass && assignOpen && (
        <AssignSubjectModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          cls={selectedClass}
          yearId={yearId}
          yearName={yearName}
        />
      )}

      {editTarget && (
        <EditClassSubjectModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          assignment={editTarget}
        />
      )}

      {removeTarget && (
        <RemoveClassSubjectDialog
          open={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          assignment={removeTarget}
        />
      )}
    </>
  );
}
