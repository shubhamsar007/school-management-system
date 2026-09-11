'use client';

import * as React from 'react';
import type { AtRiskStudent, AtRiskSummary } from '@/lib/hooks/use-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FLAG_META = {
  attendance: { label: 'Attendance', color: '#b3261e', bg: '#b3261e18', icon: '↓' },
  marks:      { label: 'Marks',      color: '#c87d2a', bg: '#c87d2a18', icon: '↘' },
  fees:       { label: 'Fees',       color: '#7c4fa0', bg: '#7c4fa018', icon: '₹' },
} as const;

// ─── Summary bar ─────────────────────────────────────────────────────────────

function SummaryRow({ summary }: { summary: AtRiskSummary }) {
  const stats = [
    { label: 'Low Attendance', value: summary.lowAttendance, color: '#b3261e' },
    { label: 'Declining Marks', value: summary.decliningMarks, color: '#c87d2a' },
    { label: 'Overdue Fees', value: summary.overduefees, color: '#7c4fa0' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        marginBottom: 12,
        padding: '8px 0',
        borderBottom: '1px solid #e8e3d8',
      }}
    >
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: s.color,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: 9.5, color: '#a0998e', marginTop: 1 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Student row ──────────────────────────────────────────────────────────────

function StudentRow({ student, isLast }: { student: AtRiskStudent; isLast: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
        gap: 8,
      }}
    >
      {/* Name + class */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: '#2c322f',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {student.name}
        </div>
        {student.class && (
          <div style={{ fontSize: 9.5, color: '#a0998e', marginTop: 1 }}>{student.class}</div>
        )}
      </div>

      {/* Flag pills */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {student.flags.map((flag) => {
          const meta = FLAG_META[flag];
          return (
            <span
              key={flag}
              title={
                flag === 'attendance' && student.attendanceRate !== null
                  ? `${student.attendanceRate}% attendance`
                  : flag === 'fees' && student.overdueAmount !== null
                  ? `₹${student.overdueAmount.toLocaleString('en-IN')} overdue`
                  : meta.label
              }
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 8,
                background: meta.bg,
                color: meta.color,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span style={{ fontSize: 8 }}>{meta.icon}</span>
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AtRiskWidgetProps {
  summary: AtRiskSummary;
  students: AtRiskStudent[];
}

export function AtRiskWidget({ summary, students }: AtRiskWidgetProps) {
  const [expanded, setExpanded] = React.useState(false);
  const MAX_VISIBLE = 5;
  const visible = expanded ? students : students.slice(0, MAX_VISIBLE);
  const hasMore = students.length > MAX_VISIBLE;

  if (summary.total === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#2e7a52', fontWeight: 600, margin: 0 }}>
          All clear — no at-risk students
        </p>
      </div>
    );
  }

  return (
    <div>
      <SummaryRow summary={summary} />

      {visible.map((student, i) => (
        <StudentRow
          key={student.id}
          student={student}
          isLast={i === visible.length - 1 && !hasMore}
        />
      ))}

      {hasMore && (
        <button
          onClick={() => setExpanded((p) => !p)}
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: 600,
            color: '#5d7f6b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded
            ? 'Show less ↑'
            : `Show ${students.length - MAX_VISIBLE} more students ↓`}
        </button>
      )}

      {summary.total > 20 && (
        <div style={{ fontSize: 10, color: '#a0998e', marginTop: 6 }}>
          Showing top 20 of {summary.total} at-risk students
        </div>
      )}
    </div>
  );
}
