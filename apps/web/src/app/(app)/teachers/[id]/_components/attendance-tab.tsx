'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useEmployeeAttendance } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return d.toISOString().split('T')[0]!;
}

function monthStart(year: number, month: number) {
  return new Date(year, month, 1);
}
function monthEnd(year: number, month: number) {
  return new Date(year, month + 1, 0);
}

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'PRESENT':
    case 'WORK_FROM_HOME': return 'active';
    case 'LATE':
    case 'HALF_DAY':
    case 'ON_LEAVE':
    case 'HOLIDAY':        return 'pending';
    case 'ABSENT':         return 'left';
    default:               return 'default';
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late',
    HALF_DAY: 'Half Day', ON_LEAVE: 'On Leave',
    HOLIDAY: 'Holiday', WORK_FROM_HOME: 'WFH',
  };
  return map[status] ?? status;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Calendar grid ────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  PRESENT:        '#33604a',
  WORK_FROM_HOME: '#3d6678',
  LATE:           '#f59e0b',
  HALF_DAY:       '#8b5cf6',
  ON_LEAVE:       '#6b7480',
  HOLIDAY:        '#b0b6bc',
  ABSENT:         '#b3261e',
};

function CalendarGrid({
  year, month,
  recordsByDate,
}: {
  year: number;
  month: number;
  recordsByDate: Map<string, string>;
}) {
  const firstDay  = monthStart(year, month).getDay(); // 0=Sun
  const daysCount = monthEnd(year, month).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ fontSize: '11px', fontWeight: 600, color: '#8a929b', textAlign: 'center', padding: '4px 0', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>
      {/* Date cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status  = recordsByDate.get(dateStr);
          const dotColor = status ? (STATUS_DOT[status] ?? '#8a929b') : undefined;
          const isToday  = dateStr === toISO(new Date());

          return (
            <div
              key={i}
              className="flex flex-col items-center justify-center rounded-lg py-2"
              style={{
                background: isToday ? '#eef3fb' : status ? '#fafbfc' : 'transparent',
                border: isToday ? '1px solid #2b5fa8' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400, color: isToday ? '#2b5fa8' : '#14181c' }}>
                {day}
              </span>
              {dotColor && (
                <span className="block rounded-full mt-1" style={{ width: 6, height: 6, background: dotColor }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Attendance tab ───────────────────────────────────────────────────────────

export function AttendanceTab({ employeeId }: { employeeId: string }) {
  const today = new Date();
  const [year,  setYear]  = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());

  const from = toISO(monthStart(year, month));
  const to   = toISO(monthEnd(year, month));

  const { data, isLoading } = useEmployeeAttendance(employeeId, from, to);
  const records = data ?? [];

  // Build a date → status map
  const recordsByDate = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of records) {
      m.set(r.date.split('T')[0]!, r.status);
    }
    return m;
  }, [records]);

  // Summary counts
  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of records) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [records]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const isFuture       = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  const SUMMARY_ITEMS = [
    { label: 'Present',  status: 'PRESENT',  color: '#33604a', bg: '#dbe8dc' },
    { label: 'Absent',   status: 'ABSENT',   color: '#b3261e', bg: '#fde8e7' },
    { label: 'Late',     status: 'LATE',     color: '#92400e', bg: '#fef3c7' },
    { label: 'Half Day', status: 'HALF_DAY', color: '#5b21b6', bg: '#ede9fe' },
    { label: 'On Leave', status: 'ON_LEAVE', color: '#6b7480', bg: '#f3f4f6' },
    { label: 'WFH',      status: 'WORK_FROM_HOME', color: '#3d6678', bg: '#dfeaf1' },
  ];

  return (
    <div className="space-y-5">
      {/* Month navigator + summary */}
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0f2f4]">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-[#f5f6f7] transition-colors">
            <ChevronLeft size={16} style={{ color: '#6b7480' }} />
          </button>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>
            {MONTH_NAMES[month]} {year}
          </p>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1 rounded hover:bg-[#f5f6f7] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} style={{ color: '#6b7480' }} />
          </button>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-[#f0f2f4]">
          {SUMMARY_ITEMS.map((s) => {
            const count = counts[s.status] ?? 0;
            return (
              <div
                key={s.status}
                className="flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{ background: s.bg }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: s.color }}>{count}</span>
                <span style={{ fontSize: '12px', color: s.color, opacity: 0.8 }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Calendar */}
        <div className="p-5">
          {isLoading ? (
            <Skeleton height={200} className="rounded-lg" />
          ) : isFuture ? (
            <p style={{ fontSize: '13px', color: '#8a929b', textAlign: 'center', padding: '24px 0' }}>
              No data for future months.
            </p>
          ) : (
            <CalendarGrid year={year} month={month} recordsByDate={recordsByDate} />
          )}
        </div>
      </div>

      {/* Records list */}
      {!isLoading && records.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>Daily Records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid #e6e8eb' }}>
                  {['Date', 'Status', 'Check In', 'Check Out', 'Hours', 'Remarks'].map((h) => (
                    <th key={h} style={{ padding: '0 16px', height: 36, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a929b', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((r) => (
                    <tr key={r.id} style={{ height: 46, borderBottom: '1px solid #f0f2f4' }} className="hover:bg-[#fafbfc]">
                      <td style={{ padding: '0 16px', fontSize: '13px', color: '#14181c', whiteSpace: 'nowrap' }}>
                        {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                        <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
                      </td>
                      <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                        {r.checkInTime ?? '—'}
                      </td>
                      <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                        {r.checkOutTime ?? '—'}
                      </td>
                      <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                        {r.workHours != null ? `${r.workHours}h` : '—'}
                      </td>
                      <td style={{ padding: '0 16px', fontSize: '12.5px', color: '#8a929b' }}>
                        {r.remarks ?? '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && records.length === 0 && !isFuture && (
        <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-16 px-8 text-center">
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="No attendance records"
            description={`No attendance has been recorded for ${MONTH_NAMES[month]} ${year}.`}
          />
        </div>
      )}
    </div>
  );
}
