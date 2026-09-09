'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Spinner, DataTable, EmptyState } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { payrollApi, formatPeriod, type PayrollRun } from '@/lib/payroll-api';
import { Users } from 'lucide-react';

export default function PayrollEmployeesPage() {
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

  const columns: ColumnDef<PayrollRun>[] = [
    {
      id: 'period',
      header: 'Period',
      cell: (row) => (
        <span style={{ fontSize: 13, color: '#14181c' }}>
          {formatPeriod(row.periodStart, row.periodEnd)}
        </span>
      ),
    },
    {
      id: 'employees',
      header: 'Employees',
      align: 'center',
      width: '110px',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#6b7480' }}>{row._count?.records ?? 0}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '110px',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#6b7480' }}>{row.status}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '90px',
      align: 'right',
      cell: (row) => (
        <Link href={`/payroll/runs/${row.id}`}>
          <Button variant="secondary" size="sm">View Run</Button>
        </Link>
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
        title="Employees"
        subtitle="Payroll assignment overview"
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

      {/* Info card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          padding: '20px 24px',
          marginBottom: 20,
          background: '#fff',
          border: '1px solid #e6e8eb',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#d8e9de',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Users size={20} style={{ color: '#3f6152' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2c322f', marginBottom: 4 }}>
            Employee Management
          </div>
          <div style={{ fontSize: 13, color: '#6b7480', lineHeight: 1.6 }}>
            Employee management is handled in the Teachers &amp; Staff module. Use this view to check
            payroll assignments and see how many employees were included in each payroll run.
          </div>
        </div>
      </div>

      {/* Payroll runs reference */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e6e8eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0f2' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>Payroll Runs</span>
          <span style={{ fontSize: 12, color: '#8a929b', marginLeft: 8 }}>
            — employee counts per run
          </span>
        </div>

        {runs.length === 0 ? (
          <EmptyState
            icon={<Users size={28} style={{ color: '#8a929b' }} />}
            title="No payroll runs yet"
            description="Create a payroll run to see employee participation."
            action={
              <Link href="/payroll/runs">
                <Button variant="primary">Create Payroll Run</Button>
              </Link>
            }
          />
        ) : (
          <DataTable<PayrollRun> columns={columns} data={runs} />
        )}
      </div>
    </div>
  );
}
