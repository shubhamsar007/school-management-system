'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge } from '@/components/ui';
import { useTodayCoverage, useConfirmAssignment, useReassignAfterDecline, useEscalateRequest, useOptimizeDate } from '@/lib/substitution-api';
import type { CoveragePeriod } from '@/lib/substitution-api';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Zap, ArrowUpCircle, UserX, Sparkles } from 'lucide-react';

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

const STATUS_BADGE: Record<CoveragePeriod['status'], 'active' | 'pending' | 'left'> = {
  COVERED: 'active',
  PENDING: 'pending',
  UNRESOLVED: 'left',
};

const STATUS_ICON: Record<CoveragePeriod['status'], React.ReactNode> = {
  COVERED: <CheckCircle2 size={14} className="text-[#22c55e]" />,
  PENDING: <Clock size={14} className="text-[#eab308]" />,
  UNRESOLVED: <AlertTriangle size={14} className="text-[#ef4444]" />,
};

// ─── Unresolved action panel ──────────────────────────────────────────────────

const UNRESOLVED_ACTIONS = [
  { id: 'reassign', label: 'Auto-Reassign', desc: 'Pick next best candidate from scoring', icon: Zap,           color: '#2b5fa8', bg: '#eff6ff' },
  { id: 'escalate', label: 'Escalate',      desc: 'Notify coordinator / principal',        icon: ArrowUpCircle,  color: '#8a5a00', bg: '#fef9c3' },
  { id: 'cancel',   label: 'Mark Unresolved',desc: 'Record as unable to cover',            icon: UserX,          color: '#6b7480', bg: '#f4f4f4' },
] as const;

