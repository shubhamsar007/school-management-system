'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PulseStatus = 'good' | 'watch' | 'attention';

export interface PulseMetric {
  label: string;
  value: string;
  status: PulseStatus;
  target?: string;
  href?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = {
  good:      { dot: '#2e7a52', text: '#2e7a52', bg: '#d4edde', label: '✓ Good' },
  watch:     { dot: '#c87d2a', text: '#8c5a1e', bg: '#f5e8d0', label: '⚠ Watch' },
  attention: { dot: '#b3261e', text: '#8c1e18', bg: '#fde6e4', label: '⚠ Attention' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SchoolPulse({ metrics }: { metrics: PulseMetric[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 7 }}>
      {metrics.map((m, i) => {
        const s = STATUS[m.status];
        const Inner = (
          <div
            className="flex items-center"
            style={{
              gap: 10,
              padding: '9px 12px',
              background: '#fffdf8',
              border: '1px solid #ede9df',
              borderRadius: 11,
              cursor: m.href ? 'pointer' : 'default',
              transition: 'border-color 140ms',
            }}
            onMouseEnter={(e) => { if (m.href) (e.currentTarget as HTMLElement).style.borderColor = '#c9c4ba'; }}
            onMouseLeave={(e) => { if (m.href) (e.currentTarget as HTMLElement).style.borderColor = '#ede9df'; }}
          >
            {/* Status dot */}
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />

            {/* Label */}
            <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: '#2c322f' }}>{m.label}</div>

            {/* Target */}
            {m.target && (
              <div style={{ fontSize: 10.5, color: '#a9aca4' }}>
                target {m.target}
              </div>
            )}

            {/* Value */}
            <div style={{
              fontSize: 13.5,
              fontWeight: 700,
              fontFamily: 'var(--font-fraunces)',
              color: '#2c322f',
              minWidth: 44,
              textAlign: 'right',
            }}>
              {m.value}
            </div>

            {/* Badge */}
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: s.text,
              background: s.bg,
              padding: '2px 9px',
              borderRadius: 20,
              flexShrink: 0,
              letterSpacing: '0.01em',
            }}>
              {s.label}
            </div>
          </div>
        );

        return m.href ? (
          <a key={i} href={m.href} style={{ textDecoration: 'none' }}>{Inner}</a>
        ) : (
          <div key={i}>{Inner}</div>
        );
      })}
    </div>
  );
}
