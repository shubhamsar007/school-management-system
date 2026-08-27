'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, SearchBar, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface Invoice { id: string; invoiceNo: string; student: string; cls: string; amount: string; dueDate: string; status: string; }
interface Payment { id: string; receiptNo: string; student: string; amount: string; mode: string; date: string; status: string; }
interface FeeStructure { id: string; name: string; academicYear: string; cls: string; totalAmount: string; lineItems: number; status: string; }

const INVOICES: Invoice[] = [
  { id: '1', invoiceNo: 'INV-2024-0001', student: 'Aarav Mehta', cls: 'Grade 8·B', amount: '₹12,500', dueDate: '15 Aug 2024', status: 'PAID' },
  { id: '2', invoiceNo: 'INV-2024-0002', student: 'Diya Krishnan', cls: 'Grade 8·B', amount: '₹12,500', dueDate: '15 Aug 2024', status: 'PAID' },
  { id: '3', invoiceNo: 'INV-2024-0003', student: 'Kavya Nair', cls: 'Grade 6·C', amount: '₹9,800', dueDate: '10 Aug 2024', status: 'OVERDUE' },
  { id: '4', invoiceNo: 'INV-2024-0004', student: 'Manav Sethi', cls: 'Grade 11·A', amount: '₹18,200', dueDate: '20 Aug 2024', status: 'PARTIALLY_PAID' },
  { id: '5', invoiceNo: 'INV-2024-0005', student: 'Rohan Desai', cls: 'Grade 9·A', amount: '₹15,200', dueDate: '05 Aug 2024', status: 'OVERDUE' },
  { id: '6', invoiceNo: 'INV-2024-0006', student: 'Sneha Iyer', cls: 'Grade 11·B', amount: '₹18,200', dueDate: '25 Aug 2024', status: 'ISSUED' },
  { id: '7', invoiceNo: 'INV-2024-0007', student: 'Ishaan Bose', cls: 'Grade 9·A', amount: '₹15,200', dueDate: '30 Aug 2024', status: 'ISSUED' },
  { id: '8', invoiceNo: 'INV-2024-0008', student: 'Saanvi Deshpande', cls: 'Grade 7·A', amount: '₹11,000', dueDate: '01 Sep 2024', status: 'ISSUED' },
];

const PAYMENTS: Payment[] = [
  { id: '1', receiptNo: 'RCP-2024-0001', student: 'Aarav Mehta', amount: '₹12,500', mode: 'ONLINE', date: '12 Aug 2024', status: 'CONFIRMED' },
  { id: '2', receiptNo: 'RCP-2024-0002', student: 'Diya Krishnan', amount: '₹12,500', mode: 'CASH', date: '13 Aug 2024', status: 'CONFIRMED' },
  { id: '3', receiptNo: 'RCP-2024-0003', student: 'Ishaan Bose', amount: '₹15,200', mode: 'CHEQUE', date: '10 Aug 2024', status: 'CONFIRMED' },
  { id: '4', receiptNo: 'RCP-2024-0004', student: 'Manav Sethi', amount: '₹10,000', mode: 'ONLINE', date: '18 Aug 2024', status: 'CONFIRMED' },
  { id: '5', receiptNo: 'RCP-2024-0005', student: 'Saanvi Deshpande', amount: '₹11,000', mode: 'CASH', date: '22 Aug 2024', status: 'CONFIRMED' },
  { id: '6', receiptNo: 'RCP-2024-0006', student: 'Vihaan Gupta', amount: '₹18,200', mode: 'ONLINE', date: '25 Aug 2024', status: 'PENDING' },
  { id: '7', receiptNo: 'RCP-2024-0007', student: 'Priya Nair', amount: '₹9,800', mode: 'DD', date: '28 Aug 2024', status: 'FAILED' },
  { id: '8', receiptNo: 'RCP-2024-0008', student: 'Rohan Desai', amount: '₹5,000', mode: 'CASH', date: '27 Aug 2024', status: 'CONFIRMED' },
];

