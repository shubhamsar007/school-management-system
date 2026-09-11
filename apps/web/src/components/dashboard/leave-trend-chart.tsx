'use client';

import * as React from 'react';
import type { LeaveMonth, LeaveTypeBreakdown } from '@/lib/hooks/use-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const APPROVED_COLOR = '#3a6b8a';
const PENDING_COLOR  = '#c87d2a';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveTrendChartProps {
  monthly: LeaveMonth[];
  pendingBreakdown: LeaveTypeBreakdown[];
  totalPending: number;
  totalApprovedThisMonth: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeaveTrendChart({
  monthly,
  pendingBreakdown,
  totalPending,
  totalApprovedThisMonth,
}: LeaveTrendChartProps) {
  const W = 400;
  const H = 130;
  const PAD = { top: 12, right: 14, bottom: 24, left: 28 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...monthly.flatMap((m) => [m.approved, m.pending]), 1);
  const gridMax = Math.ceil(maxVal / 5) * 5 || 5;
  const n = monthly.length;
  const barW = Math.min(28, (cW / n) * 0.38);
  const groupW = cW / n;

  const toX = (i: number) => PAD.left + i * groupW + groupW / 2;
  const toY = (v: number) => PAD.top + cH - (v / gridMax) * cH;
  const toH = (v: number) => (v / gridMax) * cH;

  const gridLines = [0, 0.5, 1.0].map((f) => Math.round(gridMax * f));

  if (!monthly.length) return null;

  return (
    <div>
      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        {/* Grid lines */}
        {gridLines.map((v, i) => {
          const y = toY(v);
          return (
            <g key={i}>
              <line
                x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                stroke="#ddd9d0" strokeWidth={0.8}
                strokeDasharray={i === 0 ? 'none' : '3 3'}
              />
              {i > 0 && (
                <text
                  x={PAD.left - 4} y={y + 3.5}
                  textAnchor="end" fill="#b0a99a"
                  fontSize={8} fontFamily="Karla, sans-serif"
                >
                  {v}
                </text>
              )}
            </g>
          );
        })}

        {/* Grouped bars — Approved (left) + Pending (right) */}
        {monthly.map((m, i) => {
          const cx = toX(i);
          const isCurrent = i === monthly.length - 1;
          const gap = barW * 0.2;

          const approvedH = toH(m.approved);
          const pendingH  = toH(m.pending);
          const approvedY = PAD.top + cH - approvedH;
          const pendingY  = PAD.top + cH - pendingH;

          return (
            <g key={i}>
              {/* Approved bar */}
              <rect
                x={cx - barW - gap / 2}
                y={approvedY}
                width={barW}
                height={Math.max(approvedH, m.approved > 0 ? 2 : 0)}
                fill={APPROVED_COLOR}
                opacity={isCurrent ? 1 : 0.65}
                rx={3} ry={3}
              />
              {/* Pending bar */}
              <rect
                x={cx + gap / 2}
                y={pendingY}
                width={barW}
                height={Math.max(pendingH, m.pending > 0 ? 2 : 0)}
                fill={PENDING_COLOR}
                opacity={isCurrent ? 1 : 0.65}
                rx={3} ry={3}
              />
              {/* X-axis label */}
              <text
                x={cx} y={H - 5}
                textAnchor="middle"
                fill={isCurrent ? '#2c322f' : '#a0998e'}
                fontSize={9}
                fontWeight={isCurrent ? 700 : 400}
                fontFamily="Karla, sans-serif"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend row */}
      <div style={{ display: 'flex', gap: 16, marginTop: 4, marginBottom: 10 }}>
        {[
          { color: APPROVED_COLOR, label: 'Approved' },
          { color: PENDING_COLOR,  label: 'Pending' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
            <span style={{ fontSize: 10, color: '#8d938d' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#8d938d' }}>
          <span style={{ fontWeight: 700, color: '#c87d2a', fontVariantNumeric: 'tabular-nums' }}>
            {totalPending}
          </span>
          {' '}pending · this month{' '}
          <span style={{ fontWeight: 700, color: APPROVED_COLOR, fontVariantNumeric: 'tabular-nums' }}>
            {totalApprovedThisMonth}
          </span>
          {' '}approved
        </div>
      </div>

      {/* Pending breakdown by type */}
      {pendingBreakdown.length > 0 && (
        <div
          style={{
            borderTop: '1px solid #e8e3d8',
            paddingTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
            Pending by Type
          </div>
          {pendingBreakdown.slice(0, 4).map((item) => {
            const pct = totalPending > 0 ? (item.count / totalPending) * 100 : 0;
            return (
              <div key={item.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10.5, color: '#2c322f' }}>{item.type}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#c87d2a', fontVariantNumeric: 'tabular-nums' }}>
                    {item.count}
                    <span style={{ fontSize: 9, fontWeight: 400, color: '#a0998e' }}>
                      {' '}({item.days}d)
                    </span>
                  </span>
                </div>
                <div style={{ height: 3, background: '#e8e3d8', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: PENDING_COLOR,
                      borderRadius: 2,
                      transition: 'width 500ms ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
