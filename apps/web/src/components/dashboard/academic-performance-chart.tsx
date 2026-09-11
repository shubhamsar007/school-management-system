'use client';

import * as React from 'react';
import type { SubjectPerformance, ClassPerformance } from '@/lib/hooks/use-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#2e7a52';
  if (score >= 60) return '#3a6b8a';
  if (score >= 40) return '#c87d2a';
  return '#b3261e';
}

function passRateColor(rate: number): string {
  if (rate >= 90) return '#2e7a52';
  if (rate >= 75) return '#3a6b8a';
  if (rate >= 60) return '#c87d2a';
  return '#b3261e';
}

// ─── Sub-components ────────────────────────────────────────────────────────

type Tab = 'subject' | 'class';

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabBtn({ active, onClick, children }: TabBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 10.5,
        fontWeight: active ? 700 : 500,
        color: active ? '#2e7a52' : '#a0998e',
        background: active ? '#2e7a5215' : 'transparent',
        border: 'none',
        borderRadius: 6,
        padding: '3px 10px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ─── Subject chart ────────────────────────────────────────────────────────────

function SubjectChart({ data }: { data: SubjectPerformance[] }) {
  if (!data.length) {
    return (
      <p style={{ fontSize: 11.5, color: '#8d938d', textAlign: 'center', padding: '16px 0' }}>
        No subject data
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.avgScore), 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {data.map((row, i) => {
        const color = scoreColor(row.avgScore);
        const pct = (row.avgScore / max) * 100;
        const isLast = i === data.length - 1;

        return (
          <div
            key={row.subject}
            style={{
              padding: '7px 0',
              borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2c322f' }}>
                {row.subject}
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.avgScore.toFixed(1)}
                <span style={{ fontSize: 9.5, fontWeight: 400, color: '#a9aca4' }}>/100</span>
              </span>
            </div>
            <div
              style={{
                height: 5,
                background: '#e8e3d8',
                borderRadius: 3,
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
                  width: `${pct}%`,
                  background: color,
                  borderRadius: 3,
                  transition: 'width 500ms ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Class chart ──────────────────────────────────────────────────────────────

function ClassChart({ data }: { data: ClassPerformance[] }) {
  if (!data.length) {
    return (
      <p style={{ fontSize: 11.5, color: '#8d938d', textAlign: 'center', padding: '16px 0' }}>
        No class data
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {data.map((row, i) => {
        const avgColor = scoreColor(row.avgScore);
        const passColor = passRateColor(row.passRate);
        const isLast = i === data.length - 1;

        return (
          <div
            key={row.class}
            style={{
              padding: '7px 0',
              borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#2c322f',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.class}
              </div>
              <div style={{ fontSize: 9.5, color: '#a0998e', marginTop: 1 }}>
                {row.studentCount} student{row.studentCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Avg score pill */}
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: avgColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.avgScore.toFixed(1)}%
              </div>
              <div style={{ fontSize: 9.5, color: '#a0998e' }}>avg</div>
            </div>

            {/* Pass rate pill */}
            <div
              style={{
                background: passColor + '18',
                borderRadius: 8,
                padding: '2px 8px',
                textAlign: 'center',
                minWidth: 44,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: passColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.passRate}%
              </div>
              <div style={{ fontSize: 8.5, color: passColor, opacity: 0.8 }}>pass</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AcademicPerformanceChartProps {
  bySubject: SubjectPerformance[];
  byClass: ClassPerformance[];
  latestExamName: string | null;
}

export function AcademicPerformanceChart({
  bySubject,
  byClass,
  latestExamName,
}: AcademicPerformanceChartProps) {
  const [tab, setTab] = React.useState<Tab>('subject');

  return (
    <div>
      {/* Header row: exam name + tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        {latestExamName ? (
          <span style={{ fontSize: 10, color: '#8d938d', fontStyle: 'italic' }}>
            {latestExamName}
          </span>
        ) : (
          <span />
        )}
        <div style={{ display: 'flex', gap: 2 }}>
          <TabBtn active={tab === 'subject'} onClick={() => setTab('subject')}>
            By Subject
          </TabBtn>
          <TabBtn active={tab === 'class'} onClick={() => setTab('class')}>
            By Class
          </TabBtn>
        </div>
      </div>

      {tab === 'subject' ? (
        <SubjectChart data={bySubject} />
      ) : (
        <ClassChart data={byClass} />
      )}
    </div>
  );
}
