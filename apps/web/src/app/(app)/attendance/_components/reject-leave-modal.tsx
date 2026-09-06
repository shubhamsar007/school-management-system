'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useRejectLeaveRequest } from '@/lib/hooks/use-attendance';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RejectLeaveModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  employeeName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RejectLeaveModal({ open, onClose, requestId, employeeName }: RejectLeaveModalProps) {
  const toast = useToast();
  const [reason, setReason] = React.useState('');
  const reject = useRejectLeaveRequest();

  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);

  function handleReject() {
    reject.mutate(
      {
        id: requestId,
        ...(reason ? { rejectionReason: reason } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Leave request rejected');
          onClose();
        },
        onError: () => {
          toast.error('Failed to reject leave request. Please try again.');
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject Leave Request"
      description={`Rejecting leave request for ${employeeName}`}
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
