'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TargetMetric {
  key: string;
  label: string;
  target: number;
  actual: number | null;
  unit: '%' | 'count';
  href?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(actual: number | null, target: number): { track: string; fill: string; text: string } {
  if (actual === null) return { track: '#e8e3d8', fill: '#c8c4bc', text: '#8d938d' };
  const ratio = actual / target;
  if (ratio >= 1)   return { track: '#c4e8d4', fill: '#2e7a52', text: '#2e7a52' };
  if (ratio >= 0.9) return { track: '#fce4c8', fill: '#c87d2a', text: '#c87d2a' };
  return { track: '#f8d4d0', fill: '#b3261e', text: '#b3261e' };
}

// SVG ring gauge
function RingGauge({
  actual,
  target,
  size = 54,
}: {
  actual: number | null;
  target: number;
  size?: number;
}) {
  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = actual !== null ? Math.min(actual / target, 1.1) : 0;
  const dash = pct * circumference;
  const { track, fill } = statusColor(actual, target);

  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={track}
        strokeWidth={6}
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={fill}
        strokeWidth={6}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 700ms ease' }}
      />
      {/* Center value */}
      <text
        x={cx} y={cy + 4}
        textAnchor="middle"
        fill={fill}
        fontSize={11}
        fontWeight={700}
        fontFamily="Karla, sans-serif"
      >
        {actual !== null ? `${actual.toFixed(0)}` : '—'}
      </text>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TargetsWidgetProps {
  metrics: TargetMetric[];
  onEditTarget?: (key: string, newTarget: number) => void;
}

export function TargetsWidget({ metrics, onEditTarget }: TargetsWidgetProps) {
  const [editKey, setEditKey] = React.useState<string | null>(null);
  const [editVal, setEditVal] = React.useState('');

  const handleEditSave = (key: string) => {
    const n = parseFloat(editVal);
    if (!isNaN(n) && n > 0 && onEditTarget) {
      onEditTarget(key, n);
    }
    setEditKey(null);
    setEditVal('');
  };

  if (!metrics.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {metrics.map((m, i) => {
        const { text } = statusColor(m.actual, m.target);
        const isLast   = i === metrics.length - 1;
        const isEditing = editKey === m.key;
        const pct       = m.actual !== null ? Math.min((m.actual / m.target) * 100, 110) : 0;

        return (
          <div
            key={m.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingBottom: 10,
              borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
            }}
          >
            {/* Ring */}
            <RingGauge actual={m.actual} target={m.target} size={52} />

            {/* Text content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2c322f' }}>
                  {m.href ? (
                    <a href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {m.label}
                    </a>
                  ) : m.label}
                </span>
                {/* Target badge — click to edit */}
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      autoFocus
                      type="number"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(m.key);
                        if (e.key === 'Escape') { setEditKey(null); setEditVal(''); }
                      }}
                      style={{
                        width: 52, fontSize: 10.5, padding: '2px 5px',
                        border: '1px solid #bfd4c4', borderRadius: 6,
                        textAlign: 'right', outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => handleEditSave(m.key)}
                      style={{ fontSize: 9.5, color: '#2e7a52', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditKey(m.key); setEditVal(String(m.target)); }}
                    title="Click to edit target"
                    style={{
                      fontSize: 10, color: '#8d938d', background: '#f0ede8',
                      border: 'none', borderRadius: 6, padding: '1px 7px',
                      cursor: 'pointer', fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    Target: {m.target}{m.unit === '%' ? '%' : ''}
                  </button>
                )}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 5, background: '#e8e3d8', borderRadius: 3,
                  overflow: 'hidden', position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${Math.min(pct, 100)}%`,
                    background: text,
                    borderRadius: 3,
                    transition: 'width 700ms ease',
                  }}
                />
              </div>

              {/* Actual vs target text */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 10, color: text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {m.actual !== null ? `${m.actual.toFixed(1)}${m.unit === '%' ? '%' : ''}` : 'No data'}
                </span>
                <span style={{ fontSize: 9.5, color: '#a0998e' }}>
                  {m.actual !== null && m.actual >= m.target
                    ? 'Target met ✓'
                    : m.actual !== null
                    ? `${(m.target - m.actual).toFixed(1)}${m.unit === '%' ? 'pp' : ''} to go`
                    : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
