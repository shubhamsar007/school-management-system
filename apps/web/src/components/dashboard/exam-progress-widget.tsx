'use client';

import * as React from 'react';
import type { ExamProgressItem } from '@/lib/hooks/use-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: 'SCHEDULED' | 'ONGOING') {
  if (status === 'ONGOING') {
    return { label: 'Ongoing', bg: '#2e7a52', color: '#fff' };
  }
  return { label: 'Scheduled', bg: '#3a6b8a22', color: '#3a6b8a' };
}

function completionColor(pct: number) {
  if (pct >= 90) return '#2e7a52';
  if (pct >= 50) return '#c87d2a';
  return '#b3261e';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ExamProgressWidgetProps {
  exams: ExamProgressItem[];
  recentCompleted: number;
}

export function ExamProgressWidget({ exams, recentCompleted }: ExamProgressWidgetProps) {
  if (exams.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#8d938d', margin: 0 }}>
          No active exams
          {recentCompleted > 0 && (
            <span style={{ display: 'block', marginTop: 4 }}>
              {recentCompleted} exam{recentCompleted !== 1 ? 's' : ''} completed recently
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {exams.map((exam, i) => {
        const badge = statusBadge(exam.status);
        const barColor = completionColor(exam.completionPct);
        const isLast = i === exams.length - 1;

        return (
          <div
            key={exam.id}
            style={{
              paddingBottom: 10,
              borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
            }}
          >
            {/* Exam name + status badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 5,
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2c322f', flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {exam.name}
                </span>
                {exam.type && (
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#8d938d' }}>
                    {exam.type}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: badge.bg,
                  color: badge.color,
                  flexShrink: 0,
                }}
              >
                {badge.label}
              </span>
            </div>

            {/* Progress bar + percentage */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: '#e8e3d8',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${exam.completionPct}%`,
                    background: barColor,
                    borderRadius: 4,
                    transition: 'width 500ms ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: barColor,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 30,
                  textAlign: 'right',
                }}
              >
                {exam.completionPct}%
              </span>
            </div>

            {/* Meta row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: '#a0998e',
              }}
            >
              <span>
                {exam.marksEntered} marks entered
                {exam.totalSubjects > 0 && (
                  <span> · {exam.totalSubjects} subject{exam.totalSubjects !== 1 ? 's' : ''}</span>
                )}
              </span>
              {exam.pendingVerifications > 0 && (
                <span style={{ color: '#c87d2a', fontWeight: 600 }}>
                  {exam.pendingVerifications} pending verify
                </span>
              )}
              {exam.startDate && (
                <span>
                  {formatDate(exam.startDate)}
                  {exam.endDate ? ` – ${formatDate(exam.endDate)}` : ''}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {recentCompleted > 0 && (
        <div style={{ fontSize: 10.5, color: '#5d7f6b', paddingTop: 2 }}>
          + {recentCompleted} exam{recentCompleted !== 1 ? 's' : ''} completed in last 30 days
        </div>
      )}
    </div>
  );
}
