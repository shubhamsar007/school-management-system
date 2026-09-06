'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useUpdateSection } from '@/lib/hooks/use-academics';
import type { Section } from '@/lib/types/academics';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

interface FormState {
  name: string;
  code: string;
  capacity: string;
  status: string;
}

interface Errors { name?: string; code?: string }

interface EditSectionModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  section: Section;
}

export function EditSectionModal({ open, onClose, classId, section }: EditSectionModalProps) {
  const [form, setForm] = React.useState<FormState>({
    name: section.name,
    code: section.code,
    capacity: section.capacity != null ? String(section.capacity) : '',
    status: section.status,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const update = useUpdateSection();

  React.useEffect(() => {
    if (open) {
      setForm({
        name: section.name,
        code: section.code,
        capacity: section.capacity != null ? String(section.capacity) : '',
        status: section.status,
      });
      setErrors({});
    }
  }, [open, section]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Section name is required';
    if (!form.code.trim()) errs.code = 'Section code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await update.mutateAsync({
        classId,
        sectionId: section.id,
        dto: {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
          status: form.status,
        },
      });
      toast.success(`Section "${form.name}" updated.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to update section.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Section"
      description={`Update details for ${section.name}.`}
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
        <div
          style={{
            padding: '8px 12px',
            background: '#f8f6f0',
            borderRadius: 8,
            fontSize: 12,
            color: '#6b7480',
          }}
        >
          Campus: <strong style={{ color: '#2c322f' }}>{section.campus?.name ?? '—'}</strong>
          <span style={{ margin: '0 8px', color: '#d0ccc5' }}>·</span>
          Class code: <strong style={{ color: '#2c322f', fontFamily: 'monospace' }}>{section.code}</strong>
        </div>
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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={set('capacity')}
            placeholder="e.g. 40"
          />
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>
    </Modal>
  );
}
