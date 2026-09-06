'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudentHistory } from '@/lib/hooks/use-attendance';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PRESENT:  { bg: '#dcfce7', color: '#166534', label: 'P' },
  ABSENT:   { bg: '#fee2e2', color: '#991b1b', label: 'A' },
  LATE:     { bg: '#fef3c7', color: '#92400e', label: 'L' },
  HALF_DAY: { bg: '#ede9fe', color: '#6b21a8', label: 'H' },
  EXCUSED:  { bg: '#f1f5f9', color: '#475569', label: 'E' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudentHistoryCalendarProps {
  studentId: string;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function buildCalendarCells(year: number, month: number): (number | null)[] {
  // month is 1-indexed here
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun
  // We want Mon=0..Sun=6, so shift: Mon=(1->0), Tue=(2->1), ..., Sun=(0->6)
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  return [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentHistoryCalendar({
  studentId,
  year,
  month,
  onMonthChange,
}: StudentHistoryCalendarProps) {
  const { data, isLoading } = useStudentHistory(studentId, year, month);

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const recordMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of data?.records ?? []) {
      m.set(r.date.slice(0, 10), r.status);
    }
    return m;
  }, [data]);

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  const cells = buildCalendarCells(year, month);
  const summary = data?.summary;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            background: 'none',
            border: '1px solid #e6e8eb',
            borderRadius: 6,
            width: 30,
            height: 30,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={14} style={{ color: '#6b7480' }} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          style={{
            background: 'none',
            border: '1px solid #e6e8eb',
            borderRadius: 6,
            width: 30,
            height: 30,
            cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
            opacity: isCurrentMonth ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={14} style={{ color: '#6b7480' }} />
        </button>
      </div>

      {/* Summary strip */}
      {summary && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            padding: '10px 12px',
            background: '#f8f9fa',
            borderRadius: 8,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Present', key: 'present', color: '#166534', bg: '#dcfce7' },
            { label: 'Absent', key: 'absent', color: '#991b1b', bg: '#fee2e2' },
            { label: 'Late', key: 'late', color: '#92400e', bg: '#fef3c7' },
            { label: 'Half Day', key: 'halfDay', color: '#6b21a8', bg: '#ede9fe' },
            { label: 'Excused', key: 'excused', color: '#475569', bg: '#f1f5f9' },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: item.bg,
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>
                {summary[item.key as keyof typeof summary]}
              </span>
              <span style={{ fontSize: '11px', color: item.color }}>{item.label}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 'auto',
            }}
          >
            <span style={{ fontSize: '12px', color: '#6b7480' }}>Rate:</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#14181c' }}>
              {summary.rate}%
            </span>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderRadius: 6,
                background: '#f0f1f3',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#8a929b',
                  textAlign: 'center',
                  padding: '4px 0',
                  letterSpacing: '0.04em',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} />;
              }
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = recordMap.get(dateStr);
              const style = status ? STATUS_STYLE[status] : null;
              const isToday =
                dateStr ===
                new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={dateStr}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 52,
                    borderRadius: 6,
                    background: style ? style.bg : '#f8fafc',
                    border: isToday ? '2px solid #2b5fa8' : '1px solid transparent',
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isToday ? 700 : 500,
                      color: style ? style.color : '#cbd5e1',
                    }}
                  >
                    {day}
                  </span>
                  {style && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: style.color,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {style.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && (data?.records ?? []).length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '24px 0',
            color: '#8a929b',
            fontSize: '13px',
          }}
        >
          No attendance records for {MONTH_NAMES[month - 1]} {year}.
        </div>
      )}
    </div>
  );
}
