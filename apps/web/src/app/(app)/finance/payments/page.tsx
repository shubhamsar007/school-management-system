'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, DataTable, Dropdown, Spinner, EmptyState, Modal } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { financeApi, formatCurrency, formatDate, type FeePayment } from '@/lib/finance-api';
import { RecordPaymentModal } from './_components/record-payment-modal';

type BadgeVariant = 'active' | 'pending' | 'left' | 'graduated' | 'default';

const METHOD_BADGE: Record<string, BadgeVariant> = {
  CASH: 'active',
  UPI: 'graduated',
  ONLINE: 'graduated',
  CHEQUE: 'default',
  DD: 'default',
  NEFT: 'default',
  CARD: 'graduated',
};

const STATUS_BADGE: Record<string, BadgeVariant> = {
  CONFIRMED: 'active',
  PENDING: 'pending',
  FAILED: 'left',
  REFUNDED: 'graduated',
};

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const METHOD_OPTIONS = [
  { label: 'All Methods', value: 'all' },
  { label: 'Cash', value: 'CASH' },
  { label: 'UPI', value: 'UPI' },
  { label: 'Online', value: 'ONLINE' },
  { label: 'Cheque', value: 'CHEQUE' },
  { label: 'DD', value: 'DD' },
  { label: 'NEFT', value: 'NEFT' },
  { label: 'Card', value: 'CARD' },
];

function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function isSameWeek(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  const startOfWeek = new Date(ref);
  startOfWeek.setDate(ref.getDate() - ref.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState<FeePayment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [methodFilter, setMethodFilter] = React.useState('all');
  const [showRecord, setShowRecord] = React.useState(false);
  const [viewPayment, setViewPayment] = React.useState<FeePayment | null>(null);

  const today = new Date();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await financeApi.payments.list(params);
      setPayments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmedPayments = React.useMemo(
    () => payments.filter((p) => p.status === 'CONFIRMED'),
    [payments]
  );

  const todayTotal = confirmedPayments
    .filter((p) => isSameDay(p.paymentDate, today))
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
  const weekTotal = confirmedPayments
    .filter((p) => isSameWeek(p.paymentDate, today))
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
  const monthTotal = confirmedPayments
    .filter((p) => isSameMonth(p.paymentDate, today))
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0);

  const filtered = React.useMemo(() => {
    let rows = payments;
    if (methodFilter !== 'all') rows = rows.filter((p) => p.paymentMethod === methodFilter);
    return rows;
  }, [payments, methodFilter]);

  const columns: ColumnDef<FeePayment>[] = [
    {
      id: 'receipt',
      header: 'RECEIPT NO',
      width: '140px',
      cell: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#2b5fa8' }}>
          {r.receiptNumber}
        </span>
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
      id: 'amount',
      header: 'AMOUNT',
      width: '100px',
      align: 'right',
      cell: (r) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>
          {formatCurrency(r.amount)}
        </span>
      ),
    },
    {
      id: 'method',
      header: 'METHOD',
      width: '100px',
      cell: (r) => (
        <Badge variant={METHOD_BADGE[r.paymentMethod] ?? 'default'}>
          {r.paymentMethod}
        </Badge>
      ),
    },
    {
      id: 'date',
      header: 'DATE',
      width: '100px',
      cell: (r) => <span style={{ fontSize: 13, color: '#6d746e' }}>{formatDate(r.paymentDate)}</span>,
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => (
        <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>
          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '70px',
      align: 'right',
      cell: (r) => (
        <button
          onClick={() => setViewPayment(r)}
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
        title="Payments & Collections"
        subtitle="All fee payments received"
        actions={
          <Button variant="primary" onClick={() => setShowRecord(true)}>
            Record Payment
          </Button>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "TODAY'S COLLECTIONS", value: todayTotal },
          { label: 'THIS WEEK', value: weekTotal },
          { label: 'THIS MONTH', value: monthTotal },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: '#fff',
              border: '1px solid #e6e8eb',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6d746e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#3f6152', marginTop: 4 }}>
              {formatCurrency(value)}
            </div>
            <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>confirmed only</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <Dropdown
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
          <Dropdown
            label="Method"
            value={methodFilter}
            options={METHOD_OPTIONS}
            onChange={setMethodFilter}
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
            title="No payments found"
            description={
              statusFilter !== 'all' || methodFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Record your first payment to get started.'
            }
            action={
              statusFilter === 'all' && methodFilter === 'all' ? (
                <Button variant="primary" onClick={() => setShowRecord(true)}>
                  Record Payment
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      <RecordPaymentModal
        open={showRecord}
        onClose={() => setShowRecord(false)}
        onSaved={load}
      />

      {/* View Payment Modal */}
      <Modal
        open={viewPayment !== null}
        onClose={() => setViewPayment(null)}
        title={`Payment ${viewPayment?.receiptNumber ?? ''}`}
        description={`Student: ${viewPayment?.studentId ?? ''} · ${viewPayment ? formatDate(viewPayment.paymentDate) : ''}`}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setViewPayment(null)}>
            Close
          </Button>
        }
      >
        {viewPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Amount', value: formatCurrency(viewPayment.amount) },
                { label: 'Method', value: viewPayment.paymentMethod },
                { label: 'Date', value: formatDate(viewPayment.paymentDate) },
                { label: 'Status', value: viewPayment.status },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#8a929b', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#2c322f' }}>{value}</div>
                </div>
              ))}
            </div>

            {viewPayment.transactionReference && (
              <div>
                <div style={{ fontSize: 11, color: '#8a929b', marginBottom: 2 }}>Transaction Reference</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#2c322f' }}>
                  {viewPayment.transactionReference}
                </div>
              </div>
            )}

            {(viewPayment.allocations ?? []).length > 0 && (
              <div style={{ borderTop: '1px solid #f0f2f4', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', marginBottom: 8 }}>
                  Invoice Allocations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(viewPayment.allocations ?? []).map((alloc) => (
                    <div
                      key={alloc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: '#f8f8f8',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', color: '#6d746e' }}>
                        {alloc.invoiceId.slice(0, 12)}…
                      </span>
                      <span style={{ fontWeight: 600, color: '#2c322f' }}>
                        {formatCurrency(alloc.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
