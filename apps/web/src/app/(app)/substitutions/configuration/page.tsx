'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { useGetPolicy, useUpsertPolicy } from '@/lib/substitution-api';
import type { SubstitutionPolicy } from '@/lib/substitution-api';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e6e8eb]" style={{ background: '#fafbfc' }}>
        <p className="text-sm font-semibold text-[#14181c]">{title}</p>
        <p className="text-xs text-[#6b7480] mt-0.5">{description}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-[#f3f4f6] last:border-0">
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-sm font-medium text-[#14181c]">{label}</span>
        {description && <span className="text-xs text-[#6b7480]">{description}</span>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center rounded-full transition-colors"
      style={{ width: 36, height: 20, background: checked ? '#2b5fa8' : '#d1d5db' }}
    >
      <span
        className="inline-block rounded-full bg-white transition-transform"
        style={{ width: 16, height: 16, transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

function NumberInput({ value, onChange, min, max, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-20 rounded-lg border border-[#e6e8eb] px-3 py-1.5 text-sm text-right outline-none focus:border-[#2b5fa8]"
      />
      {unit && <span className="text-xs text-[#6b7480]">{unit}</span>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SubMode = 'MANUAL' | 'AUTO_SUGGEST' | 'AUTO_ASSIGN' | 'HYBRID';

const DEFAULT_POLICY: Omit<SubstitutionPolicy, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'> = {
  mode: 'HYBRID',
  autoAssignThreshold: 85,
  escalateAfterMinutes: 5,
  maxSubsPerDay: 2,
  maxSubsPerWeek: 6,
  fairnessWindowDays: 7,
  notifyTeacher: true,
  notifyParents: false,
  subjectMatchRequired: false,
  weightSubject: 40,
  weightWorkload: 30,
  weightFairness: 20,
  weightDept: 10,
};

export default function ConfigurationPage() {
  const { data: policy, isLoading } = useGetPolicy();
  const upsert = useUpsertPolicy();

  // Local draft state — seeded from API on load
  const [mode, setMode]                         = React.useState<SubMode>(DEFAULT_POLICY.mode);
  const [autoThreshold, setAutoThreshold]       = React.useState(DEFAULT_POLICY.autoAssignThreshold);
  const [escalateAfter, setEscalateAfter]       = React.useState(DEFAULT_POLICY.escalateAfterMinutes);
  const [maxPerDay, setMaxPerDay]               = React.useState(DEFAULT_POLICY.maxSubsPerDay);
  const [maxPerWeek, setMaxPerWeek]             = React.useState(DEFAULT_POLICY.maxSubsPerWeek);
  const [fairnessWindow, setFairnessWindow]     = React.useState(DEFAULT_POLICY.fairnessWindowDays);
  const [notifyTeacher, setNotifyTeacher]       = React.useState(DEFAULT_POLICY.notifyTeacher);
  const [notifyParents, setNotifyParents]       = React.useState(DEFAULT_POLICY.notifyParents);
  const [subjectMatchRequired, setSubjectMatchRequired] = React.useState(DEFAULT_POLICY.subjectMatchRequired);
  const [wSubject, setWSubject]   = React.useState(DEFAULT_POLICY.weightSubject);
  const [wWorkload, setWWorkload] = React.useState(DEFAULT_POLICY.weightWorkload);
  const [wFairness, setWFairness] = React.useState(DEFAULT_POLICY.weightFairness);
  const [wDept, setWDept]         = React.useState(DEFAULT_POLICY.weightDept);
  const [seeded, setSeeded]       = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Seed from API once loaded
  React.useEffect(() => {
    if (policy && !seeded) {
      setMode(policy.mode);
      setAutoThreshold(policy.autoAssignThreshold);
      setEscalateAfter(policy.escalateAfterMinutes);
      setMaxPerDay(policy.maxSubsPerDay);
      setMaxPerWeek(policy.maxSubsPerWeek);
      setFairnessWindow(policy.fairnessWindowDays);
      setNotifyTeacher(policy.notifyTeacher);
      setNotifyParents(policy.notifyParents);
      setSubjectMatchRequired(policy.subjectMatchRequired);
      setWSubject(policy.weightSubject);
      setWWorkload(policy.weightWorkload);
      setWFairness(policy.weightFairness);
      setWDept(policy.weightDept);
      setSeeded(true);
    }
  }, [policy, seeded]);

  const totalWeight = wSubject + wWorkload + wFairness + wDept;

  const handleSave = () => {
    setSaveStatus('saving');
    upsert.mutate(
      {
        mode,
        autoAssignThreshold: autoThreshold,
        escalateAfterMinutes: escalateAfter,
        maxSubsPerDay: maxPerDay,
        maxSubsPerWeek: maxPerWeek,
        fairnessWindowDays: fairnessWindow,
        notifyTeacher,
        notifyParents,
        subjectMatchRequired,
        weightSubject: wSubject,
        weightWorkload: wWorkload,
        weightFairness: wFairness,
        weightDept: wDept,
      },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
        },
        onError: () => {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        },
      },
    );
  };

  const MODE_OPTIONS: { value: SubMode; label: string; desc: string }[] = [
    { value: 'MANUAL',       label: 'Manual',      desc: 'Admin selects and confirms every substitute.' },
    { value: 'AUTO_SUGGEST', label: 'Auto-suggest', desc: 'System ranks candidates; human confirms.' },
    { value: 'AUTO_ASSIGN',  label: 'Auto-assign',  desc: 'System automatically assigns per policy.' },
    { value: 'HYBRID',       label: 'Hybrid',       desc: 'Auto-assign when confidence is high; otherwise require human review.' },
  ];

  const saveLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error — retry' : 'Save Changes';
  const saveBg    = saveStatus === 'saved' ? '#146b41' : saveStatus === 'error' ? '#b3261e' : '#2b5fa8';

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Configuration" subtitle="Substitution policy, scoring weights, and automation rules" />
        <div className="flex items-center justify-center py-24 text-sm text-[#8a929b]">Loading policy…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Configuration"
        subtitle="Substitution policy, scoring weights, and automation rules"
        actions={
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || totalWeight !== 100}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: saveBg }}
          >
            {saveLabel}
          </button>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Substitution Mode */}
        <Section title="Substitution Mode" description="Choose how substitutes are selected and confirmed.">
          <div className="grid grid-cols-2 gap-3">
            {MODE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setMode(o.value)}
                className="flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors"
                style={{
                  borderColor: mode === o.value ? '#2b5fa8' : '#e6e8eb',
                  background: mode === o.value ? '#eff6ff' : 'white',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2"
                    style={{ borderColor: mode === o.value ? '#2b5fa8' : '#d1d5db', background: mode === o.value ? '#2b5fa8' : 'white' }}
                  />
                  <span className="text-sm font-semibold text-[#14181c]">{o.label}</span>
                  {o.value === 'HYBRID' && (
                    <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: '#dcfce7', color: '#146b41' }}>Recommended</span>
                  )}
                </div>
                <p className="text-xs text-[#6b7480] pl-5">{o.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Automation thresholds */}
        {(mode === 'AUTO_ASSIGN' || mode === 'HYBRID') && (
          <Section title="Automation Thresholds" description="When to auto-assign versus require human review.">
            <Field label="Auto-assign threshold score" description="Minimum score (out of 100) for automatic assignment">
              <NumberInput value={autoThreshold} onChange={setAutoThreshold} min={50} max={100} unit="pts" />
            </Field>
            <Field label="Escalate after" description="Minutes without assignment before escalating to coordinator">
              <NumberInput value={escalateAfter} onChange={setEscalateAfter} min={1} max={60} unit="min" />
            </Field>
          </Section>
        )}

        {/* Workload protection */}
        <Section title="Workload Protection" description="Prevent overloading substitute teachers.">
          <Field label="Max substitutions per day" description="A teacher exceeding this is disqualified for further slots that day">
            <NumberInput value={maxPerDay} onChange={setMaxPerDay} min={1} max={10} unit="periods" />
          </Field>
          <Field label="Max substitutions per week" description="Weekly cap across all substitution slots">
            <NumberInput value={maxPerWeek} onChange={setMaxPerWeek} min={1} max={30} unit="periods" />
          </Field>
        </Section>

        {/* Fairness */}
        <Section title="Fairness Settings" description="Keep substitution load distributed across teachers.">
          <Field label="Fairness window" description="Period (in days) used to compare substitution history">
            <NumberInput value={fairnessWindow} onChange={setFairnessWindow} min={1} max={365} unit="days" />
          </Field>
        </Section>

        {/* Scoring weights */}
        <Section title="Scoring Weights" description={`Configure how candidate scores are calculated. Total must equal 100 (currently: ${totalWeight}).`}>
          {totalWeight !== 100 && (
            <div className="rounded-lg border border-[#fde68a] bg-[#fef9c3] px-3 py-2 mb-3 text-xs text-[#8a5a00]">
              Weights must total 100. Current total: {totalWeight}. Save is disabled until corrected.
            </div>
          )}

          {[
            { label: 'Subject Proficiency', desc: 'Has the teacher taught this subject before?', value: wSubject, set: setWSubject, color: '#3b82f6' },
            { label: 'Workload Balance', desc: 'Fewer periods assigned today = higher score', value: wWorkload, set: setWWorkload, color: '#10b981' },
            { label: 'Fairness', desc: 'Fewer past substitutions this year = higher score', value: wFairness, set: setWFairness, color: '#f59e0b' },
            { label: 'Department Affinity', desc: 'Same department as absent teacher', value: wDept, set: setWDept, color: '#8b5cf6' },
          ].map((w) => (
            <Field key={w.label} label={w.label} description={w.desc}>
              <div className="flex items-center gap-3">
                <div className="h-2 rounded-full overflow-hidden" style={{ width: 80, background: '#f3f4f6' }}>
                  <div style={{ width: `${w.value}%`, height: '100%', background: w.color, borderRadius: 4 }} />
                </div>
                <NumberInput value={w.value} onChange={w.set} min={0} max={100} unit="pts" />
              </div>
            </Field>
          ))}
        </Section>

        {/* Eligibility */}
        <Section title="Eligibility Rules" description="Hard constraints for candidate disqualification.">
          <Field label="Subject match required" description="Disqualify candidates with no record of teaching the subject">
            <Toggle checked={subjectMatchRequired} onChange={setSubjectMatchRequired} />
          </Field>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" description="Who gets notified when a substitution is confirmed.">
          <Field label="Notify substitute teacher" description="Send a notification when they are confirmed">
            <Toggle checked={notifyTeacher} onChange={setNotifyTeacher} />
          </Field>
          <Field label="Notify parents" description="Inform parents when their child's teacher changes">
            <Toggle checked={notifyParents} onChange={setNotifyParents} />
          </Field>
        </Section>
      </div>
    </div>
  );
}
