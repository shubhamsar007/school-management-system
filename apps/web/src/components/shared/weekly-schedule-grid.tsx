'use client';

import * as React from 'react';
import { Clock, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { periodTypeColor } from './period-type-badge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleGridPeriod {
  id: string;
  name: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  periodType: string;
}

export interface ScheduleGridEntry {
  id: string;
  dayOfWeek: number;
  period: ScheduleGridPeriod;
  /** Present on section schedule (shows the section the entry belongs to). */
  section?: { id: string; name: string; code: string };
  subject: { id: string; name: string };
  room?: { id: string; name: string; code: string } | null;
  /** Present on room schedule (shows the teacher). */
  teacher?: { id: string; name: string } | null;
}

export interface ScheduleGridDay {
  day: string;
  entries: ScheduleGridEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  // Handles "HH:MM:SS", "HH:MM", and ISO "1970-01-01T..."
  const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

// ─── Period card ──────────────────────────────────────────────────────────────

interface PeriodCardProps {
  entry: ScheduleGridEntry;
  /** Show the section code below the subject (for teacher/room views). */
  showSection?: boolean | undefined;
  /** Show the teacher name below the subject (for section/room views). */
  showTeacher?: boolean | undefined;
}

function PeriodCard({ entry, showSection, showTeacher }: PeriodCardProps) {
  const color = periodTypeColor(entry.period.periodType);
  const subtitle = [
    showSection && entry.section ? entry.section.code : null,
    showTeacher && entry.teacher ? entry.teacher.name : null,
    entry.room ? entry.room.name : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className="rounded-xl border flex-shrink-0 px-3 py-2.5"
      style={{ background: color.bg, borderColor: color.bg, minWidth: 160, maxWidth: 200 }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: color.fg, lineHeight: 1.3 }}>
        {entry.subject.name}
      </p>
      {subtitle && (
        <p style={{ fontSize: 11, color: color.fg, opacity: 0.8, marginTop: 2 }}>{subtitle}</p>
      )}
      <p style={{ fontSize: 11, color: color.fg, opacity: 0.65, marginTop: 3 }}>
        {formatTime(entry.period.startTime)} – {formatTime(entry.period.endTime)}
      </p>
    </div>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

interface SummaryStripProps {
  days: ScheduleGridDay[];
}

function SummaryStrip({ days }: SummaryStripProps) {
  const totalPeriods = days.reduce((s, d) => s + d.entries.length, 0);
  const uniqueSubjects = new Set(days.flatMap((d) => d.entries.map((e) => e.subject.id))).size;

  const stats = [
    { label: 'Days with classes', value: days.length },
    { label: 'Total periods / week', value: totalPeriods },
    { label: 'Subjects', value: uniqueSubjects },
  ];

  return (
    <div className="flex gap-4 flex-wrap">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-xl border border-[#e6e8eb] px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <p style={{ fontSize: 20, fontWeight: 700, color: '#14181c' }}>{s.value}</p>
          <p style={{ fontSize: 12, color: '#8a929b' }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WeeklyScheduleGridProps {
  days: ScheduleGridDay[];
  isLoading?: boolean;
  isError?: boolean;
  showSection?: boolean;
  showTeacher?: boolean;
  showSummary?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
}

/**
 * Day-grouped schedule view — one card per day, period cards scrollable inside.
 * Used by the teacher profile timetable tab, timetable page section view, and
 * any future student profile schedule tab.
 *
 * @param showSection  Show the section code on each period card (for teacher view).
 * @param showTeacher  Show the teacher name on each period card (for section/room view).
 * @param showSummary  Show the 3-stat summary strip at the top.
 */
export function WeeklyScheduleGrid({
  days,
  isLoading,
  isError,
  showSection,
  showTeacher,
  showSummary = false,
  emptyTitle = 'No schedule assigned',
  emptyDescription = 'No periods have been scheduled yet.',
  errorTitle = 'No active timetable',
  errorDescription = 'No active timetable was found.',
}: WeeklyScheduleGridProps) {
  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[#e6e8eb] px-5 py-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <Skeleton height={12} width={80} className="mb-3" />
            <div className="flex gap-3">
              <Skeleton height={60} width={160} className="rounded-xl" />
              <Skeleton height={60} width={160} className="rounded-xl" />
              <Skeleton height={60} width={160} className="rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<Clock size={24} />}
          title={errorTitle}
          description={errorDescription}
        />
      </div>
    );
  }

  // ── Empty ──
  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<BookOpen size={24} />}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  // ── Data ──
  return (
    <div className="space-y-4">
      {showSummary && <SummaryStrip days={days} />}

      {days.map((day) => (
        <div
          key={day.day}
          className="bg-white rounded-xl border border-[#e6e8eb]"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}
        >
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#f0f2f4]">
            <p style={{ fontSize: 13, fontWeight: 700, color: '#14181c', minWidth: 90 }}>
              {day.day}
            </p>
            <Badge variant="default">
              {day.entries.length} {day.entries.length === 1 ? 'period' : 'periods'}
            </Badge>
          </div>
          <div className="px-5 py-3 flex flex-wrap gap-2.5">
            {day.entries
              .slice()
              .sort((a, b) => a.period.periodNumber - b.period.periodNumber)
              .map((entry) => (
                <PeriodCard
                  key={entry.id}
                  entry={entry}
                  showSection={showSection}
                  showTeacher={showTeacher}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
