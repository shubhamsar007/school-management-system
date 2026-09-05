'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { useConflicts, useTimetableFull } from '@/lib/hooks/use-timetable';
import type { TimetableConflict, TimetableSummary } from '@/lib/hooks/use-timetable';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

// ─── Conflict card ────────────────────────────────────────────────────────────

function ConflictCard({ conflict }: { conflict: TimetableConflict }) {
  const isTeacher = conflict.type === 'TEACHER';
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{ background: '#fff5f5', border: '1.5px solid #fecaca' }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <AlertTriangle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#b91c1c',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {isTeacher ? 'Teacher Conflict' : 'Room Conflict'}
        </span>
        <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 'auto' }}>
          {conflict.day} · {conflict.period.name} ({formatTime(conflict.period.startTime)})
        </span>
      </div>

      {isTeacher && conflict.teacher ? (
        <p style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>
          {conflict.teacher.person.firstName} {conflict.teacher.person.lastName} is assigned to{' '}
          {conflict.entries.length} sections simultaneously
        </p>
      ) : (
        conflict.room && (
          <p style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>
            {conflict.room.name} is booked for {conflict.entries.length} sections simultaneously
          </p>
        )
      )}

      <div className="flex flex-col gap-0.5">
        {conflict.entries.map((e) => (
          <div key={e.id} className="flex items-center gap-1" style={{ fontSize: 10, color: '#4b5563' }}>
            <span style={{ color: '#d1d5db' }}>·</span>
            <span style={{ fontWeight: 500 }}>{e.section.name}</span>
            {e.subject && <span style={{ color: '#9ca3af' }}>— {e.subject.name}</span>}
            {!isTeacher && e.teacher && (
              <span style={{ color: '#9ca3af' }}>
                ({e.teacher.person.firstName} {e.teacher.person.lastName})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Teacher workload ─────────────────────────────────────────────────────────

interface TeacherWorkload {
  teacherId: string;
  name: string;
  periodsByDay: Record<number, number>;
  total: number;
}

const DAY_COLS = [
  { num: 1, label: 'Mon' },
  { num: 2, label: 'Tue' },
  { num: 3, label: 'Wed' },
  { num: 4, label: 'Thu' },
  { num: 5, label: 'Fri' },
  { num: 6, label: 'Sat' },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface HealthTabProps {
  timetable: TimetableSummary;
}

export function HealthTab({ timetable }: HealthTabProps) {
  const { data: conflicts, isLoading: conflictsLoading } = useConflicts(timetable.id);
  const { data: full, isLoading: fullLoading } = useTimetableFull(timetable.id);

  // Derive teacher workload from full timetable entries
  const teacherWorkload = React.useMemo<TeacherWorkload[]>(() => {
    if (!full) return [];
    const map = new Map<string, TeacherWorkload>();
    for (const entry of full.entries) {
      if (!entry.teacher) continue;
      const tid = entry.teacher.id;
      if (!map.has(tid)) {
        map.set(tid, {
          teacherId: tid,
          name: `${entry.teacher.person.firstName} ${entry.teacher.person.lastName}`,
          periodsByDay: {},
          total: 0,
        });
      }
      const wl = map.get(tid)!;
      wl.periodsByDay[entry.dayOfWeek] = (wl.periodsByDay[entry.dayOfWeek] ?? 0) + 1;
      wl.total += 1;
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [full]);

  // Quick stats
  const stats = React.useMemo(() => {
    if (!full) return null;
    const { entries } = full;
    const sections = new Set(entries.map((e) => e.sectionId)).size;
    const teachers = new Set(entries.filter((e) => e.teacher).map((e) => e.teacherId!)).size;
    const rooms = new Set(entries.filter((e) => e.room).map((e) => e.roomId!)).size;
    return { total: entries.length, sections, teachers, rooms };
  }, [full]);

  const isLoading = conflictsLoading || fullLoading;
  const totalConflicts = conflicts?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
        Analysing timetable…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Quick stats ── */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'TOTAL ENTRIES', value: stats.total },
            { label: 'SECTIONS', value: stats.sections },
            { label: 'TEACHERS ASSIGNED', value: stats.teachers },
            { label: 'ROOMS USED', value: stats.rooms },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 flex flex-col gap-1"
              style={{ background: '#fafbfc', border: '1px solid #e6e8eb' }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#8a929b',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#14181c', lineHeight: 1.1 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Conflict detection ── */}
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <span style={{ fontSize: 12, fontWeight: 700, color: '#14181c' }}>Conflict Detection</span>
          {totalConflicts === 0 ? (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ml-2"
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: 11,
                color: '#15803d',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={11} /> All clear
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ml-2"
              style={{
                background: '#fff5f5',
                border: '1px solid #fecaca',
                fontSize: 11,
                color: '#b91c1c',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={11} /> {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="p-4">
          {totalConflicts === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckCircle2 size={36} style={{ color: '#86efac' }} />
              <p className="text-sm font-semibold text-[#15803d]">No conflicts detected</p>
              <p className="text-xs text-[#8a929b]">
                Every teacher and room is assigned to at most one section per period.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                ...(conflicts?.teacherConflicts ?? []),
                ...(conflicts?.roomConflicts ?? []),
              ].map((c, i) => (
                <ConflictCard key={i} conflict={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Teacher workload ── */}
      {teacherWorkload.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
            <Users size={13} style={{ color: '#8a929b' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#14181c' }}>Teacher Workload</span>
            <span style={{ fontSize: 11, color: '#8a929b' }}>
              {teacherWorkload.length} teacher{teacherWorkload.length !== 1 ? 's' : ''} assigned
            </span>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px 14px',
                      color: '#8a929b',
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      borderBottom: '1px solid #eef0f2',
                      textTransform: 'uppercase',
                    }}
                  >
                    Teacher
                  </th>
                  {DAY_COLS.map((d) => (
                    <th
                      key={d.num}
                      style={{
                        textAlign: 'center',
                        padding: '8px 10px',
                        color: '#8a929b',
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        borderBottom: '1px solid #eef0f2',
                        textTransform: 'uppercase',
                        width: 52,
                      }}
                    >
                      {d.label}
                    </th>
                  ))}
                  <th
                    style={{
                      textAlign: 'center',
                      padding: '8px 14px',
                      color: '#8a929b',
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      borderBottom: '1px solid #eef0f2',
                      textTransform: 'uppercase',
                      width: 60,
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {teacherWorkload.map((tw, i) => (
                  <tr key={tw.teacherId} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                    <td
                      style={{
                        padding: '7px 14px',
                        color: '#14181c',
                        fontWeight: 500,
                        borderBottom: '1px solid #f3f4f5',
                      }}
                    >
                      {tw.name}
                    </td>
                    {DAY_COLS.map((d) => (
                      <td
                        key={d.num}
                        style={{
                          textAlign: 'center',
                          padding: '7px 10px',
                          color: tw.periodsByDay[d.num] ? '#1d4ed8' : '#d1d5db',
                          fontWeight: tw.periodsByDay[d.num] ? 600 : 400,
                          borderBottom: '1px solid #f3f4f5',
                        }}
                      >
                        {tw.periodsByDay[d.num] ?? '—'}
                      </td>
                    ))}
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '7px 14px',
                        borderBottom: '1px solid #f3f4f5',
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center rounded-full"
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: 10,
                          fontWeight: 700,
                          width: 26,
                          height: 20,
                        }}
                      >
                        {tw.total}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!stats && !isLoading && (
        <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
          No entries in this timetable yet.
        </div>
      )}
    </div>
  );
}
