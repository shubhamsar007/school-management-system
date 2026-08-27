'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Avatar, KpiCard, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface LeaveReq { id: string; name: string; designation: string; leaveType: string; from: string; to: string; days: string; reason: string; status: string; }
interface LeaveType { id: string; name: string; code: string; daysAllowed: number; carryForward: string; paid: string; }

const LEAVE_REQS: LeaveReq[] = [
  { id: '1', name: 'Amit Joshi', designation: 'Teacher', leaveType: 'Sick Leave', from: '25 Aug 2025', to: '29 Aug 2025', days: '5', reason: 'Fever and flu', status: 'PENDING' },
  { id: '2', name: 'Suresh Menon', designation: 'Senior Teacher', leaveType: 'Casual Leave', from: '01 Sep 2025', to: '01 Sep 2025', days: '1', reason: 'Personal work', status: 'PENDING' },
  { id: '3', name: 'Deepa Rao', designation: 'Senior Teacher', leaveType: 'Medical Leave', from: '27 Aug 2025', to: '27 Aug 2025', days: '1', reason: 'Medical appointment', status: 'APPROVED' },
  { id: '4', name: 'Priya Sharma', designation: 'Senior Teacher', leaveType: 'Casual Leave', from: '15 Aug 2025', to: '15 Aug 2025', days: '1', reason: 'Independence Day travel', status: 'APPROVED' },
  { id: '5', name: 'Ravi Kumar', designation: 'Teacher', leaveType: 'Earned Leave', from: '10 Aug 2025', to: '14 Aug 2025', days: '5', reason: 'Family function', status: 'APPROVED' },
  { id: '6', name: 'Lakshmi Nair', designation: 'Teacher', leaveType: 'Sick Leave', from: '05 Aug 2025', to: '06 Aug 2025', days: '2', reason: 'Cold and cough', status: 'APPROVED' },
  { id: '7', name: 'Ananya Das', designation: 'Teacher', leaveType: 'Casual Leave', from: '02 Aug 2025', to: '02 Aug 2025', days: '1', reason: 'Personal', status: 'REJECTED' },
  { id: '8', name: 'Kiran Bhat', designation: 'Teacher', leaveType: 'Earned Leave', from: '20 Jul 2025', to: '25 Jul 2025', days: '6', reason: 'Vacation', status: 'APPROVED' },
];

const LEAVE_TYPES: LeaveType[] = [
  { id: '1', name: 'Casual Leave', code: 'CL', daysAllowed: 12, carryForward: 'YES', paid: 'YES' },
  { id: '2', name: 'Sick Leave', code: 'SL', daysAllowed: 10, carryForward: 'NO', paid: 'YES' },
  { id: '3', name: 'Earned Leave', code: 'EL', daysAllowed: 15, carryForward: 'YES', paid: 'YES' },
  { id: '4', name: 'Medical Leave', code: 'ML', daysAllowed: 30, carryForward: 'NO', paid: 'YES' },
  { id: '5', name: 'Maternity Leave', code: 'MAT', daysAllowed: 180, carryForward: 'NO', paid: 'YES' },
  { id: '6', name: 'Paternity Leave', code: 'PAT', daysAllowed: 15, carryForward: 'NO', paid: 'YES' },
];

const STATUS_BADGE: Record<string, 'active' | 'pending' | 'left' | 'default'> = { PENDING: 'pending', APPROVED: 'active', REJECTED: 'left', CANCELLED: 'default' };
const TABS = [{ id: 'requests', label: 'Leave Requests', count: 16 }, { id: 'leave-types', label: 'Leave Types', count: 6 }];
const STATUS_OPTIONS = [{ label: 'All Statuses', value: 'all' }, { label: 'Pending', value: 'PENDING' }, { label: 'Approved', value: 'APPROVED' }, { label: 'Rejected', value: 'REJECTED' }];
const TYPE_OPTIONS = [{ label: 'All Types', value: 'all' }, { label: 'Sick Leave', value: 'Sick Leave' }, { label: 'Casual Leave', value: 'Casual Leave' }, { label: 'Earned Leave', value: 'Earned Leave' }, { label: 'Medical Leave', value: 'Medical Leave' }];

