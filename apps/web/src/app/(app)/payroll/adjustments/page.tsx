'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Spinner, DataTable, Tabs, EmptyState } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  payrollApi,
  type PayrollAdjustment,
  type AdjustmentType,
  type CreateAdjustmentData,
  formatCurrency,
  formatDate,
} from '@/lib/payroll-api';
import { Plus, TrendingUp, Check, X } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'PENDING',  label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'INCLUDED', label: 'Included' },
  { id: 'REJECTED', label: 'Rejected' },
];

const ADJUSTMENT_TYPES: AdjustmentType[] = [
  'BONUS', 'OVERTIME', 'ARREAR', 'REIMBURSEMENT', 'DEDUCTION', 'OTHER',
];

const TYPE_LABEL: Record<AdjustmentType, string> = {
  BONUS:         'Bonus',
  OVERTIME:      'Overtime',
  ARREAR:        'Arrear',
  REIMBURSEMENT: 'Reimbursement',
  DEDUCTION:     'Deduction',
  OTHER:         'Other',
};

const TYPE_TABS = [
  { id: 'all',          label: 'All Types' },
  { id: 'BONUS',        label: 'Bonus' },
  { id: 'OVERTIME',     label: 'Overtime' },
  { id: 'ARREAR',       label: 'Arrear' },
  { id: 'REIMBURSEMENT', label: 'Reimbursement' },
  { id: 'DEDUCTION',    label: 'Deduction' },
  { id: 'OTHER',        label: 'Other' },
];

const EMPTY_FORM: CreateAdjustmentData = {
  employeeId:      '',
  adjustmentType:  'BONUS',
  subType:         '',
  description:     '',
  amount:          0,
  effectivePeriod: '',
};

const STATUS_BADGE: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  PENDING:  'pending',
  APPROVED: 'active',
  INCLUDED: 'graduated',
  REJECTED: 'left',
};

function isEarning(type: AdjustmentType) {
  return type !== 'DEDUCTION';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments]   = React.useState<PayrollAdjustment[]>([]);
  const [loading, setLoading]           = React.useState(true);
  const [error, setError]               = React.useState<string | null>(null);
  const [statusTab, setStatusTab]       = React.useState('all');
  const [typeTab, setTypeTab]           = React.useState('all');
  const [showForm, setShowForm]         = React.useState(false);
  const [form, setForm]                 = React.useState<CreateAdjustmentData>(EMPTY_FORM);
  const [formError, setFormError]       = React.useState<string | null>(null);
  const [saving, setSaving]             = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError]   = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof payrollApi.adjustments.list>[0] = {};
      if (statusTab !== 'all') params.status = statusTab;
      if (typeTab !== 'all')   params.adjustmentType = typeTab;
      const data = await payrollApi.adjustments.list(params);
      setAdjustments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [statusTab, typeTab]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId.trim()) { setFormError('Employee ID is required.'); return; }
    if (!form.effectivePeriod.match(/^\d{4}-\d{2}$/)) { setFormError('Effective period must be YYYY-MM.'); return; }
    if (!form.amount || form.amount <= 0) { setFormError('Amount must be greater than 0.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const payload: CreateAdjustmentData = {
        employeeId:     form.employeeId,
        adjustmentType: form.adjustmentType,
        amount:         form.amount,
        effectivePeriod: form.effectivePeriod,
      };
      if (form.subType)     payload.subType     = form.subType;
      if (form.description) payload.description = form.description;
      await payrollApi.adjustments.create(payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create adjustment');
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    setActionError(null);
    try {
      await payrollApi.adjustments.approve(id);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    setActionError(null);
    try {
      await payrollApi.adjustments.reject(id);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  }

  const columns: ColumnDef<PayrollAdjustment>[] = [
    {
      id: 'employeeId',
      header: 'Employee',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6d746e' }}>
          {row.employeeId.slice(0, 8)}…
        </span>
      ),
    },
    {
      id: 'adjustmentType',
      header: 'Type',
      cell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 500 }}>{TYPE_LABEL[row.adjustmentType]}</span>
          {row.subType && (
            <span style={{ fontSize: 11, color: '#6d746e' }}>{row.subType}</span>
          )}
        </div>
      ),
    },
    {
      id: 'effectivePeriod',
      header: 'Period',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.effectivePeriod}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: (row) => (
        <span
          style={{
            fontWeight: 600,
            color: isEarning(row.adjustmentType) ? '#2c7a3f' : '#b04a3a',
          }}
        >
          {isEarning(row.adjustmentType) ? '+' : '−'}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => (
        <span style={{ fontSize: 13, color: '#6d746e' }}>{row.description || '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={STATUS_BADGE[row.status] ?? 'default'}>
          {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#6d746e' }}>{formatDate(row.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => {
        if (row.status !== 'PENDING') return null;
        const busy = actionLoading === row.id;
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handleApprove(row.id)}
              style={{ color: '#2c7a3f', padding: '2px 8px' }}
            >
              {busy ? <Spinner size="sm" /> : <Check size={14} />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handleReject(row.id)}
              style={{ color: '#b04a3a', padding: '2px 8px' }}
            >
              {busy ? <Spinner size="sm" /> : <X size={14} />}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Payroll Adjustments"
        subtitle="Manage bonuses, overtime, arrears, reimbursements, and deductions"
        actions={
          <Button size="sm" onClick={() => { setShowForm(true); setFormError(null); }}>
            <Plus size={14} style={{ marginRight: 6 }} />
            New Adjustment
          </Button>
        }
      />

      {/* ── Inline create form ───────────────────────────────────── */}
      {showForm && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2ddd5',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
            New Adjustment
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Employee ID *
                </label>
                <input
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  placeholder="UUID"
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Adjustment Type *
                </label>
                <select
                  value={form.adjustmentType}
                  onChange={(e) => setForm((f) => ({ ...f, adjustmentType: e.target.value as AdjustmentType }))}
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, background: '#fff', boxSizing: 'border-box',
                  }}
                >
                  {ADJUSTMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Sub-type
                </label>
                <input
                  value={form.subType ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, subType: e.target.value }))}
                  placeholder="e.g. PERFORMANCE, FESTIVAL"
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount || ''}
                  onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="5000"
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Effective Period *
                </label>
                <input
                  value={form.effectivePeriod}
                  onChange={(e) => setForm((f) => ({ ...f, effectivePeriod: e.target.value }))}
                  placeholder="2026-09"
                  maxLength={7}
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <input
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional note"
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            {formError && (
              <div style={{ color: '#b04a3a', fontSize: 13, marginBottom: 12 }}>{formError}</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Create Adjustment'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Tabs
          tabs={STATUS_TABS}
          activeTab={statusTab}
          onChange={setStatusTab}
        />
        <Tabs
          tabs={TYPE_TABS}
          activeTab={typeTab}
          onChange={setTypeTab}
        />
      </div>

      {actionError && (
        <div
          style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', color: '#b04a3a', fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner />
        </div>
      ) : error ? (
        <div
          style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', color: '#b04a3a', fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : adjustments.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={32} />}
          title="No adjustments found"
          description="Create a bonus, deduction, or other adjustment to apply it to the next payroll run."
        />
      ) : (
        <div
          style={{
            background: '#fff', border: '1px solid #e2ddd5',
            borderRadius: 12, overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={adjustments} />
        </div>
      )}
    </div>
  );
}
