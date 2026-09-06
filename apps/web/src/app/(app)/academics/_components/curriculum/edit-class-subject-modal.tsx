'use client';

import * as React from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { SubjectTypeBadge } from '@/components/ui/subject-type-badge';
import { useToast } from '@/components/ui/toast';
import { useUpdateClassSubject } from '@/lib/hooks/use-academics';
import type { ClassSubject } from '@/lib/types/academics';

interface FormState {
  isOptional: boolean;
  maxMarks: string;
  passingMarks: string;
  weightage: string;
}

interface EditClassSubjectModalProps {
  open: boolean;
  onClose: () => void;
  assignment: ClassSubject;
}

export function EditClassSubjectModal({ open, onClose, assignment }: EditClassSubjectModalProps) {
  const toast = useToast();
  const update = useUpdateClassSubject();

  const [form, setForm] = React.useState<FormState>({
    isOptional: assignment.isOptional,
    maxMarks: assignment.maxMarks != null ? String(assignment.maxMarks) : '',
    passingMarks: assignment.passingMarks != null ? String(assignment.passingMarks) : '',
    weightage: assignment.weightage != null ? String(assignment.weightage) : '',
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        isOptional: assignment.isOptional,
        maxMarks: assignment.maxMarks != null ? String(assignment.maxMarks) : '',
        passingMarks: assignment.passingMarks != null ? String(assignment.passingMarks) : '',
        weightage: assignment.weightage != null ? String(assignment.weightage) : '',
      });
    }
  }, [open, assignment]);

  const setN = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit() {
    try {
      await update.mutateAsync({
        id: assignment.id,
        dto: {
          isOptional: form.isOptional,
          maxMarks: form.maxMarks ? parseFloat(form.maxMarks) : null,
          passingMarks: form.passingMarks ? parseFloat(form.passingMarks) : null,
          weightage: form.weightage ? parseFloat(form.weightage) : null,
        },
      });
      toast.success(`"${assignment.subject?.name}" configuration updated.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to update configuration.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Subject Configuration"
      description={`Marks and weightage for ${assignment.class?.name ?? 'this class'}.`}
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
        {/* Subject info — read-only */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: '#f8f6f0',
            borderRadius: 8,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#14181c', margin: 0 }}>
              {assignment.subject?.name}
            </p>
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#8a929b', margin: '2px 0 0' }}>
              {assignment.subject?.code}
            </p>
          </div>
          {assignment.subject && <SubjectTypeBadge type={assignment.subject.subjectType} />}
        </div>

        {/* Optional toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isOptional}
            onChange={(e) => setForm((f) => ({ ...f, isOptional: e.target.checked }))}
            style={{ accentColor: '#5d7f6b', width: 15, height: 15 }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#14181c', margin: 0 }}>
              Optional / Elective
            </p>
            <p style={{ fontSize: 11, color: '#8a929b', margin: '2px 0 0' }}>
              Students can choose whether to take this subject
            </p>
          </div>
        </label>

        {/* Marks */}
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Max Marks"
            type="number"
            value={form.maxMarks}
            onChange={setN('maxMarks')}
            placeholder="e.g. 100"
          />
          <Input
            label="Pass Marks"
            type="number"
            value={form.passingMarks}
            onChange={setN('passingMarks')}
            placeholder="e.g. 33"
          />
          <Input
            label="Weightage %"
            type="number"
            value={form.weightage}
            onChange={setN('weightage')}
            placeholder="e.g. 20"
          />
        </div>

        {/* Derived hint */}
        {form.maxMarks && form.passingMarks && (
          <p style={{ fontSize: 11, color: '#8a929b' }}>
            Pass percentage:{' '}
            <strong style={{ color: '#2c322f' }}>
              {Math.round((parseFloat(form.passingMarks) / parseFloat(form.maxMarks)) * 100)}%
            </strong>
          </p>
        )}
      </div>
    </Modal>
  );
}
