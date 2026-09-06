'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useCreateClass } from '@/lib/hooks/use-academics';

interface FormState {
  name: string;
  code: string;
  level: string;
  displayOrder: string;
}

const EMPTY: FormState = { name: '', code: '', level: '', displayOrder: '' };

interface Errors { name?: string; code?: string }

interface AddClassModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddClassModal({ open, onClose }: AddClassModalProps) {
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const create = useCreateClass();

  React.useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}); }
  }, [open]);

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
      await create.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        ...(form.level ? { level: parseInt(form.level, 10) } : {}),
        ...(form.displayOrder ? { displayOrder: parseInt(form.displayOrder, 10) } : {}),
      });
      toast.success(`Class "${form.name}" created successfully.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to create class.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Class"
      description="Create a new academic class or grade."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create Class'}
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
          hint="Unique identifier for this class"
          {...(errors.code ? { error: errors.code } : {})}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Level"
            type="number"
            value={form.level}
            onChange={set('level')}
            placeholder="e.g. 1"
            hint="Numeric level for ordering"
          />
          <Input
            label="Display Order"
            type="number"
            value={form.displayOrder}
            onChange={set('displayOrder')}
            placeholder="e.g. 1"
          />
        </div>
      </div>
    </Modal>
  );
}
