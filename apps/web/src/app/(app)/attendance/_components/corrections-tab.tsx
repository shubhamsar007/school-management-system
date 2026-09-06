'use client';

import * as React from 'react';
import { Badge, DataTable } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  useAttendanceCorrections,
  useApproveCorrection,
  useRejectCorrection,
  type AttendanceCorrection,
} from '@/lib/hooks/use-attendance';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function truncate(str: string, max = 16): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

const CORR_STATUS_VARIANT: Record<string, 'pending' | 'active' | 'left' | 'default'> = {
  PENDING: 'pending',
  APPROVED: 'active',
  REJECTED: 'left',
};

const TYPE_VARIANT: Record<string, 'active' | 'default'> = {
  STUDENT: 'active',
  EMPLOYEE: 'default',
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectCorrectionModalProps {
  open: boolean;
  correctionId: string;
  onClose: () => void;
}

function RejectCorrectionModal({ open, correctionId, onClose }: RejectCorrectionModalProps) {
  const toast = useToast();
  const [reason, setReason] = React.useState('');
  const reject = useRejectCorrection();

  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);

  function handleReject() {
    reject.mutate(
      { id: correctionId, ...(reason ? { rejectionReason: reason } : {}) },
      {
        onSuccess: () => {
          toast.success('Correction request rejected');
          onClose();
        },
        onError: () => {
          toast.error('Failed to reject correction request');
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject Correction Request"
      description="This correction will be marked as rejected."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleReject}
            disabled={reject.isPending}
            style={{ background: '#b3261e', borderColor: '#b3261e' }}
          >
            {reject.isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        </>
      }
    >
      <div>
        <label
          style={{
            fontSize: '12px',
            color: '#6b7480',
            display: 'block',
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          Rejection Reason (optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason for rejection…"
          rows={4}
          style={{
            width: '100%',
            border: '1px solid #d7dce1',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: '13px',
            color: '#14181c',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </Modal>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CorrectionsTabProps {
  campusId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CorrectionsTab({ campusId: _campusId }: CorrectionsTabProps) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = React.useState('');
  const [rejectModal, setRejectModal] = React.useState<{ open: boolean; correctionId: string }>({
    open: false,
    correctionId: '',
  });

  const { data: corrections = [], isLoading } = useAttendanceCorrections(
    statusFilter ? { status: statusFilter } : undefined,
  );
  const approve = useApproveCorrection();

  function handleApprove(id: string) {
    approve.mutate(id, {
      onSuccess: () => toast.success('Correction approved and attendance updated'),
      onError: () => toast.error('Failed to approve correction'),
    });
  }

  const columns: ColumnDef<AttendanceCorrection>[] = [
    {
      id: 'type',
      header: 'TYPE',
      width: '100px',
      cell: (r) => (
        <Badge variant={TYPE_VARIANT[r.attendanceType] ?? 'default'}>{r.attendanceType}</Badge>
      ),
    },
    {
      id: 'attendanceId',
      header: 'RECORD ID',
      width: '130px',
      cell: (r) => (
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#6b7480',
            background: '#f8f9fa',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {truncate(r.attendanceId, 14)}
        </span>
      ),
    },
    {
      id: 'change',
      header: 'CHANGE',
      width: '200px',
      cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#991b1b',
              background: '#fee2e2',
              padding: '2px 8px',
              borderRadius: 20,
            }}
          >
            {r.originalStatus.replace(/_/g, ' ')}
          </span>
          <span style={{ fontSize: '12px', color: '#8a929b' }}>→</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#166534',
              background: '#dcfce7',
              padding: '2px 8px',
              borderRadius: 20,
            }}
          >
            {r.requestedStatus.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      id: 'reason',
      header: 'REASON',
      width: 'minmax(140px,1fr)',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }} title={r.reason}>
          {truncate(r.reason, 40)}
        </span>
      ),
    },
    {
      id: 'requestedAt',
      header: 'REQUESTED',
      width: '110px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatDate(r.requestedAt)}</span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => (
        <Badge variant={CORR_STATUS_VARIANT[r.status] ?? 'default'}>
          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '140px',
      align: 'right',
      cell: (r) =>
        r.status === 'PENDING' ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              onClick={() => handleApprove(r.id)}
              disabled={approve.isPending}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#146b41',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Approve
            </button>
            <span style={{ color: '#d7dce1' }}>|</span>
            <button
              onClick={() => setRejectModal({ open: true, correctionId: r.id })}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#b3261e',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reject
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#8a929b' }}>—</span>
        ),
    },
  ];

  return (
    <>
      <div
        style={{
          overflow: 'hidden',
          borderRadius: 10,
          border: '1px solid #e6e8eb',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Filter bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid #eef0f2',
            padding: '10px 14px',
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 32,
              border: '1px solid #d7dce1',
              borderRadius: 6,
              padding: '0 8px',
              fontSize: '13px',
              color: '#14181c',
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div style={{ flex: 1 }} />
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
            Loading correction requests…
          </div>
        ) : corrections.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
            No correction requests.
          </div>
        ) : (
          <DataTable columns={columns} data={corrections} />
        )}
      </div>

      <RejectCorrectionModal
        open={rejectModal.open}
        correctionId={rejectModal.correctionId}
        onClose={() => setRejectModal({ open: false, correctionId: '' })}
      />
    </>
  );
}
