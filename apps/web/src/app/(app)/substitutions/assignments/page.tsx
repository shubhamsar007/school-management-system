'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge, Avatar, Pagination, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  useSubstitutionAssignments,
  useDeclineAssignment,
  useReassignAfterDecline,
} from '@/lib/substitution-api';
import type { SubstitutionAssignment } from '@/lib/substitution-api';
import { RefreshCw } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ASSIGN_BADGE: Record<string, 'active' | 'pending' | 'left' | 'graduated' | 'default'> = {
  CONFIRMED: 'active',
  COMPLETED: 'graduated',
  SUGGESTED: 'pending',
  DECLINED:  'left',
  CANCELLED: 'left',
};

const STATUS_FILTERS = ['ALL', 'CONFIRMED', 'SUGGESTED', 'DECLINED', 'COMPLETED', 'CANCELLED'];

// ─── Decline modal ────────────────────────────────────────────────────────────

const DECLINE_REASONS = ['Unavailable', 'High workload', 'Personal reason', 'Already assigned', 'Other'];

function DeclineModal({ assignmentId, onClose }: { assignmentId: string; onClose: () => void }) {
  const decline = useDeclineAssignment();
  const [reason, setReason] = React.useState('');
  const [custom, setCustom] = React.useState('');
  const [error, setError]   = React.useState('');

  const handleDecline = () => {
    const finalReason = reason === 'Other' ? custom.trim() : reason;
    decline.mutate(
      { assignmentId, reason: finalReason || undefined },
      {
        onSuccess: () => onClose(),
        onError: (e: Error) => setError(e.message),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-[#14181c] mb-1">Decline Assignment</h2>
        <p className="text-sm text-[#6b7480] mb-5">Select a reason. The system will try to reassign automatically.</p>

        <div className="flex flex-col gap-2 mb-4">
          {DECLINE_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => { setReason(r); setError(''); }}
                className="accent-[#2b5fa8]"
              />
              <span className="text-sm text-[#14181c]">{r}</span>
            </label>
          ))}
        </div>

        {reason === 'Other' && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Describe the reason…"
            rows={3}
            className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8] resize-none mb-4"
          />
        )}

        {error && <p className="text-xs text-[#b3261e] mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#e6e8eb] text-[#4a5260] hover:bg-[#f4f1e9]">
            Cancel
          </button>
          <button
            onClick={handleDecline}
            disabled={!reason || decline.isPending}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#b3261e] disabled:opacity-50"
          >
            {decline.isPending ? 'Declining…' : 'Confirm Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reassign result toast ────────────────────────────────────────────────────

function ReassignToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isSuccess = message.startsWith('Reassigned');

  return (
    <div
      className="fixed bottom-5 right-5 z-50 rounded-xl shadow-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
      style={{
        background: isSuccess ? '#f0fdf4' : '#fef9c3',
        border: `1.5px solid ${isSuccess ? '#bbf7d0' : '#fde68a'}`,
        color: isSuccess ? '#146b41' : '#8a5a00',
      }}
    >
      {message}
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const [page, setPage]               = React.useState(1);
  const [pageSize, setPageSize]       = React.useState(25);
  const [status, setStatus]           = React.useState('');
  const [declineTarget, setDeclineTarget] = React.useState<string | null>(null);
  const [toastMsg, setToastMsg]       = React.useState<string | null>(null);

  const reassign = useReassignAfterDecline();

  const { data, isLoading, isError } = useSubstitutionAssignments({
    status: status || undefined,
    page,
    limit: pageSize,
  });

  const assignments = data?.data ?? [];
  const total       = data?.total ?? 0;

  const handleReassign = (assignmentId: string) => {
    reassign.mutate(assignmentId, {
      onSuccess: (res) => setToastMsg(res.message),
      onError:   (e: Error) => setToastMsg(e.message),
    });
  };

  const columns: ColumnDef<SubstitutionAssignment>[] = [
    {
      id: 'ref',
      header: 'REF',
      width: '100px',
      cell: (r) => <span className="text-xs font-mono text-[#6b7480]">#{r.id.slice(0, 8).toUpperCase()}</span>,
    },
    {
      id: 'substitute',
      header: 'SUBSTITUTE',
      width: 'minmax(140px,1.3fr)',
      cell: (r) => {
        const name = r.substituteEmployee
          ? `${r.substituteEmployee.person.firstName} ${r.substituteEmployee.person.lastName}`
          : '—';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="md" />
            <span className="text-sm font-medium truncate">{name}</span>
          </div>
        );
      },
    },
    {
      id: 'covering',
      header: 'COVERING FOR',
      width: '150px',
      cell: (r) => {
        const emp = r.substitutionRequest?.leaveRequest?.employee;
        const name = emp ? `${emp.person.firstName} ${emp.person.lastName}` : '—';
        return <span className="text-sm truncate">{name}</span>;
      },
    },
    {
      id: 'class',
      header: 'CLASS & PERIOD',
      width: '150px',
      cell: (r) => (
        <div>
          <p className="text-sm font-medium text-[#14181c]">{r.timetableEntry?.section?.name ?? '—'}</p>
          <p className="text-xs text-[#6b7480]">{r.timetableEntry?.period?.name ?? ''} · {r.timetableEntry?.subject?.name ?? ''}</p>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'DATE',
      width: '110px',
      cell: (r) => <span className="text-sm">{r.substitutionRequest?.date ? fmtDate(r.substitutionRequest.date) : '—'}</span>,
    },
    {
      id: 'score',
      header: 'SCORE',
      width: '65px',
      align: 'center',
      cell: (r) => {
        const s = r.algorithmScore ? Number(r.algorithmScore) : null;
        if (s === null) return <span className="text-xs text-[#8a929b]">—</span>;
        return (
          <span className="text-sm font-semibold" style={{ color: s >= 80 ? '#146b41' : s >= 60 ? '#8a5a00' : '#b3261e' }}>
            {Math.round(s)}
          </span>
        );
      },
    },
    {
      id: 'assignedBy',
      header: 'SOURCE',
      width: '80px',
      cell: (r) => (
        <Badge variant={r.assignedBy ? 'default' : 'graduated'}>
          {r.assignedBy ? 'Manual' : 'Auto'}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '130px',
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant={ASSIGN_BADGE[r.status] ?? 'default'}>{r.status}</Badge>
          {r.status === 'DECLINED' && r.declineReason && (
            <span className="text-xs text-[#6b7480] truncate max-w-[120px]" title={r.declineReason}>
              {r.declineReason}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '110px',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-2">
          {r.status === 'CONFIRMED' && (
            <button
              onClick={() => setDeclineTarget(r.id)}
              className="text-xs font-medium text-[#b3261e] hover:underline"
            >
              Decline
            </button>
          )}
          {(r.status === 'DECLINED' || r.status === 'SUGGESTED') && (
            <button
              onClick={() => handleReassign(r.id)}
              disabled={reassign.isPending}
              className="flex items-center gap-1 text-xs font-medium text-[#2b5fa8] hover:underline disabled:opacity-50"
            >
              <RefreshCw size={11} className={reassign.isPending ? 'animate-spin' : ''} />
              Reassign
            </button>
          )}
        </div>
      ),
    },
  ];

  const exportData = assignments.map((a) => ({
    ref:     a.id.slice(0, 8).toUpperCase(),
    status:  a.status,
    reason:  a.declineReason ?? '—',
    class:   a.timetableEntry?.section?.name ?? '—',
    period:  a.timetableEntry?.period?.name ?? '—',
    subject: a.timetableEntry?.subject?.name ?? '—',
    score:   a.algorithmScore ? Math.round(Number(a.algorithmScore)) : '—',
    source:  a.assignedBy ? 'Manual' : 'Auto',
  }));

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="All substitute assignments · Reassign declined slots in one click"
        actions={
          <ExportButton
            label="Export"
            data={exportData}
            filename="substitution-assignments"
            formats={['csv']}
            columns={[
              { header: 'Ref',     accessor: 'ref' },
              { header: 'Status',  accessor: 'status' },
              { header: 'Reason',  accessor: 'reason' },
              { header: 'Class',   accessor: 'class' },
              { header: 'Period',  accessor: 'period' },
              { header: 'Subject', accessor: 'subject' },
              { header: 'Score',   accessor: 'score' },
              { header: 'Source',  accessor: 'source' },
            ]}
          />
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
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading assignments…</div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#b3261e]">Failed to load assignments.</div>
        ) : assignments.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">No assignments found.</div>
        ) : (
          <DataTable columns={columns} data={assignments} />
        )}
        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {declineTarget && (
        <DeclineModal assignmentId={declineTarget} onClose={() => setDeclineTarget(null)} />
      )}
      {toastMsg && (
        <ReassignToast message={toastMsg} onDismiss={() => setToastMsg(null)} />
      )}
    </div>
  );
}
