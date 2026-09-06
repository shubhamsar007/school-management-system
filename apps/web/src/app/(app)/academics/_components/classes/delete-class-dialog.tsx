'use client';

import * as React from 'react';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useDeleteClass } from '@/lib/hooks/use-academics';
import type { AcademicClass } from '@/lib/types/academics';

interface DeleteClassDialogProps {
  open: boolean;
  onClose: () => void;
  cls: AcademicClass;
}

export function DeleteClassDialog({ open, onClose, cls }: DeleteClassDialogProps) {
  const toast = useToast();
  const del = useDeleteClass();

  async function handleConfirm() {
    try {
      await del.mutateAsync(cls.id);
      toast.success(`Class "${cls.name}" deleted.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete class.');
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Class"
      description={`Are you sure you want to delete "${cls.name}"? This cannot be undone.`}
      confirmLabel="Delete Class"
      variant="danger"
      loading={del.isPending}
    />
  );
}
