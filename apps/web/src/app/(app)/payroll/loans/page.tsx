'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Spinner, Tabs, EmptyState } from '@/components/ui';
import {
  payrollApi,
  type EmployeeLoan,
  type LoanInstallment,
  type LoanType,
  type CreateLoanData,
  formatCurrency,
  formatDate,
} from '@/lib/payroll-api';
import { Plus, Landmark, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { id: 'all',       label: 'All' },
  { id: 'ACTIVE',    label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CLOSED',    label: 'Closed' },
];

const LOAN_TYPES: LoanType[] = [
  'SALARY_ADVANCE', 'PERSONAL_LOAN', 'VEHICLE_LOAN', 'OTHER',
];

const LOAN_TYPE_LABEL: Record<LoanType, string> = {
  SALARY_ADVANCE: 'Salary Advance',
  PERSONAL_LOAN:  'Personal Loan',
  VEHICLE_LOAN:   'Vehicle Loan',
  OTHER:          'Other',
};

const LOAN_TYPE_TABS = [
  { id: 'all',            label: 'All Types' },
  { id: 'SALARY_ADVANCE', label: 'Salary Advance' },
  { id: 'PERSONAL_LOAN',  label: 'Personal Loan' },
  { id: 'VEHICLE_LOAN',   label: 'Vehicle Loan' },
  { id: 'OTHER',          label: 'Other' },
];

const STATUS_BADGE: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  ACTIVE:    'active',
  COMPLETED: 'graduated',
  CLOSED:    'left',
};

const EMPTY_FORM: CreateLoanData = {
  employeeId:       '',
  loanType:         'PERSONAL_LOAN',
  principalAmount:  0,
  monthlyDeduction: 0,
  startDate:        '',
  reason:           '',
};

function progressPercent(loan: EmployeeLoan): number {
  const principal = parseFloat(loan.principalAmount);
  const outstanding = parseFloat(loan.outstandingAmount);
  if (principal <= 0) return 100;
  return Math.min(100, Math.round(((principal - outstanding) / principal) * 100));
}

// ─── Installments panel ───────────────────────────────────────────────────────

