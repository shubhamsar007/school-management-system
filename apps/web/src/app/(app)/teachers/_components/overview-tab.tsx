'use client';

import * as React from 'react';
import Link from 'next/link';
import { Users, UserCheck, UserX, GraduationCap, UserPlus, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTeacherStats, useTeachers, useEmployeeDepartments } from '@/lib/hooks/use-teachers';
import { KpiCard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';

// ─── KPI row ──────────────────────────────────────────────────────────────────

function StatsRow() {
  const { data, isLoading } = useTeacherStats();

  const cards = [
    { title: 'Total Staff',     value: data?.total,       variant: 'neutral'  as const, icon: Users },
    { title: 'Active',          value: data?.active,      variant: 'sage'     as const, icon: UserCheck },
    { title: 'Teaching',        value: data?.teachers,    variant: 'blue'     as const, icon: GraduationCap },
    { title: 'Non-Teaching',    value: data?.nonTeaching, variant: 'neutral'  as const },
    { title: 'On Leave',        value: data?.onLeave,     variant: 'clay'     as const, icon: UserX },
    { title: 'New This Month',  value: data?.newJoiners,  variant: 'blue'     as const, icon: UserPlus },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((_, i) => (
          <div key={i} className="rounded-[18px] border border-[#e6e1d5] bg-[#fffdf8] p-[16px]">
            <Skeleton height={10} width={80} className="mb-3" />
            <Skeleton height={28} width={50} className="mb-2" />
            <Skeleton height={10} width={60} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <KpiCard
          key={card.title}
          title={card.title}
          value={card.value?.toLocaleString() ?? '—'}
          variant={card.variant}
        />
      ))}
    </div>
  );
}

// ─── Department chart ─────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#a8c5d8', '#b5cca5', '#d4b8a0', '#c5b8d8', '#d8c5a5',
  '#a0bcc8', '#b8d4c0', '#c8b8a8', '#b8c0d8', '#c8d4b8',
];

function DepartmentChart() {
  const { data: departments, isLoading } = useEmployeeDepartments();

  const chartData = (departments ?? [])
    .filter((d) => d.employeeCount > 0)
    .sort((a, b) => b.employeeCount - a.employeeCount)
    .slice(0, 10)
    .map((d) => ({ name: d.name, employees: d.employeeCount }));

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '20px 24px' }}
    >
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c', marginBottom: 4 }}>
        Staff by Department
      </p>
      <p style={{ fontSize: '11.5px', color: '#8a929b', marginBottom: 20 }}>
        Headcount per department
      </p>
      {isLoading ? (
        <Skeleton height={200} className="rounded-lg" />
      ) : chartData.length === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '13px', color: '#8a929b' }}>No department data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={22}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#8a929b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8a929b' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e6e8eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="employees" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Recent hires ─────────────────────────────────────────────────────────────

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':      return 'active';
    case 'PROBATION':   return 'pending';
    case 'ON_LEAVE':    return 'pending';
    case 'EXITED':
    case 'ARCHIVED':    return 'left';
    default:            return 'default';
  }
}

function RecentHires() {
  const { data, isLoading } = useTeachers({ limit: 6 });
  const employees = data?.data ?? [];

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f4' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>Recent Hires</p>
        <p style={{ fontSize: '11.5px', color: '#8a929b', marginTop: 2 }}>Latest employees added</p>
      </div>
      <div>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3" style={{ padding: '12px 20px', borderBottom: '1px solid #f5f6f7' }}>
              <Skeleton width={32} height={32} className="rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton height={11} width={120} className="mb-1.5" />
                <Skeleton height={10} width={80} />
              </div>
              <Skeleton height={20} width={50} className="rounded-full" />
            </div>
          ))
        ) : employees.length === 0 ? (
          <p style={{ padding: '24px 20px', fontSize: '13px', color: '#8a929b', textAlign: 'center' }}>
            No employees yet
          </p>
        ) : (
          employees.map((emp) => (
            <Link
              key={emp.id}
              href={`/teachers/${emp.id}`}
              className="flex items-center gap-3 hover:bg-[#fafbfc] transition-colors outline-none group"
              style={{ padding: '11px 20px', borderBottom: '1px solid #f5f6f7', display: 'flex' }}
            >
              <Avatar name={emp.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate group-hover:underline" style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>
                  {emp.name}
                </p>
                <p style={{ fontSize: '11.5px', color: '#8a929b' }}>
                  {emp.designation?.name ?? emp.department?.name ?? emp.employeeNumber}
                </p>
              </div>
              <Badge variant={statusVariant(emp.employmentStatus)}>
                {emp.employmentStatus.charAt(0) + emp.employmentStatus.slice(1).toLowerCase().replace('_', ' ')}
              </Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Alerts row ───────────────────────────────────────────────────────────────

function AlertsRow() {
  const { data } = useTeacherStats();
  if (!data) return null;

  const alerts = [
    { label: 'Probation ending soon', value: data.probationEnding, color: '#f59e0b' },
    { label: 'Contracts expiring',    value: data.contractsExpiring, color: '#ef4444' },
    { label: 'On probation',          value: data.probation, color: '#8b5cf6' },
  ].filter((a) => a.value > 0);

  if (!alerts.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {alerts.map((a) => (
        <div
          key={a.label}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-white"
          style={{ borderColor: a.color + '40', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <Clock size={13} style={{ color: a.color }} />
          <span style={{ fontSize: '12.5px', color: '#14181c' }}>
            <strong>{a.value}</strong> {a.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

export function OverviewTab() {
  return (
    <div className="space-y-5">
      <StatsRow />
      <AlertsRow />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DepartmentChart />
        </div>
        <div className="lg:col-span-2">
          <RecentHires />
        </div>
      </div>
    </div>
  );
}
