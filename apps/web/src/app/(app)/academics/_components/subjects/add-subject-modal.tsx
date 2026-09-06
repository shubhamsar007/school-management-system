'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useCreateSubject } from '@/lib/hooks/use-academics';

const TYPE_OPTIONS = [
  { label: 'Core',          value: 'CORE'          },
  { label: 'Elective',      value: 'ELECTIVE'      },
  { label: 'Co-Curricular', value: 'CO_CURRICULAR' },
  { label: 'Language',      value: 'LANGUAGE'      },
];

interface FormState {
  name: string;
  code: string;
  subjectType: string;
  description: string;
}

const EMPTY: FormState = { name: '', code: '', subjectType: '', description: '' };

interface Errors { name?: string; code?: string; subjectType?: string }

interface AddSubjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddSubjectModal({ open, onClose }: AddSubjectModalProps) {
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const create = useCreateSubject();

  React.useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}); }
  }, [open]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Subject name is required';
    if (!form.code.trim()) errs.code = 'Subject code is required';
    if (!form.subjectType) errs.subjectType = 'Subject type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        subjectType: form.subjectType,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      toast.success(`Subject "${form.name}" created successfully.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to create subject.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Subject"
      description="Create a new subject in the subject master."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create Subject'}
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
            hint="Unique per organisation"
            {...(errors.code ? { error: errors.code } : {})}
          />
          <Select
            label="Subject Type"
            required
            value={form.subjectType}
            onChange={set('subjectType')}
            options={TYPE_OPTIONS}
            placeholder="Select type"
            {...(errors.subjectType ? { error: errors.subjectType } : {})}
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
