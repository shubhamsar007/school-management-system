'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Spinner, DataTable, Tabs, Pagination, EmptyState } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { payrollApi, formatPeriod, type PayrollRun } from '@/lib/payroll-api';
import { Plus, PlayCircle } from 'lucide-react';

const STATUS_BADGE: Record<PayrollRun['status'], { variant: 'active' | 'pending' | 'default' | 'graduated' | 'left'; label: string }> = {
  PAID: { variant: 'active', label: 'Paid' },
  APPROVED: { variant: 'graduated', label: 'Approved' },
  COMPLETED: { variant: 'pending', label: 'Completed' },
  PROCESSING: { variant: 'pending', label: 'Processing' },
  DRAFT: { variant: 'default', label: 'Draft' },
};

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PAID', label: 'Paid' },
];

export default function PayrollRunsPage() {
  const [runs, setRuns] = React.useState<PayrollRun[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [periodStart, setPeriodStart] = React.useState('');
  const [periodEnd, setPeriodEnd] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function loadRuns() {
    try {
      const data = await payrollApi.runs.list();
      setRuns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadRuns();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!periodStart || !periodEnd) {
      setCreateError('Both period start and end dates are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await payrollApi.runs.create({ periodStart, periodEnd });
      setPeriodStart('');
      setPeriodEnd('');
      setShowCreateForm(false);
      await loadRuns();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create payroll run');
    } finally {
      setCreating(false);
    }
  }

  async function handleProcess(id: string) {
    setActionLoading(id + '-process');
    setActionError(null);
    try {
      await payrollApi.runs.process(id);
      await loadRuns();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to process run');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id + '-approve');
    setActionError(null);
    try {
      await payrollApi.runs.approve(id);
      await loadRuns();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to approve run');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkPaid(id: string) {
    setActionLoading(id + '-markpaid');
    setActionError(null);
    try {
      await payrollApi.runs.markPaid(id);
      await loadRuns();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to mark run as paid');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    activeTab === 'all' ? runs : runs.filter((r) => r.status === activeTab);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnDef<PayrollRun>[] = [
    {
      id: 'runId',
      header: 'Run ID',
      width: '140px',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7480' }}>
          {row.id.slice(0, 8)}…
        </span>
      ),
    },
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
      width: '100px',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#6b7480' }}>{row._count?.records ?? '—'}</span>
      ),
    },
    {
      id: 'gross',
      header: 'Gross',
      align: 'right',
      width: '100px',
      cell: () => <span style={{ fontSize: 12, color: '#6b7480' }}>—</span>,
    },
    {
      id: 'net',
      header: 'Net',
      align: 'right',
      width: '100px',
      cell: () => <span style={{ fontSize: 12, color: '#6b7480' }}>—</span>,
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      cell: (row) => {
        const s = STATUS_BADGE[row.status] ?? { variant: 'default' as const, label: row.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '200px',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/payroll/runs/${row.id}`}>
            <Button variant="secondary" size="sm">View</Button>
          </Link>
          {row.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              disabled={actionLoading === row.id + '-process'}
              onClick={() => handleProcess(row.id)}
            >
              {actionLoading === row.id + '-process' ? '…' : 'Process'}
            </Button>
          )}
          {row.status === 'COMPLETED' && (
            <Button
              variant="primary"
              size="sm"
              disabled={actionLoading === row.id + '-approve'}
              onClick={() => handleApprove(row.id)}
            >
              {actionLoading === row.id + '-approve' ? '…' : 'Approve'}
            </Button>
          )}
          {row.status === 'APPROVED' && (
            <Button
              variant="primary"
              size="sm"
              disabled={actionLoading === row.id + '-markpaid'}
              onClick={() => handleMarkPaid(row.id)}
            >
              {actionLoading === row.id + '-markpaid' ? '…' : 'Mark Paid'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        subtitle="Manage and process payroll runs"
        actions={
          <Button variant="primary" onClick={() => setShowCreateForm((v) => !v)}>
            <Plus size={14} style={{ marginRight: 6 }} />
            Create Run
          </Button>
        }
      />

      {error && (
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
          {error}
        </div>
      )}

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

      {/* Create Run inline panel */}
      {showCreateForm && (
        <div
          style={{
            padding: '20px 24px',
            marginBottom: 16,
            background: '#fff',
            border: '1px solid #e6e8eb',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}>
            New Payroll Run
          </div>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', display: 'block', marginBottom: 6 }}>
                  PERIOD START
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#14181c',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', display: 'block', marginBottom: 6 }}>
                  PERIOD END
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#14181c',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            {createError && (
              <div style={{ fontSize: 12, color: '#b3261e', marginBottom: 12 }}>{createError}</div>
            )}
            <div className="flex gap-2">
              <Button variant="primary" type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create Payroll Run'}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <Tabs
        tabs={STATUS_TABS}
        activeTab={activeTab}
        onChange={(id) => { setActiveTab(id); setPage(1); }}
        className="mb-4"
      />

      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<PlayCircle size={32} style={{ color: '#8a929b' }} />}
            title="No payroll runs yet"
            description="Create your first payroll run to get started."
          />
        ) : (
          <>
            <DataTable<PayrollRun> columns={columns} data={paged} />
            {filtered.length > pageSize && (
              <div className="border-t border-[#eef0f2] p-3">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={filtered.length}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
