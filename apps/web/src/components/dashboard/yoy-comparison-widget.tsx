'use client';

import * as React from 'react';
import type { YoYMetric } from '@/lib/hooks/use-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatValue(value: number, unit: string): string {
  if (unit === '₹') {
    const l = value / 100_000;
    return l >= 100 ? `₹${Math.round(l / 10) * 10 / 100}Cr` : `₹${l >= 10 ? Math.round(l) : l.toFixed(1)}L`;
  }
  return value.toLocaleString('en-IN');
}

function deltaColor(delta: number): string {
  if (delta > 0) return '#2e7a52';
  if (delta < 0) return '#b3261e';
  return '#8d938d';
}

function deltaBg(delta: number): string {
  if (delta > 0) return '#d8f0e2';
  if (delta < 0) return '#fde6e4';
  return '#f0ede8';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface YoYComparisonWidgetProps {
  metrics: YoYMetric[];
  currentYearName: string | null;
  previousYearName: string | null;
}

export function YoYComparisonWidget({
  metrics,
  currentYearName,
  previousYearName,
}: YoYComparisonWidgetProps) {
  if (!metrics.length) {
    return (
      <p style={{ fontSize: 11.5, color: '#8d938d', textAlign: 'center', padding: '12px 0' }}>
        No comparison data — set up academic years first
      </p>
    );
  }

  return (
    <div>
      {/* Year labels header */}
      {currentYearName && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 10,
            padding: '0 4px',
          }}
        >
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Metric
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {previousYearName && (
              <span style={{ fontSize: 9.5, color: '#a0998e', fontWeight: 500 }}>
                {previousYearName}
              </span>
            )}
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#2c322f' }}>
              {currentYearName}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#8d938d', width: 54, textAlign: 'right' }}>
              YoY
            </span>
          </div>
        </div>
      )}

      {/* Metric rows */}
      {metrics.map((m, i) => {
        const isLast = i === metrics.length - 1;
        const color  = deltaColor(m.delta);
        const bg     = deltaBg(m.delta);
        const arrow  = m.delta > 0 ? '↑' : m.delta < 0 ? '↓' : '—';
        const pctStr = m.deltaPercent !== null
          ? `${m.delta > 0 ? '+' : ''}${m.deltaPercent.toFixed(1)}%`
          : '—';

        return (
          <div
            key={m.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 4px',
              borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
              gap: 8,
            }}
          >
            {/* Label */}
            <span style={{ fontSize: 11.5, fontWeight: 500, color: '#2c322f', flex: 1 }}>
              {m.label}
            </span>

            {/* Values + delta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
              {m.previous > 0 && (
                <span style={{ fontSize: 11, color: '#a0998e', fontVariantNumeric: 'tabular-nums', minWidth: 52, textAlign: 'right' }}>
                  {formatValue(m.previous, m.unit)}
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2c322f', fontVariantNumeric: 'tabular-nums', minWidth: 52, textAlign: 'right' }}>
                {formatValue(m.current, m.unit)}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  background: bg,
                  borderRadius: 8,
                  padding: '2px 8px',
                  minWidth: 54,
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 9, color, fontWeight: 700 }}>{arrow}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                  {pctStr}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
