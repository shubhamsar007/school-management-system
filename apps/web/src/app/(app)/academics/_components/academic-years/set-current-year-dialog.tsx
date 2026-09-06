'use client';

import * as React from 'react';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useUpdateAcademicYear } from '@/lib/hooks/use-academic-years';
import { useOrganization } from '@/lib/hooks/use-academics';
import type { AcademicYear } from '@/lib/types/academics';

interface SetCurrentYearDialogProps {
  open: boolean;
  onClose: () => void;
  year: AcademicYear;
}

export function SetCurrentYearDialog({ open, onClose, year }: SetCurrentYearDialogProps) {
  const toast = useToast();
  const { data: org } = useOrganization();
  const update = useUpdateAcademicYear(org?.id);

  async function handleConfirm() {
    try {
      await update.mutateAsync({
        yearId: year.id,
        dto: { isCurrent: true, status: 'ACTIVE' },
      });
      toast.success(`"${year.name}" is now the current academic year.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to update academic year.');
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Set as Current Year"
      description={`Set "${year.name}" as the current academic year? The previously active year will be unmarked.`}
      confirmLabel="Set as Current"
      variant="primary"
      loading={update.isPending}
    />
  );
}
