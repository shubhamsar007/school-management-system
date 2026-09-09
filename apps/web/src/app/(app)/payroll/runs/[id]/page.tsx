'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, Spinner, DataTable, Tabs } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  payrollApi,
  formatCurrency,
  formatPeriod,
  downloadBankExportCsv,
  type PayrollRunDetail,
  type PayrollRecord,
  type ValidationReport,
} from '@/lib/payroll-api';
import { CheckCircle2, AlertTriangle, XCircle, Shield } from 'lucide-react';

// ─── Badge maps ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  PayrollRecord['status'],
  { variant: 'active' | 'pending' | 'default' | 'graduated' | 'left'; label: string }
> = {
  PAID:    { variant: 'active',  label: 'Paid' },
  PENDING: { variant: 'pending', label: 'Pending' },
  HELD:    { variant: 'left',    label: 'Held' },
};

const RUN_STATUS_BADGE: Record<
  PayrollRunDetail['status'],
  { variant: 'active' | 'pending' | 'default' | 'graduated' | 'left'; label: string }
> = {
  PAID:       { variant: 'active',    label: 'Paid' },
  APPROVED:   { variant: 'graduated', label: 'Approved' },
  COMPLETED:  { variant: 'pending',   label: 'Completed' },
  PROCESSING: { variant: 'pending',   label: 'Processing' },
  DRAFT:      { variant: 'default',   label: 'Draft' },
};

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'employees',  label: 'Employees' },
  { id: 'attendance', label: 'Attendance Breakdown' },
  { id: 'exceptions', label: 'Exceptions' },
];

// ─── Validation panel ─────────────────────────────────────────────────────────

