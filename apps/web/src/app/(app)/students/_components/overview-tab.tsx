'use client';

import * as React from 'react';
import { Users, UserCheck, UserPlus, UserX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStudentStats, useStudents } from '@/lib/hooks/use-students';
import { KpiCard } from '@/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// ─── KPI row ──────────────────────────────────────────────────────────────────

function StatsRow() {
  const { data, isLoading } = useStudentStats();

  const cards = [
    { title: 'Total Students',   value: data?.total,          variant: 'neutral'  as const, icon: Users },
    { title: 'Active',           value: data?.active,         variant: 'sage'     as const, icon: UserCheck },
    { title: 'New Admissions',   value: data?.newAdmissions,  variant: 'blue'     as const, icon: UserPlus, sub: 'last 30 days' },
    { title: 'Boys',             value: data?.boys,           variant: 'blue'     as const },
    { title: 'Girls',            value: data?.girls,          variant: 'heather'  as const },
    { title: 'Inactive',         value: data?.inactive,       variant: 'clay'     as const },
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
          {...(card.sub ? { subtitle: card.sub } : {})}
          variant={card.variant}
        />
      ))}
    </div>
  );
}

// ─── Students by class chart ──────────────────────────────────────────────────

const CHART_COLORS = [
  '#a8c5d8', '#b5cca5', '#d4b8a0', '#c5b8d8', '#d8c5a5',
  '#a0bcc8', '#b8d4c0', '#c8b8a8', '#b8c0d8', '#c8d4b8',
];

function ClassChart() {
  // This will show real data once we have a class-wise stats endpoint.
  // For now it uses mock data as a visual placeholder.
  const placeholderData = [
    { name: 'Class 1', students: 128 },
    { name: 'Class 2', students: 135 },
    { name: 'Class 3', students: 97 },
    { name: 'Class 4', students: 142 },
    { name: 'Class 5', students: 151 },
    { name: 'Class 6', students: 108 },
    { name: 'Class 7', students: 112 },
    { name: 'Class 8', students: 147 },
    { name: 'Class 9', students: 151 },
    { name: 'Class 10', students: 177 },
  ];

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '20px 24px' }}
    >
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c', marginBottom: 4 }}>
        Students by Class
      </p>
      <p style={{ fontSize: '11.5px', color: '#8a929b', marginBottom: 20 }}>
        Enrollment distribution across classes
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={placeholderData} barSize={22}>
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
          <Bar dataKey="students" radius={[4, 4, 0, 0]}>
            {placeholderData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Recent admissions ────────────────────────────────────────────────────────

function RecentAdmissions() {
  const { data, isLoading } = useStudents({ limit: 6 });
  const students = data?.data ?? [];

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f4' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>Recent Admissions</p>
        <p style={{ fontSize: '11.5px', color: '#8a929b', marginTop: 2 }}>Latest students added</p>
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
        ) : students.length === 0 ? (
          <p style={{ padding: '24px 20px', fontSize: '13px', color: '#8a929b', textAlign: 'center' }}>
            No students yet
          </p>
        ) : (
          students.map((s) => {
            const enrollment = s.enrollments[0];
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 hover:bg-[#fafbfc] transition-colors"
                style={{ padding: '11px 20px', borderBottom: '1px solid #f5f6f7' }}
              >
                <Avatar name={s.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }} className="truncate">
                    {s.name}
                  </p>
                  <p style={{ fontSize: '11.5px', color: '#8a929b' }}>
                    {s.admissionNumber}
                    {enrollment ? ` · ${enrollment.class.name}-${enrollment.section.name}` : ''}
                  </p>
                </div>
                <Badge variant={s.studentStatus === 'ACTIVE' ? 'active' : 'left'}>
                  {s.studentStatus.charAt(0) + s.studentStatus.slice(1).toLowerCase()}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

export function OverviewTab() {
  return (
    <div className="space-y-5">
      <StatsRow />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ClassChart />
        </div>
        <div className="lg:col-span-2">
          <RecentAdmissions />
        </div>
      </div>
    </div>
  );
}
