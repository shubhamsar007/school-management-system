'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthPoint {
  month: string;   // "Apr"
  students: number; // already in % e.g. 91.4
  staff: number;
}

interface AttendanceChartProps {
  data: MonthPoint[];
  targetLine?: number;
  currentMonth?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AttendanceChart({ data, targetLine = 90, currentMonth }: AttendanceChartProps) {
  const W = 460;
  const H = 150;
  const PAD = { top: 12, right: 16, bottom: 26, left: 34 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const yMin = 82;
  const yMax = 100;
  const yRange = yMax - yMin;
  const n = data.length;

  const toX = (i: number) => PAD.left + (i / (n - 1)) * cW;
  const toY = (v: number) => PAD.top + cH - ((v - yMin) / yRange) * cH;

  // Smooth path using cubic bezier (catmull-rom style)
  function smoothPath(points: { x: number; y: number }[]) {
    if (points.length < 2) return '';
    const first = points[0]!;
    let d = `M ${first.x} ${first.y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }

  const studentPts = data.map((d, i) => ({ x: toX(i), y: toY(d.students) }));
  const staffPts   = data.map((d, i) => ({ x: toX(i), y: toY(d.staff) }));

  const studentLine = smoothPath(studentPts);
  const staffLine   = smoothPath(staffPts);

  const bottomY = PAD.top + cH;
  const studentArea = `${studentLine} L ${toX(n - 1)} ${bottomY} L ${toX(0)} ${bottomY} Z`;
  const staffArea   = `${staffLine}   L ${toX(n - 1)} ${bottomY} L ${toX(0)} ${bottomY} Z`;

  const targetY = toY(targetLine);
  const yGridLines = [84, 88, 92, 96, 100];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e7a52" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2e7a52" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="gradStaff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8623c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#b8623c" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines */}
        {yGridLines.map((v) => {
          const y = toY(v);
          return (
            <g key={v}>
              <line
                x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                stroke="#ddd9d0" strokeWidth={0.8} strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 5} y={y + 3.5}
                textAnchor="end" fill="#b0a99a"
                fontSize={8.5} fontFamily="Karla, sans-serif"
              >
                {v}%
              </text>
            </g>
          );
        })}

        {/* Target line */}
        <line
          x1={PAD.left} x2={W - PAD.right} y1={targetY} y2={targetY}
          stroke="#c87d2a" strokeWidth={1.2} strokeDasharray="5 3" opacity={0.75}
        />
        <text
          x={W - PAD.right + 3} y={targetY + 3.5}
          fill="#c87d2a" fontSize={8.5} fontFamily="Karla, sans-serif"
        >
          {targetLine}%
        </text>

        {/* Highlight current month column */}
        {currentMonth && data.map((d, i) => d.month === currentMonth ? (
          <rect
            key={i}
            x={toX(i) - 16} y={PAD.top}
            width={32} height={cH}
            fill="#2e7a52" opacity={0.04} rx={4}
          />
        ) : null)}

        {/* Area fills */}
        <path d={staffArea}   fill="url(#gradStaff)" />
        <path d={studentArea} fill="url(#gradStudents)" />

        {/* Lines */}
        <path d={staffLine}   fill="none" stroke="#b8623c" strokeWidth={1.8}
          strokeLinejoin="round" strokeLinecap="round" />
        <path d={studentLine} fill="none" stroke="#2e7a52" strokeWidth={2.2}
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {studentPts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={data[i]?.month === currentMonth ? 4 : 2.5}
            fill="#2e7a52" />
        ))}
        {staffPts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={data[i]?.month === currentMonth ? 4 : 2.5}
            fill="#b8623c" />
        ))}

        {/* X-axis month labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={toX(i)} y={H - 6}
            textAnchor="middle"
            fill={d.month === currentMonth ? '#2c322f' : '#a0998e'}
            fontSize={9.5}
            fontWeight={d.month === currentMonth ? 700 : 400}
            fontFamily="Karla, sans-serif"
          >
            {d.month}
          </text>
        ))}
      </svg>
    </div>
  );
}
