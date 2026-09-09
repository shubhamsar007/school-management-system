'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge, Avatar, Pagination, DataTable, ExportButton, Button } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  useSubstitutionRequests,
  useSubstitutionCandidates,
  useConfirmAssignment,
  useCancelRequest,
  useRetryScoring,
  useEscalateRequest,
  useCreateManualSubstitution,
  useGetPolicy,
  useAuditLog,
} from '@/lib/substitution-api';
import type { SubstitutionRequest, CandidateScore, AuditLogEntry } from '@/lib/substitution-api';
import { X, RefreshCw, Users, AlertTriangle, Plus, History } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const REQ_BADGE: Record<string, 'active' | 'pending' | 'left' | 'default'> = {
  FULLY_ASSIGNED:    'active',
  PARTIALLY_ASSIGNED:'pending',
  PENDING:           'pending',
  CANCELLED:         'left',
  ESCALATED:         'left',
};

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 10, color: '#9ca3af', width: 108, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#374151', width: 28, textAlign: 'right' }}>
        {value}/{max}
      </span>
    </div>
  );
}

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({ score, rank, onAssign, isPending, autoThreshold }: {
  score: CandidateScore;
  rank: number;
  onAssign: (teacherId: string) => void;
  isPending: boolean;
  autoThreshold?: number;
}) {
  const isDisqualified = !!score.disqualifiedReason;
  const total = Math.round(Number(score.totalScore));
  const name = score.employee
    ? `${score.employee.person.firstName} ${score.employee.person.lastName}`
    : 'Unknown';
  const wouldAutoAssign = !isDisqualified && autoThreshold !== undefined && total >= autoThreshold;

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{
        background: isDisqualified ? '#fafbfc' : rank === 1 ? '#f0fdf4' : 'white',
        border: `1.5px solid ${isDisqualified ? '#e6e8eb' : rank === 1 ? '#bbf7d0' : '#e6e8eb'}`,
        opacity: isDisqualified ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
          style={{
            width: 24, height: 24,
            background: isDisqualified ? '#e5e7eb' : rank === 1 ? '#22c55e' : '#e0e7ff',
            color: isDisqualified ? '#9ca3af' : rank === 1 ? 'white' : '#4338ca',
          }}
        >
          {rank}
        </span>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold text-[#14181c] truncate">{name}</span>
          {score.employee?.department && (
            <span className="text-xs text-[#6b7480]">{score.employee.department.name}</span>
          )}
        </div>

        {isDisqualified ? (
          <span className="rounded-full px-2 py-0.5 text-xs bg-[#fee2e2] text-[#b91c1c] font-medium ml-auto">
            {score.disqualifiedReason}
          </span>
        ) : (
          <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
            {wouldAutoAssign && (
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#dcfce7', color: '#15803d' }}>
                ⚡ Auto-assign
              </span>
            )}
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: rank === 1 ? '#dcfce7' : '#eff6ff', color: rank === 1 ? '#15803d' : '#1d4ed8' }}
            >
              {total} pts
            </span>
            <button
              onClick={() => onAssign(score.candidateEmployeeId)}
              disabled={isPending}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#2b5fa8' }}
            >
              {isPending ? '…' : 'Assign'}
            </button>
          </div>
        )}
      </div>

      {!isDisqualified && (
        <div className="flex flex-col gap-1 pl-8">
          <ScoreBar label="Subject proficiency" value={Number(score.subjectProficiencyScore)} max={40} color="#3b82f6" />
          <ScoreBar label="Workload balance"    value={Number(score.workloadScore)}           max={30} color="#10b981" />
          <ScoreBar label="Fairness"            value={Number(score.fairnessScore)}           max={20} color="#f59e0b" />
          <ScoreBar label="Dept. affinity"      value={Number(score.departmentAffinityScore)} max={10} color="#8b5cf6" />
        </div>
      )}
    </div>
  );
}

// ─── Candidates modal ─────────────────────────────────────────────────────────

function CandidatesModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useSubstitutionCandidates(requestId);
  const { data: policy } = useGetPolicy();
  const confirm = useConfirmAssignment();
  const retry   = useRetryScoring();
  const [msg, setMsg] = React.useState('');
  const autoThreshold = policy?.autoAssignThreshold;

  const handleAssign = (teacherId: string) => {
    setMsg('');
    // Without a specific assignmentId from this view, show a helpful message.
    // Full per-slot assignment is available on Today's Coverage.
    void teacherId;
    setMsg("To assign per period, go to Today's Coverage and click Assign on the specific period row.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e8eb]">
          <div>
            <h2 className="text-base font-semibold text-[#14181c]">Ranked Candidates</h2>
            <p className="text-xs text-[#6b7480]">Request #{requestId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => retry.mutate(requestId)}
              disabled={retry.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e6e8eb] text-xs text-[#4a5260] hover:bg-[#f4f1e9]"
            >
              <RefreshCw size={12} className={retry.isPending ? 'animate-spin' : ''} />
              Re-score
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f4f1e9]">
              <X size={16} className="text-[#6b7480]" />
            </button>
          </div>
        </div>

        {policy && (policy.mode === 'AUTO_ASSIGN' || policy.mode === 'HYBRID') && autoThreshold !== undefined && (
          <div className="px-5 py-2 bg-[#eff6ff] border-b border-[#bfdbfe] flex items-center gap-2">
            <span className="text-xs text-[#1d4ed8]">
              <span className="font-semibold">{policy.mode === 'AUTO_ASSIGN' ? 'AUTO_ASSIGN' : 'HYBRID'} mode</span>
              {policy.mode === 'HYBRID' && ` — candidates scoring ≥ ${autoThreshold} pts are auto-assigned`}
              {policy.mode === 'AUTO_ASSIGN' && ' — top candidate is always auto-assigned'}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {isLoading && <p className="text-sm text-center text-[#8a929b] py-8">Computing scores…</p>}
          {isError   && <p className="text-sm text-center text-[#b3261e] py-8">Failed to load candidates.</p>}

          {data && (
            <>
              {data.qualified.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm font-medium text-[#4a5260]">No qualified candidates found</p>
                  <p className="text-xs text-[#8a929b] mt-1">All teachers are disqualified for this request.</p>
                </div>
              )}

              {data.qualified.map((s, i) => (
                <CandidateCard key={s.id} score={s} rank={i + 1} onAssign={handleAssign} isPending={confirm.isPending} autoThreshold={autoThreshold} />
              ))}

              {data.disqualified.length > 0 && (
                <>
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-[#e6e8eb]" />
                    <span className="text-xs text-[#8a929b]">Disqualified ({data.disqualified.length})</span>
                    <div className="flex-1 h-px bg-[#e6e8eb]" />
                  </div>
                  {data.disqualified.map((s, i) => (
                    <CandidateCard key={s.id} score={s} rank={data.qualified.length + i + 1} onAssign={handleAssign} isPending={false} />
                  ))}
                </>
              )}

              {msg && (
                <div className="rounded-lg border border-[#fde68a] bg-[#fef9c3] px-3 py-2 text-xs text-[#8a5a00]">{msg}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manual request modal ─────────────────────────────────────────────────────

function ManualRequestModal({ onClose }: { onClose: () => void }) {
  const create = useCreateManualSubstitution();
  const [employeeId, setEmployeeId] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState('');
  const [leaveRequestId, setLeaveRequestId] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleSubmit = () => {
    setError('');
    if (!employeeId.trim()) { setError('Employee ID is required.'); return; }
    if (!date) { setError('Date is required.'); return; }

    create.mutate(
      {
        employeeId: employeeId.trim(),
        date,
        reason: reason.trim() || undefined,
        leaveRequestId: leaveRequestId.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSuccess('Substitution request created and scoring algorithm triggered.');
          setTimeout(() => onClose(), 1800);
        },
        onError: (e: Error) => setError(e.message),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#14181c]">Create Manual Substitution</h2>
            <p className="text-xs text-[#6b7480] mt-0.5">For absences not linked to a formal leave request</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f4f1e9]">
            <X size={16} className="text-[#6b7480]" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[#6b7480] block mb-1.5">Absent Employee ID <span className="text-[#b3261e]">*</span></label>
            <input
              value={employeeId}
              onChange={(e) => { setEmployeeId(e.target.value); setError(''); }}
              placeholder="Employee UUID"
              className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6b7480] block mb-1.5">Date of Absence <span className="text-[#b3261e]">*</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setError(''); }}
              className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6b7480] block mb-1.5">Reason</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sick — called in at 7:30 AM"
              className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6b7480] block mb-1.5">
              Leave Request ID <span className="text-[#8a929b] font-normal">(optional — link to an existing leave record)</span>
            </label>
            <input
              value={leaveRequestId}
              onChange={(e) => setLeaveRequestId(e.target.value)}
              placeholder="Leave request UUID (if applicable)"
              className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8]"
            />
          </div>
        </div>

        {error   && <p className="text-xs text-[#b3261e] mt-3">{error}</p>}
        {success && <p className="text-xs text-[#146b41] mt-3 font-medium">{success}</p>}

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#e6e8eb] text-[#4a5260] hover:bg-[#f4f1e9]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={create.isPending || !!success}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-60"
            style={{ background: '#2b5fa8' }}
          >
            {create.isPending ? 'Creating…' : 'Create & Score'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Timeline modal ─────────────────────────────────────────────────────

const ACTION_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  TRIGGERED:     { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  CONFIRMED:     { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  AUTO_CONFIRMED:{ bg: '#f0fdf4', text: '#15803d', dot: '#86efac' },
  OPTIMIZED:     { bg: '#f0fdf4', text: '#15803d', dot: '#4ade80' },
  DECLINED:      { bg: '#fef2f2', text: '#b91c1c', dot: '#f87171' },
  CANCELLED:     { bg: '#f9fafb', text: '#6b7280', dot: '#d1d5db' },
  ESCALATED:     { bg: '#fef9c3', text: '#854d0e', dot: '#eab308' },
  REASSIGNED:    { bg: '#fdf4ff', text: '#7e22ce', dot: '#a855f7' },
};

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AuditTimelineModal({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useAuditLog(requestId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e8eb]">
          <div>
            <h2 className="text-base font-semibold text-[#14181c]">Audit Timeline</h2>
            <p className="text-xs text-[#6b7480]">Request #{requestId.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f4f1e9]">
            <X size={16} className="text-[#6b7480]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <p className="text-sm text-center text-[#8a929b] py-8">Loading timeline…</p>}
          {isError   && <p className="text-sm text-center text-[#b3261e] py-8">Failed to load audit log.</p>}

          {data && data.length === 0 && (
            <p className="text-sm text-center text-[#8a929b] py-8">No audit entries yet.</p>
          )}

          {data && data.length > 0 && (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[#e6e8eb]" />

              <div className="flex flex-col gap-4">
                {(data as AuditLogEntry[]).map((entry) => {
                  const colors = ACTION_COLOR[entry.action] ?? { bg: '#f9fafb', text: '#374151', dot: '#9ca3af' };
                  return (
                    <div key={entry.id} className="flex gap-3 relative">
                      {/* Dot */}
                      <div
                        className="flex-shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center z-10"
                        style={{ background: colors.bg, border: `2px solid ${colors.dot}` }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-xs font-bold rounded-full px-2 py-0.5"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {entry.action.replace(/_/g, ' ')}
                          </span>
                          {entry.actor && entry.actor !== 'system' && (
                            <span className="text-xs text-[#6b7480]">by {entry.actor.slice(0, 8)}</span>
                          )}
                          {entry.actor === 'system' && (
                            <span className="text-xs text-[#8a929b]">system</span>
                          )}
                        </div>
                        <p className="text-xs text-[#8a929b] mt-0.5">{fmtTs(entry.createdAt)}</p>
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <div className="mt-1 rounded-lg bg-[#f9fafb] border border-[#e6e8eb] px-2 py-1.5">
                            {Object.entries(entry.details).map(([k, v]) => (
                              <p key={k} className="text-xs text-[#4a5260]">
                                <span className="font-medium">{k}:</span>{' '}
                                <span className="font-mono text-[10px]">{String(v)}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Escalate confirm ─────────────────────────────────────────────────────────

function EscalateConfirm({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const escalate = useEscalateRequest();
  const [error, setError] = React.useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#fef9c3] flex items-center justify-center">
            <AlertTriangle size={18} className="text-[#eab308]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#14181c]">Escalate Request</h2>
            <p className="text-sm text-[#6b7480] mt-1">
              This will mark the request as <strong>ESCALATED</strong> and surface it to the Academic Coordinator and Principal for urgent attention.
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-[#b3261e] mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#e6e8eb] text-[#4a5260] hover:bg-[#f4f1e9]">
            Cancel
          </button>
          <button
            onClick={() =>
              escalate.mutate(requestId, {
                onSuccess: () => onClose(),
                onError: (e: Error) => setError(e.message),
              })
            }
            disabled={escalate.isPending}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ background: '#eab308' }}
          >
            {escalate.isPending ? 'Escalating…' : 'Escalate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status filters ───────────────────────────────────────────────────────────

const STATUS_FILTERS = ['ALL', 'PENDING', 'PARTIALLY_ASSIGNED', 'FULLY_ASSIGNED', 'ESCALATED', 'CANCELLED'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [status, setStatus] = React.useState('');
  const [candidateRequestId, setCandidateRequestId] = React.useState<string | null>(null);
  const [escalateRequestId, setEscalateRequestId]   = React.useState<string | null>(null);
  const [auditRequestId, setAuditRequestId]         = React.useState<string | null>(null);
  const [showManual, setShowManual] = React.useState(false);
  const cancel = useCancelRequest();

  const { data, isLoading, isError } = useSubstitutionRequests({ status: status || undefined, page, limit: pageSize });
  const requests = data?.data ?? [];
  const total    = data?.total ?? 0;

  const columns: ColumnDef<SubstitutionRequest>[] = [
    {
      id: 'ref',
      header: 'REQUEST',
      width: '120px',
      cell: (r) => <span className="text-xs font-mono text-[#6b7480]">#{r.id.slice(0, 8).toUpperCase()}</span>,
    },
    {
      id: 'teacher',
      header: 'ABSENT TEACHER',
      width: 'minmax(140px,1.4fr)',
      cell: (r) => {
        const name = r.leaveRequest?.employee
          ? `${r.leaveRequest.employee.person.firstName} ${r.leaveRequest.employee.person.lastName}`
          : '— Manual';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="md" />
            <div>
              <span className="text-sm font-medium truncate">{name}</span>
              {!r.leaveRequestId && (
                <span className="text-xs text-[#6b7480] block">Manual request</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'date',
      header: 'DATE',
      width: '110px',
      cell: (r) => <span className="text-sm">{fmtDate(r.date)}</span>,
    },
    {
      id: 'reason',
      header: 'REASON',
      width: '120px',
      cell: (r) => <span className="text-sm text-[#6b7480] truncate">{r.leaveRequest?.leaveType?.name ?? '—'}</span>,
    },
    {
      id: 'coverage',
      header: 'COVERAGE',
      width: '110px',
      cell: (r) => {
        const asgn = r.assignments ?? [];
        const tot  = asgn.filter((a) => a.status !== 'CANCELLED').length;
        const conf = asgn.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;
        return (
          <span className="text-sm">
            <span className="font-semibold text-[#14181c]">{conf}</span>
            <span className="text-[#6b7480]">/{tot}</span>
            <span className="text-xs text-[#6b7480] ml-1">periods</span>
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '150px',
      cell: (r) => {
        if (r.status === 'ESCALATED') {
          return (
            <div className="flex items-center gap-1">
              <AlertTriangle size={12} className="text-[#eab308]" />
              <span className="text-xs font-semibold text-[#8a5a00]">ESCALATED</span>
            </div>
          );
        }
        return <Badge variant={REQ_BADGE[r.status] ?? 'default'}>{r.status.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '160px',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button
            onClick={() => setCandidateRequestId(r.id)}
            className="flex items-center gap-1 text-xs font-medium text-[#2b5fa8] hover:underline"
          >
            <Users size={12} />
            Candidates
          </button>
          <button
            onClick={() => setAuditRequestId(r.id)}
            className="flex items-center gap-1 text-xs font-medium text-[#6b7480] hover:underline"
          >
            <History size={12} />
            History
          </button>
          {!['CANCELLED', 'FULLY_ASSIGNED', 'ESCALATED'].includes(r.status) && (
            <button
              onClick={() => setEscalateRequestId(r.id)}
              className="text-xs font-medium text-[#8a5a00] hover:underline"
            >
              Escalate
            </button>
          )}
          {!['CANCELLED', 'ESCALATED'].includes(r.status) && (
            <button
              onClick={() => cancel.mutate(r.id)}
              disabled={cancel.isPending}
              className="text-xs font-medium text-[#b3261e] hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  const exportData = requests.map((r) => ({
    id:     r.id.slice(0, 8).toUpperCase(),
    date:   fmtDate(r.date),
    teacher: r.leaveRequest?.employee
      ? `${r.leaveRequest.employee.person.firstName} ${r.leaveRequest.employee.person.lastName}`
      : 'Manual',
    status: r.status,
  }));

  return (
    <div>
      <PageHeader
        title="Substitution Requests"
        subtitle="One request per day of absence · scored and ranked"
        actions={
          <div className="flex gap-2">
            <ExportButton
              label="Export"
              data={exportData}
              filename="substitution-requests"
              formats={['csv']}
              columns={[
                { header: 'Ref', accessor: 'id' },
                { header: 'Date', accessor: 'date' },
                { header: 'Teacher', accessor: 'teacher' },
                { header: 'Status', accessor: 'status' },
              ]}
            />
            <Button variant="primary" onClick={() => setShowManual(true)}>
              <Plus size={14} className="mr-1" /> Manual Request
            </Button>
          </div>
        }
      />

      {/* Status filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s === 'ALL' ? '' : s); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: (s === 'ALL' ? !status : status === s) ? '#2b5fa8' : '#f4f4f4',
              color:      (s === 'ALL' ? !status : status === s) ? '#fff' : '#4a5260',
            }}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading requests…</div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#b3261e]">Failed to load requests.</div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">No substitution requests found.</div>
        ) : (
          <DataTable columns={columns} data={requests} />
        )}
        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {candidateRequestId && (
        <CandidatesModal requestId={candidateRequestId} onClose={() => setCandidateRequestId(null)} />
      )}
      {escalateRequestId && (
        <EscalateConfirm requestId={escalateRequestId} onClose={() => setEscalateRequestId(null)} />
      )}
      {auditRequestId && (
        <AuditTimelineModal requestId={auditRequestId} onClose={() => setAuditRequestId(null)} />
      )}
      {showManual && (
        <ManualRequestModal onClose={() => setShowManual(false)} />
      )}
    </div>
  );
}
