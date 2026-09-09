'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { KpiCard } from '@/components/ui';
import { useSubstitutionRequests, useSubstitutionAssignments } from '@/lib/substitution-api';
import type { SubstitutionRequest, SubstitutionAssignment } from '@/lib/substitution-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolutionMinutes(req: SubstitutionRequest): number | null {
  if (!req.createdAt) return null;
  const assignments = req.assignments ?? [];
  const firstConfirmed = assignments
    .filter((a) => a.confirmedAt)
    .sort((a, b) => new Date(a.confirmedAt!).getTime() - new Date(b.confirmedAt!).getTime())[0];
  if (!firstConfirmed?.confirmedAt) return null;
  return Math.round(
    (new Date(firstConfirmed.confirmedAt).getTime() - new Date(req.createdAt).getTime()) / 60_000,
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({
  data,
  valueKey,
  labelKey,
  color = '#2b5fa8',
  unit = '',
}: {
  data: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  color?: string;
  unit?: string;
}) {
  if (data.length === 0) return <p className="text-xs text-center text-[#8a929b] py-6">No data</p>;

  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0));

  return (
    <div className="flex flex-col gap-2 py-2">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const label = String(d[labelKey] ?? '');
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-[#6b7480] truncate" style={{ width: 120, flexShrink: 0 }}>{label}</span>
            <div className="flex-1 h-5 bg-[#f3f4f6] rounded overflow-hidden">
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span className="text-xs font-semibold text-[#14181c] w-16 text-right">
              {val}{unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: reqData, isLoading: reqLoading } = useSubstitutionRequests({ limit: 500 });
  const { data: asnData, isLoading: asnLoading } = useSubstitutionAssignments({ limit: 500 });

  const isLoading = reqLoading || asnLoading;

  const requests    = reqData?.data ?? [];
  const assignments = asnData?.data ?? [];

  // ── KPIs ──
  const totalRequired  = assignments.filter((a) => a.status !== 'CANCELLED').length;
  const totalCovered   = assignments.filter((a) => ['CONFIRMED','COMPLETED'].includes(a.status)).length;
  const overallRate    = totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 0;
  const autoAssigned   = assignments.filter((a) => ['CONFIRMED','COMPLETED'].includes(a.status) && !a.assignedBy).length;
  const manualAssigned = assignments.filter((a) => ['CONFIRMED','COMPLETED'].includes(a.status) && !!a.assignedBy).length;
  const declined       = assignments.filter((a) => a.status === 'DECLINED').length;
  const unresolved     = assignments.filter((a) => a.status === 'SUGGESTED').length;

  // ── Resolution time ──
  const resTimes = requests.map(resolutionMinutes).filter((v): v is number => v !== null);
  const avgRes  = resTimes.length > 0 ? Math.round(resTimes.reduce((a, b) => a + b, 0) / resTimes.length) : null;
  const maxRes  = resTimes.length > 0 ? Math.max(...resTimes) : null;

  // ── Teacher substitution counts (fairness) ──
  const teacherMap: Record<string, { name: string; count: number; declined: number }> = {};
  for (const a of assignments) {
    const empId = a.substituteTeacherId;
    if (!empId) continue;
    const emp = a.substituteEmployee;
    const name = emp ? `${emp.person.firstName} ${emp.person.lastName}` : 'Unknown';
    if (!teacherMap[empId]) teacherMap[empId] = { name, count: 0, declined: 0 };
    if (a.status === 'CONFIRMED' || a.status === 'COMPLETED') teacherMap[empId].count++;
    if (a.status === 'DECLINED') teacherMap[empId].declined++;
  }
  const teacherData = Object.entries(teacherMap)
    .map(([, v]) => ({ label: v.name, subs: v.count, declined: v.declined }))
    .sort((a, b) => b.subs - a.subs)
    .slice(0, 15);

  // ── Subject coverage ──
  const subjectMap: Record<string, { required: number; covered: number }> = {};
  for (const a of assignments) {
    if (a.status === 'CANCELLED') continue;
    const subject = a.timetableEntry?.subject?.name ?? 'Unknown';
    if (!subjectMap[subject]) subjectMap[subject] = { required: 0, covered: 0 };
    subjectMap[subject].required++;
    if (a.status === 'CONFIRMED' || a.status === 'COMPLETED') subjectMap[subject].covered++;
  }
  const subjectData = Object.entries(subjectMap)
    .map(([label, v]) => ({
      label,
      required: v.required,
      covered: v.covered,
      rate: v.required > 0 ? Math.round((v.covered / v.required) * 100) : 0,
    }))
    .sort((a, b) => b.required - a.required)
    .slice(0, 10);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Substitution performance and fairness metrics" />
        <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Substitution performance and fairness metrics" />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard title="OVERALL COVERAGE" value={`${overallRate}%`} subtitle={`${totalCovered}/${totalRequired} periods`} />
        <KpiCard title="AUTO ASSIGNED" value={String(autoAssigned)} subtitle="by algorithm" />
        <KpiCard title="MANUAL ASSIGNED" value={String(manualAssigned)} subtitle="by admin" />
        <KpiCard title="DECLINED" value={String(declined)} subtitle="by substitute" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard title="AVG RESOLUTION" value={avgRes !== null ? `${avgRes} min` : '—'} subtitle="leave approved → assigned" />
        <KpiCard title="MAX RESOLUTION" value={maxRes !== null ? `${maxRes} min` : '—'} subtitle="slowest assignment" />
        <KpiCard title="UNRESOLVED" value={String(unresolved)} subtitle="still pending" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Subject coverage */}
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e6e8eb]" style={{ background: '#fafbfc' }}>
            <p className="text-xs font-semibold text-[#6b7480] uppercase tracking-wide">Coverage Rate by Subject</p>
          </div>
          <div className="px-4 py-2">
            <BarChart
              data={subjectData}
              valueKey="rate"
              labelKey="label"
              color="#2b5fa8"
              unit="%"
            />
          </div>
        </div>

        {/* Teacher fairness */}
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e6e8eb]" style={{ background: '#fafbfc' }}>
            <p className="text-xs font-semibold text-[#6b7480] uppercase tracking-wide">Substitution Load by Teacher</p>
            <p className="text-xs text-[#8a929b] mt-0.5">Fairness distribution — evenly loaded is better</p>
          </div>
          <div className="px-4 py-2">
            <BarChart
              data={teacherData}
              valueKey="subs"
              labelKey="label"
              color="#10b981"
              unit=" subs"
            />
          </div>
        </div>
      </div>

      {/* Subject detail table */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e6e8eb]" style={{ background: '#fafbfc' }}>
          <p className="text-xs font-semibold text-[#6b7480] uppercase tracking-wide">Subject Coverage Detail</p>
        </div>
        <div>
          <div className="grid px-4 py-2 border-b border-[#f3f4f6]" style={{ gridTemplateColumns: '1fr 80px 80px 80px' }}>
            {['SUBJECT', 'REQUIRED', 'COVERED', 'RATE'].map((h) => (
              <span key={h} className="text-xs font-semibold text-[#8a929b]">{h}</span>
            ))}
          </div>
          {subjectData.length === 0 ? (
            <p className="text-xs text-center text-[#8a929b] py-6">No data</p>
          ) : subjectData.map((s) => (
            <div
              key={s.label}
              className="grid px-4 py-2.5 border-b border-[#f3f4f6] last:border-0 items-center"
              style={{ gridTemplateColumns: '1fr 80px 80px 80px' }}
            >
              <span className="text-sm font-medium text-[#14181c]">{s.label}</span>
              <span className="text-sm text-[#6b7480]">{s.required}</span>
              <span className="text-sm text-[#14181c]">{s.covered}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: s.rate >= 90 ? '#146b41' : s.rate >= 70 ? '#8a5a00' : '#b3261e' }}
              >
                {s.rate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
