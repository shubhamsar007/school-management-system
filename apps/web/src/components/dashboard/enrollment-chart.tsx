'use client';

import * as React from 'react';
import type { EnrollmentClass } from '@/lib/hooks/use-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function occupancyColor(pct: number | null): string {
  if (pct === null) return '#3a7a57';
  if (pct >= 95)    return '#b3261e';
  if (pct >= 85)    return '#c87d2a';
  return '#2e7a52';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EnrollmentChartProps {
  classes: EnrollmentClass[];
  /** Max classes to display before scrolling (default: 10) */
  maxVisible?: number;
}

export function EnrollmentChart({ classes, maxVisible = 10 }: EnrollmentChartProps) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? classes : classes.slice(0, maxVisible);
  const hasMore = classes.length > maxVisible;

  const maxEnrolled = Math.max(...classes.map((c) => c.enrolled), 1);
  const maxCapacity = Math.max(...classes.map((c) => c.capacity ?? 0), maxEnrolled, 1);
  const scale = maxCapacity;

  if (!classes.length) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ fontSize: 12, color: '#8d938d' }}>No enrollment data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      {visible.map((cls, i) => {
        const enrolledPct = (cls.enrolled / scale) * 100;
        const capacityPct = cls.capacity ? (cls.capacity / scale) * 100 : 100;
        const barColor = occupancyColor(cls.occupancy);
        const isLast = i === visible.length - 1;

        return (
          <div
            key={cls.id}
            style={{
              padding: '8px 0',
              borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
            }}
          >
            {/* Row header */}
            <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#2c322f' }}>
                {cls.name}
              </div>
              <div className="flex items-center gap-2">
                {cls.occupancy !== null && cls.occupancy >= 85 && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 700,
                    color: barColor, background: barColor + '18',
                    padding: '1px 6px', borderRadius: 10,
                  }}>
                    {cls.occupancy.toFixed(0)}%
                  </span>
                )}
                <span style={{
                  fontSize: 11.5, fontWeight: 700,
                  color: barColor, fontVariantNumeric: 'tabular-nums',
                }}>
                  {cls.enrolled.toLocaleString()}
                  {cls.capacity ? (
                    <span style={{ fontSize: 10.5, color: '#a9aca4', fontWeight: 400 }}>
                      {' / '}{cls.capacity.toLocaleString()}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            {/* Bar track */}
            <div style={{
              position: 'relative',
              height: 7,
              background: '#e8e3d8',
              borderRadius: 5,
              overflow: 'hidden',
            }}>
              {/* Capacity marker (lighter track) */}
              {cls.capacity && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0,
                  width: `${capacityPct}%`, height: '100%',
                  background: '#d4cfc4',
                  borderRadius: 5,
                }} />
              )}
              {/* Enrolled bar */}
              <div style={{
                position: 'absolute',
                left: 0, top: 0,
                width: `${enrolledPct}%`, height: '100%',
                background: barColor,
                borderRadius: 5,
                transition: 'width 500ms ease',
              }} />
            </div>
          </div>
        );
      })}

      {/* Expand / collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded((p) => !p)}
          style={{
            marginTop: 8,
            fontSize: 11.5, fontWeight: 600,
            color: '#5d7f6b',
            background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left', padding: 0,
          }}
        >
          {expanded
            ? 'Show less ↑'
            : `Show ${classes.length - maxVisible} more classes ↓`}
        </button>
      )}
    </div>
  );
}
