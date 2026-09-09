'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import {
  payrollApi,
  type FnfSettlement,
  type FnfSeparationType,
  type InitiateFnfData,
  formatCurrency,
  formatDate,
} from '@/lib/payroll-api';
import { Handshake, Plus, ChevronDown, X, Check, Banknote } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEPARATION_TYPES: FnfSeparationType[] = [
  'RESIGNATION',
  'TERMINATION',
  'RETIREMENT',
  'DEATH',
  'CONTRACT_END',
  'OTHER',
];

const STATUS_BADGE: Record<string, 'active' | 'pending' | 'inactive'> = {
  DRAFT:    'pending',
  APPROVED: 'active',
  PAID:     'inactive',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 500,
  fontSize: 12,
  color: '#6d746e',
  textAlign: 'left',
  borderBottom: '1px solid #e2ddd5',
  background: '#fafaf7',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  verticalAlign: 'middle',
  borderTop: '1px solid #f0ede6',
};

// ─── Create form ──────────────────────────────────────────────────────────────

interface CreateFormState {
  employeeId: string;
  separationDate: string;
  separationType: FnfSeparationType;
  lastWorkingDay: string;
  noticePeriodDays: string;
  pendingLeaveDays: string;
  notes: string;
}

const emptyForm = (): CreateFormState => ({
  employeeId:      '',
  separationDate:  '',
  separationType:  'RESIGNATION',
  lastWorkingDay:  '',
  noticePeriodDays: '0',
  pendingLeaveDays: '0',
  notes:           '',
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FnfSettlementsPage() {
  const [settlements, setSettlements] = React.useState<FnfSettlement[]>([]);
  const [loading, setLoading]         = React.useState(true);
  const [error, setError]             = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [showCreate, setShowCreate]   = React.useState(false);
  const [form, setForm]               = React.useState<CreateFormState>(emptyForm());
  const [creating, setCreating]       = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  async function load(status?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await payrollApi.settlements.list(status ? { status } : undefined);
      setSettlements(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(statusFilter || undefined); }, [statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const payload: InitiateFnfData = {
        employeeId:     form.employeeId.trim(),
        separationDate: form.separationDate,
        separationType: form.separationType,
        lastWorkingDay: form.lastWorkingDay,
        ...(parseInt(form.noticePeriodDays) > 0
          ? { noticePeriodDays: parseInt(form.noticePeriodDays) }
          : {}),
        ...(parseFloat(form.pendingLeaveDays) > 0
          ? { pendingLeaveDays: parseFloat(form.pendingLeaveDays) }
          : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };
      await payrollApi.settlements.initiate(payload);
      setShowCreate(false);
      setForm(emptyForm());
      await load(statusFilter || undefined);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to initiate settlement');
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id + ':approve');
    try {
      await payrollApi.settlements.approve(id);
      await load(statusFilter || undefined);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkPaid(id: string) {
    setActionLoading(id + ':paid');
    try {
      await payrollApi.settlements.markPaid(id);
      await load(statusFilter || undefined);
    } finally {
      setActionLoading(null);
    }
  }

  const employeeName = (s: FnfSettlement) => {
    if (!s.employee?.person) return s.employeeId.slice(0, 8) + '…';
    const { firstName, lastName } = s.employee.person;
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Full & Final Settlements"
        subtitle="Manage separation settlements — partial salary, leave encashment, gratuity, and loan recovery"
        actions={
          <Button onClick={() => { setShowCreate(true); setCreateError(null); setForm(emptyForm()); }}>
            <Plus size={14} style={{ marginRight: 6 }} />
            Initiate Settlement
          </Button>
        }
      />

      {/* ── Info banner ─────────────────────────────────────────── */}
      <div
        style={{
          background: '#f0f9f4', border: '1px solid #c3e6d1',
          borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#2c7a3f',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}
      >
        <Handshake size={16} style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <strong>Settlement computation:</strong> Partial month salary is prorated by working days.
          Leave encashment is calculated at daily rate (monthly CTC ÷ 26 × pending days).
          Gratuity is payable after 5 years of service: (monthly ÷ 26) × 15 × years.
          Outstanding loan balances are recovered from the settlement amount.
        </div>
      </div>

      {/* ── Status filter tabs ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['', 'DRAFT', 'APPROVED', 'PAID'].map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: '1px solid',
              borderColor: statusFilter === s ? '#4a9b6f' : '#e2ddd5',
              background:  statusFilter === s ? '#e8f5ee' : '#fff',
              color:       statusFilter === s ? '#2c7a3f' : '#6d746e',
              cursor: 'pointer',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* ── Create form ──────────────────────────────────────────── */}
      {showCreate && (
        <div
          style={{
            background: '#fff', border: '1px solid #e2ddd5',
            borderRadius: 12, padding: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#2c322f' }}>Initiate Full & Final Settlement</span>
            <button
              onClick={() => setShowCreate(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d746e' }}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Employee ID *
                </label>
                <input
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  placeholder="UUID of employee"
                  style={{
                    width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Separation Type *
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    required
                    value={form.separationType}
                    onChange={(e) => setForm((f) => ({ ...f, separationType: e.target.value as FnfSeparationType }))}
                    style={{
                      width: '100%', appearance: 'none', padding: '7px 30px 7px 10px',
                      border: '1px solid #e2ddd5', borderRadius: 7, fontSize: 13,
                      background: '#fff', boxSizing: 'border-box',
                    }}
                  >
                    {SEPARATION_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6d746e' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Separation Date *
                </label>
                <input
                  required
                  type="date"
                  value={form.separationDate}
                  onChange={(e) => setForm((f) => ({ ...f, separationDate: e.target.value }))}
                  style={{
                    width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Last Working Day *
                </label>
                <input
                  required
                  type="date"
                  value={form.lastWorkingDay}
                  onChange={(e) => setForm((f) => ({ ...f, lastWorkingDay: e.target.value }))}
                  style={{
                    width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Notice Period Served (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.noticePeriodDays}
                  onChange={(e) => setForm((f) => ({ ...f, noticePeriodDays: e.target.value }))}
                  style={{
                    width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Pending Leave Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={form.pendingLeaveDays}
                  onChange={(e) => setForm((f) => ({ ...f, pendingLeaveDays: e.target.value }))}
                  style={{
                    width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional internal notes…"
                style={{
                  width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                  borderRadius: 7, fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            {createError && (
              <div style={{ color: '#b04a3a', fontSize: 12, marginBottom: 10 }}>{createError}</div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" disabled={creating}>
                {creating ? <Spinner size="sm" /> : 'Compute & Initiate'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
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
      ) : settlements.length === 0 ? (
        <EmptyState
          icon={<Handshake size={32} />}
          title="No settlements yet"
          description="Initiate a Full & Final settlement when an employee separates from the organization."
        />
      ) : (
        <div
          style={{
            background: '#fff', border: '1px solid #e2ddd5',
            borderRadius: 12, overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Separation Type</th>
                <th style={thStyle}>Last Working Day</th>
                <th style={thStyle}>Partial Salary</th>
                <th style={thStyle}>Leave Encash.</th>
                <th style={thStyle}>Gratuity</th>
                <th style={thStyle}>Loan Recovery</th>
                <th style={thStyle}>Net Settlement</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => {
                const isApproving = actionLoading === s.id + ':approve';
                const isPaying    = actionLoading === s.id + ':paid';
                return (
                  <tr key={s.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: '#2c322f', fontSize: 13 }}>
                        {employeeName(s)}
                      </div>
                      {s.employee?.department && (
                        <div style={{ fontSize: 11, color: '#6d746e', marginTop: 2 }}>
                          {s.employee.department.name}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                          color: '#6d746e', textTransform: 'uppercase',
                        }}
                      >
                        {s.separationType.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>{formatDate(s.lastWorkingDay)}</td>
                    <td style={tdStyle}>{formatCurrency(s.partialMonthSalary)}</td>
                    <td style={tdStyle}>{formatCurrency(s.leaveEncashmentAmount)}</td>
                    <td style={tdStyle}>{formatCurrency(s.gratuityAmount)}</td>
                    <td style={{ ...tdStyle, color: '#b04a3a' }}>
                      {parseFloat(s.loanRecoveryAmount) > 0
                        ? `−${formatCurrency(s.loanRecoveryAmount)}`
                        : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#2c7a3f' }}>
                      {formatCurrency(s.netSettlement)}
                    </td>
                    <td style={tdStyle}>
                      <Badge variant={STATUS_BADGE[s.status] ?? 'inactive'}>{s.status}</Badge>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {s.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isApproving}
                            onClick={() => handleApprove(s.id)}
                            title="Approve settlement"
                          >
                            {isApproving ? <Spinner size="sm" /> : <Check size={13} />}
                          </Button>
                        )}
                        {s.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPaying}
                            onClick={() => handleMarkPaid(s.id)}
                            title="Mark as paid"
                          >
                            {isPaying ? <Spinner size="sm" /> : <Banknote size={13} />}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
