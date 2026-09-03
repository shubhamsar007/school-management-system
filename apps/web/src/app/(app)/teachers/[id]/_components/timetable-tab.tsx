'use client';

import * as React from 'react';
import { Clock, BookOpen } from 'lucide-react';
import { useTeacherTimetable } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string) {
  // t is stored as HH:MM:SS or HH:MM
  const [h, m] = t.split(':');
  const hour = parseInt(h ?? '0', 10);
  const min  = m ?? '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12  = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${min} ${ampm}`;
}

const PERIOD_TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  LECTURE:  { bg: '#dfeaf1', fg: '#3d6678' },
  LAB:      { bg: '#dcfce7', fg: '#166534' },
  ACTIVITY: { bg: '#fef3c7', fg: '#92400e' },
  BREAK:    { bg: '#f3f4f6', fg: '#6b7280' },
  DEFAULT:  { bg: '#ede9fe', fg: '#5b21b6' },
};

function periodColor(type: string) {
  return PERIOD_TYPE_COLORS[type] ?? PERIOD_TYPE_COLORS.DEFAULT!;
}

// ─── Period card ──────────────────────────────────────────────────────────────

function PeriodCard({ entry }: { entry: import('@/lib/hooks/use-teachers').TimetableEntry }) {
  const color = periodColor(entry.period.periodType);
  return (
    <div
      className="rounded-xl border px-3 py-2.5 flex-shrink-0"
      style={{
        background: color.bg,
        borderColor: color.bg,
        minWidth: 160,
        maxWidth: 200,
      }}
    >
      <p style={{ fontSize: '12px', fontWeight: 700, color: color.fg }}>{entry.subject.name}</p>
      <p style={{ fontSize: '11px', color: color.fg, opacity: 0.8, marginTop: 1 }}>
        {entry.section.name}
        {entry.room ? ` · ${entry.room.name}` : ''}
      </p>
      <p style={{ fontSize: '11px', color: color.fg, opacity: 0.65, marginTop: 3 }}>
        {formatTime(entry.period.startTime)} – {formatTime(entry.period.endTime)}
      </p>
    </div>
  );
}

// ─── Timetable tab ────────────────────────────────────────────────────────────

export function TimetableTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading, isError } = useTeacherTimetable(employeeId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] px-5 py-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Skeleton height={12} width={80} className="mb-3" />
            <div className="flex gap-3">
              <Skeleton height={56} width={160} className="rounded-xl" />
              <Skeleton height={56} width={160} className="rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<Clock size={24} />}
          title="No active timetable"
          description="No active timetable was found for this teacher. Create one in the Timetable module."
        />
      </div>
    );
  }

  const days = data ?? [];

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No schedule assigned"
          description="This teacher has not been assigned to any periods in the active timetable."
        />
      </div>
    );
  }

  // Summary
  const totalPeriods  = days.reduce((s, d) => s + d.entries.length, 0);
  const uniqueSubjects = new Set(days.flatMap((d) => d.entries.map((e) => e.subject.name))).size;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Days with classes', value: days.length },
          { label: 'Total periods/week', value: totalPeriods },
          { label: 'Subjects taught', value: uniqueSubjects },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e6e8eb] px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#14181c' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#8a929b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Day rows */}
      {days.map((day) => (
        <div
          key={day.day}
          className="bg-white rounded-xl border border-[#e6e8eb]"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}
        >
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#f0f2f4]">
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#14181c', minWidth: 90 }}>
              {day.day}
            </p>
            <Badge variant="default">{day.entries.length} {day.entries.length === 1 ? 'period' : 'periods'}</Badge>
          </div>
          <div className="px-5 py-3 flex flex-wrap gap-2.5">
            {day.entries
              .slice()
              .sort((a, b) => a.period.periodNumber - b.period.periodNumber)
              .map((entry) => (
                <PeriodCard key={entry.id} entry={entry} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
