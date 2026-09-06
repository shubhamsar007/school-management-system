'use client';

import * as React from 'react';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useRemoveClassSubject } from '@/lib/hooks/use-academics';
import type { ClassSubject } from '@/lib/types/academics';

interface RemoveClassSubjectDialogProps {
  open: boolean;
  onClose: () => void;
  assignment: ClassSubject;
}

export function RemoveClassSubjectDialog({
  open,
  onClose,
  assignment,
}: RemoveClassSubjectDialogProps) {
  const toast = useToast();
  const remove = useRemoveClassSubject();

  async function handleConfirm() {
    try {
      await remove.mutateAsync(assignment.id);
      toast.success(`"${assignment.subject?.name ?? 'Subject'}" removed from class.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to remove subject.');
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Remove Subject"
      description={`Remove "${assignment.subject?.name ?? 'this subject'}" from ${assignment.class?.name ?? 'this class'} for the selected academic year? This only removes the curriculum mapping — the subject itself is not deleted.`}
      confirmLabel="Remove"
      variant="danger"
      loading={remove.isPending}
    />
  );
}
