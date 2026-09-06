'use client';

import * as React from 'react';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useDeleteSection } from '@/lib/hooks/use-academics';
import type { Section } from '@/lib/types/academics';

interface DeleteSectionDialogProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  section: Section;
}

export function DeleteSectionDialog({ open, onClose, classId, section }: DeleteSectionDialogProps) {
  const toast = useToast();
  const del = useDeleteSection();

  async function handleConfirm() {
    try {
      await del.mutateAsync({ classId, sectionId: section.id });
      toast.success(`Section "${section.name}" deleted.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete section.');
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Section"
      description={`Are you sure you want to delete "${section.name}"? This cannot be undone.`}
      confirmLabel="Delete Section"
      variant="danger"
      loading={del.isPending}
    />
  );
}
