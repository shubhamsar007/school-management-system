'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { KpiCard, DataTable, Spinner, EmptyState } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { financeApi, formatCurrency, formatDate, type FeeInvoice } from '@/lib/finance-api';

function daysBetween(dateStr: string, ref: Date): number {
  const d = new Date(dateStr);
  const diff = ref.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function OverduesPage() {
  const [invoices, setInvoices] = React.useState<FeeInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const today = new Date();

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await financeApi.invoices.list({ status: 'OVERDUE' });
        setInvoices(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load overdue invoices');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const withDays = React.useMemo(
    () =>
      invoices
        .map((inv) => ({ ...inv, daysOverdue: daysBetween(inv.dueDate, today) }))
        .sort((a, b) => b.daysOverdue - a.daysOverdue),
    [invoices] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const bucket1to30 = withDays.filter((i) => i.daysOverdue >= 1 && i.daysOverdue <= 30).length;
  const bucket31to60 = withDays.filter((i) => i.daysOverdue >= 31 && i.daysOverdue <= 60).length;
  const bucket61to90 = withDays.filter((i) => i.daysOverdue >= 61 && i.daysOverdue <= 90).length;
  const bucket90plus = withDays.filter((i) => i.daysOverdue > 90).length;

  const totalOverdueAmount = withDays.reduce((s, inv) => s + parseFloat(inv.total || '0'), 0);

  const columns: ColumnDef<FeeInvoice & { daysOverdue: number }>[] = [
    {
      id: 'invoiceNumber',
      header: 'INVOICE NO',
      width: '140px',
      cell: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6d746e' }}>
          {r.invoiceNumber}
        </span>
      ),
    },
    {
      id: 'student',
      header: 'STUDENT ID',
      width: '140px',
      cell: (r) => (
        <span style={{ fontSize: 12, color: '#6d746e', fontFamily: 'monospace' }}>
          {r.studentId?.length > 14 ? `${r.studentId.slice(0, 10)}…` : r.studentId}
        </span>
      ),
    },
    {
      id: 'dueDate',
      header: 'DUE DATE',
      width: '110px',
      cell: (r) => (
        <span style={{ fontSize: 13, color: '#b3261e', fontWeight: 500 }}>
          {formatDate(r.dueDate)}
        </span>
      ),
    },
    {
      id: 'daysOverdue',
      header: 'DAYS OVERDUE',
      width: '120px',
      align: 'center',
      cell: (r) => {
        const days = r.daysOverdue;
        const color = days > 90 ? '#7b0000' : days > 60 ? '#b3261e' : days > 30 ? '#c65000' : '#8a6500';
        return (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color,
              padding: '2px 8px',
              borderRadius: 12,
              background: `${color}15`,
            }}
          >
            {days}d
          </span>
        );
      },
    },
    {
      id: 'total',
      header: 'AMOUNT',
      width: '110px',
      align: 'right',
      cell: (r) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#b3261e' }}>
          {formatCurrency(r.total)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '90px',
      align: 'right',
      cell: () => (
        <button
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#2b5fa8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overdues & Collections"
        subtitle="Monitor and follow up on overdue invoices"
      />

      {/* Aging breakdown cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: '#fff',
            border: '1px solid #e6e8eb',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6d746e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            1–30 DAYS
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#8a6500', marginTop: 4 }}>
            {bucket1to30}
          </div>
          <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>invoices</div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: '#fff',
            border: '1px solid #e6e8eb',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6d746e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            31–60 DAYS
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#c65000', marginTop: 4 }}>
            {bucket31to60}
          </div>
          <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>invoices</div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: '#fff',
            border: '1px solid #e6e8eb',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6d746e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            61–90 DAYS
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#b3261e', marginTop: 4 }}>
            {bucket61to90}
          </div>
          <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>invoices</div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#b3261e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            90+ DAYS
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#7b0000', marginTop: 4 }}>
            {bucket90plus}
          </div>
          <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>critical</div>
        </div>
      </div>

      {/* Summary KPI */}
      {withDays.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <KpiCard
            title="TOTAL OVERDUE"
            value={String(withDays.length)}
            trendPositive={false}
            subtitle="invoices pending"
          />
          <KpiCard
            title="OVERDUE AMOUNT"
            value={formatCurrency(totalOverdueAmount)}
            trendPositive={false}
            subtitle="to recover"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: '16px 20px', color: '#b3261e', fontSize: 13 }}>{error}</div>
        ) : withDays.length === 0 ? (
          <EmptyState
            title="No overdue invoices"
            description="All invoices are up to date. Great work!"
          />
        ) : (
          <DataTable columns={columns} data={withDays} />
        )}
      </div>
    </div>
  );
}
