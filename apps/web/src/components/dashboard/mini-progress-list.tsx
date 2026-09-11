'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressItem {
  label: string;
  value: string;
  pct: number;         // 0–100
  barColor: string;
  trackColor: string;
  href?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MiniProgressList({ items }: { items: ProgressItem[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 11 }}>
      {items.map((item, i) => {
        const inner = (
          <div key={i}>
            <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 12.5, color: '#1e3028', fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#3d6050' }}>{item.value}</div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 4, background: item.trackColor, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(item.pct, 100)}%`,
                background: item.barColor,
                borderRadius: 4,
                transition: 'width 400ms ease',
              }} />
            </div>
          </div>
        );

        return item.href ? (
          <a key={i} href={item.href} style={{ textDecoration: 'none' }}>{inner}</a>
        ) : <div key={i}>{inner}</div>;
      })}
    </div>
  );
}