function UnresolvedPanel({
  period,
  onClose,
}: {
  period: CoveragePeriod;
  onClose: () => void;
}) {
  const reassign = useReassignAfterDecline();
  const escalate = useEscalateRequest();
  const [msg, setMsg] = React.useState('');
  const [done, setDone] = React.useState(false);

  const handle = (action: string) => {
    setMsg('');
    if (action === 'reassign') {
      reassign.mutate(period.assignmentId, {
        onSuccess: (res) => { setMsg(res.message); if (res.assignment) setDone(true); },
        onError:   (e: Error) => setMsg(e.message),
      });
    } else if (action === 'escalate') {
      escalate.mutate(period.requestId, {
        onSuccess: () => { setMsg('Request escalated to coordinator.'); setDone(true); },
        onError:   (e: Error) => setMsg(e.message),
      });
    } else {
      setMsg('Period marked as unresolvable. Please update class schedule accordingly.');
      setDone(true);
    }
  };

  const isPending = reassign.isPending || escalate.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-[#ef4444]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#14181c]">Unresolved Period</h2>
            <p className="text-xs text-[#6b7480] mt-0.5">
              {period.className} · {period.subject} · {fmt(period.startTime)}
            </p>
            <p className="text-xs text-[#6b7480]">Absent: {period.absentTeacher}</p>
          </div>
        </div>

        {!done ? (
          <>
            <p className="text-xs font-semibold text-[#6b7480] uppercase tracking-wide mb-3">Choose an action</p>
            <div className="flex flex-col gap-2">
              {UNRESOLVED_ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => handle(a.id)}
                    disabled={isPending}
                    className="flex items-center gap-3 rounded-xl border border-[#e6e8eb] px-4 py-3 text-left hover:border-[#2b5fa8] transition-colors disabled:opacity-50"
                    style={{ background: 'white' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: a.bg }}
                    >
                      <Icon size={15} style={{ color: a.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#14181c]">{a.label}</p>
                      <p className="text-xs text-[#6b7480]">{a.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {msg && (
          <div
            className="rounded-lg px-3 py-2 text-xs mt-4"
            style={{
              background: msg.includes('Reassigned') || msg.includes('escalated') ? '#f0fdf4' : '#fef9c3',
              color:      msg.includes('Reassigned') || msg.includes('escalated') ? '#146b41' : '#8a5a00',
              border:     `1px solid ${msg.includes('Reassigned') || msg.includes('escalated') ? '#bbf7d0' : '#fde68a'}`,
            }}
          >
            {msg}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-[#e6e8eb] text-[#4a5260] hover:bg-[#f4f1e9]"
          >
            {done ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Board row ────────────────────────────────────────────────────────────────

function BoardRow({ period, onAssign, onUnresolved }: { period: CoveragePeriod; onAssign: (p: CoveragePeriod) => void; onUnresolved: (p: CoveragePeriod) => void }) {
  return (
    <div
      className="grid items-center gap-3 px-4 py-3.5 border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafbfc] transition-colors"
      style={{ gridTemplateColumns: '80px 1fr 160px 180px 120px 100px 80px' }}
    >
      <span className="text-sm font-bold text-[#14181c]">{fmt(period.startTime)}</span>

      <div>
        <p className="text-sm font-medium text-[#14181c]">{period.className}</p>
        <p className="text-xs text-[#6b7480]">{period.subject}</p>
      </div>

      <div>
        <p className="text-xs text-[#8a929b] mb-0.5">Absent</p>
        <p className="text-sm text-[#14181c] truncate">{period.absentTeacher}</p>
      </div>

      <div>
        {period.substitute ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[#8a929b] text-sm">→</span>
            <p className="text-sm font-medium text-[#14181c] truncate">{period.substitute}</p>
          </div>
        ) : period.status === 'UNRESOLVED' ? (
          <span className="text-xs font-medium text-[#b3261e]">No candidate found</span>
        ) : (
          <span className="text-xs text-[#8a929b] italic">Awaiting assignment</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {STATUS_ICON[period.status]}
        <Badge variant={STATUS_BADGE[period.status]}>{period.status}</Badge>
      </div>

      {period.score !== null ? (
        <span
          className="text-sm font-semibold text-center"
          style={{ color: period.score >= 80 ? '#146b41' : period.score >= 60 ? '#8a5a00' : '#b3261e' }}
        >
          {period.score} pts
        </span>
      ) : <span />}

      <div className="flex justify-end">
        {period.status === 'COVERED' && (
          <Link href="/substitutions/assignments" className="text-xs font-medium text-[#6b7480] hover:underline">
            View
          </Link>
        )}
        {period.status === 'PENDING' && (
          <button onClick={() => onAssign(period)} className="text-xs font-medium text-[#2b5fa8] hover:underline">
            Assign
          </button>
        )}
        {period.status === 'UNRESOLVED' && (
          <button
            onClick={() => onUnresolved(period)}
            className="text-xs font-semibold text-[#b3261e] hover:underline flex items-center gap-1"
          >
            <AlertTriangle size={11} />
            Resolve
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({ period, onClose }: { period: CoveragePeriod; onClose: () => void }) {
  const confirm = useConfirmAssignment();
  const [teacherId, setTeacherId] = React.useState('');
  const [error, setError] = React.useState('');

  const handleAssign = () => {
    if (!teacherId.trim()) { setError('Enter a substitute teacher ID'); return; }
    confirm.mutate(
      { assignmentId: period.assignmentId, substituteTeacherId: teacherId.trim() },
      {
        onSuccess: () => onClose(),
        onError: (e: Error) => setError(e.message),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-[#14181c] mb-1">Assign Substitute</h2>
        <p className="text-sm text-[#6b7480] mb-4">
          {period.className} · {period.subject} · {fmt(period.startTime)}
        </p>

        <div className="rounded-lg p-3 border border-[#e6e8eb] bg-[#fafbfc] mb-4 text-sm">
          <span className="text-[#6b7480]">Absent teacher:</span>{' '}
          <span className="font-medium text-[#14181c]">{period.absentTeacher}</span>
        </div>

        <div className="mb-1">
          <label className="text-xs font-semibold text-[#6b7480] block mb-1.5">Substitute Teacher ID</label>
          <input
            value={teacherId}
            onChange={(e) => { setTeacherId(e.target.value); setError(''); }}
            placeholder="Enter employee UUID"
            className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8]"
          />
          <p className="text-xs text-[#6b7480] mt-1">
            For ranked candidates, visit{' '}
            <Link href={`/substitutions/requests`} className="text-[#2b5fa8] hover:underline" onClick={onClose}>
              Requests
            </Link>{' '}
            and open this request.
          </p>
        </div>

        {error && <p className="text-xs text-[#b3261e] mb-3">{error}</p>}

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#e6e8eb] text-[#4a5260] hover:bg-[#f4f1e9]">Cancel</button>
          <button
            onClick={handleAssign}
            disabled={confirm.isPending}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ background: '#2b5fa8' }}
          >
            {confirm.isPending ? 'Assigning…' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ['ALL', 'COVERED', 'PENDING', 'UNRESOLVED'] as const;
type Filter = typeof FILTER_OPTIONS[number];

export default function TodayCoveragePage() {
  const { data, isLoading, isError, refetch, isFetching } = useTodayCoverage();
  const optimize = useOptimizeDate();
  const [filter, setFilter]                   = React.useState<Filter>('ALL');
  const [assignTarget, setAssignTarget]       = React.useState<CoveragePeriod | null>(null);
  const [unresolvedTarget, setUnresolvedTarget] = React.useState<CoveragePeriod | null>(null);
  const [optimizeResult, setOptimizeResult]   = React.useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  const periods = data?.periods ?? [];
  const kpis = data?.kpis;

  const filtered = filter === 'ALL' ? periods : periods.filter((p) => p.status === filter);

  // Sort by time
  const sorted = [...filtered].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  const handleOptimize = () => {
    optimize.mutate(undefined, {
      onSuccess: (res) => {
        setOptimizeResult(res.message);
        void refetch();
        setTimeout(() => setOptimizeResult(null), 6000);
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Today's Coverage"
        subtitle={today}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleOptimize}
              disabled={optimize.isPending || isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#2b5fa8' }}
            >
              <Sparkles size={14} />
              {optimize.isPending ? 'Optimizing…' : 'Optimize Day'}
            </button>
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6e8eb] text-sm text-[#4a5260] hover:bg-[#f4f1e9]"
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Summary strip */}
      {kpis && (
        <div className="flex gap-3 mb-4 flex-wrap">
          {[
            { label: 'Required', value: kpis.todayRequired, color: '#6b7480' },
            { label: 'Covered', value: kpis.covered, color: '#146b41' },
            { label: 'Pending', value: kpis.awaitingConfirmation, color: '#8a5a00' },
            { label: 'Unresolved', value: kpis.uncovered - kpis.awaitingConfirmation, color: '#b3261e' },
            { label: 'Absent Teachers', value: kpis.teachersAbsent, color: '#14181c' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-[#e6e8eb] bg-white px-4 py-2 flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-xs text-[#6b7480]">{s.label}</span>
            </div>
          ))}
          <div className="rounded-lg border border-[#e6e8eb] bg-white px-4 py-2 flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: kpis.coverageRate >= 80 ? '#146b41' : '#b3261e' }}>{kpis.coverageRate}%</span>
            <span className="text-xs text-[#6b7480]">Coverage Rate</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {FILTER_OPTIONS.map((f) => {
          const count = f === 'ALL' ? periods.length : periods.filter((p) => p.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: filter === f ? '#2b5fa8' : '#f4f4f4',
                color: filter === f ? '#fff' : '#4a5260',
              }}
            >
              {f} <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="grid gap-3 px-4 py-2.5 border-b border-[#e6e8eb]"
          style={{ gridTemplateColumns: '80px 1fr 160px 180px 120px 100px 80px', background: '#fafbfc' }}
        >
          {['TIME', 'CLASS', 'ABSENT', 'SUBSTITUTE', 'STATUS', 'SCORE', 'ACTION'].map((h) => (
            <span key={h} className="text-xs font-semibold text-[#8a929b]">{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading…</div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#b3261e]">Failed to load. <button onClick={() => void refetch()} className="ml-1 underline">Retry</button></div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <CheckCircle2 size={28} className="text-[#22c55e]" />
            <p className="text-sm text-[#6b7480]">{filter === 'ALL' ? 'No substitutions required today' : `No ${filter.toLowerCase()} periods`}</p>
          </div>
        ) : (
          sorted.map((p) => (
            <BoardRow
              key={p.assignmentId}
              period={p}
              onAssign={setAssignTarget}
              onUnresolved={setUnresolvedTarget}
            />
          ))
        )}
      </div>

      {assignTarget && <AssignModal period={assignTarget} onClose={() => setAssignTarget(null)} />}
      {unresolvedTarget && (
        <UnresolvedPanel
          period={unresolvedTarget}
          onClose={() => { setUnresolvedTarget(null); void refetch(); }}
        />
      )}

      {optimizeResult && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-xl shadow-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#146b41', maxWidth: 380 }}
        >
          <Sparkles size={14} />
          {optimizeResult}
          <button onClick={() => setOptimizeResult(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}
    </div>
  );
}
