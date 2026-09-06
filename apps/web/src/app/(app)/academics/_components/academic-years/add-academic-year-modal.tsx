'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { StepWizard, type WizardStep } from '@/components/ui/step-wizard';
import { useToast } from '@/components/ui/toast';
import { useCreateAcademicYear, useCopyAcademicYear } from '@/lib/hooks/use-academic-years';
import { useOrganization, useAcademicYears } from '@/lib/hooks/use-academics';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: WizardStep[] = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'copy',  label: 'Copy From'  },
  { id: 'review', label: 'Review'    },
];

const STATUS_OPTIONS = [
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Active',   value: 'ACTIVE'   },
];

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function CheckRow({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #e6e8eb',
        background: checked ? '#f4faf5' : '#fff',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ marginTop: 2, accentColor: '#5d7f6b', width: 15, height: 15 }}
      />
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#14181c', margin: 0 }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: '#8a929b', margin: '2px 0 0' }}>{hint}</p>}
      </div>
    </label>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-[#f2f4f6]">
      <span style={{ width: 160, flexShrink: 0, fontSize: 12, color: '#8a929b' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#14181c', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
}

interface CopyState {
  sourceYearId: string;
  copyCurriculum: boolean;
  copyTeacherAssignments: boolean;
}

interface Errors { name?: string; code?: string; startDate?: string; endDate?: string }

const EMPTY_FORM: FormState = {
  name: '', code: '', startDate: '', endDate: '', status: 'UPCOMING', isCurrent: false,
};

const EMPTY_COPY: CopyState = {
  sourceYearId: '', copyCurriculum: true, copyTeacherAssignments: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AddAcademicYearModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddAcademicYearModal({ open, onClose }: AddAcademicYearModalProps) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [copy, setCopy] = React.useState<CopyState>(EMPTY_COPY);
  const [errors, setErrors] = React.useState<Errors>({});
  const [createdYearId, setCreatedYearId] = React.useState<string | null>(null);

  const toast = useToast();
  const { data: org } = useOrganization();
  const { data: years = [] } = useAcademicYears(org?.id);
  const create = useCreateAcademicYear(org?.id);
  const copyYear = useCopyAcademicYear(org?.id);

  React.useEffect(() => {
    if (open) {
      setStep(0);
      setForm(EMPTY_FORM);
      setCopy(EMPTY_COPY);
      setErrors({});
      setCreatedYearId(null);
    }
  }, [open]);

  const setF = (field: keyof FormState) =>
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

  async function handleNext() {
    if (step === 0) {
      if (!validate()) return;
      // Create the year right away on step 0 confirm so copy step has a target yearId
      try {
        const result = await create.mutateAsync({
          name: form.name.trim(),
          code: form.code.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
          ...(form.isCurrent ? { isCurrent: true } : {}),
        }) as { id: string };
        setCreatedYearId(result.id);
        setStep(1);
      } catch (e: unknown) {
        toast.error((e as { message?: string })?.message ?? 'Failed to create academic year.');
      }
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
  }

  async function handleFinish() {
    // If no source year selected, just close
    if (!copy.sourceYearId || !createdYearId) {
      toast.success(`Academic year "${form.name}" created.`);
      onClose();
      return;
    }

    try {
      const result = await copyYear.mutateAsync({
        targetYearId: createdYearId,
        dto: {
          sourceYearId: copy.sourceYearId,
          copyCurriculum: copy.copyCurriculum,
          copyTeacherAssignments: copy.copyTeacherAssignments,
        },
      });
      const parts: string[] = [];
      if (result.curriculumCopied > 0) parts.push(`${result.curriculumCopied} curriculum assignments`);
      if (result.assignmentsCopied > 0) parts.push(`${result.assignmentsCopied} teacher assignments`);
      const msg = parts.length
        ? `"${form.name}" created. Copied: ${parts.join(', ')}.`
        : `"${form.name}" created.`;
      toast.success(msg);
    } catch (e: unknown) {
      // Year was already created — warn but don't block
      toast.error(`Year created, but copy failed: ${(e as { message?: string })?.message ?? 'Unknown error'}`);
    }
    onClose();
  }

  const yearOptions = years.map((y) => ({ label: `${y.name} (${y.status})`, value: y.id }));
  const sourceYearName = years.find((y) => y.id === copy.sourceYearId)?.name;
  const isCreating = create.isPending;
  const isCopying = copyYear.isPending;

  const footer = (
    <>
      {step > 0 && step < 2 && (
        <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={isCreating || isCopying}>
          Back
        </Button>
      )}
      <Button variant="ghost" onClick={onClose} disabled={isCreating || isCopying}>
        Cancel
      </Button>
      {step < 2 ? (
        <Button variant="primary" onClick={handleNext} disabled={isCreating}>
          {isCreating ? 'Creating…' : step === 1 ? 'Review' : 'Continue'}
        </Button>
      ) : (
        <Button variant="primary" onClick={handleFinish} disabled={isCopying}>
          {isCopying ? 'Copying…' : copy.sourceYearId ? 'Create & Copy' : 'Done'}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Academic Year"
      description="Set up a new academic year for your organisation."
      size="md"
      footer={footer}
    >
      <div style={{ marginBottom: 28 }}>
        <StepWizard steps={STEPS} currentStep={step} />
      </div>

      {/* ── Step 0: Basic Info ── */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <Input
            label="Academic Year Name"
            required
            value={form.name}
            onChange={setF('name')}
            placeholder="e.g. 2027–28"
            {...(errors.name ? { error: errors.name } : {})}
          />
          <Input
            label="Code"
            required
            value={form.code}
            onChange={setF('code')}
            placeholder="e.g. AY2027-28"
            hint="Unique code for this year"
            {...(errors.code ? { error: errors.code } : {})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              required
              type="date"
              value={form.startDate}
              onChange={setF('startDate')}
              {...(errors.startDate ? { error: errors.startDate } : {})}
            />
            <Input
              label="End Date"
              required
              type="date"
              value={form.endDate}
              onChange={setF('endDate')}
              {...(errors.endDate ? { error: errors.endDate } : {})}
            />
          </div>
          <Select
            label="Initial Status"
            value={form.status}
            onChange={setF('status')}
            options={STATUS_OPTIONS}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked }))}
              style={{ accentColor: '#5d7f6b', width: 15, height: 15 }}
            />
            <span style={{ fontSize: 13, color: '#2c322f' }}>
              Set as current academic year
            </span>
          </label>
        </div>
      )}

      {/* ── Step 1: Copy From ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <Select
            label="Copy structure from"
            value={copy.sourceYearId}
            onChange={(e) => setCopy((c) => ({ ...c, sourceYearId: e.target.value }))}
            options={[{ label: 'None — start fresh', value: '' }, ...yearOptions]}
            hint="Optionally copy curriculum and assignments from an existing year"
          />

          {copy.sourceYearId && (
            <div className="flex flex-col gap-2">
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                What to copy
              </p>
              <CheckRow
                checked={copy.copyCurriculum}
                onChange={(v) => setCopy((c) => ({ ...c, copyCurriculum: v }))}
                label="Curriculum"
                hint="Class-subject assignments, max marks, passing marks, weightage"
              />
              <CheckRow
                checked={copy.copyTeacherAssignments}
                onChange={(v) => setCopy((c) => ({ ...c, copyTeacherAssignments: v }))}
                label="Teacher Assignments"
                hint="Who teaches which subject in which class — dates reset to new year"
              />
            </div>
          )}

          {!copy.sourceYearId && (
            <div style={{ padding: '16px 0 8px', color: '#8a929b', fontSize: 13 }}>
              No source year selected — the new year will start with an empty structure.
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            New Academic Year
          </p>
          <ReviewRow label="Name"        value={form.name} />
          <ReviewRow label="Code"        value={form.code} />
          <ReviewRow label="Start Date"  value={form.startDate} />
          <ReviewRow label="End Date"    value={form.endDate} />
          <ReviewRow label="Status"      value={form.status} />
          <ReviewRow label="Set Current" value={form.isCurrent ? 'Yes' : 'No'} />

          {copy.sourceYearId && (
            <>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 20, marginBottom: 8 }}>
                Copy From
              </p>
              <ReviewRow label="Source Year"           value={sourceYearName ?? ''} />
              <ReviewRow label="Curriculum"            value={copy.copyCurriculum ? 'Yes' : 'No'} />
              <ReviewRow label="Teacher Assignments"   value={copy.copyTeacherAssignments ? 'Yes' : 'No'} />
            </>
          )}

          {!copy.sourceYearId && (
            <p style={{ fontSize: 13, color: '#8a929b', marginTop: 12 }}>
              No structure will be copied. Start fresh.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