function InstallmentsPanel({ loanId }: { loanId: string }) {
  const [installments, setInstallments] = React.useState<LoanInstallment[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    payrollApi.loans.get(loanId)
      .then((detail) => setInstallments(detail.installments ?? []))
      .catch(() => setInstallments([]))
      .finally(() => setLoading(false));
  }, [loanId]);

  return (
    <tr>
      <td
        colSpan={8}
        style={{
          background: '#f9f7f2',
          borderTop: '1px solid #e2ddd5',
          padding: '14px 20px',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#2c322f' }}>
          Installment History
        </div>
        {loading ? (
          <Spinner size="sm" />
        ) : !installments || installments.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6d746e' }}>No installments recorded yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#6d746e' }}>
                <th style={{ padding: '4px 8px', fontWeight: 500, textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '4px 8px', fontWeight: 500, textAlign: 'left' }}>Paid At</th>
                <th style={{ padding: '4px 8px', fontWeight: 500, textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((inst) => (
                <tr key={inst.id} style={{ borderTop: '1px solid #e2ddd5' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                    {formatCurrency(inst.amount)}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#6d746e' }}>
                    {inst.paidAt ? formatDate(inst.paidAt) : '—'}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <Badge variant={inst.status === 'PAID' ? 'active' : 'pending'}>
                      {inst.status.charAt(0) + inst.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoansPage() {
  const [loans, setLoans]             = React.useState<EmployeeLoan[]>([]);
  const [loading, setLoading]         = React.useState(true);
  const [error, setError]             = React.useState<string | null>(null);
  const [statusTab, setStatusTab]     = React.useState('all');
  const [typeTab, setTypeTab]         = React.useState('all');
  const [showForm, setShowForm]       = React.useState(false);
  const [form, setForm]               = React.useState<CreateLoanData>(EMPTY_FORM);
  const [formError, setFormError]     = React.useState<string | null>(null);
  const [saving, setSaving]           = React.useState(false);
  const [closingId, setClosingId]     = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId]   = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof payrollApi.loans.list>[0] = {};
      if (statusTab !== 'all') params.status = statusTab;
      if (typeTab !== 'all')   params.loanType = typeTab;
      const data = await payrollApi.loans.list(params);
      setLoans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [statusTab, typeTab]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employeeId.trim())    { setFormError('Employee ID is required.'); return; }
    if (!form.startDate)            { setFormError('Start date is required.'); return; }
    if (form.principalAmount <= 0)  { setFormError('Principal must be greater than 0.'); return; }
    if (form.monthlyDeduction <= 0) { setFormError('Monthly deduction must be greater than 0.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      const payload: CreateLoanData = {
        employeeId:       form.employeeId,
        loanType:         form.loanType,
        principalAmount:  form.principalAmount,
        monthlyDeduction: form.monthlyDeduction,
        startDate:        form.startDate,
      };
      if (form.reason) payload.reason = form.reason;
      await payrollApi.loans.create(payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create loan');
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(id: string) {
    setClosingId(id);
    setActionError(null);
    try {
      await payrollApi.loans.close(id);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to close loan');
    } finally {
      setClosingId(null);
    }
  }

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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Loans & Advances"
        subtitle="Manage employee loans, salary advances, and EMI deductions"
        actions={
          <Button size="sm" onClick={() => { setShowForm(true); setFormError(null); }}>
            <Plus size={14} style={{ marginRight: 6 }} />
            New Loan
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
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>New Loan / Advance</div>
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
                  Loan Type *
                </label>
                <select
                  value={form.loanType}
                  onChange={(e) => setForm((f) => ({ ...f, loanType: e.target.value as LoanType }))}
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, background: '#fff', boxSizing: 'border-box',
                  }}
                >
                  {LOAN_TYPES.map((t) => (
                    <option key={t} value={t}>{LOAN_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Principal Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.principalAmount || ''}
                  onChange={(e) => setForm((f) => ({ ...f, principalAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="120000"
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Monthly EMI (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.monthlyDeduction || ''}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyDeduction: parseFloat(e.target.value) || 0 }))}
                  placeholder="10000"
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                  Reason
                </label>
                <input
                  value={form.reason ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Medical emergency"
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid #e2ddd5',
                    borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            {form.principalAmount > 0 && form.monthlyDeduction > 0 && (
              <div
                style={{
                  background: '#f4f1e9', borderRadius: 8, padding: '8px 12px',
                  fontSize: 13, color: '#6d746e', marginBottom: 12,
                }}
              >
                Estimated tenure:{' '}
                <strong style={{ color: '#2c322f' }}>
                  {Math.ceil(form.principalAmount / form.monthlyDeduction)} months
                </strong>
              </div>
            )}
            {formError && (
              <div style={{ color: '#b04a3a', fontSize: 13, marginBottom: 12 }}>{formError}</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Create Loan'}
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
        <Tabs tabs={STATUS_TABS}    activeTab={statusTab} onChange={setStatusTab} />
        <Tabs tabs={LOAN_TYPE_TABS} activeTab={typeTab}   onChange={setTypeTab}   />
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
      ) : loans.length === 0 ? (
        <EmptyState
          icon={<Landmark size={32} />}
          title="No loans found"
          description="Create a loan or salary advance to start tracking EMI deductions in payroll."
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
                <th style={{ ...thStyle, width: 32 }} />
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Principal</th>
                <th style={thStyle}>Outstanding</th>
                <th style={thStyle}>Monthly EMI</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, idx) => {
                const pct = progressPercent(loan);
                const isExpanded = expandedId === loan.id;
                return (
                  <React.Fragment key={loan.id}>
                    <tr
                      style={{
                        borderTop: idx > 0 ? '1px solid #f0ede6' : undefined,
                        background: isExpanded ? '#fafaf7' : undefined,
                      }}
                    >
                      <td style={{ ...tdStyle, padding: '12px 8px 12px 14px' }}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#6d746e', display: 'flex', alignItems: 'center',
                            padding: 0,
                          }}
                        >
                          {isExpanded
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6d746e' }}>
                          {loan.employeeId.slice(0, 8)}…
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 500 }}>{LOAN_TYPE_LABEL[loan.loanType]}</span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {formatCurrency(loan.principalAmount)}
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: 600, color: pct >= 100 ? '#2c7a3f' : '#2c322f', marginBottom: 4 }}>
                            {formatCurrency(loan.outstandingAmount)}
                          </div>
                          <div style={{ height: 4, borderRadius: 4, background: '#e2ddd5', overflow: 'hidden', width: 100 }}>
                            <div
                              style={{
                                height: '100%', borderRadius: 4,
                                width: `${pct}%`,
                                background: pct >= 100 ? '#2c7a3f' : '#4a9b6f',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 11, color: '#6d746e', marginTop: 2 }}>{pct}% repaid</div>
                        </div>
                      </td>
                      <td style={tdStyle}>{formatCurrency(loan.monthlyDeduction)}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#6d746e' }}>
                        {formatDate(loan.startDate)}
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={STATUS_BADGE[loan.status] ?? 'default'}>
                          {loan.status.charAt(0) + loan.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {loan.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={closingId === loan.id}
                            onClick={() => handleClose(loan.id)}
                            style={{ color: '#b04a3a', fontSize: 12 }}
                          >
                            {closingId === loan.id ? <Spinner size="sm" /> : 'Close'}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && <InstallmentsPanel loanId={loan.id} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