function ValidationPanel({
  report,
  onProcess,
  processing,
}: {
  report: ValidationReport;
  onProcess: () => void;
  processing: boolean;
}) {
  const { summary } = report;
  const allGood = summary.withIssues === 0;

  return (
    <div
      style={{
        padding: '20px 24px',
        marginBottom: 16,
        background: allGood ? '#f0f9f0' : '#fffdf8',
        border: `1px solid ${allGood ? '#c3e6d0' : '#e6e1d5'}`,
        borderRadius: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Shield size={16} style={{ color: allGood ? '#3f6152' : '#b07000', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>Pre-Payroll Validation</span>
        <Badge variant={allGood ? 'active' : 'pending'} style={{ marginLeft: 'auto' }}>
          {summary.readyToProcess}/{summary.totalEmployees} ready
        </Badge>
      </div>

      {/* Health items */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {
            label: 'Salary Structure',
            ok: summary.missingStructure === 0,
            text:
              summary.missingStructure === 0
                ? `All ${summary.totalEmployees} employees have salary structures`
                : `${summary.missingStructure} employee${summary.missingStructure !== 1 ? 's' : ''} missing salary structure`,
          },
          {
            label: 'Attendance Data',
            ok: summary.missingAttendance === 0,
            text:
              summary.missingAttendance === 0
                ? 'All employees have attendance data for this period'
                : `${summary.missingAttendance} employee${summary.missingAttendance !== 1 ? 's' : ''} have no attendance records`,
          },
        ].map(({ label, ok, text }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: ok ? '#fff' : '#fff8e6',
              border: `1px solid ${ok ? '#e6e8eb' : '#ffe8a0'}`,
            }}
          >
            {ok ? (
              <CheckCircle2 size={15} style={{ color: '#3f6152', flexShrink: 0, marginTop: 1 }} />
            ) : (
              <AlertTriangle size={15} style={{ color: '#b07000', flexShrink: 0, marginTop: 1 }} />
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: ok ? '#3f6152' : '#b07000' }}>
                {label}
              </div>
              <div style={{ fontSize: 11, color: '#6b7480', marginTop: 2 }}>{text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Employees with issues */}
      {summary.withIssues > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#8a929b',
              marginBottom: 6,
            }}
          >
            Employees with issues
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {report.employees
              .filter((e) => e.issues.length > 0)
              .map((e) => (
                <div
                  key={e.employeeId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: '#fde8e7',
                    border: '1px solid #f5c6c6',
                    fontSize: 12,
                  }}
                >
                  <XCircle size={13} style={{ color: '#b3261e', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, color: '#14181c', minWidth: 120 }}>{e.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7480' }}>
                    {e.employeeNumber}
                  </span>
                  <span style={{ color: '#b3261e', marginLeft: 'auto' }}>{e.issues.join(' · ')}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Button variant="primary" disabled={processing || !report.canProcess} onClick={onProcess}>
          {processing
            ? 'Processing…'
            : allGood
            ? 'Process Payroll'
            : `Process (${summary.readyToProcess} employees)`}
        </Button>
        {!report.canProcess && (
          <span style={{ fontSize: 12, color: '#b3261e' }}>
            No employees are ready — assign salary structures first.
          </span>
        )}
        {report.canProcess && !allGood && (
          <span style={{ fontSize: 12, color: '#b07000' }}>
            Employees with issues will be skipped.
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = React.useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('overview');

  // Validation state
  const [validation, setValidation] = React.useState<ValidationReport | null>(null);
  const [validating, setValidating] = React.useState(false);
  const [showValidation, setShowValidation] = React.useState(false);

  // Action state
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function loadRun() {
    try {
      const data = await payrollApi.runs.get(id);
      setRun(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load run');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadRun(); }, [id]);

  async function handleValidate() {
    setValidating(true);
    setActionError(null);
    try {
      const report = await payrollApi.runs.validate(id);
      setValidation(report);
      setShowValidation(true);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  }

  async function handleProcess() {
    setActionLoading('process');
    setActionError(null);
    try {
      await payrollApi.runs.process(id);
      setShowValidation(false);
      setValidation(null);
      await loadRun();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to process run');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove() {
    setActionLoading('approve');
    setActionError(null);
    try {
      await payrollApi.runs.approve(id);
      await loadRun();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to approve run');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkPaid() {
    setActionLoading('markpaid');
    setActionError(null);
    try {
      await payrollApi.runs.markPaid(id);
      await loadRun();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to mark as paid');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleHold(recordId: string) {
    setActionLoading('hold-' + recordId);
    setActionError(null);
    try {
      await payrollApi.runs.holdRecord(id, recordId);
      await loadRun();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to hold record');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div>
        <PageHeader title="Payroll Run" subtitle="Run details" />
        <div
          style={{
            padding: '16px 20px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 10,
            color: '#b3261e',
            fontSize: 13,
          }}
        >
          {error ?? 'Run not found'}
        </div>
      </div>
    );
  }

  const records = run.records ?? [];

  const totalGross      = records.reduce((s, r) => s + parseFloat(r.gross || '0'), 0);
  const totalDeductions = records.reduce((s, r) => s + parseFloat(r.totalDeductions || '0'), 0);
  const totalNet        = records.reduce((s, r) => s + parseFloat(r.netSalary || '0'), 0);
  const totalLop        = records.reduce((s, r) => s + parseFloat(r.lopAmount || '0'), 0);

  const pendingCount = records.filter((r) => r.status === 'PENDING').length;
  const paidCount    = records.filter((r) => r.status === 'PAID').length;
  const heldCount    = records.filter((r) => r.status === 'HELD').length;
  const exceptions   = records.filter(
    (r) => r.status === 'HELD' || (parseFloat(r.presentDays || '0') === 0 && records.length > 0),
  );

  const runStatusInfo = RUN_STATUS_BADGE[run.status] ?? { variant: 'default' as const, label: run.status };

  // ─── Action buttons ─────────────────────────────────────────────────────────
  const actionButtons = (
    <div className="flex items-center gap-2">
      <Badge variant={runStatusInfo.variant}>{runStatusInfo.label}</Badge>
      {run.status === 'DRAFT' && !showValidation && (
        <Button variant="secondary" disabled={validating} onClick={handleValidate}>
          {validating ? 'Validating…' : 'Validate & Process'}
        </Button>
      )}
      {run.status === 'DRAFT' && showValidation && (
        <Button variant="secondary" onClick={() => setShowValidation(false)}>
          Hide Validation
        </Button>
      )}
      {run.status === 'COMPLETED' && (
        <Button
          variant="primary"
          disabled={actionLoading === 'approve'}
          onClick={handleApprove}
        >
          {actionLoading === 'approve' ? 'Approving…' : 'Approve Run'}
        </Button>
      )}
      {run.status === 'APPROVED' && (
        <Button
          variant="primary"
          disabled={actionLoading === 'markpaid'}
          onClick={handleMarkPaid}
        >
          {actionLoading === 'markpaid' ? 'Marking…' : 'Mark as Paid'}
        </Button>
      )}
      {(run.status === 'APPROVED' || run.status === 'PAID') && (
        <Button
          variant="secondary"
          disabled={actionLoading === 'bankexport'}
          onClick={async () => {
            setActionLoading('bankexport');
            setActionError(null);
            try { await downloadBankExportCsv(id); }
            catch (e) { setActionError(e instanceof Error ? e.message : 'Bank export failed'); }
            finally { setActionLoading(null); }
          }}
        >
          {actionLoading === 'bankexport' ? 'Exporting…' : 'Export for Bank'}
        </Button>
      )}
    </div>
  );

  // ─── Column definitions ──────────────────────────────────────────────────────

  const employeeColumns: ColumnDef<PayrollRecord>[] = [
    {
      id: 'employeeId',
      header: 'Employee ID',
      width: '120px',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7480' }}>
          {row.employeeId.slice(0, 8)}…
        </span>
      ),
    },
    {
      id: 'present',
      header: 'Present',
      align: 'center',
      width: '80px',
      cell: (row) => (
        <span style={{ fontSize: 12 }}>
          {row.presentDays != null ? parseFloat(row.presentDays).toFixed(1) : '—'}
        </span>
      ),
    },
    {
      id: 'lop',
      header: 'LOP Days',
      align: 'center',
      width: '90px',
      cell: (row) => {
        const lop = parseFloat(row.lopDays || '0');
        return (
          <span style={{ fontSize: 12, color: lop > 0 ? '#b3261e' : '#6b7480', fontWeight: lop > 0 ? 600 : 400 }}>
            {lop > 0 ? lop.toFixed(1) : '—'}
          </span>
        );
      },
    },
    {
      id: 'lopAmount',
      header: 'LOP Amt',
      align: 'right',
      width: '90px',
      cell: (row) => {
        const amt = parseFloat(row.lopAmount || '0');
        return (
          <span style={{ fontSize: 12, color: amt > 0 ? '#b3261e' : '#6b7480' }}>
            {amt > 0 ? formatCurrency(amt) : '—'}
          </span>
        );
      },
    },
    {
      id: 'basic',
      header: 'Basic',
      align: 'right',
      width: '90px',
      cell: (row) => <span style={{ fontSize: 12 }}>{formatCurrency(row.basic)}</span>,
    },
    {
      id: 'gross',
      header: 'Gross',
      align: 'right',
      width: '90px',
      cell: (row) => <span style={{ fontSize: 12 }}>{formatCurrency(row.gross)}</span>,
    },
    {
      id: 'deductions',
      header: 'Deductions',
      align: 'right',
      width: '100px',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#b3261e' }}>{formatCurrency(row.totalDeductions)}</span>
      ),
    },
    {
      id: 'tds',
      header: 'TDS',
      align: 'right',
      width: '90px',
      cell: (row) => {
        const tds = parseFloat(row.tdsAmount ?? '0');
        return (
          <span style={{ fontSize: 12, color: tds > 0 ? '#b3261e' : '#8a929b' }}>
            {tds > 0 ? formatCurrency(tds) : '—'}
          </span>
        );
      },
    },
    {
      id: 'net',
      header: 'Net Salary',
      align: 'right',
      width: '100px',
      cell: (row) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#146b41' }}>
          {formatCurrency(row.netSalary)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '80px',
      cell: (row) => {
        const s = STATUS_BADGE[row.status] ?? { variant: 'default' as const, label: row.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      width: '70px',
      align: 'right',
      cell: (row) =>
        row.status !== 'HELD' ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={actionLoading === 'hold-' + row.id}
            onClick={() => handleHold(row.id)}
          >
            {actionLoading === 'hold-' + row.id ? '…' : 'Hold'}
          </Button>
        ) : (
          <span style={{ fontSize: 11, color: '#8a929b' }}>Held</span>
        ),
    },
  ];

  const attendanceColumns: ColumnDef<PayrollRecord>[] = [
    {
      id: 'employeeId',
      header: 'Employee ID',
      width: '120px',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7480' }}>
          {row.employeeId.slice(0, 8)}…
        </span>
      ),
    },
    {
      id: 'workingDays',
      header: 'Working Days',
      align: 'center',
      width: '100px',
      cell: (row) => <span style={{ fontSize: 12 }}>{row.workingDays ?? '—'}</span>,
    },
    {
      id: 'present',
      header: 'Present',
      align: 'center',
      width: '80px',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#146b41', fontWeight: 500 }}>
          {row.presentDays != null ? parseFloat(row.presentDays).toFixed(1) : '—'}
        </span>
      ),
    },
    {
      id: 'absent',
      header: 'Absent',
      align: 'center',
      width: '70px',
      cell: (row) => {
        const v = row.absentDays ?? 0;
        return (
          <span style={{ fontSize: 12, color: v > 0 ? '#b3261e' : '#6b7480' }}>
            {v > 0 ? v : '—'}
          </span>
        );
      },
    },
    {
      id: 'halfDay',
      header: 'Half Day',
      align: 'center',
      width: '80px',
      cell: (row) => {
        const v = row.halfDayCount ?? 0;
        return <span style={{ fontSize: 12, color: v > 0 ? '#b07000' : '#6b7480' }}>{v > 0 ? v : '—'}</span>;
      },
    },
    {
      id: 'paidLeave',
      header: 'Paid Leave',
      align: 'center',
      width: '90px',
      cell: (row) => {
        const v = parseFloat(row.paidLeaveDays || '0');
        return <span style={{ fontSize: 12, color: v > 0 ? '#2b5fa8' : '#6b7480' }}>{v > 0 ? v.toFixed(1) : '—'}</span>;
      },
    },
    {
      id: 'unpaidLeave',
      header: 'Unpaid Leave',
      align: 'center',
      width: '100px',
      cell: (row) => {
        const v = parseFloat(row.unpaidLeaveDays || '0');
        return (
          <span style={{ fontSize: 12, color: v > 0 ? '#b3261e' : '#6b7480' }}>{v > 0 ? v.toFixed(1) : '—'}</span>
        );
      },
    },
    {
      id: 'lop',
      header: 'LOP Days',
      align: 'center',
      width: '90px',
      cell: (row) => {
        const v = parseFloat(row.lopDays || '0');
        return (
          <span style={{ fontSize: 12, fontWeight: v > 0 ? 600 : 400, color: v > 0 ? '#b3261e' : '#6b7480' }}>
            {v > 0 ? v.toFixed(1) : '—'}
          </span>
        );
      },
    },
    {
      id: 'overtime',
      header: 'OT Hours',
      align: 'center',
      width: '90px',
      cell: (row) => {
        const v = parseFloat(row.overtimeHours || '0');
        return (
          <span style={{ fontSize: 12, color: v > 0 ? '#3f6152' : '#6b7480' }}>{v > 0 ? v.toFixed(1) : '—'}</span>
        );
      },
    },
    {
      id: 'lopAmount',
      header: 'LOP Amount',
      align: 'right',
      width: '100px',
      cell: (row) => {
        const v = parseFloat(row.lopAmount || '0');
        return (
          <span style={{ fontSize: 12, color: v > 0 ? '#b3261e' : '#6b7480', fontWeight: v > 0 ? 600 : 400 }}>
            {v > 0 ? formatCurrency(v) : '—'}
          </span>
        );
      },
    },
  ];

  const exceptionColumns: ColumnDef<PayrollRecord>[] = [
    {
      id: 'employeeId',
      header: 'Employee ID',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7480' }}>
          {row.employeeId}
        </span>
      ),
    },
    {
      id: 'present',
      header: 'Present Days',
      align: 'center',
      cell: (row) => (
        <span style={{ fontSize: 12 }}>
          {row.presentDays != null ? parseFloat(row.presentDays).toFixed(1) : '—'}
        </span>
      ),
    },
    {
      id: 'lop',
      header: 'LOP',
      align: 'center',
      cell: (row) => {
        const v = parseFloat(row.lopDays || '0');
        return <span style={{ fontSize: 12, color: '#b3261e' }}>{v > 0 ? v.toFixed(1) : '—'}</span>;
      },
    },
    {
      id: 'net',
      header: 'Net Salary',
      align: 'right',
      cell: (row) => <span style={{ fontSize: 12 }}>{formatCurrency(row.netSalary)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => {
        const s = STATUS_BADGE[row.status] ?? { variant: 'default' as const, label: row.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      id: 'reason',
      header: 'Reason',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#b07000' }}>
          {row.status === 'HELD'
            ? 'Manually held'
            : parseFloat(row.presentDays || '0') === 0
            ? 'Zero present days'
            : 'LOP applied'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Payroll Run — ${formatPeriod(run.periodStart, run.periodEnd)}`}
        subtitle={run.id}
        actions={actionButtons}
      />

      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 8,
            color: '#b3261e',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {actionError}
        </div>
      )}

      {/* Validation panel — shown when user clicks Validate & Process */}
      {showValidation && validation && run.status === 'DRAFT' && (
        <ValidationPanel
          report={validation}
          onProcess={handleProcess}
          processing={actionLoading === 'process'}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="EMPLOYEES" value={String(records.length)} subtitle="in this run" />
        <KpiCard title="GROSS PAYROLL" value={formatCurrency(totalGross)} subtitle="total gross" />
        <KpiCard
          title="LOP DEDUCTIONS"
          value={formatCurrency(totalLop)}
          trendPositive={totalLop === 0}
          subtitle="loss of pay"
        />
        <KpiCard
          title="NET PAYROLL"
          value={formatCurrency(totalNet)}
          trendPositive
          subtitle="to disburse"
        />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}>
              Run Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Period',           value: formatPeriod(run.periodStart, run.periodEnd) },
                { label: 'Status',           value: run.status },
                { label: 'Total Employees',  value: String(records.length) },
                { label: 'Gross Payroll',    value: formatCurrency(totalGross) },
                { label: 'Total Deductions', value: formatCurrency(totalDeductions) },
                { label: 'LOP Deductions',   value: formatCurrency(totalLop) },
                { label: 'Net Payroll',      value: formatCurrency(totalNet) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7480' }}>{label}</span>
                  <span style={{ color: '#14181c', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}>
              Records by Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Pending', count: pendingCount, color: '#f59e0b' },
                { label: 'Paid',    count: paidCount,    color: '#146b41' },
                { label: 'Held',    count: heldCount,    color: '#b3261e' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 70, fontSize: 12, color: '#6b7480' }}>{label}</div>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: '#eef0f2',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: records.length > 0 ? `${(count / records.length) * 100}%` : '0%',
                        background: color,
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 28,
                      fontSize: 12,
                      color: '#14181c',
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    {count}
                  </div>
                </div>
              ))}
            </div>

            {/* LOP summary */}
            {totalLop > 0 && (
              <div
                style={{
                  marginTop: 20,
                  padding: '12px',
                  background: '#fde8e7',
                  border: '1px solid #f5c6c6',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#b3261e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  LOP Impact
                </div>
                <div style={{ fontSize: 13, color: '#b3261e', fontWeight: 600 }}>
                  {formatCurrency(totalLop)} deducted
                </div>
                <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>
                  across {records.filter((r) => parseFloat(r.lopDays || '0') > 0).length} employee
                  {records.filter((r) => parseFloat(r.lopDays || '0') > 0).length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employees tab */}
      {activeTab === 'employees' && (
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          {records.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                fontSize: 13,
                color: '#6b7480',
              }}
            >
              No employee records — process the run first.
            </div>
          ) : (
            <DataTable<PayrollRecord> columns={employeeColumns} data={records} />
          )}
        </div>
      )}

      {/* Attendance Breakdown tab */}
      {activeTab === 'attendance' && (
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          {records.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#6b7480' }}>
              Process the payroll run first to see attendance data.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #eef0f2',
                  display: 'flex',
                  gap: 20,
                  fontSize: 12,
                  color: '#6b7480',
                }}
              >
                <span>
                  <strong style={{ color: '#146b41' }}>
                    {records.reduce((s, r) => s + parseFloat(r.presentDays || '0'), 0).toFixed(1)}
                  </strong>{' '}
                  total present days
                </span>
                <span>
                  <strong style={{ color: '#b3261e' }}>
                    {records.reduce((s, r) => s + parseFloat(r.lopDays || '0'), 0).toFixed(1)}
                  </strong>{' '}
                  total LOP days
                </span>
                <span>
                  <strong style={{ color: '#2b5fa8' }}>
                    {records.reduce((s, r) => s + parseFloat(r.paidLeaveDays || '0'), 0).toFixed(1)}
                  </strong>{' '}
                  paid leave days
                </span>
                <span>
                  <strong style={{ color: '#3f6152' }}>
                    {records.reduce((s, r) => s + parseFloat(r.overtimeHours || '0'), 0).toFixed(1)}
                  </strong>{' '}
                  OT hours
                </span>
              </div>
              <DataTable<PayrollRecord> columns={attendanceColumns} data={records} />
            </>
          )}
        </div>
      )}

      {/* Exceptions tab */}
      {activeTab === 'exceptions' && (
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          {exceptions.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                fontSize: 13,
                color: '#3f6152',
                background: '#f0f9f0',
              }}
            >
              No exceptions — all records look healthy.
            </div>
          ) : (
            <DataTable<PayrollRecord> columns={exceptionColumns} data={exceptions} />
          )}
        </div>
      )}
    </div>
  );
}
