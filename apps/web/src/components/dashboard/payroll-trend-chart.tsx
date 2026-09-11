'use client';

import * as React from 'react';
import type { PayrollMonth } from '@/lib/hooks/use-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLakh(n: number): string {
  const l = n / 100_000;
  return l >= 100
    ? `₹${(l / 100).toFixed(1)}Cr`
    : l >= 10
    ? `₹${Math.round(l)}L`
    : `₹${l.toFixed(1)}L`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PayrollTrendChartProps {
  monthly: PayrollMonth[];
  totalGross: number;
  totalNet: number;
  financialYear: string;
}

const GROSS_COLOR = '#3a6b8a';
const NET_COLOR   = '#2e7a52';

export function PayrollTrendChart({
  monthly,
  totalGross,
  totalNet,
  financialYear,
}: PayrollTrendChartProps) {
  const W = 420;
  const H = 140;
  const PAD = { top: 14, right: 14, bottom: 26, left: 44 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  if (!monthly.length) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#8d938d', margin: 0 }}>
          No payroll runs yet for {financialYear}
        </p>
      </div>
    );
  }

  const maxVal  = Math.max(...monthly.flatMap((m) => [m.gross, m.net]), 1);
  const gridMax = Math.ceil(maxVal / 100_000) * 100_000 || 100_000;
  const n       = monthly.length;
  const barW    = Math.min(22, (cW / n) * 0.35);
  const groupW  = cW / n;

  const toX = (i: number) => PAD.left + i * groupW + groupW / 2;
  const toY = (v: number) => PAD.top + cH - (v / gridMax) * cH;
  const toH = (v: number) => (v / gridMax) * cH;

  const gridLines = [0, 0.5, 1.0].map((f) => gridMax * f);

  return (
    <div>
      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
          marginBottom: 10,
          padding: '8px 10px',
          background: '#f0f4f8',
          borderRadius: 10,
        }}
      >
        {[
          { label: `FY ${financialYear} Gross`, value: toLakh(totalGross), color: GROSS_COLOR },
          { label: 'Net Disbursed',             value: toLakh(totalNet),   color: NET_COLOR },
          { label: 'TDS Withheld',              value: toLakh(totalGross - totalNet), color: '#7c4fa0' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-fraunces, serif)', fontWeight: 700, color: s.color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 9, color: '#8d938d', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

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
                  {toLakh(v)}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {monthly.map((m, i) => {
          const cx         = toX(i);
          const isCurrent  = i === monthly.length - 1;
          const gap        = barW * 0.15;

          const grossH = toH(m.gross);
          const netH   = toH(m.net);

          return (
            <g key={m.period}>
              {/* Gross bar */}
              <rect
                x={cx - barW - gap / 2}
                y={toY(m.gross)}
                width={barW}
                height={Math.max(grossH, m.gross > 0 ? 2 : 0)}
                fill={GROSS_COLOR}
                opacity={isCurrent ? 1 : 0.65}
                rx={3} ry={3}
              />
              {/* Net bar */}
              <rect
                x={cx + gap / 2}
                y={toY(m.net)}
                width={barW}
                height={Math.max(netH, m.net > 0 ? 2 : 0)}
                fill={NET_COLOR}
                opacity={isCurrent ? 1 : 0.65}
                rx={3} ry={3}
              />
              {/* Headcount label above current month */}
              {isCurrent && m.headcount > 0 && (
                <text
                  x={cx} y={toY(m.gross) - 5}
                  textAnchor="middle" fill="#4e6a7d"
                  fontSize={8.5} fontFamily="Karla, sans-serif" fontWeight={600}
                >
                  {m.headcount} staff
                </text>
              )}
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

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
        {[
          { color: GROSS_COLOR, label: 'Gross' },
          { color: NET_COLOR,   label: 'Net' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
            <span style={{ fontSize: 10, color: '#8d938d' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
