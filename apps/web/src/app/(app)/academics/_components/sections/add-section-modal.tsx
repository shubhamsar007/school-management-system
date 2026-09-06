'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useCreateSection, useOrganization, useCampuses } from '@/lib/hooks/use-academics';

interface FormState {
  campusId: string;
  name: string;
  code: string;
  capacity: string;
}

const EMPTY: FormState = { campusId: '', name: '', code: '', capacity: '' };

interface Errors { campusId?: string; name?: string; code?: string }

interface AddSectionModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

export function AddSectionModal({ open, onClose, classId, className }: AddSectionModalProps) {
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const create = useCreateSection();
  const { data: org } = useOrganization();
  const { data: campuses = [], isLoading: campusesLoading } = useCampuses(org?.id);

  React.useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}); }
  }, [open]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.campusId) errs.campusId = 'Campus is required';
    if (!form.name.trim()) errs.name = 'Section name is required';
    if (!form.code.trim()) errs.code = 'Section code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await create.mutateAsync({
        classId,
        dto: {
          campusId: form.campusId,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          ...(form.capacity ? { capacity: parseInt(form.capacity, 10) } : {}),
        },
      });
      toast.success(`Section "${form.name}" added to ${className}.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to add section.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Section"
      description={`Add a new section to ${className}.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add Section'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Campus"
          required
          value={form.campusId}
          onChange={set('campusId')}
          options={campuses.map((c) => ({ label: c.name, value: c.id }))}
          placeholder={campusesLoading ? 'Loading…' : 'Select campus'}
          {...(errors.campusId ? { error: errors.campusId } : {})}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Section Name"
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Section A"
            {...(errors.name ? { error: errors.name } : {})}
          />
          <Input
            label="Section Code"
            required
            value={form.code}
            onChange={set('code')}
            placeholder="e.g. A"
            {...(errors.code ? { error: errors.code } : {})}
          />
        </div>
        <Input
          label="Capacity"
          type="number"
          value={form.capacity}
          onChange={set('capacity')}
          placeholder="e.g. 40"
          hint="Maximum number of students"
        />
      </div>
    </Modal>
  );
}
