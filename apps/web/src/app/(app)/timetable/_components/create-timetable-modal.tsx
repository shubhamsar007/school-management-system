'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useOrganization, useAcademicYears } from '@/lib/hooks/use-academics';
import { useCreateTimetable } from '@/lib/hooks/use-timetable';

interface FormState {
  name: string;
  academicYearId: string;
  effectiveFrom: string;
  effectiveTo: string;
}

interface Errors {
  name?: string;
  academicYearId?: string;
  effectiveFrom?: string;
}

const EMPTY: FormState = { name: '', academicYearId: '', effectiveFrom: '', effectiveTo: '' };

interface CreateTimetableModalProps {
  open: boolean;
  onClose: () => void;
  campusId: string;
  /** Called with the newly created timetable id so the parent can auto-select it. */
  onCreated?: (id: string) => void;
}

export function CreateTimetableModal({ open, onClose, campusId, onCreated }: CreateTimetableModalProps) {
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const create = useCreateTimetable();
  const { data: org } = useOrganization();
  const { data: years = [] } = useAcademicYears(org?.id);

  const yearOptions = years.map((y) => ({
    label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
    value: y.id,
  }));

  React.useEffect(() => {
    if (open) {
      // Pre-select current year
      const currentYear = years.find((y) => y.isCurrent);
      setForm({ ...EMPTY, ...(currentYear ? { academicYearId: currentYear.id } : {}) });
      setErrors({});
    }
  }, [open, years]);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Timetable name is required';
    if (!form.academicYearId) errs.academicYearId = 'Academic year is required';
    if (!form.effectiveFrom) errs.effectiveFrom = 'Effective from date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      const result = await create.mutateAsync({
        campusId,
        academicYearId: form.academicYearId,
        name: form.name.trim(),
        effectiveFrom: form.effectiveFrom,
        ...(form.effectiveTo ? { effectiveTo: form.effectiveTo } : {}),
      });
      toast.success(`Draft timetable "${form.name}" created.`);
      onCreated?.(result.id);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to create timetable.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Draft Timetable"
      description="Create a new draft timetable for this campus. You can start adding entries immediately."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create Draft'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Timetable Name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Term 1 Regular 2026-27"
          {...(errors.name ? { error: errors.name } : {})}
        />
        <Select
          label="Academic Year"
          required
          value={form.academicYearId}
          onChange={set('academicYearId')}
          options={yearOptions}
          placeholder="Select academic year"
          {...(errors.academicYearId ? { error: errors.academicYearId } : {})}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Effective From"
            required
            type="date"
            value={form.effectiveFrom}
            onChange={set('effectiveFrom')}
            {...(errors.effectiveFrom ? { error: errors.effectiveFrom } : {})}
          />
          <Input
            label="Effective To"
            type="date"
            value={form.effectiveTo}
            onChange={set('effectiveTo')}
            hint="Leave blank if ongoing"
          />
        </div>
      </div>
    </Modal>
  );
}
