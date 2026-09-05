'use client';

import * as React from 'react';
import { Badge, Button, ConfirmDialog, DataTable } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { Modal, Select, Input } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSchedulingRules, useCreateRule, useDeleteRule, usePeriods } from '@/lib/hooks/use-timetable';
import type { SchedulingRule } from '@/lib/hooks/use-timetable';

// ─── Rule type labels ─────────────────────────────────────────────────────────

const RULE_TYPE_OPTIONS = [
  { value: 'MAX_PERIODS_PER_DAY',  label: 'Max Periods Per Day (per teacher)' },
  { value: 'MAX_PERIODS_PER_WEEK', label: 'Max Periods Per Week (per teacher)' },
  { value: 'BLACKOUT_PERIOD',      label: 'Blackout Period (no classes allowed)' },
  { value: 'PREFERRED_PERIOD',     label: 'Preferred Period (hint only)' },
];

const DAY_LABELS: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

const DAY_OPTIONS = [
  { value: '', label: '— All days —' },
  ...Object.entries(DAY_LABELS).map(([v, l]) => ({ value: v, label: l })),
];

// ─── Add rule modal ───────────────────────────────────────────────────────────

interface AddRuleModalProps {
  open: boolean;
  onClose: () => void;
  campusId: string;
}

function AddRuleModal({ open, onClose, campusId }: AddRuleModalProps) {
  const toast = useToast();
  const create = useCreateRule();
  const { data: periods = [] } = usePeriods(campusId);

  const [ruleType, setRuleType] = React.useState('MAX_PERIODS_PER_DAY');
  const [value, setValue] = React.useState('');
  const [periodId, setPeriodId] = React.useState('');
  const [dayOfWeek, setDayOfWeek] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setRuleType('MAX_PERIODS_PER_DAY');
      setValue('');
      setPeriodId('');
      setDayOfWeek('');
      setDescription('');
      setError('');
    }
  }, [open]);

  const needsValue = ruleType === 'MAX_PERIODS_PER_DAY' || ruleType === 'MAX_PERIODS_PER_WEEK';
  const needsPeriod = ruleType === 'BLACKOUT_PERIOD' || ruleType === 'PREFERRED_PERIOD';

  const periodOptions = [
    { value: '', label: '— Select period —' },
    ...periods.filter((p) => p.periodType === 'CLASS').map((p) => ({
      value: p.id,
      label: `${p.name}`,
    })),
  ];

  async function handleSubmit() {
    if (needsValue && !value) { setError('Value is required for this rule type'); return; }
    if (needsPeriod && !periodId) { setError('Period is required for this rule type'); return; }
    setError('');
    try {
      await create.mutateAsync({
        campusId,
        ruleType,
        ...(needsValue && value ? { value: parseInt(value, 10) } : {}),
        ...(needsPeriod && periodId ? { periodId } : {}),
        ...(dayOfWeek ? { dayOfWeek: parseInt(dayOfWeek, 10) } : {}),
        ...(description ? { description } : {}),
      });
      toast.success('Scheduling rule created.');
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to create rule.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Scheduling Rule"
      description="Define a constraint that applies to this campus's timetable scheduling."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create Rule'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Rule Type"
          required
          value={ruleType}
          onChange={(e) => { setRuleType(e.target.value); setError(''); }}
          options={RULE_TYPE_OPTIONS}
        />

        {needsValue && (
          <Input
            label="Limit"
            required
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={ruleType === 'MAX_PERIODS_PER_DAY' ? 'e.g. 6' : 'e.g. 25'}
            hint={ruleType === 'MAX_PERIODS_PER_DAY'
              ? 'Maximum number of periods a teacher can teach in a single day'
              : 'Maximum number of periods a teacher can teach in a week'}
            {...(error ? { error } : {})}
          />
        )}

        {needsPeriod && (
          <Select
            label="Period"
            required
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            options={periodOptions}
            placeholder="Select a period"
            {...(error ? { error } : {})}
          />
        )}

        <Select
          label="Day of Week"
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
          options={DAY_OPTIONS}
          hint="Leave blank to apply to all days"
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note about this rule"
        />
      </div>
    </Modal>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

interface RulesTabProps {
  campusId: string;
}

export function RulesTab({ campusId }: RulesTabProps) {
  const toast = useToast();
  const { data: rules = [], isLoading } = useSchedulingRules(campusId);
  const deleteRule = useDeleteRule();

  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SchedulingRule | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRule.mutateAsync({ id: deleteTarget.id, campusId });
      toast.success('Rule deleted.');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete rule.');
    }
  }

  function ruleLabel(r: SchedulingRule): string {
    switch (r.ruleType) {
      case 'MAX_PERIODS_PER_DAY':  return `Max ${r.value ?? '?'} periods/day per teacher`;
      case 'MAX_PERIODS_PER_WEEK': return `Max ${r.value ?? '?'} periods/week per teacher`;
      case 'BLACKOUT_PERIOD':      return `Blackout: ${r.period?.name ?? 'period'}`;
      case 'PREFERRED_PERIOD':     return `Preferred: ${r.period?.name ?? 'period'}`;
      default:                     return r.ruleType;
    }
  }

  const columns: ColumnDef<SchedulingRule>[] = [
    {
      id: 'type',
      header: 'TYPE',
      width: '180px',
      cell: (r) => (
        <Badge variant={r.isActive ? 'active' : 'default'}>
          {r.ruleType.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { id: 'summary', header: 'RULE SUMMARY', accessor: ruleLabel },
    {
      id: 'day',
      header: 'DAY',
      width: '110px',
      accessor: (r) => (r.dayOfWeek ? (DAY_LABELS[r.dayOfWeek] ?? '—') : 'All days'),
    },
    {
      id: 'desc',
      header: 'DESCRIPTION',
      accessor: (r) => r.description ?? '—',
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '80px',
      align: 'right',
      cell: (r) => (
        <button
          className="text-xs font-medium text-[#b3261e]"
          onClick={() => setDeleteTarget(r)}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <div className="flex-1">
            <p style={{ fontSize: 12, color: '#8a929b' }}>
              {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            + Add Rule
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">
            Loading rules…
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">No scheduling rules configured</p>
            <p className="text-xs text-[#8a929b]">
              Add constraints like max periods per day, or blackout periods.
            </p>
          </div>
        ) : (
          <DataTable columns={columns} data={rules} />
        )}
      </div>

      <AddRuleModal open={addOpen} onClose={() => setAddOpen(false)} campusId={campusId} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Rule"
        description={`Delete rule "${deleteTarget ? ruleLabel(deleteTarget) : ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteRule.isPending}
      />
    </>
  );
}
