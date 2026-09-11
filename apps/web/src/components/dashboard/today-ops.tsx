'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpsHighlight = 'green' | 'amber' | 'red' | 'blue' | 'default';

export interface OpsRow {
  label: string;
  value: string | number;
  highlight?: OpsHighlight;
  href?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HIGHLIGHT: Record<OpsHighlight, string> = {
  green:   '#2e7a52',
  amber:   '#c87d2a',
  red:     '#b3261e',
  blue:    '#3a6b8a',
  default: '#2c322f',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TodayOps({ rows }: { rows: OpsRow[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      {rows.map((row, i) => {
        const valueEl = (
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-fraunces)',
            color: HIGHLIGHT[row.highlight ?? 'default'],
            letterSpacing: '-0.01em',
          }}>
            {row.value}
          </div>
        );

        return (
          <div
            key={i}
            className="flex items-center justify-between"
            style={{
              padding: '9px 0',
              borderBottom: i < rows.length - 1 ? '1px solid #e8e3d8' : 'none',
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7370', fontWeight: 500 }}>{row.label}</div>
            {row.href ? (
              <a href={row.href} style={{ textDecoration: 'none' }}>{valueEl}</a>
            ) : valueEl}
          </div>
        );
      })}
    </div>
  );
}
