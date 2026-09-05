'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  useCreatePeriod,
  useUpdatePeriod,
  type TimetablePeriod,
} from '@/lib/hooks/use-timetable';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_TYPE_OPTIONS = [
  { label: 'Class', value: 'CLASS' },
  { label: 'Break', value: 'BREAK' },
  { label: 'Lunch', value: 'LUNCH' },
  { label: 'Assembly', value: 'ASSEMBLY' },
  { label: 'Activity', value: 'ACTIVITY' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  periodNumber: string;
  startTime: string;
  endTime: string;
  periodType: string;
}

interface Errors {
  name?: string;
  periodNumber?: string;
  startTime?: string;
  endTime?: string;
  periodType?: string;
}

const EMPTY: FormState = {
  name: '',
  periodNumber: '',
  startTime: '',
  endTime: '',
  periodType: 'CLASS',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract "HH:MM" from a time value that may be ISO or "HH:MM:SS". */
function toTimeInput(t: string): string {
  const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
  return timePart.substring(0, 5); // "HH:MM"
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PeriodModalProps {
  open: boolean;
  onClose: () => void;
  campusId: string;
  /** Pass an existing period to enter edit mode. */
  period?: TimetablePeriod;
}

export function PeriodModal({ open, onClose, campusId, period }: PeriodModalProps) {
  const isEdit = !!period;
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const create = useCreatePeriod();
  const update = useUpdatePeriod();

  // Populate form on open
  React.useEffect(() => {
    if (open) {
      if (period) {
        setForm({
          name: period.name,
          periodNumber: String(period.periodNumber),
          startTime: toTimeInput(period.startTime),
          endTime: toTimeInput(period.endTime),
          periodType: period.periodType,
        });
      } else {
        setForm(EMPTY);
      }
      setErrors({});
    }
  }, [open, period]);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Period name is required';
    if (!form.periodNumber || isNaN(Number(form.periodNumber)) || Number(form.periodNumber) < 1)
      errs.periodNumber = 'Enter a valid period number (min 1)';
    if (!form.startTime) errs.startTime = 'Start time is required';
    if (!form.endTime) errs.endTime = 'End time is required';
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      errs.endTime = 'End time must be after start time';
    if (!form.periodType) errs.periodType = 'Period type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      if (isEdit && period) {
        await update.mutateAsync({
          id: period.id,
          campusId,
          dto: {
            name: form.name.trim(),
            periodNumber: parseInt(form.periodNumber, 10),
            startTime: form.startTime,
            endTime: form.endTime,
            periodType: form.periodType,
          },
        });
        toast.success(`Period "${form.name}" updated.`);
      } else {
        await create.mutateAsync({
          campusId,
          name: form.name.trim(),
          periodNumber: parseInt(form.periodNumber, 10),
          startTime: form.startTime,
          endTime: form.endTime,
          periodType: form.periodType,
        });
        toast.success(`Period "${form.name}" created.`);
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? `Failed to ${isEdit ? 'update' : 'create'} period.`);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Period' : 'Add Period'}
      description={isEdit ? 'Update period details.' : 'Define a new period slot for this campus.'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Period'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Period Name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Period 1"
          {...(errors.name ? { error: errors.name } : {})}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Period Number"
            required
            type="number"
            min={1}
            value={form.periodNumber}
            onChange={set('periodNumber')}
            placeholder="e.g. 1"
            hint="Used for ordering in the grid"
            {...(errors.periodNumber ? { error: errors.periodNumber } : {})}
          />
          <Select
            label="Period Type"
            required
            value={form.periodType}
            onChange={set('periodType')}
            options={PERIOD_TYPE_OPTIONS}
            {...(errors.periodType ? { error: errors.periodType } : {})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            required
            type="time"
            value={form.startTime}
            onChange={set('startTime')}
            {...(errors.startTime ? { error: errors.startTime } : {})}
          />
          <Input
            label="End Time"
            required
            type="time"
            value={form.endTime}
            onChange={set('endTime')}
            {...(errors.endTime ? { error: errors.endTime } : {})}
          />
        </div>
      </div>
    </Modal>
  );
}
