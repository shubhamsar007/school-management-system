'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, DataTable, Spinner, EmptyState } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  financeApi,
  formatCurrency,
  formatDate,
  type StudentFeeAssignment,
  type FeeInvoice,
  type StudentLedger,
} from '@/lib/finance-api';

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

export default function StudentFeesPage() {
  const [studentIdInput, setStudentIdInput] = React.useState('');
  const [searchedId, setSearchedId] = React.useState<string | null>(null);
  const [ledger, setLedger] = React.useState<StudentLedger | null>(null);
  const [assignments, setAssignments] = React.useState<StudentFeeAssignment[]>([]);
  const [invoices, setInvoices] = React.useState<FeeInvoice[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function lookup(sid: string) {
    setLoading(true);
    setError(null);
    try {
      const [ledgerData, assignData, invData] = await Promise.all([
        financeApi.ledger.get(sid),
        financeApi.feeAssignments.listForStudent(sid),
        financeApi.invoices.list({ studentId: sid }),
      ]);
      setLedger(ledgerData);
      setAssignments(assignData);
      setInvoices(invData);
      setSearchedId(sid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load student fee data');
      setLedger(null);
      setAssignments([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    if (!studentIdInput.trim()) return;
    lookup(studentIdInput.trim());
  }

  async function toggleAssignment(id: string, currentStatus: 'ACTIVE' | 'INACTIVE') {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await financeApi.feeAssignments.updateStatus(id, newStatus);
      if (searchedId) lookup(searchedId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update status');
    }
  }

  const assignmentColumns: ColumnDef<StudentFeeAssignment>[] = [
    {
      id: 'structure',
      header: 'STRUCTURE',
      width: 'minmax(140px, 1.5fr)',
      cell: (r) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: '#2c322f' }}>
          {r.feeStructure?.name ?? r.feeStructureId}
        </span>
      ),
    },
    {
      id: 'effectiveFrom',
      header: 'FROM',
      width: '100px',
      cell: (r) => <span style={{ fontSize: 12, color: '#6d746e' }}>{formatDate(r.effectiveFrom)}</span>,
    },
    {
      id: 'discount',
      header: 'DISCOUNT',
      width: '100px',
      align: 'right',
      cell: (r) => (
        <span style={{ fontSize: 13, color: '#3f6152', fontWeight: 500 }}>
          {parseFloat(r.discountAmount) > 0 ? formatCurrency(r.discountAmount) : '—'}
        </span>
      ),
    },
    {
      id: 'scholarship',
      header: 'SCHOLARSHIP',
      width: '110px',
      align: 'right',
      cell: (r) => (
        <span style={{ fontSize: 13, color: '#3f6152', fontWeight: 500 }}>
          {parseFloat(r.scholarshipAmount) > 0 ? formatCurrency(r.scholarshipAmount) : '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '90px',
      cell: (r) => (
        <Badge variant={r.status === 'ACTIVE' ? 'active' : 'default'}>
          {r.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '150px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button
            onClick={() => toggleAssignment(r.id, r.status)}
            className="hover:underline"
            style={{ color: r.status === 'ACTIVE' ? '#6d746e' : '#3f6152' }}
          >
            {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  const invoiceColumns: ColumnDef<FeeInvoice>[] = [
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
      id: 'invoiceDate',
      header: 'DATE',
      width: '100px',
      cell: (r) => <span style={{ fontSize: 12, color: '#6d746e' }}>{formatDate(r.invoiceDate)}</span>,
    },
    {
      id: 'dueDate',
      header: 'DUE DATE',
      width: '100px',
      cell: (r) => (
        <span style={{ fontSize: 12, color: r.status === 'OVERDUE' ? '#b3261e' : '#6d746e' }}>
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
  ];

  return (
    <div>
      <PageHeader
        title="Student Fees"
        subtitle="Fee assignments and student ledger"
      />

      {/* Search bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, maxWidth: 400 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#6d746e', marginBottom: 6 }}>
            Search by Student ID
          </div>
          <input
            type="text"
            placeholder="Enter student ID or admission number…"
            value={studentIdInput}
            onChange={(e) => setStudentIdInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            style={{
              width: '100%',
              height: 36,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 13,
              color: '#2c322f',
              outline: 'none',
              background: '#fff',
            }}
          />
        </div>
        <Button variant="primary" onClick={handleSearch} disabled={!studentIdInput.trim()}>
          View Fees
        </Button>
      </div>

      {!searchedId && !loading && (
        <EmptyState
          title="Enter a student ID to view fee details"
          description="Search by student ID or admission number to view their fee assignments, ledger balance, and invoices."
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            padding: '14px 18px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 10,
            color: '#b3261e',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {searchedId && !loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ledger KPI cards */}
          {ledger && (
            <div className="grid grid-cols-4 gap-4">
              <KpiCard title="TOTAL BILLED" value={formatCurrency(ledger.totalBilled)} subtitle="all invoices" />
              <KpiCard title="PAID" value={formatCurrency(ledger.totalPaid)} trendPositive subtitle="confirmed payments" />
              <KpiCard
                title="REFUNDED"
                value={formatCurrency(ledger.totalRefunded)}
                subtitle="total refunded"
              />
              <KpiCard
                title="BALANCE DUE"
                value={formatCurrency(ledger.balance)}
                trendPositive={parseFloat(ledger.balance) <= 0}
                subtitle="outstanding"
              />
            </div>
          )}

          {/* Fee Assignments */}
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#2c322f',
                marginBottom: 10,
              }}
            >
              Fee Assignments
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
              {assignments.length === 0 ? (
                <EmptyState
                  title="No fee assignments"
                  description="No fee structures have been assigned to this student."
                />
              ) : (
                <DataTable columns={assignmentColumns} data={assignments} />
              )}
            </div>
          </div>

          {/* Invoices */}
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#2c322f',
                marginBottom: 10,
              }}
            >
              Invoices
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
              {invoices.length === 0 ? (
                <EmptyState
                  title="No invoices"
                  description="No invoices have been generated for this student."
                />
              ) : (
                <DataTable columns={invoiceColumns} data={invoices} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
