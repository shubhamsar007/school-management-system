'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ActionItem {
  count: number;
  label: string;
  sub?: string;
  priority: ActionPriority;
  href?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY = {
  critical: { dot: '#b3261e', countBg: '#fde6e4', countFg: '#8c1e18' },
  high:     { dot: '#c87d2a', countBg: '#f5e8d0', countFg: '#8c5a1e' },
  medium:   { dot: '#2e7a52', countBg: '#d4edde', countFg: '#1e5034' },
  low:      { dot: '#6b7aaa', countBg: '#e2e6f5', countFg: '#3d4f88' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NeedsActionPanel({ items }: { items: ActionItem[] }) {
  return (
    <div className="flex flex-col" style={{ gap: 7 }}>
      {items.map((item, i) => {
        const p = PRIORITY[item.priority];
        const content = (
          <div
            className="flex items-center"
            style={{
              gap: 11,
              background: '#fffdf8',
              border: '1px solid #e6e1d5',
              borderRadius: 12,
              padding: '10px 12px',
              transition: 'border-color 140ms',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c9c4ba'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e6e1d5'; }}
          >
            {/* Priority dot */}
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: p.dot, flexShrink: 0,
            }} />

            {/* Count badge */}
            <div style={{
              minWidth: 30, height: 30, borderRadius: 9,
              background: p.countBg, color: p.countFg,
              fontSize: 12.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, padding: '0 6px',
            }}>
              {item.count > 99 ? '99+' : item.count}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2c322f', lineHeight: 1.3 }}>
                {item.label}
              </div>
              {item.sub && (
                <div style={{ fontSize: 11, color: '#8d938d', marginTop: 1 }}>{item.sub}</div>
              )}
            </div>

            {/* Arrow */}
            <div style={{ fontSize: 18, color: '#c0b9af', lineHeight: 1, flexShrink: 0 }}>›</div>
          </div>
        );

        return item.href ? (
          <a key={i} href={item.href} style={{ textDecoration: 'none' }}>{content}</a>
        ) : (
          <div key={i}>{content}</div>
        );
      })}
    </div>
  );
}
