'use client';

import * as React from 'react';

// ─── Color map ────────────────────────────────────────────────────────────────

const PERIOD_TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  CLASS:    { bg: '#dfeaf1', fg: '#3d6678' },
  LECTURE:  { bg: '#dfeaf1', fg: '#3d6678' },
  LAB:      { bg: '#dcfce7', fg: '#166534' },
  ACTIVITY: { bg: '#fef3c7', fg: '#92400e' },
  BREAK:    { bg: '#f3f4f6', fg: '#6b7280' },
  LUNCH:    { bg: '#fef3c7', fg: '#78350f' },
  ASSEMBLY: { bg: '#ede9fe', fg: '#5b21b6' },
};

const DEFAULT_COLOR = { bg: '#ede9fe', fg: '#5b21b6' };

/** Returns the bg/fg color pair for a given period type string. */
export function periodTypeColor(type: string): { bg: string; fg: string } {
  return PERIOD_TYPE_COLORS[type] ?? DEFAULT_COLOR;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PeriodTypeBadgeProps {
  type: string;
  className?: string;
}

/**
 * Colored inline badge for period types (CLASS, BREAK, LUNCH, LAB, ASSEMBLY, ACTIVITY).
 * Used in the timetable page, teacher profile timetable tab, and any schedule view.
 */
export function PeriodTypeBadge({ type, className }: PeriodTypeBadgeProps) {
  const color = periodTypeColor(type);
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: color.bg,
        color: color.fg,
        letterSpacing: '0.02em',
      }}
    >
      {type}
    </span>
  );
}
