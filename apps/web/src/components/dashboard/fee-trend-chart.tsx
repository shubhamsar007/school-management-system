'use client';

import * as React from 'react';
import type { FinanceSummaryMonth } from '@/lib/hooks/use-dashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeeTrendChartProps {
  data: FinanceSummaryMonth[];
  /** Optional target line value in same unit as collected (raw ₹) */
  target?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLakh(amount: number) {
  const l = amount / 100_000;
  return l >= 10 ? `${Math.round(l)}L` : `${l.toFixed(1)}L`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeeTrendChart({ data, target }: FeeTrendChartProps) {
  const W = 460;
  const H = 150;
  const PAD = { top: 14, right: 16, bottom: 26, left: 42 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  if (!data.length) return null;

  const maxVal = Math.max(...data.map((d) => d.collected), target ?? 0, 1);
  // Round up max to a nice grid ceiling
  const gridMax = Math.ceil(maxVal / 100_000) * 100_000;
  const n = data.length;
  const barW = Math.min(36, (cW / n) * 0.55);
  const groupW = cW / n;

  const toX = (i: number) => PAD.left + i * groupW + groupW / 2;
  const toY = (v: number) => PAD.top + cH - (v / gridMax) * cH;
  const toH = (v: number) => (v / gridMax) * cH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1.0].map((f) => gridMax * f);

  // Optional target line (straight)
  const targetY = target ? toY(target) : null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="gradFee" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e7a52" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2e7a52" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {gridLines.map((v, i) => {
          const y = toY(v);
          return (
            <g key={i}>
              <line
                x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                stroke="#ddd9d0" strokeWidth={0.8} strokeDasharray={i === 0 ? 'none' : '3 3'}
              />
              {i > 0 && (
                <text
                  x={PAD.left - 4} y={y + 3.5}
                  textAnchor="end" fill="#b0a99a"
                  fontSize={8.5} fontFamily="Karla, sans-serif"
                >
                  ₹{toLakh(v)}
                </text>
              )}
            </g>
          );
        })}

        {/* Target dashed line */}
        {targetY !== null && target && (
          <>
            <line
              x1={PAD.left} x2={W - PAD.right} y1={targetY} y2={targetY}
              stroke="#c87d2a" strokeWidth={1.2} strokeDasharray="5 3" opacity={0.8}
            />
            <text
              x={W - PAD.right + 3} y={targetY + 3.5}
              fill="#c87d2a" fontSize={8} fontFamily="Karla, sans-serif"
            >
              Target
            </text>
          </>
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const x = toX(i) - barW / 2;
          const barH = toH(d.collected);
          const y = PAD.top + cH - barH;
          const isCurrentMonth = i === data.length - 1;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x} y={y} width={barW} height={Math.max(barH, 2)}
                fill={isCurrentMonth ? '#2e7a52' : 'url(#gradFee)'}
                opacity={isCurrentMonth ? 1 : 0.75}
                rx={4} ry={4}
              />
              {/* Value label on current month */}
              {isCurrentMonth && barH > 16 && (
                <text
                  x={toX(i)} y={y - 4}
                  textAnchor="middle" fill="#1e5034"
                  fontSize={8.5} fontWeight={700} fontFamily="Karla, sans-serif"
                >
                  ₹{toLakh(d.collected)}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis month labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={toX(i)} y={H - 6}
            textAnchor="middle"
            fill={i === data.length - 1 ? '#2c322f' : '#a0998e'}
            fontSize={9.5}
            fontWeight={i === data.length - 1 ? 700 : 400}
            fontFamily="Karla, sans-serif"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
