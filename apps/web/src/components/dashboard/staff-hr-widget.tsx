'use client';

import * as React from 'react';
import type { DashboardStaffHR } from '@/lib/hooks/use-dashboard';

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color = '#2c322f',
  bg,
}: {
  label: string;
  value: string | number;
  color?: string;
  bg?: string;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '8px 6px',
        background: bg ?? 'transparent',
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontFamily: 'var(--font-fraunces, serif)',
          fontWeight: 700,
          color,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 9.5, color: '#8d938d', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DeptBar({
  name,
  count,
  max,
  isLast,
}: {
  name: string;
  count: number;
  max: number;
  isLast: boolean;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div
      style={{
        padding: '5px 0',
        borderBottom: !isLast ? '1px solid #e8e3d8' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 3,
        }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 500, color: '#2c322f' }}>{name}</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#3a6b8a', fontVariantNumeric: 'tabular-nums' }}>
          {count}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: '#e8e3d8',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: '#3a6b8a',
            borderRadius: 3,
            transition: 'width 500ms ease',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface StaffHRWidgetProps {
  data: DashboardStaffHR;
}

const TYPE_LABELS: Record<string, string> = {
  PERMANENT:   'Permanent',
  CONTRACT:    'Contract',
  TEMPORARY:   'Temporary',
  PART_TIME:   'Part-time',
  UNSPECIFIED: 'Unspecified',
};

export function StaffHRWidget({ data }: StaffHRWidgetProps) {
  const { headline, byDepartment, byType, joiningTrend, alerts } = data;
  const maxDept = Math.max(...byDepartment.map((d) => d.count), 1);

  const hasAlerts = alerts.probationEnding > 0 || alerts.contractsExpiring > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Headline stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          background: '#f0f4f8',
          borderRadius: 12,
          padding: 8,
        }}
      >
        <StatBox label="Total Staff"    value={headline.total}      color="#2a3f5e" bg="#e4ecf6" />
        <StatBox label="Active"         value={headline.active}     color="#2e7a52" />
        <StatBox label="On Leave"       value={headline.onLeave}    color="#c87d2a" />
        <StatBox label="Present Today"  value={headline.presentToday} color="#3a6b8a" />
      </div>

      {/* Teaching vs Non-teaching + Employment type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Teaching split */}
        <div
          style={{
            background: '#f8f6f0',
            border: '1px solid #e8e3d8',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Staff Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Teaching',     count: headline.teachers,    color: '#2e7a52' },
              { label: 'Non-Teaching', count: headline.nonTeaching, color: '#3a6b8a' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: row.color, flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, color: '#2c322f', flex: 1 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Employment type */}
        <div
          style={{
            background: '#f8f6f0',
            border: '1px solid #e8e3d8',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Employment
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {byType.length === 0 ? (
              <span style={{ fontSize: 10.5, color: '#a0998e' }}>No data</span>
            ) : (
              byType.map((t) => (
                <div key={t.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#2c322f' }}>
                    {TYPE_LABELS[t.type] ?? t.type}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3a6b8a', fontVariantNumeric: 'tabular-nums' }}>
                    {t.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Department breakdown */}
      {byDepartment.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            By Department
          </div>
          {byDepartment.map((dept, i) => (
            <DeptBar
              key={dept.name}
              name={dept.name}
              count={dept.count}
              max={maxDept}
              isLast={i === byDepartment.length - 1}
            />
          ))}
        </div>
      )}

      {/* Joining trend + Alerts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Joining trend */}
        <div
          style={{
            background: '#f8f6f0',
            border: '1px solid #e8e3d8',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            New Joiners
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 40 }}>
            {joiningTrend.map((m, i) => {
              const maxCount = Math.max(...joiningTrend.map((x) => x.count), 1);
              const h = Math.max((m.count / maxCount) * 32, m.count > 0 ? 4 : 2);
              const isCurrent = i === joiningTrend.length - 1;
              return (
                <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: isCurrent ? '#2e7a52' : '#a0998e', fontVariantNumeric: 'tabular-nums' }}>
                    {m.count > 0 ? m.count : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: h,
                      background: isCurrent ? '#2e7a52' : '#b8d4c0',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                  <div style={{ fontSize: 8.5, color: isCurrent ? '#2c322f' : '#a0998e', fontWeight: isCurrent ? 700 : 400 }}>
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* HR Alerts */}
        <div
          style={{
            background: hasAlerts ? '#fdf3f0' : '#f8f6f0',
            border: `1px solid ${hasAlerts ? '#e8c8c0' : '#e8e3d8'}`,
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8d938d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            HR Alerts
          </div>
          {!hasAlerts ? (
            <div style={{ fontSize: 11, color: '#2e7a52', fontWeight: 600 }}>All clear</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alerts.probationEnding > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10.5, color: '#7a5a1a' }}>Probation ending</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#c87d2a', fontVariantNumeric: 'tabular-nums' }}>
                    {alerts.probationEnding}
                  </span>
                </div>
              )}
              {alerts.contractsExpiring > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10.5, color: '#7a2a1e' }}>Contracts expiring</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b3261e', fontVariantNumeric: 'tabular-nums' }}>
                    {alerts.contractsExpiring}
                  </span>
                </div>
              )}
              <div style={{ fontSize: 9, color: '#a0998e', marginTop: 2 }}>within 30 days</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