const FEE_STRUCTURES: FeeStructure[] = [
  { id: '1', name: 'Grade 6 Structure 2024–25', academicYear: '2024–25', cls: 'Grade 6', totalAmount: '₹9,800', lineItems: 4, status: 'PUBLISHED' },
  { id: '2', name: 'Grade 7 Structure 2024–25', academicYear: '2024–25', cls: 'Grade 7', totalAmount: '₹11,000', lineItems: 4, status: 'PUBLISHED' },
  { id: '3', name: 'Grade 8 Structure 2024–25', academicYear: '2024–25', cls: 'Grade 8', totalAmount: '₹12,500', lineItems: 5, status: 'PUBLISHED' },
  { id: '4', name: 'Grade 9 Structure 2024–25', academicYear: '2024–25', cls: 'Grade 9', totalAmount: '₹15,200', lineItems: 5, status: 'PUBLISHED' },
  { id: '5', name: 'Grade 11 Structure 2024–25', academicYear: '2024–25', cls: 'Grade 11', totalAmount: '₹18,200', lineItems: 6, status: 'PUBLISHED' },
  { id: '6', name: 'Grade 12 Draft 2025–26', academicYear: '2025–26', cls: 'Grade 12', totalAmount: '₹20,000', lineItems: 6, status: 'DRAFT' },
];

const INV_BADGE: Record<string, 'active' | 'pending' | 'default' | 'left'> = { PAID: 'active', ISSUED: 'pending', PARTIALLY_PAID: 'default', OVERDUE: 'left', CANCELLED: 'left' };
const PAY_MODE_BADGE: Record<string, 'active' | 'graduated' | 'default'> = { CASH: 'active', ONLINE: 'graduated', CHEQUE: 'default', DD: 'default' };
const PAY_STATUS_BADGE: Record<string, 'active' | 'pending' | 'left' | 'default'> = { CONFIRMED: 'active', PENDING: 'pending', FAILED: 'left', REFUNDED: 'default' };

const TABS = [{ id: 'invoices', label: 'Invoices', count: 234 }, { id: 'payments', label: 'Payments', count: 189 }, { id: 'fee-structures', label: 'Fee Structures', count: 8 }];
const STATUS_OPTIONS = [{ label: 'All Statuses', value: 'all' }, { label: 'Issued', value: 'ISSUED' }, { label: 'Partially Paid', value: 'PARTIALLY_PAID' }, { label: 'Paid', value: 'PAID' }, { label: 'Overdue', value: 'OVERDUE' }];
const MODE_OPTIONS = [{ label: 'All Modes', value: 'all' }, { label: 'Cash', value: 'CASH' }, { label: 'Online', value: 'ONLINE' }, { label: 'Cheque', value: 'CHEQUE' }, { label: 'DD', value: 'DD' }];

