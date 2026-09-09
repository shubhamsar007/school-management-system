'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, DataTable, Dropdown, SearchBar, Spinner, EmptyState, ConfirmDialog, Modal } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { financeApi, formatCurrency, formatDate, type FeeInvoice } from '@/lib/finance-api';
import { CreateInvoiceModal } from './_components/create-invoice-modal';

type BadgeVariant = 'active' | 'pending' | 'default' | 'left';

const INV_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PAID: 'active',
  ISSUED: 'pending',
  PARTIALLY_PAID: 'default',
  OVERDUE: 'left',
  CANCELLED: 'left',
};

const INV_STATUS_LABEL: Record<string, string> = {
  PAID: 'Paid',
  ISSUED: 'Issued',
  PARTIALLY_PAID: 'Partial',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Issued', value: 'ISSUED' },
  { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<FeeInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showCreate, setShowCreate] = React.useState(false);
  const [viewInvoice, setViewInvoice] = React.useState<FeeInvoice | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<FeeInvoice | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await financeApi.invoices.list(params);
      setInvoices(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.studentId?.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await financeApi.invoices.cancel(cancelTarget.id);
      setCancelTarget(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  }

  const columns: ColumnDef<FeeInvoice>[] = [
    {
      id: 'invoiceNumber',
      header: 'INVOICE NO',
      width: '140px',
      cell: (r) => (
        <button
          onClick={() => setViewInvoice(r)}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#2b5fa8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {r.invoiceNumber}
        </button>
      ),
    },
    {
      id: 'student',
      header: 'STUDENT ID',
      width: '140px',
      cell: (r) => (
        <span style={{ fontSize: 12, color: '#6d746e', fontFamily: 'monospace' }}>
          {r.studentId?.length > 16 ? `${r.studentId.slice(0, 8)}…` : r.studentId}
        </span>
      ),
    },
    {
      id: 'invoiceDate',
      header: 'DATE',
      width: '100px',
      cell: (r) => <span style={{ fontSize: 13, color: '#6d746e' }}>{formatDate(r.invoiceDate)}</span>,
    },
    {
      id: 'dueDate',
      header: 'DUE DATE',
      width: '100px',
      cell: (r) => (
        <span
          style={{
            fontSize: 13,
            color: r.status === 'OVERDUE' ? '#b3261e' : '#6d746e',
            fontWeight: r.status === 'OVERDUE' ? 600 : 400,
          }}
        >
          {formatDate(r.dueDate)}
        </span>
      ),
    },
    {
      id: 'total',
      header: 'TOTAL',
      width: '100px',
      align: 'right',
      cell: (r) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>
          {formatCurrency(r.total)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '110px',
      cell: (r) => (
        <Badge variant={INV_STATUS_VARIANT[r.status] ?? 'default'}>
          {INV_STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '130px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button onClick={() => setViewInvoice(r)} className="hover:underline">
            View
          </button>
          {(r.status === 'ISSUED' || r.status === 'PARTIALLY_PAID') && (
            <>
              <span className="text-[#d7dce1]">|</span>
              <button
                onClick={() => setCancelTarget(r)}
                className="hover:underline text-[#b3261e]"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Student fee invoices"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + Create Invoice
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar
            placeholder="Search invoice no or student ID…"
            value={search}
            onChange={setSearch}
            className="w-72"
          />
          <Dropdown
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
          <div className="flex-1" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: '16px 20px', color: '#b3261e', fontSize: 13 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Create your first invoice to get started.'
            }
            action={
              !search && statusFilter === 'all' ? (
                <Button variant="primary" onClick={() => setShowCreate(true)}>
                  + Create Invoice
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      <CreateInvoiceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={load}
      />

      {/* View Invoice Modal */}
      <Modal
        open={viewInvoice !== null}
        onClose={() => setViewInvoice(null)}
        title={`Invoice ${viewInvoice?.invoiceNumber ?? ''}`}
        description={`Student: ${viewInvoice?.studentId ?? ''} · Due: ${viewInvoice ? formatDate(viewInvoice.dueDate) : ''}`}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setViewInvoice(null)}>
            Close
          </Button>
        }
      >
        {viewInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#8a929b' }}>Status</div>
                <Badge variant={INV_STATUS_VARIANT[viewInvoice.status] ?? 'default'}>
                  {INV_STATUS_LABEL[viewInvoice.status] ?? viewInvoice.status}
                </Badge>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8a929b' }}>Invoice Date</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(viewInvoice.invoiceDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#8a929b' }}>Due Date</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(viewInvoice.dueDate)}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f0f2f4', paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', marginBottom: 8 }}>
                Line Items
              </div>
              {(viewInvoice.items ?? []).length === 0 ? (
                <div style={{ fontSize: 12, color: '#8a929b' }}>No items</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(viewInvoice.items ?? []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: '#f8f8f8',
                        fontSize: 12,
                      }}
                    >
                      <span>{item.feeHead?.name ?? item.feeHeadId}</span>
                      <div style={{ display: 'flex', gap: 12, color: '#6d746e' }}>
                        {parseFloat(item.discount) > 0 && (
                          <span style={{ color: '#3f6152' }}>−{formatCurrency(item.discount)}</span>
                        )}
                        <span style={{ fontWeight: 600, color: '#2c322f' }}>{formatCurrency(item.netAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                background: '#d8e9de',
                fontSize: 14,
                fontWeight: 700,
                color: '#2c322f',
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(viewInvoice.total)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel Invoice"
        description={`Cancel invoice ${cancelTarget?.invoiceNumber}? This action cannot be undone.`}
        confirmLabel="Cancel Invoice"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
