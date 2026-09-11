'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgingBucket {
  label: string;
  amount: string;
  amountNum: number;
  color: string;
  href?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeeAging({ buckets, totalLabel }: { buckets: AgingBucket[]; totalLabel?: string }) {
  const maxNum = Math.max(...buckets.map((b) => b.amountNum), 1);

  return (
    <div className="flex flex-col" style={{ gap: 9 }}>
      {buckets.map((bucket, i) => {
        const pct = (bucket.amountNum / maxNum) * 100;

        const inner = (
          <div key={i}>
            <div className="flex items-baseline justify-between" style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11.5, color: '#3a1a0c', fontWeight: 500 }}>{bucket.label}</div>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#9c4e28',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {bucket.amount}
              </div>
            </div>
            <div style={{ height: 6, background: '#e8d0be', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: bucket.color,
                borderRadius: 4,
                transition: 'width 500ms ease',
              }} />
            </div>
          </div>
        );

        return bucket.href ? (
          <a key={i} href={bucket.href} style={{ textDecoration: 'none' }}>{inner}</a>
        ) : <div key={i}>{inner}</div>;
      })}

      {totalLabel && (
        <div style={{
          marginTop: 3,
          padding: '7px 10px',
          background: '#fffdf8',
          border: '1px solid #e8d0be',
          borderRadius: 9,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, color: '#9c7060' }}>Total overdue</div>
          <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 15, fontWeight: 700, color: '#7a3018' }}>
            {totalLabel}
          </div>
        </div>
      )}
    </div>
  );
}
