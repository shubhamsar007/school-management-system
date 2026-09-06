'use client';

import * as React from 'react';
import { Modal, Button, Select } from '@/components/ui';
import { StepWizard, type WizardStep } from '@/components/ui/step-wizard';
import { useToast } from '@/components/ui/toast';
import {
  usePromotionRuns,
  useCreatePromotionRun,
  useUpdatePromotionResults,
  useFinalizePromotionRun,
  useDeletePromotionRun,
  useClasses,
  useOrganization,
  useAcademicYears,
} from '@/lib/hooks/use-academics';
import type { PromotionRun, PromotionResult, PromotionOutcome } from '@/lib/types/academics';

// ─── Constants ────────────────────────────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = [
  { id: 'setup',   label: 'Setup'   },
  { id: 'review',  label: 'Review'  },
  { id: 'confirm', label: 'Confirm' },
];

const OUTCOME_CONFIG: Record<PromotionOutcome, { label: string; bg: string; color: string; border: string }> = {
  PROMOTED:    { label: 'Promoted',    bg: '#eef5f1', color: '#33604a', border: '#9bbdaa' },
  HELD_BACK:   { label: 'Held Back',   bg: '#fef9ee', color: '#92400e', border: '#fcd34d' },
  TRANSFERRED: { label: 'Transferred', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function studentFullName(result: PromotionResult): string {
  const p = result.student?.person;
  if (!p) return result.student?.admissionNumber ?? '—';
  return `${p.firstName} ${p.lastName}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Outcome badge ────────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: PromotionOutcome }) {
  const cfg = OUTCOME_CONFIG[outcome];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 10,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isFinalized = status === 'FINALIZED';
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 10,
        background: isFinalized ? '#eef5f1' : '#f8f9fa',
        color: isFinalized ? '#33604a' : '#6b7480',
        border: `1px solid ${isFinalized ? '#9bbdaa' : '#e6e8eb'}`,
      }}
    >
      {isFinalized ? 'Finalized' : 'Draft'}
    </span>
  );
}

// ─── Summary stat pill ────────────────────────────────────────────────────────

function StatPill({
  count,
  label,
  outcome,
}: {
  count: number;
  label: string;
  outcome: PromotionOutcome;
}) {
  const cfg = OUTCOME_CONFIG[outcome];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 10,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
      }}
    >
      <span style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{count}</span>
      <span style={{ fontSize: 12, color: cfg.color, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── New Promotion Wizard ─────────────────────────────────────────────────────

interface NewPromotionWizardProps {
  open: boolean;
  onClose: () => void;
  defaultYearId: string;
}

function NewPromotionWizard({ open, onClose, defaultYearId }: NewPromotionWizardProps) {
  const [step, setStep] = React.useState(0);
  const [createdRun, setCreatedRun] = React.useState<PromotionRun | null>(null);

  // Local outcome overrides for step 2: studentId → outcome/notes
  const [localOutcomes, setLocalOutcomes] = React.useState<
    Record<string, { outcome: PromotionOutcome; notes: string }>
  >({});

  const [form, setForm] = React.useState({
    fromYearId: defaultYearId,
    toYearId: '',
    fromClassId: '',
    toClassId: '',
    notes: '',
  });

  const toast = useToast();
  const { data: org } = useOrganization();
  const { data: years = [] } = useAcademicYears(org?.id);
  const { data: classes = [] } = useClasses();
  const create = useCreatePromotionRun();
  const updateResults = useUpdatePromotionResults();
  const finalize = useFinalizePromotionRun();

  const yearOptions = years.map((y) => ({ label: `${y.name} (${y.status})`, value: y.id }));
  const classOptions = classes.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }));

  React.useEffect(() => {
    if (open) {
      setStep(0);
      setCreatedRun(null);
      setLocalOutcomes({});
      setForm({
        fromYearId: defaultYearId,
        toYearId: '',
        fromClassId: '',
        toClassId: '',
        notes: '',
      });
    }
  }, [open, defaultYearId]);

  // Initialise localOutcomes whenever createdRun changes (after step 1)
  React.useEffect(() => {
    if (createdRun?.results) {
      const init: Record<string, { outcome: PromotionOutcome; notes: string }> = {};
      for (const r of createdRun.results) {
        init[r.studentId] = { outcome: r.outcome, notes: r.notes ?? '' };
      }
      setLocalOutcomes(init);
    }
  }, [createdRun]);

  const setF =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  // Step 0 → create run
  async function handleSetupNext() {
    if (!form.fromYearId || !form.toYearId || !form.fromClassId || !form.toClassId) {
      toast.error('Please fill in all fields.');
      return;
    }
    try {
      const run = await create.mutateAsync({
        fromYearId: form.fromYearId,
        toYearId: form.toYearId,
        fromClassId: form.fromClassId,
        toClassId: form.toClassId,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      setCreatedRun(run as PromotionRun);
      setStep(1);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to create promotion run.');
    }
  }

  // Step 1 → save outcomes
  async function handleReviewNext() {
    if (!createdRun) return;
    const results = Object.entries(localOutcomes).map(([studentId, { outcome, notes }]) => ({
      studentId,
      outcome,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    }));
    try {
      const updated = await updateResults.mutateAsync({ id: createdRun.id, results });
      setCreatedRun(updated as PromotionRun);
      setStep(2);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to save outcomes.');
    }
  }

  // Step 2 → finalize
  async function handleFinalize() {
    if (!createdRun) return;
    try {
      const result = await finalize.mutateAsync(createdRun.id);
      toast.success(
        `Promotion finalized — ${result.promoted} promoted, ${result.heldBack} held back, ${result.transferred} transferred.`,
      );
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to finalize promotion.');
    }
  }

  // Computed summary for step 2
  const outcomeCounts = React.useMemo(() => {
    const counts = { PROMOTED: 0, HELD_BACK: 0, TRANSFERRED: 0 };
    for (const { outcome } of Object.values(localOutcomes)) {
      counts[outcome] = (counts[outcome] ?? 0) + 1;
    }
    return counts;
  }, [localOutcomes]);

  const isPending = create.isPending || updateResults.isPending || finalize.isPending;
  const results = createdRun?.results ?? [];

  // Bulk set all outcomes
  function bulkSetOutcome(outcome: PromotionOutcome) {
    setLocalOutcomes((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = { ...next[key]!, outcome };
      }
      return next;
    });
  }

  const footer = (
    <>
      {step > 0 && (
        <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={isPending}>
          Back
        </Button>
      )}
      <Button variant="ghost" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      {step === 0 && (
        <Button variant="primary" onClick={handleSetupNext} disabled={isPending}>
          {create.isPending ? 'Loading students…' : 'Continue'}
        </Button>
      )}
      {step === 1 && (
        <Button variant="primary" onClick={handleReviewNext} disabled={isPending}>
          {updateResults.isPending ? 'Saving…' : 'Review Summary'}
        </Button>
      )}
      {step === 2 && (
        <Button variant="primary" onClick={handleFinalize} disabled={isPending}>
          {finalize.isPending ? 'Finalizing…' : 'Finalize Promotion'}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Promotion Run"
      description="Promote a class of students from one academic year to the next."
      size="lg"
      footer={footer}
    >
      <div style={{ marginBottom: 28 }}>
        <StepWizard steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {/* ── Step 0: Setup ── */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="From Year"
              required
              value={form.fromYearId}
              onChange={setF('fromYearId')}
              options={yearOptions}
              placeholder="Select year"
              hint="Year students are currently in"
            />
            <Select
              label="To Year"
              required
              value={form.toYearId}
              onChange={setF('toYearId')}
              options={yearOptions}
              placeholder="Select year"
              hint="Year students will be promoted into"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="From Class"
              required
              value={form.fromClassId}
              onChange={setF('fromClassId')}
              options={classOptions}
              placeholder="Select class"
              hint="Class students are currently in"
            />
            <Select
              label="To Class"
              required
              value={form.toClassId}
              onChange={setF('toClassId')}
              options={classOptions}
              placeholder="Select class"
              hint="Class students will move into"
            />
          </div>
          <p style={{ fontSize: 12, color: '#8a929b', marginTop: 4 }}>
            All active students enrolled in the selected class and year will be pulled in. Default outcome is <strong>Promoted</strong> — change exceptions in the next step.
          </p>
        </div>
      )}

      {/* ── Step 1: Review students ── */}
      {step === 1 && (
        <div>
          {/* Bulk action bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              padding: '8px 12px',
              background: '#f8f9fa',
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 12, color: '#6b7480', marginRight: 4 }}>Bulk set all:</span>
            {(['PROMOTED', 'HELD_BACK', 'TRANSFERRED'] as PromotionOutcome[]).map((o) => {
              const cfg = OUTCOME_CONFIG[o];
              return (
                <button
                  key={o}
                  onClick={() => bulkSetOutcome(o)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: `1px solid ${cfg.border}`,
                    background: cfg.bg,
                    color: cfg.color,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8a929b' }}>
              {results.length} student{results.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Student table */}
          <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #ecedf0', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Student', 'Adm. No.', 'Outcome', 'Notes'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#8a929b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #ecedf0',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const local = localOutcomes[r.studentId] ?? {
                    outcome: r.outcome,
                    notes: r.notes ?? '',
                  };
                  return (
                    <tr key={r.studentId} style={{ borderBottom: '1px solid #f2f4f6' }}>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#14181c' }}>
                        {studentFullName(r)}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, color: '#8a929b', fontFamily: 'monospace' }}>
                        {r.student?.admissionNumber}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={local.outcome}
                          onChange={(e) =>
                            setLocalOutcomes((prev) => ({
                              ...prev,
                              [r.studentId]: {
                                ...prev[r.studentId]!,
                                outcome: e.target.value as PromotionOutcome,
                              },
                            }))
                          }
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: `1px solid ${OUTCOME_CONFIG[local.outcome].border}`,
                            background: OUTCOME_CONFIG[local.outcome].bg,
                            color: OUTCOME_CONFIG[local.outcome].color,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="PROMOTED">Promoted</option>
                          <option value="HELD_BACK">Held Back</option>
                          <option value="TRANSFERRED">Transferred</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          value={local.notes}
                          onChange={(e) =>
                            setLocalOutcomes((prev) => ({
                              ...prev,
                              [r.studentId]: { ...prev[r.studentId]!, notes: e.target.value },
                            }))
                          }
                          placeholder="Optional note"
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid #e6e8eb',
                            fontSize: 12,
                            color: '#4a5260',
                            outline: 'none',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Step 2: Summary ── */}
      {step === 2 && createdRun && (
        <div>
          {/* Route info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: '#f8f9fa',
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: '#14181c' }}>
              {createdRun.fromClass?.name}
            </span>
            <span style={{ color: '#8a929b' }}>·</span>
            <span style={{ color: '#6b7480' }}>{createdRun.fromYear?.name}</span>
            <span style={{ color: '#c5c0b6', fontSize: 16 }}>→</span>
            <span style={{ fontWeight: 600, color: '#14181c' }}>
              {createdRun.toClass?.name}
            </span>
            <span style={{ color: '#8a929b' }}>·</span>
            <span style={{ color: '#6b7480' }}>{createdRun.toYear?.name}</span>
          </div>

          {/* Outcome summary pills */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatPill count={outcomeCounts.PROMOTED}    label="Promoted"    outcome="PROMOTED"    />
            <StatPill count={outcomeCounts.HELD_BACK}   label="Held Back"   outcome="HELD_BACK"   />
            <StatPill count={outcomeCounts.TRANSFERRED} label="Transferred" outcome="TRANSFERRED" />
          </div>

          <p style={{ fontSize: 13, color: '#6b7480', lineHeight: 1.6 }}>
            Clicking <strong>Finalize Promotion</strong> will stamp each student's current enrollment
            with the outcome you selected. This action cannot be undone.
          </p>
        </div>
      )}
    </Modal>
  );
}

// ─── Run detail modal (view a past run) ──────────────────────────────────────

function RunDetailModal({
  run,
  onClose,
}: {
  run: PromotionRun | null;
  onClose: () => void;
}) {
  if (!run) return null;

  const results = run.results ?? [];
  const counts = { PROMOTED: 0, HELD_BACK: 0, TRANSFERRED: 0 };
  for (const r of results) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;

  return (
    <Modal
      open
      onClose={onClose}
      title="Promotion Run Details"
      description={`${run.fromClass?.name} → ${run.toClass?.name}`}
      size="lg"
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      {/* Route + status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#f8f9fa',
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: '#14181c' }}>{run.fromClass?.name}</span>
          <span style={{ color: '#8a929b' }}>·</span>
          <span style={{ color: '#6b7480' }}>{run.fromYear?.name}</span>
          <span style={{ color: '#c5c0b6', fontSize: 16 }}>→</span>
          <span style={{ fontWeight: 600, color: '#14181c' }}>{run.toClass?.name}</span>
          <span style={{ color: '#8a929b' }}>·</span>
          <span style={{ color: '#6b7480' }}>{run.toYear?.name}</span>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <StatPill count={counts.PROMOTED}    label="Promoted"    outcome="PROMOTED"    />
        <StatPill count={counts.HELD_BACK}   label="Held Back"   outcome="HELD_BACK"   />
        <StatPill count={counts.TRANSFERRED} label="Transferred" outcome="TRANSFERRED" />
      </div>

      {/* Results table */}
      <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid #ecedf0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#f8f9fa' }}>
              {['Student', 'Adm. No.', 'Outcome', 'Notes'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#8a929b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #ecedf0',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.studentId} style={{ borderBottom: '1px solid #f2f4f6' }}>
                <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#14181c' }}>
                  {studentFullName(r)}
                </td>
                <td style={{ padding: '8px 12px', fontSize: 12, color: '#8a929b', fontFamily: 'monospace' }}>
                  {r.student?.admissionNumber}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <OutcomeBadge outcome={r.outcome} />
                </td>
                <td style={{ padding: '8px 12px', fontSize: 12, color: '#6b7480' }}>
                  {r.notes ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteRunConfirm({
  run,
  onClose,
}: {
  run: PromotionRun | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const remove = useDeletePromotionRun();

  if (!run) return null;

  async function handleConfirm() {
    try {
      await remove.mutateAsync(run!.id);
      toast.success('Promotion run deleted.');
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete run.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete Promotion Run"
      description={`Delete the draft promotion run for ${run.fromClass?.name} → ${run.toClass?.name}? This cannot be undone.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={remove.isPending}>
            {remove.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function PromotionTab({ yearId }: { yearId: string }) {
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [viewRun, setViewRun] = React.useState<PromotionRun | null>(null);
  const [deleteRun, setDeleteRun] = React.useState<PromotionRun | null>(null);

  const { data: runs = [], isLoading } = usePromotionRuns(yearId || undefined);

  const totalFinalized = runs.filter((r) => r.status === 'FINALIZED').length;
  const totalDraft = runs.filter((r) => r.status === 'DRAFT').length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#14181c', margin: 0 }}>
            Student Promotion
          </p>
          <p style={{ fontSize: 12, color: '#8a929b', margin: '2px 0 0' }}>
            {runs.length} run{runs.length !== 1 ? 's' : ''} · {totalFinalized} finalized · {totalDraft} draft
          </p>
        </div>
        <Button variant="primary" onClick={() => setWizardOpen(true)}>
          + New Promotion Run
        </Button>
      </div>

      {/* Runs table */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8a929b', fontSize: 13 }}>
          Loading…
        </div>
      ) : runs.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 240,
            gap: 8,
            border: '1px dashed #e6e8eb',
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 32 }}>🎓</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#4a5260', margin: 0 }}>
            No promotion runs yet
          </p>
          <p style={{ fontSize: 13, color: '#8a929b', margin: 0 }}>
            Click "New Promotion Run" to promote a class of students.
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid #e6e8eb', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['From', 'To', 'Students', 'Status', 'Created', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#8a929b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #ecedf0',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  style={{
                    borderBottom: '1px solid #f2f4f6',
                    cursor: 'pointer',
                  }}
                  onClick={() => setViewRun(run)}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#14181c', margin: 0 }}>
                      {run.fromClass?.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#8a929b', margin: '2px 0 0' }}>
                      {run.fromYear?.name}
                    </p>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#14181c', margin: 0 }}>
                      {run.toClass?.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#8a929b', margin: '2px 0 0' }}>
                      {run.toYear?.name}
                    </p>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#4a5260' }}>
                    {run._count?.results ?? 0}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={run.status} />
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#8a929b' }}>
                    {fmtDate(run.createdAt)}
                  </td>
                  <td
                    style={{ padding: '10px 14px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {run.status === 'DRAFT' && (
                      <button
                        onClick={() => setDeleteRun(run)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          border: '1px solid #fecdca',
                          background: '#fff',
                          fontSize: 11,
                          color: '#b42318',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Wizard */}
      <NewPromotionWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        defaultYearId={yearId}
      />

      {/* Detail view */}
      <RunDetailModal run={viewRun} onClose={() => setViewRun(null)} />

      {/* Delete confirm */}
      <DeleteRunConfirm run={deleteRun} onClose={() => setDeleteRun(null)} />
    </div>
  );
}
