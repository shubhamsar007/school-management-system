'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubstitutionData {
  absentTeachers: number;
  affectedPeriods: number;
  covered: number;
  uncovered: number;
  coverageRate: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubstitutionWidget({ data }: { data: SubstitutionData }) {
  const rateColor =
    data.coverageRate >= 95 ? '#2e7a52' :
    data.coverageRate >= 80 ? '#c87d2a' :
    '#b3261e';

  const stats = [
    { label: 'Absent Teachers',  value: data.absentTeachers,  color: data.absentTeachers > 5 ? '#c87d2a' : '#2c322f' },
    { label: 'Affected Periods', value: data.affectedPeriods, color: '#2c322f' },
    { label: 'Covered',          value: data.covered,         color: '#2e7a52' },
    { label: 'Uncovered',        value: data.uncovered,       color: data.uncovered > 0 ? '#b3261e' : '#2c322f' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2" style={{ gap: 8, marginBottom: 10 }}>
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#fffdf8',
              border: '1px solid #e6e1d5',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div style={{
              fontSize: 9.5,
              color: '#8d938d',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'var(--font-fraunces)',
              color: stat.color,
              letterSpacing: '-0.02em',
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Coverage rate bar */}
      <div style={{
        background: '#fffdf8',
        border: '1px solid #e6e1d5',
        borderRadius: 10,
        padding: '10px 14px',
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11.5, color: '#6b7370', fontWeight: 600 }}>Coverage Rate</div>
          <div style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 18,
            fontWeight: 700,
            color: rateColor,
            letterSpacing: '-0.01em',
          }}>
            {data.coverageRate.toFixed(1)}%
          </div>
        </div>
        <div style={{ height: 6, background: '#e6e1d5', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${data.coverageRate}%`,
            background: rateColor,
            borderRadius: 4,
            transition: 'width 500ms ease',
          }} />
        </div>
      </div>
    </div>
  );
}
