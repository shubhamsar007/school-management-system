'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useUpdateClass } from '@/lib/hooks/use-academics';
import type { AcademicClass } from '@/lib/types/academics';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

interface FormState {
  name: string;
  code: string;
  level: string;
  displayOrder: string;
  status: string;
}

interface Errors { name?: string; code?: string }

interface EditClassModalProps {
  open: boolean;
  onClose: () => void;
  cls: AcademicClass;
}

export function EditClassModal({ open, onClose, cls }: EditClassModalProps) {
  const [form, setForm] = React.useState<FormState>({
    name: cls.name,
    code: cls.code,
    level: cls.level != null ? String(cls.level) : '',
    displayOrder: cls.displayOrder != null ? String(cls.displayOrder) : '',
    status: cls.status,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const update = useUpdateClass();

  React.useEffect(() => {
    if (open) {
      setForm({
        name: cls.name,
        code: cls.code,
        level: cls.level != null ? String(cls.level) : '',
        displayOrder: cls.displayOrder != null ? String(cls.displayOrder) : '',
        status: cls.status,
      });
      setErrors({});
    }
  }, [open, cls]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Class name is required';
    if (!form.code.trim()) errs.code = 'Class code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await update.mutateAsync({
        id: cls.id,
        dto: {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          level: form.level ? parseInt(form.level, 10) : null,
          displayOrder: form.displayOrder ? parseInt(form.displayOrder, 10) : null,
          status: form.status,
        },
      });
      toast.success(`Class "${form.name}" updated successfully.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to update class.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Class"
      description={`Update details for ${cls.name}.`}
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
          label="Class Name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Grade 1"
          {...(errors.name ? { error: errors.name } : {})}
        />
        <Input
          label="Class Code"
          required
          value={form.code}
          onChange={set('code')}
          placeholder="e.g. G1"
          {...(errors.code ? { error: errors.code } : {})}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Level"
            type="number"
            value={form.level}
            onChange={set('level')}
            placeholder="e.g. 1"
          />
          <Input
            label="Display Order"
            type="number"
            value={form.displayOrder}
            onChange={set('displayOrder')}
            placeholder="e.g. 1"
          />
        </div>
        <Select
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={STATUS_OPTIONS}
        />
      </div>
    </Modal>
  );
}
