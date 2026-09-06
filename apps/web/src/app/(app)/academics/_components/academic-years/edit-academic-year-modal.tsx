'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useUpdateAcademicYear } from '@/lib/hooks/use-academic-years';
import { useOrganization } from '@/lib/hooks/use-academics';
import type { AcademicYear } from '@/lib/types/academics';

const STATUS_OPTIONS = [
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Active',   value: 'ACTIVE'   },
  { label: 'Completed', value: 'COMPLETED' },
];

interface FormState {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Errors { name?: string; code?: string; startDate?: string; endDate?: string }

interface EditAcademicYearModalProps {
  open: boolean;
  onClose: () => void;
  year: AcademicYear;
}

function toDateInput(iso: string) {
  // Accepts ISO string or date-only string → returns YYYY-MM-DD
  return iso ? iso.substring(0, 10) : '';
}

export function EditAcademicYearModal({ open, onClose, year }: EditAcademicYearModalProps) {
  const { data: org } = useOrganization();
  const update = useUpdateAcademicYear(org?.id);
  const toast = useToast();

  const [form, setForm] = React.useState<FormState>({
    name: year.name,
    code: year.code,
    startDate: toDateInput(year.startDate),
    endDate: toDateInput(year.endDate),
    status: year.status,
  });
  const [errors, setErrors] = React.useState<Errors>({});

  React.useEffect(() => {
    if (open) {
      setForm({
        name: year.name,
        code: year.code,
        startDate: toDateInput(year.startDate),
        endDate: toDateInput(year.endDate),
        status: year.status,
      });
      setErrors({});
    }
  }, [open, year]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      errs.endDate = 'End date must be after start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await update.mutateAsync({
        yearId: year.id,
        dto: {
          name: form.name.trim(),
          code: form.code.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        },
      });
      toast.success(`"${form.name}" updated.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to update academic year.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Academic Year"
      description={`Update details for ${year.name}.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={update.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Academic Year Name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. 2027–28"
          {...(errors.name ? { error: errors.name } : {})}
        />
        <Input
          label="Code"
          required
          value={form.code}
          onChange={set('code')}
          placeholder="e.g. AY2027-28"
          hint="Unique identifier"
          {...(errors.code ? { error: errors.code } : {})}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            required
            type="date"
            value={form.startDate}
            onChange={set('startDate')}
            {...(errors.startDate ? { error: errors.startDate } : {})}
          />
          <Input
            label="End Date"
            required
            type="date"
            value={form.endDate}
            onChange={set('endDate')}
            {...(errors.endDate ? { error: errors.endDate } : {})}
          />
        </div>
        <Select
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={STATUS_OPTIONS}
        />
        {year.isCurrent && (
          <div
            style={{
              padding: '8px 12px',
              background: '#d8e9de',
              borderRadius: 8,
              fontSize: 12,
              color: '#33604a',
              fontWeight: 500,
            }}
          >
            This is the current academic year. To change it, use "Set as Current" on another year.
          </div>
        )}
      </div>
    </Modal>
  );
}
