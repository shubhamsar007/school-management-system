'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useClasses, useSections } from '@/lib/hooks/use-academics';
import { useAttendanceRoster, useMarkStudentAttendance } from '@/lib/hooks/use-attendance';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EntryState {
  status: string;
  remarks: string;
}

interface MarkStudentAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  campusId: string;
  academicYearId: string;
  date: string;
}

const STATUS_OPTIONS = [
  { label: 'Present', value: 'PRESENT' },
  { label: 'Absent', value: 'ABSENT' },
  { label: 'Late', value: 'LATE' },
  { label: 'Half Day', value: 'HALF_DAY' },
  { label: 'Excused', value: 'EXCUSED' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MarkStudentAttendanceModal({
  open,
  onClose,
  campusId,
  academicYearId,
  date: propDate,
}: MarkStudentAttendanceModalProps) {
  const toast = useToast();
  const [classId, setClassId] = React.useState('');
  const [sectionId, setSectionId] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(propDate);
  const [entries, setEntries] = React.useState<Map<string, EntryState>>(new Map());

  const { data: classes = [] } = useClasses();
  const { data: sections = [] } = useSections(classId || null);
  const { data: roster = [], isFetching: rosterLoading } = useAttendanceRoster(
    sectionId || undefined,
    academicYearId || undefined,
    selectedDate || undefined,
  );
  const mark = useMarkStudentAttendance();

  // When class changes, clear section
  React.useEffect(() => {
    setSectionId('');
  }, [classId]);

  // Sync entries when roster loads
  React.useEffect(() => {
    const next = new Map<string, EntryState>();
    for (const row of roster) {
      next.set(row.studentId, {
        status: row.attendance?.status ?? 'PRESENT',
        remarks: row.attendance?.remarks ?? '',
      });
    }
    setEntries(next);
  }, [roster]);

  function markAllPresent() {
    const next = new Map<string, EntryState>();
    for (const [studentId, entry] of entries) {
      next.set(studentId, { ...entry, status: 'PRESENT' });
    }
    setEntries(next);
  }

  function updateEntry(studentId: string, field: keyof EntryState, value: string) {
    setEntries((prev) => {
      const next = new Map(prev);
      const existing = next.get(studentId) ?? { status: 'PRESENT', remarks: '' };
      next.set(studentId, { ...existing, [field]: value });
      return next;
    });
  }

  async function handleSubmit() {
    if (!sectionId || !selectedDate) {
      toast.error('Please select a class, section, and date.');
      return;
    }
    if (roster.length === 0) {
      toast.error('No students in this section.');
      return;
    }

    const dtoEntries = roster.map((row) => {
      const entry = entries.get(row.studentId) ?? { status: 'PRESENT', remarks: '' };
      return {
        studentId: row.studentId,
        enrollmentId: row.enrollmentId,
        status: entry.status,
        ...(entry.remarks ? { remarks: entry.remarks } : {}),
      };
    });

    mark.mutate(
      { date: selectedDate, entries: dtoEntries },
      {
        onSuccess: () => {
          toast.success(`Attendance marked for ${dtoEntries.length} students`);
          onClose();
        },
        onError: () => {
          toast.error('Failed to mark attendance. Please try again.');
        },
      },
    );
  }

  // ── Summary counts ────────────────────────────────────────────
  const summary = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries.values()) {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Student Attendance"
      size="lg"
      footer={
        <>
          {/* Summary strip */}
          <div style={{ flex: 1, display: 'flex', gap: 16, fontSize: '12px', color: '#6b7480' }}>
            {STATUS_OPTIONS.map((s) =>
              (summary[s.value] ?? 0) > 0 ? (
                <span key={s.value}>
                  <strong style={{ color: '#14181c' }}>{summary[s.value]}</strong> {s.label}
                </span>
              ) : null,
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={mark.isPending || roster.length === 0}>
            {mark.isPending ? 'Saving…' : 'Submit Attendance'}
          </Button>
        </>
      }
    >
      {/* ── Selectors ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#6b7480', display: 'block', marginBottom: 4 }}>
            Class
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              border: '1px solid #d7dce1',
              borderRadius: 6,
              padding: '0 10px',
              fontSize: '13px',
              color: '#14181c',
              background: '#fff',
            }}
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#6b7480', display: 'block', marginBottom: 4 }}>
            Section
          </label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
            style={{
              width: '100%',
              height: 36,
              border: '1px solid #d7dce1',
              borderRadius: 6,
              padding: '0 10px',
              fontSize: '13px',
              color: '#14181c',
              background: classId ? '#fff' : '#f5f6f7',
            }}
          >
            <option value="">Select section…</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#6b7480', display: 'block', marginBottom: 4 }}>
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: '100%',
              height: 36,
              border: '1px solid #d7dce1',
              borderRadius: 6,
              padding: '0 10px',
              fontSize: '13px',
              color: '#14181c',
            }}
          />
        </div>
      </div>

      {/* ── Mark All Present ───────────────────────────────────── */}
      {roster.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button variant="ghost" onClick={markAllPresent} style={{ fontSize: '12px' }}>
            Mark All Present
          </Button>
        </div>
      )}

      {/* ── Student Table ──────────────────────────────────────── */}
      {rosterLoading && sectionId ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
          Loading students…
        </div>
      ) : !sectionId ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
          Select a class and section to load students.
        </div>
      ) : roster.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
          No active students found in this section.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '11px',
                    color: '#6b7480',
                    borderBottom: '1px solid #e6e8eb',
                    width: 60,
                  }}
                >
                  ROLL
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '11px',
                    color: '#6b7480',
                    borderBottom: '1px solid #e6e8eb',
                  }}
                >
                  STUDENT
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '11px',
                    color: '#6b7480',
                    borderBottom: '1px solid #e6e8eb',
                    width: 140,
                  }}
                >
                  STATUS
                </th>
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '11px',
                    color: '#6b7480',
                    borderBottom: '1px solid #e6e8eb',
                  }}
                >
                  REMARKS
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((row) => {
                const entry = entries.get(row.studentId) ?? { status: 'PRESENT', remarks: '' };
                return (
                  <tr key={row.studentId} style={{ borderBottom: '1px solid #f0f1f3' }}>
                    <td style={{ padding: '8px 12px', color: '#8a929b', fontWeight: 500 }}>
                      {row.rollNumber ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#14181c', fontWeight: 500 }}>
                      {row.student.person.firstName} {row.student.person.lastName}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <select
                        value={entry.status}
                        onChange={(e) => updateEntry(row.studentId, 'status', e.target.value)}
                        style={{
                          height: 30,
                          border: '1px solid #d7dce1',
                          borderRadius: 5,
                          padding: '0 8px',
                          fontSize: '12px',
                          color: '#14181c',
                          background: '#fff',
                          width: '100%',
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        value={entry.remarks}
                        onChange={(e) => updateEntry(row.studentId, 'remarks', e.target.value)}
                        placeholder="Optional"
                        style={{
                          height: 30,
                          border: '1px solid #d7dce1',
                          borderRadius: 5,
                          padding: '0 8px',
                          fontSize: '12px',
                          color: '#14181c',
                          width: '100%',
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
