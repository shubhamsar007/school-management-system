'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FunnelStage {
  label: string;
  count: number;
  color: string;
  href?: string;
}

interface AdmissionsFunnelProps {
  stages: FunnelStage[];
  conversionRate?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdmissionsFunnel({ stages, conversionRate }: AdmissionsFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {stages.map((stage, i) => {
        const pct = (stage.count / maxCount) * 100;
        const inner = (
          <div key={i}>
            <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 11.5, color: '#2c3a42', fontWeight: 500 }}>{stage.label}</div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'var(--font-fraunces)',
                color: '#2c322f',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {stage.count.toLocaleString()}
              </div>
            </div>
            <div style={{ height: 7, background: '#c8dce8', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: stage.color,
                borderRadius: 5,
                transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
          </div>
        );

        return stage.href ? (
          <a key={i} href={stage.href} style={{ textDecoration: 'none' }}>{inner}</a>
        ) : <div key={i}>{inner}</div>;
      })}

      {conversionRate !== undefined && (
        <div
          style={{
            marginTop: 4,
            padding: '7px 10px',
            background: '#fffdf8',
            border: '1px solid #dde8f0',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 11, color: '#7a9aac' }}>Conversion rate</div>
          <div style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 15,
            fontWeight: 700,
            color: '#2a5473',
          }}>
            {conversionRate.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}
