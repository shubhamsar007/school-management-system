'use client';

import * as React from 'react';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useDeleteSubject } from '@/lib/hooks/use-academics';
import type { Subject } from '@/lib/types/academics';

interface DeleteSubjectDialogProps {
  open: boolean;
  onClose: () => void;
  subject: Subject;
}

export function DeleteSubjectDialog({ open, onClose, subject }: DeleteSubjectDialogProps) {
  const toast = useToast();
  const del = useDeleteSubject();

  async function handleConfirm() {
    try {
      await del.mutateAsync(subject.id);
      toast.success(`Subject "${subject.name}" deleted.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete subject.');
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Subject"
      description={`Are you sure you want to delete "${subject.name}"? This cannot be undone if the subject is not assigned to any class.`}
      confirmLabel="Delete Subject"
      variant="danger"
      loading={del.isPending}
    />
  );
}
