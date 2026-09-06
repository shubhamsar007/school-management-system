'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useUpdateSubject } from '@/lib/hooks/use-academics';
import type { Subject } from '@/lib/types/academics';

const TYPE_OPTIONS = [
  { label: 'Core',          value: 'CORE'          },
  { label: 'Elective',      value: 'ELECTIVE'      },
  { label: 'Co-Curricular', value: 'CO_CURRICULAR' },
  { label: 'Language',      value: 'LANGUAGE'      },
];

const STATUS_OPTIONS = [
  { label: 'Active',   value: 'ACTIVE'   },
  { label: 'Inactive', value: 'INACTIVE' },
];

interface FormState {
  name: string;
  code: string;
  subjectType: string;
  description: string;
  status: string;
}

interface Errors { name?: string; code?: string }

interface EditSubjectModalProps {
  open: boolean;
  onClose: () => void;
  subject: Subject;
}

export function EditSubjectModal({ open, onClose, subject }: EditSubjectModalProps) {
  const [form, setForm] = React.useState<FormState>({
    name: subject.name,
    code: subject.code,
    subjectType: subject.subjectType,
    description: subject.description ?? '',
    status: subject.status,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const update = useUpdateSubject();

  React.useEffect(() => {
    if (open) {
      setForm({
        name: subject.name,
        code: subject.code,
        subjectType: subject.subjectType,
        description: subject.description ?? '',
        status: subject.status,
      });
      setErrors({});
    }
  }, [open, subject]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Subject name is required';
    if (!form.code.trim()) errs.code = 'Subject code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await update.mutateAsync({
        id: subject.id,
        dto: {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          subjectType: form.subjectType,
          description: form.description.trim() || null,
          status: form.status,
        },
      });
      toast.success(`Subject "${form.name}" updated.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to update subject.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Subject"
      description={`Update details for ${subject.name}.`}
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
          label="Subject Name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Mathematics"
          {...(errors.name ? { error: errors.name } : {})}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Subject Code"
            required
            value={form.code}
            onChange={set('code')}
            placeholder="e.g. MATH-01"
            {...(errors.code ? { error: errors.code } : {})}
          />
          <Select
            label="Subject Type"
            value={form.subjectType}
            onChange={set('subjectType')}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            options={STATUS_OPTIONS}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#4a5260', display: 'block', marginBottom: 4 }}>
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set('description')}
            placeholder="Optional description"
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid #ddd',
              borderRadius: 8,
              resize: 'vertical',
              outline: 'none',
              color: '#2c322f',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
