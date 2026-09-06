'use client';

import * as React from 'react';
import { Modal, Select, Input, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useAssignSubject, useSubjects, useClassSubjects } from '@/lib/hooks/use-academics';
import type { AcademicClass } from '@/lib/types/academics';

interface FormState {
  subjectId: string;
  isOptional: boolean;
  maxMarks: string;
  passingMarks: string;
  weightage: string;
}

const EMPTY: FormState = {
  subjectId: '',
  isOptional: false,
  maxMarks: '',
  passingMarks: '',
  weightage: '',
};

interface Errors { subjectId?: string }

interface AssignSubjectModalProps {
  open: boolean;
  onClose: () => void;
  cls: AcademicClass;
  yearId: string;
  yearName: string;
}

export function AssignSubjectModal({
  open,
  onClose,
  cls,
  yearId,
  yearName,
}: AssignSubjectModalProps) {
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();

  const assign = useAssignSubject();
  const { data: allSubjects = [] } = useSubjects();
  const { data: assigned = [] } = useClassSubjects(cls.id, yearId);

  // Only show subjects not already assigned to this class for this year
  const assignedSubjectIds = new Set(assigned.map((a) => a.subjectId));
  const availableSubjects = allSubjects.filter(
    (s) => s.status === 'ACTIVE' && !assignedSubjectIds.has(s.id),
  );

  React.useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}); }
  }, [open]);

  const setN = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.subjectId) errs.subjectId = 'Please select a subject';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      await assign.mutateAsync({
        academicYearId: yearId,
        classId: cls.id,
        subjectId: form.subjectId,
        isOptional: form.isOptional,
        ...(form.maxMarks ? { maxMarks: parseFloat(form.maxMarks) } : {}),
        ...(form.passingMarks ? { passingMarks: parseFloat(form.passingMarks) } : {}),
        ...(form.weightage ? { weightage: parseFloat(form.weightage) } : {}),
      });
      const subjectName = availableSubjects.find((s) => s.id === form.subjectId)?.name ?? 'Subject';
      toast.success(`"${subjectName}" assigned to ${cls.name}.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to assign subject.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Subject"
      description={`Add a subject to ${cls.name} for ${yearName}.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={assign.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={assign.isPending}>
            {assign.isPending ? 'Assigning…' : 'Assign Subject'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Context pill */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '7px 12px',
            background: '#f8f6f0',
            borderRadius: 8,
            fontSize: 12,
            color: '#6b7480',
          }}
        >
          <span>Class: <strong style={{ color: '#14181c' }}>{cls.name}</strong></span>
          <span style={{ color: '#d0ccc5' }}>·</span>
          <span>Year: <strong style={{ color: '#14181c' }}>{yearName}</strong></span>
        </div>

        <Select
          label="Subject"
          required
          value={form.subjectId}
          onChange={setN('subjectId')}
          options={availableSubjects.map((s) => ({
            label: `${s.name} (${s.code}) — ${s.subjectType.replace('_', ' ')}`,
            value: s.id,
          }))}
          placeholder={
            availableSubjects.length === 0
              ? 'All subjects already assigned'
              : 'Select a subject'
          }
          {...(errors.subjectId ? { error: errors.subjectId } : {})}
        />

        {/* Optional toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isOptional}
            onChange={(e) => setForm((f) => ({ ...f, isOptional: e.target.checked }))}
            style={{ accentColor: '#5d7f6b', width: 15, height: 15 }}
          />
          <span style={{ fontSize: 13, color: '#2c322f' }}>Optional / Elective subject</span>
        </label>

        {/* Marks configuration */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Marks Configuration
          </p>
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
          <p style={{ fontSize: 11, color: '#c5c0b6', marginTop: 6 }}>
            All fields optional — can be configured later.
          </p>
        </div>
      </div>
    </Modal>
  );
}