export default function FinancePage() {
  const [activeTab, setActiveTab] = React.useState('invoices');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [modeFilter, setModeFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selected, setSelected] = React.useState<Invoice[]>([]);

  const ActionsCell = () => (
    <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
      <button className="hover:underline">View</button>
      <span className="text-[#d7dce1]">|</span>
      <button className="hover:underline">Record Payment</button>
    </div>
  );

  const invoiceColumns: ColumnDef<Invoice>[] = [
    { id: 'invoiceNo', header: 'INVOICE NO', width: '130px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.invoiceNo}</span> },
    { id: 'student', header: 'STUDENT', width: '160px', accessor: 'student' },
    { id: 'cls', header: 'CLASS', width: '100px', accessor: 'cls' },
    { id: 'amount', header: 'AMOUNT', width: '100px', align: 'right', accessor: 'amount' },
    { id: 'dueDate', header: 'DUE DATE', width: '100px', accessor: 'dueDate' },
    { id: 'status', header: 'STATUS', width: '110px', cell: (r) => <Badge variant={INV_BADGE[r.status] ?? 'default'}>{r.status.replace('_', ' ')}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '140px', align: 'right', cell: ActionsCell },
  ];

  const paymentColumns: ColumnDef<Payment>[] = [
    { id: 'receiptNo', header: 'RECEIPT NO', width: '130px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.receiptNo}</span> },
    { id: 'student', header: 'STUDENT', width: '150px', accessor: 'student' },
    { id: 'amount', header: 'AMOUNT', width: '100px', align: 'right', accessor: 'amount' },
    { id: 'mode', header: 'MODE', width: '90px', cell: (r) => <Badge variant={PAY_MODE_BADGE[r.mode] ?? 'default'}>{r.mode}</Badge> },
    { id: 'date', header: 'DATE', width: '100px', accessor: 'date' },
    { id: 'status', header: 'STATUS', width: '110px', cell: (r) => <Badge variant={PAY_STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '70px', align: 'right', cell: () => <button className="text-xs font-medium text-[#2b5fa8] hover:underline">View</button> },
  ];

  const feeStructureColumns: ColumnDef<FeeStructure>[] = [
    { id: 'name', header: 'STRUCTURE NAME', width: '200px', accessor: 'name' },
    { id: 'academicYear', header: 'ACADEMIC YEAR', width: '130px', accessor: 'academicYear' },
    { id: 'cls', header: 'CLASS', width: '100px', accessor: 'cls' },
    { id: 'totalAmount', header: 'TOTAL AMOUNT', width: '120px', align: 'right', accessor: 'totalAmount' },
    { id: 'lineItems', header: 'LINE ITEMS', width: '90px', align: 'center', accessor: (r) => r.lineItems },
    { id: 'status', header: 'STATUS', width: '90px', cell: (r) => <Badge variant={r.status === 'PUBLISHED' ? 'active' : 'default'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '110px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>View</button><span className="text-[#d7dce1]">|</span><button>Edit</button></div> },
  ];

  const filteredInvoices = INVOICES.filter((i) => (statusFilter === 'all' || i.status === statusFilter) && (!search || i.student.toLowerCase().includes(search.toLowerCase()) || i.invoiceNo.toLowerCase().includes(search.toLowerCase())));
  const filteredPayments = PAYMENTS.filter((p) => (modeFilter === 'all' || p.mode === modeFilter) && (!search || p.student.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <PageHeader
        title="Fee Management"
        subtitle="Invoices, payments, and fee structures · 2024–25"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={INVOICES} filename="invoices" formats={['csv', 'excel']}
              columns={[{ header: 'Invoice No', accessor: 'invoiceNo' }, { header: 'Student', accessor: 'student' }, { header: 'Amount', accessor: 'amount' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary">+ Add Invoice</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TOTAL BILLED" value="₹48.2L" subtitle="this term" />
        <KpiCard title="COLLECTED" value="₹37.8L" trend="78.4%" trendPositive subtitle="of billed" />
        <KpiCard title="OUTSTANDING" value="₹10.4L" trend="−₹2.1L" trendPositive={false} subtitle="vs last month" />
        <KpiCard title="OVERDUE INVOICES" value="23" trend="5 critical" trendPositive={false} />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar placeholder="Search…" value={search} onChange={setSearch} className="w-64" />
          {activeTab === 'invoices' && <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />}
          {activeTab === 'payments' && <Dropdown label="Mode" value={modeFilter} options={MODE_OPTIONS} onChange={setModeFilter} />}
          <div className="flex-1" />
          <ExportButton label="Export" data={(activeTab === 'invoices' ? filteredInvoices : PAYMENTS) as unknown[]} filename={activeTab} formats={['csv', 'excel']}
            columns={[{ header: 'Student', accessor: (r: unknown) => String((r as { student: string }).student) }]} />
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b border-[#e2ebf6] bg-[#f3f7fc] px-4 py-2.5 text-sm">
            <span className="font-medium">{selected.length} selected</span>
            <span className="text-[#6b7480]">·</span>
            <button className="font-medium text-[#2b5fa8]">Export Selected</button>
            <div className="flex-1" />
            <button className="text-[#6b7480]" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}

        {activeTab === 'invoices' && <DataTable columns={invoiceColumns} data={filteredInvoices} selectable onSelectionChange={setSelected} />}
        {activeTab === 'payments' && <DataTable columns={paymentColumns} data={filteredPayments} />}
        {activeTab === 'fee-structures' && <DataTable columns={feeStructureColumns} data={FEE_STRUCTURES} />}

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize}
            total={activeTab === 'invoices' ? filteredInvoices.length : activeTab === 'payments' ? filteredPayments.length : FEE_STRUCTURES.length}
            onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
