'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, KpiCard, Spinner, Badge, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { payrollApi, formatCurrency, formatPeriod, type PayrollRun } from '@/lib/payroll-api';
import { AlertTriangle, PlayCircle } from 'lucide-react';

const STATUS_BADGE: Record<PayrollRun['status'], { variant: 'active' | 'pending' | 'default' | 'graduated' | 'left'; label: string }> = {
  PAID: { variant: 'active', label: 'Paid' },
  APPROVED: { variant: 'graduated', label: 'Approved' },
  COMPLETED: { variant: 'pending', label: 'Completed' },
  PROCESSING: { variant: 'pending', label: 'Processing' },
  DRAFT: { variant: 'default', label: 'Draft' },
};

function currentMonthYear() {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function PayrollOverviewPage() {
  const [runs, setRuns] = React.useState<PayrollRun[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const data = await payrollApi.runs.list();
        setRuns(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load payroll data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Payroll" subtitle="Payroll command centre" />
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
          {error}
        </div>
      </div>
    );
  }

  const isEmpty = runs.length === 0;
  const latestCompletedRun = runs.find((r) => r.status === 'PAID' || r.status === 'APPROVED');
  const pendingRunsCount = runs.filter((r) => r.status === 'DRAFT' || r.status === 'PROCESSING').length;
  const draftRuns = runs.filter((r) => r.status === 'DRAFT');
  const recentRuns = runs.slice(0, 6);

  const columns: ColumnDef<PayrollRun>[] = [
    {
      id: 'period',
      header: 'Period',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#14181c' }}>
          {formatPeriod(row.periodStart, row.periodEnd)}
        </span>
      ),
    },
    {
      id: 'employees',
      header: 'Employees',
      align: 'center',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#6b7480' }}>{row._count?.records ?? '—'}</span>
      ),
    },
    {
      id: 'gross',
      header: 'Gross',
      align: 'right',
      cell: () => <span style={{ fontSize: 12, color: '#6b7480' }}>—</span>,
    },
    {
      id: 'net',
      header: 'Net',
      align: 'right',
      cell: () => <span style={{ fontSize: 12, color: '#6b7480' }}>—</span>,
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
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <Link href={`/payroll/runs/${row.id}`}>
          <Button variant="secondary" size="sm">View</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle={`Payroll command centre · ${currentMonthYear()}`}
        actions={
          <div className="flex gap-2">
            <ExportButton
              data={runs}
              columns={[
                { accessor: 'id', header: 'Run ID' },
                { accessor: 'periodStart', header: 'Period Start' },
                { accessor: 'periodEnd', header: 'Period End' },
                { accessor: 'status', header: 'Status' },
              ]}
              filename="payroll-runs"
            />
            <Link href="/payroll/runs">
              <Button variant="primary">
                <PlayCircle size={14} style={{ marginRight: 6 }} />
                Create Run
              </Button>
            </Link>
          </div>
        }
      />

      {isEmpty && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            marginBottom: 16,
            background: '#fffdf8',
            border: '1px solid #e6e1d5',
            borderRadius: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 2 }}>
              Get started with Payroll
            </div>
            <div style={{ fontSize: 12, color: '#6d746e' }}>
              Create salary components → assign salary structures → run payroll → approve &amp; pay
            </div>
          </div>
          <Link href="/payroll/runs">
            <Button variant="primary">Create First Payroll Run</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard
          title="GROSS PAYROLL"
          value={latestCompletedRun ? '—' : formatCurrency(0)}
          subtitle={latestCompletedRun ? 'latest run' : 'no completed runs'}
        />
        <KpiCard
          title="NET PAYROLL"
          value={latestCompletedRun ? '—' : formatCurrency(0)}
          subtitle={latestCompletedRun ? 'latest run' : 'no completed runs'}
        />
        <KpiCard
          title="EMPLOYEES"
          value={String(latestCompletedRun?._count?.records ?? 0)}
          subtitle={latestCompletedRun ? 'latest run' : 'no runs yet'}
        />
        <KpiCard
          title="PENDING RUNS"
          value={String(pendingRunsCount)}
          trendPositive={pendingRunsCount === 0}
          subtitle="draft or processing"
        />
      </div>

      {draftRuns.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            marginBottom: 16,
            background: '#fff8e6',
            border: '1px solid #ffe8a0',
            borderRadius: 10,
          }}
        >
          <AlertTriangle size={16} style={{ color: '#b07000', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: '#b07000' }}>
            <strong>{draftRuns.length}</strong> payroll run{draftRuns.length !== 1 ? 's' : ''} in Draft — process them to compute salaries.
          </div>
          <Link href="/payroll/runs" style={{ marginLeft: 'auto' }}>
            <Button variant="secondary" size="sm">View Runs</Button>
          </Link>
        </div>
      )}

      {!isEmpty && (
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eef0f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>Recent Payroll Runs</h3>
            <Link href="/payroll/runs">
              <span style={{ fontSize: 12, color: '#2b5fa8', cursor: 'pointer' }}>View all →</span>
            </Link>
          </div>
          <DataTable<PayrollRun> columns={columns} data={recentRuns} />
        </div>
      )}
    </div>
  );
}
