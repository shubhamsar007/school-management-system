'use client';

import * as React from 'react';
import type { CoverageDayPoint } from '@/lib/hooks/use-dashboard';

// ─── Component ────────────────────────────────────────────────────────────────

interface CoverageTrendChartProps {
  weekTrend: CoverageDayPoint[];
}

function rateColor(rate: number | null): string {
  if (rate === null) return '#e8e3d8';
  if (rate >= 90) return '#2e7a52';
  if (rate >= 70) return '#c87d2a';
  return '#b3261e';
}

function dayLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
}

export function CoverageTrendChart({ weekTrend }: CoverageTrendChartProps) {
  if (!weekTrend.length) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        7-Day Coverage
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 48 }}>
        {weekTrend.map((day) => {
          const rate = day.coverageRate;
          const isToday = day.date === today;
          const barH = rate !== null ? Math.max((rate / 100) * 36, day.total > 0 ? 4 : 2) : 2;
          const color = rateColor(rate);

          return (
            <div
              key={day.date}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
            >
              {rate !== null && (
                <div style={{ fontSize: 8.5, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                  {rate}%
                </div>
              )}
              <div
                title={
                  rate !== null
                    ? `${day.covered}/${day.total} covered (${rate}%)`
                    : 'No data'
                }
                style={{
                  width: '100%',
                  height: barH,
                  background: color,
                  borderRadius: '3px 3px 0 0',
                  opacity: isToday ? 1 : 0.7,
                  border: isToday ? `1px solid ${color}` : 'none',
                }}
              />
              <div
                style={{
                  fontSize: 8,
                  color: isToday ? '#2c322f' : '#b0a99a',
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {dayLabel(day.date)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
