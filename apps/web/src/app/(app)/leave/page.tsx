'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  Button,
  Badge,
  Avatar,
  KpiCard,
  KpiSkeleton,
  Pagination,
  Tabs,
  DataTable,
  ExportButton,
} from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  useOrganization,
  useAcademicYears,
} from '@/lib/hooks/use-academics';
import { useTeachers } from '@/lib/hooks/use-teachers';
import {
  useLeaveOverview,
  useLeaveRequests,
  useLeaveBalances,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useBulkApproveLeaveRequests,
  useBulkRejectLeaveRequests,
  useCancelApprovedLeaveRequest,
  useTeamAvailability,
  type LeaveRequest,
  type LeaveBalance,
  type LeaveOverviewPending,
  type LeaveOverviewAbsence,
  type TeamAvailabilityDay,
} from '@/lib/hooks/use-attendance';
import { LeaveSetupTab } from '@/app/(app)/attendance/_components/leave-setup-tab';
import { LeaveRequestModal } from '@/app/(app)/attendance/_components/leave-request-modal';
import { RejectLeaveModal } from '@/app/(app)/attendance/_components/reject-leave-modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

const LV_VARIANT: Record<string, 'active' | 'left' | 'pending' | 'default'> = {
  PENDING: 'pending',
  APPROVED: 'active',
  REJECTED: 'left',
  CANCELLED: 'default',
};

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun, adjusting so 0=Mon
  const d = new Date(year, month - 1, 1).getDay();
  return (d + 6) % 7; // Mon=0, Sun=6
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ─── Sub-components ───────────────────────────────────────────────────────────

// Small inline approve/reject buttons used in multiple places
function ApproveRejectButtons({ requestId, employeeName }: { requestId: string; employeeName: string }) {
  const toast = useToast();
  const approve = useApproveLeaveRequest();
  const [rejectOpen, setRejectOpen] = React.useState(false);

  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          style={{ fontSize: '12px', fontWeight: 500, color: '#146b41', background: 'none', border: 'none', cursor: 'pointer' }}
          disabled={approve.isPending}
          onClick={() =>
            approve.mutate(
              { id: requestId },
              {
                onSuccess: () => toast.success('Leave approved'),
                onError: () => toast.error('Failed to approve'),
              },
            )
          }
        >
          Approve
        </button>
        <span style={{ color: '#d7dce1' }}>|</span>
        <button
          style={{ fontSize: '12px', fontWeight: 500, color: '#b3261e', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setRejectOpen(true)}
        >
          Reject
        </button>
      </div>
      <RejectLeaveModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        requestId={requestId}
        employeeName={employeeName}
      />
    </>
  );
}

// ─── Leave Detail Modal ───────────────────────────────────────────────────────

interface LeaveDetailModalProps {
  request: LeaveRequest | null;
  onClose: () => void;
}

