'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, ExportButton } from '@/components/ui';
import { useTodayCoverage } from '@/lib/substitution-api';
import type { CoveragePeriod } from '@/lib/substitution-api';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null): string {
  if (!iso) return '—';
  const timePart = iso.includes('T') ? (iso.split('T')[1] ?? '') : iso;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

const STATUS_CONFIG = {
  COVERED: { label: 'Covered', icon: CheckCircle2, color: '#146b41', bg: '#dcfce7', iconColor: '#22c55e' },
  PENDING: { label: 'Pending', icon: Clock, color: '#8a5a00', bg: '#fef9c3', iconColor: '#eab308' },
  UNRESOLVED: { label: 'Unresolved', icon: AlertTriangle, color: '#b3261e', bg: '#fee2e2', iconColor: '#ef4444' },
};

// ─── Period row ───────────────────────────────────────────────────────────────

function PeriodRow({ period }: { period: CoveragePeriod }) {
  const cfg = STATUS_CONFIG[period.status];
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border-b border-[#f3f4f6] last:border-0"
      style={{ background: period.status === 'UNRESOLVED' ? '#fffbfb' : 'transparent' }}
    >
      {/* Time */}
      <div style={{ width: 72, flexShrink: 0 }}>
        <span className="text-sm font-semibold text-[#14181c]">{fmt(period.startTime)}</span>
      </div>

      {/* Class + Subject */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <p className="text-sm font-medium text-[#14181c]">{period.className} · {period.subject}</p>
        <p className="text-xs text-[#6b7480]">{period.periodName}</p>
      </div>

      {/* Absent teacher */}
      <div style={{ width: 160, flexShrink: 0 }}>
        <p className="text-xs text-[#8a929b] mb-0.5">Absent</p>
        <p className="text-sm text-[#14181c]">{period.absentTeacher}</p>
      </div>

      {/* Substitute arrow */}
      <div className="flex items-center gap-2 flex-1">
        {period.substitute ? (
          <>
            <span className="text-[#8a929b]">→</span>
            <p className="text-sm font-medium text-[#14181c]">{period.substitute}</p>
            {period.score !== null && (
              <span
                className="text-xs font-semibold ml-1"
                style={{ color: period.score >= 80 ? '#146b41' : period.score >= 60 ? '#8a5a00' : '#b3261e' }}
              >
                {period.score} pts
              </span>
            )}
          </>
        ) : (
          <Link
            href={`/substitutions/requests?assignmentId=${period.assignmentId}`}
            className="text-xs font-medium text-[#2b5fa8] hover:underline"
          >
            Find substitute →
          </Link>
        )}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Icon size={14} style={{ color: cfg.iconColor }} />
        <span className="text-xs font-semibold" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

// ─── Coverage ring ────────────────────────────────────────────────────────────

function CoverageRing({ rate, covered, required, uncovered }: { rate: number; covered: number; required: number; uncovered: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const filled = (rate / 100) * circ;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: 110, height: 110 }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
          <circle
            cx={55} cy={55} r={r} fill="none"
            stroke={rate >= 80 ? '#22c55e' : rate >= 60 ? '#eab308' : '#ef4444'}
            strokeWidth={10}
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#14181c]">{rate}%</span>
          <span className="text-xs text-[#6b7480]">covered</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
          <span className="text-sm text-[#14181c]">{covered} covered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span className="text-sm text-[#14181c]">{uncovered} uncovered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#e5e7eb]" />
          <span className="text-sm text-[#6b7480]">{required} total required</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubstitutionsOverviewPage() {
  const { data, isLoading, isError, refetch, isFetching } = useTodayCoverage();

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const kpis = data?.kpis;
  const periods = data?.periods ?? [];

  const unresolved = periods.filter((p) => p.status === 'UNRESOLVED');
  const pending    = periods.filter((p) => p.status === 'PENDING');
  const covered    = periods.filter((p) => p.status === 'COVERED');

  const exportData = periods.map((p) => ({
    time: fmt(p.startTime),
    class: p.className,
    subject: p.subject,
    absentTeacher: p.absentTeacher,
    substitute: p.substitute ?? 'Unassigned',
    status: p.status,
  }));

  return (
    <div>
      <PageHeader
        title="Substitutions"
        subtitle={`Coverage Control Center · ${today}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6e8eb] text-sm text-[#4a5260] hover:bg-[#f4f1e9] transition-colors"
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
            <ExportButton
              label="Export"
              data={exportData}
              filename="coverage"
              formats={['csv']}
              columns={[
                { header: 'Time', accessor: 'time' },
                { header: 'Class', accessor: 'class' },
                { header: 'Subject', accessor: 'subject' },
                { header: 'Absent Teacher', accessor: 'absentTeacher' },
                { header: 'Substitute', accessor: 'substitute' },
                { header: 'Status', accessor: 'status' },
              ]}
            />
            <Link href="/substitutions/requests">
              <Button variant="primary">+ Manual Request</Button>
            </Link>
          </div>
        }
      />

      {isError && (
        <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] px-4 py-3 mb-4 text-sm text-[#b3261e]">
          Failed to load coverage data. <button onClick={() => void refetch()} className="underline">Retry</button>
        </div>
      )}

      {/* ── KPI row 1: Coverage summary ── */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard
          title="PENDING COVERAGE"
          value={isLoading ? '—' : String(kpis?.pendingCoverage ?? 0)}
          subtitle="awaiting confirmation"
        />
        <KpiCard
          title="TODAY REQUIRED"
          value={isLoading ? '—' : String(kpis?.todayRequired ?? 0)}
          subtitle="total periods"
        />
        <KpiCard
          title="COVERED"
          value={isLoading ? '—' : String(kpis?.covered ?? 0)}
          trend={kpis && kpis.todayRequired > 0 ? `${Math.round((kpis.covered / kpis.todayRequired) * 100)}%` : undefined}
          trendPositive
          subtitle="confirmed"
        />
        <KpiCard
          title="UNCOVERED"
          value={isLoading ? '—' : String(kpis?.uncovered ?? 0)}
          subtitle="need attention"
        />
      </div>

      {/* ── KPI row 2: Assignment breakdown ── */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <KpiCard
          title="COVERAGE RATE"
          value={isLoading ? '—' : `${kpis?.coverageRate ?? 0}%`}
          subtitle="today"
        />
        <KpiCard
          title="AUTO ASSIGNED"
          value={isLoading ? '—' : String(kpis?.autoAssigned ?? 0)}
          subtitle="by algorithm"
        />
        <KpiCard
          title="MANUAL"
          value={isLoading ? '—' : String(kpis?.manualAssigned ?? 0)}
          subtitle="by admin"
        />
      </div>

      {/* ── KPI row 3: Absence summary ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard
          title="TEACHERS ABSENT"
          value={isLoading ? '—' : String(kpis?.teachersAbsent ?? 0)}
          subtitle="today"
        />
        <KpiCard
          title="AFFECTED PERIODS"
          value={isLoading ? '—' : String(kpis?.affectedPeriods ?? 0)}
          subtitle="across all classes"
        />
      </div>

      {/* ── Main content ── */}
      {isLoading ? (
        <div className="rounded-xl border border-[#e6e8eb] bg-white flex items-center justify-center py-20">
          <p className="text-sm text-[#8a929b]">Loading coverage data…</p>
        </div>
      ) : periods.length === 0 ? (
        <div className="rounded-xl border border-[#e6e8eb] bg-white flex flex-col items-center justify-center py-20 gap-2">
          <CheckCircle2 size={32} className="text-[#22c55e]" />
          <p className="text-sm font-medium text-[#14181c]">No absences today</p>
          <p className="text-xs text-[#8a929b]">All teachers are present. No substitutions required.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Coverage ring summary */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5">
            <p className="text-xs font-semibold text-[#6b7480] uppercase tracking-wide mb-4">Today's Coverage Summary</p>
            <CoverageRing
              rate={kpis?.coverageRate ?? 0}
              covered={kpis?.covered ?? 0}
              required={kpis?.todayRequired ?? 0}
              uncovered={kpis?.uncovered ?? 0}
            />
          </div>

          {/* Unresolved — show first if any */}
          {unresolved.length > 0 && (
            <div className="rounded-xl border border-[#fca5a5] bg-white overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#fee2e2]" style={{ background: '#fff5f5' }}>
                <AlertTriangle size={15} className="text-[#ef4444]" />
                <span className="text-sm font-semibold text-[#b3261e]">{unresolved.length} Unresolved Period{unresolved.length !== 1 ? 's' : ''}</span>
                <Link href="/substitutions/requests" className="ml-auto text-xs text-[#2b5fa8] hover:underline font-medium">Assign now →</Link>
              </div>
              {unresolved.map((p) => <PeriodRow key={p.assignmentId} period={p} />)}
            </div>
          )}

          {/* Pending confirmation */}
          {pending.length > 0 && (
            <div className="rounded-xl border border-[#fde68a] bg-white overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#fef3c7]" style={{ background: '#fffdf5' }}>
                <Clock size={15} className="text-[#eab308]" />
                <span className="text-sm font-semibold text-[#8a5a00]">{pending.length} Awaiting Confirmation</span>
              </div>
              {pending.map((p) => <PeriodRow key={p.assignmentId} period={p} />)}
            </div>
          )}

          {/* Covered */}
          {covered.length > 0 && (
            <div className="rounded-xl border border-[#e6e8eb] bg-white overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f3f4f6]" style={{ background: '#fafbfc' }}>
                <CheckCircle2 size={15} className="text-[#22c55e]" />
                <span className="text-sm font-semibold text-[#14181c]">{covered.length} Covered</span>
              </div>
              {covered.map((p) => <PeriodRow key={p.assignmentId} period={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
