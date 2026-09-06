'use client';

import * as React from 'react';
import {
  useAttendanceTrends,
  useClassAttendanceSummaries,
  type AttendanceTrend,
  type ClassSectionSummary,
} from '@/lib/hooks/use-attendance';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rateVariant(rate: number): { bg: string; color: string } {
  if (rate >= 90) return { bg: '#dcfce7', color: '#166534' };
  if (rate >= 75) return { bg: '#fef3c7', color: '#92400e' };
  return { bg: '#fee2e2', color: '#991b1b' };
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div
            style={{
              height: 14,
              borderRadius: 4,
              background: '#f0f1f3',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AnalyticsTabProps {
  campusId: string;
  academicYearId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsTab({ campusId, academicYearId }: AnalyticsTabProps) {
  const { data: trends = [], isLoading: trendsLoading } = useAttendanceTrends(campusId || undefined, 6);
  const { data: classSummaries = [], isLoading: classesLoading } = useClassAttendanceSummaries(
    academicYearId || null,
    campusId || undefined,
  );

  const TH_STYLE: React.CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '11px',
    color: '#8a929b',
    borderBottom: '1px solid #e6e8eb',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };

  const TD_STYLE: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#14181c',
    borderBottom: '1px solid #f0f1f3',
  };

  const TD_MUTED: React.CSSProperties = {
    ...TD_STYLE,
    color: '#6b7480',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Section 1: Attendance Trends ─────────────────────────── */}
      <div
        style={{
          borderRadius: 10,
          border: '1px solid #e6e8eb',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #f0f1f3',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>
            Attendance Trends
          </div>
          <div style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>
            Last 6 months overview
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafbfc' }}>
                <th style={TH_STYLE}>Month</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Total Records</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Present</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Absent</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Late</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {trendsLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : trends.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...TD_MUTED, textAlign: 'center', padding: '32px 16px' }}>
                    No trend data available.
                  </td>
                </tr>
              ) : (
                trends.map((t: AttendanceTrend) => {
                  const isLow = t.rate < 80 && t.total > 0;
                  return (
                    <tr
                      key={`${t.year}-${t.month}`}
                      style={{ background: isLow ? '#fffbf0' : 'transparent' }}
                    >
                      <td style={TD_STYLE}>
                        <span style={{ fontWeight: 500 }}>{t.label}</span>
                        {isLow && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: '10px',
                              fontWeight: 600,
                              color: '#92400e',
                              background: '#fef3c7',
                              borderRadius: 4,
                              padding: '1px 6px',
                            }}
                          >
                            LOW
                          </span>
                        )}
                      </td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{t.total}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{t.present}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{t.absent}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{t.late}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>
                        {t.total > 0 ? (
                          <span
                            style={{
                              fontWeight: 600,
                              color: rateVariant(t.rate).color,
                            }}
                          >
                            {t.rate}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Class/Section Breakdown ───────────────────── */}
      <div
        style={{
          borderRadius: 10,
          border: '1px solid #e6e8eb',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #f0f1f3',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>
            Class / Section Breakdown
          </div>
          <div style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>
            Current month attendance per section
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafbfc' }}>
                <th style={TH_STYLE}>Class</th>
                <th style={TH_STYLE}>Section</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Students</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Present</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Absent</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Late</th>
                <th style={{ ...TH_STYLE, textAlign: 'right' }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {classesLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : classSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...TD_MUTED, textAlign: 'center', padding: '32px 16px' }}>
                    No class data available for this academic year.
                  </td>
                </tr>
              ) : (
                classSummaries.map((s: ClassSectionSummary) => {
                  const variant = rateVariant(s.rate);
                  const hasData = s.present + s.absent + s.late > 0;
                  return (
                    <tr key={s.sectionId} className="hover:bg-[#fafbfc]">
                      <td style={TD_STYLE}>{s.className}</td>
                      <td style={TD_STYLE}>{s.sectionName}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{s.studentCount}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{s.present}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{s.absent}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>{s.late}</td>
                      <td style={{ ...TD_MUTED, textAlign: 'right' }}>
                        {hasData ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 20,
                              fontSize: '12px',
                              fontWeight: 600,
                              background: variant.bg,
                              color: variant.color,
                            }}
                          >
                            {s.rate}%
                          </span>
                        ) : (
                          <span style={{ color: '#b0b6bc', fontSize: '12px' }}>No data</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