function LeaveDetailModal({ request, onClose }: LeaveDetailModalProps) {
  const toast = useToast();
  const approve = useApproveLeaveRequest();
  const cancelApproved = useCancelApprovedLeaveRequest();
  const [rejectOpen, setRejectOpen] = React.useState(false);

  if (!request) return null;

  const empName = `${request.employee.person.firstName} ${request.employee.person.lastName}`;

  const fieldStyle: React.CSSProperties = { fontSize: '13px', color: '#14181c' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#8a929b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 };
  const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column' as const, gap: 2 };

  return (
    <>
      <Modal
        open={!!request}
        onClose={onClose}
        title="Leave Request Detail"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {request.status === 'PENDING' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setRejectOpen(true)}
                  style={{ color: '#b3261e', borderColor: '#b3261e' }}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  disabled={approve.isPending}
                  onClick={() =>
                    approve.mutate(
                      { id: request.id },
                      {
                        onSuccess: () => { toast.success('Approved'); onClose(); },
                        onError: () => toast.error('Failed to approve'),
                      },
                    )
                  }
                >
                  {approve.isPending ? 'Approving…' : 'Approve'}
                </Button>
              </>
            )}
            {request.status === 'APPROVED' && (
              <Button
                variant="ghost"
                disabled={cancelApproved.isPending}
                onClick={() =>
                  cancelApproved.mutate(request.id, {
                    onSuccess: () => { toast.success('Leave cancelled — balance restored'); onClose(); },
                    onError: () => toast.error('Failed to cancel leave'),
                  })
                }
                style={{ color: '#b3261e', borderColor: '#b3261e' }}
              >
                {cancelApproved.isPending ? 'Cancelling…' : 'Cancel Leave'}
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Employee */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#f8f9fa', borderRadius: 8 }}>
            <Avatar name={empName} size="lg" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#14181c' }}>{empName}</div>
              <div style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>{request.employee.employeeNumber}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Badge variant={LV_VARIANT[request.status] ?? 'default'}>{request.status.replace(/_/g, ' ')}</Badge>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={rowStyle}>
              <div style={labelStyle}>Leave Type</div>
              <div style={fieldStyle}>{request.leaveType.name}</div>
              <div style={{ fontSize: '11px', color: '#8a929b' }}>{request.leaveType.code}</div>
            </div>
            <div style={rowStyle}>
              <div style={labelStyle}>Duration</div>
              <div style={fieldStyle}>{request.totalDays} working day{request.totalDays !== 1 ? 's' : ''}</div>
              <div style={{ fontSize: '11px', color: '#8a929b' }}>{fmt(request.startDate)} – {fmt(request.endDate)}</div>
            </div>
            <div style={rowStyle}>
              <div style={labelStyle}>Submitted</div>
              <div style={fieldStyle}>{fmt(request.createdAt)}</div>
            </div>
            {request.approvedAt && (
              <div style={rowStyle}>
                <div style={labelStyle}>{request.status === 'APPROVED' ? 'Approved' : 'Reviewed'} On</div>
                <div style={fieldStyle}>{fmt(request.approvedAt)}</div>
              </div>
            )}
          </div>

          {/* Reason */}
          {request.reason && (
            <div style={rowStyle}>
              <div style={labelStyle}>Reason</div>
              <div style={{ fontSize: '13px', color: '#14181c', background: '#f8f9fa', borderRadius: 6, padding: '10px 12px' }}>
                {request.reason}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {request.rejectionReason && (
            <div style={rowStyle}>
              <div style={labelStyle}>Rejection Reason</div>
              <div style={{ fontSize: '13px', color: '#b3261e', background: '#fff5f5', borderRadius: 6, padding: '10px 12px', border: '1px solid #fecaca' }}>
                {request.rejectionReason}
              </div>
            </div>
          )}

          {/* Approval timeline */}
          <div>
            <div style={labelStyle}>Approval Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 8 }}>
              {[
                { label: 'Submitted', date: request.createdAt, done: true, color: '#6b7480' },
                {
                  label: request.status === 'PENDING' ? 'Pending Approval' : request.status === 'APPROVED' ? 'Approved' : request.status === 'REJECTED' ? 'Rejected' : 'Cancelled',
                  date: request.approvedAt,
                  done: request.status !== 'PENDING',
                  color: request.status === 'APPROVED' ? '#146b41' : request.status === 'REJECTED' ? '#b3261e' : request.status === 'CANCELLED' ? '#8a929b' : '#f59e0b',
                },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', marginTop: 2,
                      background: step.done ? step.color : '#d7dce1',
                      border: `2px solid ${step.done ? step.color : '#d7dce1'}`,
                    }} />
                    {i < 1 && <div style={{ width: 2, height: 28, background: '#e6e8eb' }} />}
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: step.done ? step.color : '#8a929b' }}>{step.label}</div>
                    {step.date && <div style={{ fontSize: '11px', color: '#8a929b' }}>{fmt(step.date)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <RejectLeaveModal
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); onClose(); }}
        requestId={request.id}
        employeeName={empName}
      />
    </>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ date }: { date: string }) {
  const { data: overview, isLoading } = useLeaveOverview(date);

  const sectionStyle: React.CSSProperties = {
    borderRadius: 10,
    border: '1px solid #e6e8eb',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  };

  const sectionHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #f0f1f3',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI strip */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[0,1,2,3].map((i) => <KpiSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard title="ON LEAVE TODAY" value={String(overview?.kpis.onLeaveToday ?? 0)} />
          <KpiCard
            title="PENDING"
            value={String(overview?.kpis.pendingRequests ?? 0)}
            subtitle="awaiting approval"
            trendPositive={false}
          />
          <KpiCard title="APPROVED THIS MONTH" value={String(overview?.kpis.approvedThisMonth ?? 0)} trendPositive />
          <KpiCard title="REJECTED THIS MONTH" value={String(overview?.kpis.rejectedThisMonth ?? 0)} />
        </div>
      )}

      {/* Today's absences */}
      <div style={sectionStyle}>
        <div style={sectionHeader}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>
              On Leave Today
            </div>
            <div style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>
              Employees with approved leave covering {fmt(date)}
            </div>
          </div>
        </div>
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>Loading…</div>
        ) : !overview?.todaysAbsences.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
            No employees on leave today.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['EMPLOYEE', 'LEAVE TYPE', 'PERIOD', 'DAYS', 'STATUS'].map((h) => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6b7480', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(overview.todaysAbsences as LeaveOverviewAbsence[]).map((a, i) => (
                <tr key={a.employeeId + i} style={{ borderTop: '1px solid #f0f1f3' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={a.name} size="md" />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontSize: '13px', color: '#14181c' }}>{a.leaveType}</div>
                    <Badge variant={a.isPaid ? 'active' : 'default'} style={{ marginTop: 2 }}>
                      {a.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: '#6b7480' }}>
                    {fmt(a.startDate)} – {fmt(a.endDate)}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 500 }}>{a.totalDays}d</td>
                  <td style={{ padding: '10px 16px' }}>
                    <Badge variant="active">Approved</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending approvals */}
      <div style={sectionStyle}>
        <div style={sectionHeader}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>
              Pending Approvals
            </div>
            <div style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>
              Oldest first — act quickly to avoid delays
            </div>
          </div>
        </div>
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>Loading…</div>
        ) : !overview?.pendingApprovals.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
            No pending leave requests.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['EMPLOYEE', 'LEAVE TYPE', 'PERIOD', 'DAYS', 'SUBMITTED', 'ACTIONS'].map((h) => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6b7480', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(overview.pendingApprovals as LeaveOverviewPending[]).map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #f0f1f3' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={r.employeeName} size="md" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>{r.employeeName}</div>
                        <div style={{ fontSize: '11px', color: '#8a929b' }}>{r.employeeNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px' }}>{r.leaveType}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: '#6b7480' }}>
                    {fmt(r.startDate)} – {fmt(r.endDate)}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 500 }}>{r.totalDays}d</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: '#8a929b' }}>{daysAgo(r.createdAt)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <ApproveRejectButtons requestId={r.id} employeeName={r.employeeName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Requests ────────────────────────────────────────────────────────────

function RequestsTab({ onNewRequest }: { onNewRequest: () => void }) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [detailRequest, setDetailRequest] = React.useState<LeaveRequest | null>(null);
  const [rejectModal, setRejectModal] = React.useState<{ open: boolean; id: string; name: string }>({
    open: false, id: '', name: '',
  });
  const [bulkRejectOpen, setBulkRejectOpen] = React.useState(false);
  const [bulkRejectReason, setBulkRejectReason] = React.useState('');

  const approve = useApproveLeaveRequest();
  const bulkApprove = useBulkApproveLeaveRequests();
  const bulkReject = useBulkRejectLeaveRequests();

  const { data: requests = [], isLoading } = useLeaveRequests(
    statusFilter ? { status: statusFilter } : undefined,
  );

  const slice = requests.slice((page - 1) * pageSize, page * pageSize);
  const pendingInSlice = slice.filter((r) => r.status === 'PENDING');
  const selectedPending = [...selected].filter((id) => requests.find((r) => r.id === id && r.status === 'PENDING'));

  function toggleAll() {
    const pendingIds = pendingInSlice.map((r) => r.id);
    const allSelected = pendingIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pendingIds.forEach((id) => next.delete(id));
      else pendingIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleBulkApprove() {
    const ids = selectedPending;
    if (!ids.length) return;
    bulkApprove.mutate(ids, {
      onSuccess: (res) => {
        toast.success(`Approved ${res.approved} request(s)${res.failed.length ? `, ${res.failed.length} failed` : ''}`);
        setSelected(new Set());
      },
      onError: () => toast.error('Bulk approval failed'),
    });
  }

  function handleBulkReject() {
    const ids = selectedPending;
    if (!ids.length) return;
    bulkReject.mutate(
      { ids, rejectionReason: bulkRejectReason.trim() || undefined },
      {
        onSuccess: (res) => {
          toast.success(`Rejected ${res.rejected} request(s)${res.failed.length ? `, ${res.failed.length} failed` : ''}`);
          setSelected(new Set());
          setBulkRejectOpen(false);
          setBulkRejectReason('');
        },
        onError: () => toast.error('Bulk rejection failed'),
      },
    );
  }

  const allPendingSelected =
    pendingInSlice.length > 0 && pendingInSlice.every((r) => selected.has(r.id));

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      id: 'check', header: '', width: '40px',
      cell: (r) =>
        r.status === 'PENDING' ? (
          <input
            type="checkbox"
            checked={selected.has(r.id)}
            onChange={() => toggleOne(r.id)}
            style={{ cursor: 'pointer', accentColor: '#2b5fa8' }}
          />
        ) : null,
    },
    {
      id: 'employee', header: 'EMPLOYEE', width: 'minmax(160px,1.4fr)',
      cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={`${r.employee.person.firstName} ${r.employee.person.lastName}`} size="md" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>
              {r.employee.person.firstName} {r.employee.person.lastName}
            </div>
            <div style={{ fontSize: '11px', color: '#8a929b' }}>{r.employee.employeeNumber}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'leaveType', header: 'LEAVE TYPE', width: '130px',
      cell: (r) => <span style={{ fontSize: '12px' }}>{r.leaveType.name}</span>,
    },
    {
      id: 'from', header: 'FROM', width: '100px',
      cell: (r) => <span style={{ fontSize: '12px', color: '#6b7480' }}>{fmt(r.startDate)}</span>,
    },
    {
      id: 'to', header: 'TO', width: '100px',
      cell: (r) => <span style={{ fontSize: '12px', color: '#6b7480' }}>{fmt(r.endDate)}</span>,
    },
    {
      id: 'days', header: 'DAYS', width: '60px', align: 'center' as const,
      cell: (r) => <span style={{ fontSize: '12px', fontWeight: 500 }}>{r.totalDays}</span>,
    },
    {
      id: 'status', header: 'STATUS', width: '100px',
      cell: (r) => <Badge variant={LV_VARIANT[r.status] ?? 'default'}>{r.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      id: 'actions', header: 'ACTIONS', width: '140px', align: 'right' as const,
      cell: (r) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            style={{ fontSize: '12px', fontWeight: 500, color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setDetailRequest(r)}
          >
            View
          </button>
          {r.status === 'PENDING' && (
            <>
              <span style={{ color: '#d7dce1' }}>|</span>
              <button
                style={{ fontSize: '12px', fontWeight: 500, color: '#146b41', background: 'none', border: 'none', cursor: 'pointer' }}
                disabled={approve.isPending}
                onClick={() =>
                  approve.mutate(
                    { id: r.id },
                    {
                      onSuccess: () => toast.success('Leave approved'),
                      onError: () => toast.error('Failed to approve'),
                    },
                  )
                }
              >
                Approve
              </button>
              <span style={{ color: '#d7dce1' }}>|</span>
              <button
                style={{ fontSize: '12px', fontWeight: 500, color: '#b3261e', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setRejectModal({ open: true, id: r.id, name: `${r.employee.person.firstName} ${r.employee.person.lastName}` })}
              >
                Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {/* Filter + actions row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #eef0f2', padding: '10px 14px' }}>
          {/* Select-all checkbox (only visible pending items on current page) */}
          {pendingInSlice.length > 0 && (
            <input
              type="checkbox"
              checked={allPendingSelected}
              onChange={toggleAll}
              title="Select all pending on this page"
              style={{ cursor: 'pointer', accentColor: '#2b5fa8' }}
            />
          )}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelected(new Set()); }}
            style={{ height: 32, border: '1px solid #d7dce1', borderRadius: 6, padding: '0 8px', fontSize: '13px', color: '#14181c' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div style={{ flex: 1 }} />
          <ExportButton
            label="Export"
            data={requests}
            filename="leave-requests"
            formats={['csv', 'excel']}
            columns={[
              { header: 'Employee', accessor: (r: LeaveRequest) => `${r.employee.person.firstName} ${r.employee.person.lastName}` },
              { header: 'Employee No', accessor: (r: LeaveRequest) => r.employee.employeeNumber },
              { header: 'Leave Type', accessor: (r: LeaveRequest) => r.leaveType.name },
              { header: 'From', accessor: 'startDate' as keyof LeaveRequest },
              { header: 'To', accessor: 'endDate' as keyof LeaveRequest },
              { header: 'Days', accessor: 'totalDays' as keyof LeaveRequest },
              { header: 'Status', accessor: 'status' as keyof LeaveRequest },
            ]}
          />
          <Button variant="primary" onClick={onNewRequest}>+ New Request</Button>
        </div>

        {/* Bulk action bar — shown when something is selected */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1d4ed8' }}>
              {selected.size} selected ({selectedPending.length} pending)
            </span>
            <div style={{ flex: 1 }} />
            {selectedPending.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleBulkApprove}
                  disabled={bulkApprove.isPending}
                  style={{ color: '#146b41', borderColor: '#146b41' }}
                >
                  {bulkApprove.isPending ? 'Approving…' : `Approve ${selectedPending.length}`}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setBulkRejectOpen(true)}
                  style={{ color: '#b3261e', borderColor: '#b3261e' }}
                >
                  Reject {selectedPending.length}
                </Button>
              </>
            )}
            <button
              onClick={() => setSelected(new Set())}
              style={{ fontSize: '12px', color: '#6b7480', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>Loading leave requests…</div>
        ) : slice.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} leave requests.` : 'No leave requests found.'}
          </div>
        ) : (
          <DataTable columns={columns} data={slice} />
        )}

        <div style={{ borderTop: '1px solid #eef0f2', padding: '10px 14px' }}>
          <Pagination page={page} pageSize={pageSize} total={requests.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>

      {/* Leave detail modal */}
      <LeaveDetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />

      {/* Single reject modal */}
      <RejectLeaveModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: '', name: '' })}
        requestId={rejectModal.id}
        employeeName={rejectModal.name}
      />

      {/* Bulk reject modal */}
      <Modal
        open={bulkRejectOpen}
        onClose={() => { setBulkRejectOpen(false); setBulkRejectReason(''); }}
        title={`Reject ${selectedPending.length} Leave Request(s)`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setBulkRejectOpen(false); setBulkRejectReason(''); }}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleBulkReject}
              disabled={bulkReject.isPending}
              style={{ background: '#b3261e', borderColor: '#b3261e' }}
            >
              {bulkReject.isPending ? 'Rejecting…' : `Reject ${selectedPending.length}`}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: '13px', color: '#14181c', margin: 0 }}>
            You are about to reject {selectedPending.length} pending leave request(s). Optionally provide a reason.
          </p>
          <textarea
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
            placeholder="Rejection reason (optional)…"
            rows={3}
            style={{ width: '100%', border: '1px solid #d7dce1', borderRadius: 6, padding: '8px 10px', fontSize: '13px', color: '#14181c', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      </Modal>
    </>
  );
}

// ─── Tab: Balances ────────────────────────────────────────────────────────────

function BalancesTab({ academicYearId }: { academicYearId: string }) {
  const [employeeId, setEmployeeId] = React.useState('');
  const { data: empRes } = useTeachers({ limit: 200 });
  const employees = empRes?.data ?? [];
  const { data: balances = [], isLoading } = useLeaveBalances(employeeId || undefined, academicYearId || undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Employee selector */}
      <div style={{ borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#14181c', marginBottom: 8 }}>Select Employee</div>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          style={{ height: 36, border: '1px solid #d7dce1', borderRadius: 6, padding: '0 10px', fontSize: '13px', color: '#14181c', minWidth: 280 }}
        >
          <option value="">Select an employee to view balances…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.person.firstName} {emp.person.lastName}
              {emp.employeeNumber ? ` — ${emp.employeeNumber}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Balance cards */}
      {!employeeId ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px', borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff' }}>
          Select an employee above to view their leave balances.
        </div>
      ) : isLoading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px', borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff' }}>
          Loading balances…
        </div>
      ) : balances.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px', borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff' }}>
          No leave balances allocated for this employee yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {(balances as LeaveBalance[]).map((b) => {
            const pct = b.allocated > 0 ? Math.round((b.used / b.allocated) * 100) : 0;
            return (
              <div
                key={b.leaveTypeId}
                style={{ borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>{b.leaveType.name}</div>
                    <div style={{ fontSize: '11px', color: '#8a929b', marginTop: 2 }}>
                      <span style={{ fontFamily: 'monospace', background: '#f0f1f3', padding: '1px 5px', borderRadius: 3 }}>{b.leaveType.code}</span>
                      {' '}&nbsp;
                      <Badge variant={b.leaveType.isPaid ? 'active' : 'default'}>{b.leaveType.isPaid ? 'Paid' : 'Unpaid'}</Badge>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: b.remaining > 0 ? '#14181c' : '#b3261e' }}>{b.remaining}</div>
                    <div style={{ fontSize: '11px', color: '#8a929b' }}>remaining</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, borderRadius: 3, background: '#f0f1f3', overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', borderRadius: 3, background: pct > 80 ? '#b3261e' : pct > 60 ? '#f59e0b' : '#146b41', width: `${Math.min(pct, 100)}%` }} />
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Allocated', value: b.allocated },
                    { label: 'Used', value: b.used },
                    { label: 'Pending', value: b.pending },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>{value}</div>
                      <div style={{ fontSize: '10px', color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Calendar ────────────────────────────────────────────────────────────

function CalendarTab() {
  const [year, setYear] = React.useState(() => new Date().getFullYear());
  const [month, setMonth] = React.useState(() => new Date().getMonth() + 1);

  // Fetch all approved leaves — we'll filter client-side for the month view
  const { data: allLeaves = [], isLoading } = useLeaveRequests({ status: 'APPROVED' });

  // Compute which employees are on leave per day in the current month view
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfMonth(year, month); // Mon=0

  // Build a map: day (1-31) -> list of { name, leaveType }
  const leavesByDay = React.useMemo(() => {
    const map = new Map<number, Array<{ name: string; leaveType: string }>>();
    for (const req of allLeaves as LeaveRequest[]) {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(year, month - 1, d);
        if (day >= start && day <= end) {
          if (!map.has(d)) map.set(d, []);
          map.get(d)!.push({
            name: `${req.employee.person.firstName} ${req.employee.person.lastName}`,
            leaveType: req.leaveType.name,
          });
        }
      }
    }
    return map;
  }, [allLeaves, year, month, daysInMonth]);

  const [hoveredDay, setHoveredDay] = React.useState<number | null>(null);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = isCurrentMonth ? today.getDate() : -1;

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  // Build calendar grid (6 rows max, 7 cols)
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const hovered = hoveredDay ? leavesByDay.get(hoveredDay) ?? [] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #d7dce1', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#14181c' }}>{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #d7dce1', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>

        {/* Day header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {DAY_LABELS.map((dl) => (
            <div key={dl} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#8a929b', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dl}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>Loading calendar…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const leavers = leavesByDay.get(day) ?? [];
              const isToday = day === todayDate;
              const isHovered = day === hoveredDay;
              return (
                <div
                  key={day}
                  onMouseEnter={() => leavers.length > 0 && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    minHeight: 72,
                    borderRadius: 8,
                    border: isToday ? '2px solid #2b5fa8' : '1px solid #f0f1f3',
                    background: isHovered ? '#f0f4ff' : isToday ? '#f5f8ff' : '#fafafa',
                    padding: '6px 8px',
                    cursor: leavers.length > 0 ? 'pointer' : 'default',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400, color: isToday ? '#2b5fa8' : '#14181c', marginBottom: 4 }}>{day}</div>
                  {leavers.slice(0, 3).map((l, i) => (
                    <div key={i} style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', borderRadius: 3, padding: '1px 4px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.name.split(' ')[0]}
                    </div>
                  ))}
                  {leavers.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#6b7480' }}>+{leavers.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover tooltip-like panel */}
      {hoveredDay && hovered.length > 0 && (
        <div style={{ borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#14181c', marginBottom: 10 }}>
            On Leave — {MONTH_NAMES[month - 1]} {hoveredDay}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hovered.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={l.name} size="md" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>{l.name}</div>
                  <div style={{ fontSize: '11px', color: '#8a929b' }}>{l.leaveType}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '12px', color: '#6b7480' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#dbeafe', border: '1px solid #bfdbfe' }} />
          On leave (approved)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid #2b5fa8' }} />
          Today
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Team Availability ───────────────────────────────────────────────────

function TeamAvailabilityTab() {
  const today = new Date();

  // Default: current week Mon–Sun
  function getWeekRange() {
    const d = new Date(today);
    const day = d.getDay(); // 0=Sun
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      from: mon.toISOString().slice(0, 10),
      to: sun.toISOString().slice(0, 10),
    };
  }

  const defaultRange = getWeekRange();
  const [from, setFrom] = React.useState(defaultRange.from);
  const [to, setTo] = React.useState(defaultRange.to);
  const [applied, setApplied] = React.useState({ from: defaultRange.from, to: defaultRange.to });

  const { data, isLoading } = useTeamAvailability(applied.from, applied.to);

  const days = data?.days ?? [];
  const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get unique employees on leave across the range
  const employees = data?.employees ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Date range selector */}
      <div style={{ borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '12px', color: '#6b7480', fontWeight: 500 }}>From</span>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ height: 34, border: '1px solid #d7dce1', borderRadius: 6, padding: '0 8px', fontSize: '13px', color: '#14181c' }}
        />
        <span style={{ fontSize: '12px', color: '#6b7480', fontWeight: 500 }}>To</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => setTo(e.target.value)}
          style={{ height: 34, border: '1px solid #d7dce1', borderRadius: 6, padding: '0 8px', fontSize: '13px', color: '#14181c' }}
        />
        <Button
          variant="primary"
          onClick={() => setApplied({ from, to })}
          disabled={!from || !to || from > to}
        >
          Apply
        </Button>
        <button
          onClick={() => { const w = getWeekRange(); setFrom(w.from); setTo(w.to); setApplied(w); }}
          style={{ fontSize: '12px', color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
        >
          This Week
        </button>
      </div>

      {/* Matrix */}
      <div style={{ borderRadius: 10, border: '1px solid #e6e8eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>Loading availability…</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
            No employees on approved leave in this period.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${200 + days.length * 56}px` }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6b7480', letterSpacing: '0.04em', width: 200, position: 'sticky', left: 0, background: '#f8f9fa', zIndex: 1 }}>
                    EMPLOYEE
                  </th>
                  {days.map((d) => {
                    const dt = new Date(d.date + 'T00:00:00');
                    const isToday = d.date === todayISO();
                    return (
                      <th
                        key={d.date}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isToday ? '#2b5fa8' : '#6b7480',
                          letterSpacing: '0.04em',
                          minWidth: 52,
                          borderLeft: '1px solid #f0f1f3',
                          background: isToday ? '#eff6ff' : '#f8f9fa',
                        }}
                      >
                        <div>{DAY_SHORT[dt.getDay()]}</div>
                        <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400 }}>{dt.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} style={{ borderTop: '1px solid #f0f1f3' }}>
                    <td style={{ padding: '10px 16px', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #f0f1f3' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={emp.name} size="md" />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>{emp.name}</span>
                      </div>
                    </td>
                    {days.map((d) => {
                      const onLeave = d.onLeave.find((o) => o.employeeId === emp.id);
                      const isToday = d.date === todayISO();
                      return (
                        <td
                          key={d.date}
                          style={{
                            textAlign: 'center',
                            padding: '6px 4px',
                            borderLeft: '1px solid #f0f1f3',
                            background: isToday ? '#eff6ff' : undefined,
                          }}
                          title={onLeave ? `${onLeave.leaveType}${onLeave.isPaid ? ' (Paid)' : ' (Unpaid)'}` : undefined}
                        >
                          {onLeave ? (
                            <div style={{
                              display: 'inline-block',
                              width: 28, height: 28,
                              borderRadius: 6,
                              background: onLeave.isPaid ? '#dbeafe' : '#fef3c7',
                              border: `1px solid ${onLeave.isPaid ? '#bfdbfe' : '#fde68a'}`,
                            }} title={onLeave.leaveType} />
                          ) : (
                            <span style={{ color: '#d7dce1', fontSize: '14px' }}>·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '12px', color: '#6b7480' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: '#dbeafe', border: '1px solid #bfdbfe' }} />
          Paid leave
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: '#fef3c7', border: '1px solid #fde68a' }} />
          Unpaid leave
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, border: '2px solid #2b5fa8' }} />
          Today
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Leave Requests' },
  { id: 'balances', label: 'Balances' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'team', label: 'Team Availability' },
  { id: 'setup', label: 'Setup' },
];

export default function LeavePage() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedDate, setSelectedDate] = React.useState(todayISO());
  const [academicYearId, setAcademicYearId] = React.useState('');
  const [leaveRequestOpen, setLeaveRequestOpen] = React.useState(false);

  const { data: org } = useOrganization();
  const { data: academicYears = [] } = useAcademicYears(org?.id);

  React.useEffect(() => {
    if (academicYears.length > 0 && !academicYearId) {
      const active = academicYears.find((y) => y.status === 'ACTIVE') ?? academicYears[0];
      if (active) setAcademicYearId(active.id);
    }
  }, [academicYears, academicYearId]);

  // Pending count for tab badge
  const { data: overview } = useLeaveOverview(selectedDate);
  const pendingCount = overview?.kpis.pendingRequests ?? 0;

  const tabsWithBadge = TABS.map((t) =>
    t.id === 'requests' && pendingCount > 0 ? { ...t, count: pendingCount } : t,
  );

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Employee leave, balances, and approvals"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {activeTab === 'overview' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ height: 36, border: '1px solid #d7dce1', borderRadius: 6, padding: '0 10px', fontSize: '13px', color: '#14181c' }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '12px', color: '#6b7480', fontWeight: 500 }}>Academic Year</span>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                style={{ height: 36, border: '1px solid #d7dce1', borderRadius: 6, padding: '0 8px', fontSize: '13px', color: '#14181c' }}
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={() => setLeaveRequestOpen(true)}>
              + Apply Leave
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabsWithBadge} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {activeTab === 'overview' && <OverviewTab date={selectedDate} />}
      {activeTab === 'requests' && <RequestsTab onNewRequest={() => setLeaveRequestOpen(true)} />}
      {activeTab === 'balances' && <BalancesTab academicYearId={academicYearId} />}
      {activeTab === 'calendar' && <CalendarTab />}
      {activeTab === 'team' && <TeamAvailabilityTab />}
      {activeTab === 'setup' && academicYearId && <LeaveSetupTab academicYearId={academicYearId} />}

      <LeaveRequestModal
        open={leaveRequestOpen}
        onClose={() => setLeaveRequestOpen(false)}
      />
    </div>
  );
}