export default function LeavePage() {
  const [activeTab, setActiveTab] = React.useState('requests');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const requestColumns: ColumnDef<LeaveReq>[] = [
    { id: 'name', header: 'EMPLOYEE', width: 'minmax(160px,1.4fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size="md" /><div><div className="text-sm font-medium">{r.name}</div><div className="text-[11px] text-[#8a929b]">{r.designation}</div></div></div> },
    { id: 'leaveType', header: 'LEAVE TYPE', width: '120px', accessor: 'leaveType' },
    { id: 'from', header: 'FROM', width: '100px', accessor: 'from' },
    { id: 'to', header: 'TO', width: '100px', accessor: 'to' },
    { id: 'days', header: 'DAYS', width: '60px', align: 'center', accessor: 'days' },
    { id: 'reason', header: 'REASON', width: '160px', cell: (r) => <span className="truncate text-sm text-[#6b7480]">{r.reason}</span> },
    { id: 'status', header: 'STATUS', width: '100px', cell: (r) => <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge> },
    {
      id: 'actions', header: 'ACTIONS', width: '110px', align: 'right',
      cell: (r) => r.status === 'PENDING'
        ? <div className="flex justify-end gap-1.5 text-xs font-medium"><button className="text-[#146b41]">Approve</button><span className="text-[#d7dce1]">|</span><button className="text-[#b3261e]">Reject</button></div>
        : <button className="text-xs font-medium text-[#2b5fa8]">View</button>,
    },
  ];

  const typeColumns: ColumnDef<LeaveType>[] = [
    { id: 'name', header: 'TYPE NAME', width: '150px', accessor: 'name' },
    { id: 'code', header: 'CODE', width: '80px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.code}</span> },
    { id: 'daysAllowed', header: 'DAYS ALLOWED', width: '120px', align: 'center', accessor: (r) => `${r.daysAllowed} days` },
    { id: 'carryForward', header: 'CARRY FORWARD', width: '130px', cell: (r) => <Badge variant={r.carryForward === 'YES' ? 'active' : 'default'}>{r.carryForward}</Badge> },
    { id: 'paid', header: 'PAID', width: '80px', cell: (r) => <Badge variant={r.paid === 'YES' ? 'active' : 'left'}>{r.paid}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '90px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>Edit</button><span className="text-[#d7dce1]">|</span><button>Delete</button></div> },
  ];

  const filtered = LEAVE_REQS.filter((r) => (statusFilter === 'all' || r.status === statusFilter) && (typeFilter === 'all' || r.leaveType === typeFilter));

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Employee leave requests and approvals"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={LEAVE_REQS} filename="leave-requests" formats={['csv', 'excel']}
              columns={[{ header: 'Employee', accessor: 'name' }, { header: 'Type', accessor: 'leaveType' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary">{activeTab === 'requests' ? '+ Add Request' : '+ Add Leave Type'}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="PENDING REQUESTS" value="4" trend="requires action" trendPositive={false} />
        <KpiCard title="APPROVED THIS MONTH" value="12" trend="of 16" trendPositive subtitle="requests" />
        <KpiCard title="REJECTED" value="2" subtitle="this month" />
        <KpiCard title="LEAVE TYPES" value="6" subtitle="configured" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {activeTab === 'requests' && (
          <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
            <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
            <Dropdown label="Leave Type" value={typeFilter} options={TYPE_OPTIONS} onChange={setTypeFilter} />
            <div className="flex-1" />
          </div>
        )}

        {activeTab === 'requests' && <DataTable columns={requestColumns} data={filtered} />}
        {activeTab === 'leave-types' && <DataTable columns={typeColumns} data={LEAVE_TYPES} />}

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize} total={activeTab === 'requests' ? filtered.length : LEAVE_TYPES.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
