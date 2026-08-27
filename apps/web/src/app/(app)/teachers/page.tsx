'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  Button, Badge, Avatar, KpiCard, SearchBar, Dropdown, Pagination,
  Tabs, DataTable, ExportButton,
} from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface Teacher {
  id: string; name: string; email: string; employeeId: string;
  department: string; subjects: string; status: string; joined: string; designation: string;
}

const ALL_TEACHERS: Teacher[] = [
  { id: '1', name: 'Priya Sharma', email: 'priya.s@school.in', employeeId: 'EMP-2019-0042', department: 'Science', subjects: 'Physics · Chemistry', status: 'ACTIVE', joined: '12 Mar 2019', designation: 'Senior Teacher' },
  { id: '2', name: 'Ravi Kumar', email: 'ravi.k@school.in', employeeId: 'EMP-2021-0078', department: 'Maths', subjects: 'Mathematics', status: 'ACTIVE', joined: '05 Jun 2021', designation: 'Teacher' },
  { id: '3', name: 'Ananya Das', email: 'ananya.d@school.in', employeeId: 'EMP-2020-0055', department: 'English', subjects: 'English · Literature', status: 'ACTIVE', joined: '14 Sep 2020', designation: 'Teacher' },
  { id: '4', name: 'Suresh Menon', email: 'suresh.m@school.in', employeeId: 'EMP-2018-0023', department: 'Social Studies', subjects: 'History · Geography', status: 'ACTIVE', joined: '08 Jan 2018', designation: 'Senior Teacher' },
  { id: '5', name: 'Lakshmi Nair', email: 'lakshmi.n@school.in', employeeId: 'EMP-2022-0091', department: 'Science', subjects: 'Biology', status: 'ACTIVE', joined: '20 Jul 2022', designation: 'Teacher' },
  { id: '6', name: 'Amit Joshi', email: 'amit.j@school.in', employeeId: 'EMP-2023-0104', department: 'Maths', subjects: 'Mathematics · Statistics', status: 'ON_LEAVE', joined: '15 Feb 2023', designation: 'Teacher' },
  { id: '7', name: 'Deepa Rao', email: 'deepa.r@school.in', employeeId: 'EMP-2017-0011', department: 'Arts', subjects: 'Drawing · Crafts', status: 'ACTIVE', joined: '01 Apr 2017', designation: 'Senior Teacher' },
  { id: '8', name: 'Kiran Bhat', email: 'kiran.b@school.in', employeeId: 'EMP-2024-0112', department: 'PE', subjects: 'Physical Education', status: 'ACTIVE', joined: '10 Jan 2024', designation: 'Teacher' },
];

const STATUS_BADGE: Record<string, 'active' | 'pending' | 'left'> = { ACTIVE: 'active', ON_LEAVE: 'pending', RESIGNED: 'left' };

const DEPT_OPTIONS = [
  { label: 'All Departments', value: 'all' },
  { label: 'Science', value: 'Science' }, { label: 'Maths', value: 'Maths' },
  { label: 'English', value: 'English' }, { label: 'Social Studies', value: 'Social Studies' },
  { label: 'Arts', value: 'Arts' }, { label: 'PE', value: 'PE' },
];
const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' }, { label: 'Active', value: 'ACTIVE' },
  { label: 'On Leave', value: 'ON_LEAVE' }, { label: 'Resigned', value: 'RESIGNED' },
];
const TABS = [
  { id: 'all', label: 'All Staff', count: 87 },
  { id: 'teachers', label: 'Teachers', count: 72 },
  { id: 'admin', label: 'Admin & Support', count: 15 },
];

export default function TeachersPage() {
  const [search, setSearch] = React.useState('');
  const [dept, setDept] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [activeTab, setActiveTab] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selected, setSelected] = React.useState<Teacher[]>([]);

  const filtered = ALL_TEACHERS.filter((t) => {
    const matchSearch = search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === 'all' || t.department === dept;
    const matchStatus = status === 'all' || t.status === status;
    return matchSearch && matchDept && matchStatus;
  });

  const columns: ColumnDef<Teacher>[] = [
    {
      id: 'name', header: 'EMPLOYEE', width: 'minmax(200px,1.6fr)',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="md" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[#14181c]">{row.name}</div>
            <div className="text-[11px] text-[#8a929b]">{row.designation}</div>
          </div>
        </div>
      ),
    },
    { id: 'employeeId', header: 'EMPLOYEE ID', width: '130px', cell: (row) => <span className="font-mono text-xs text-[#6b7480]">{row.employeeId}</span> },
    { id: 'department', header: 'DEPARTMENT', width: '120px', accessor: 'department' },
    { id: 'subjects', header: 'SUBJECTS', width: '140px', cell: (row) => <span className="truncate text-sm">{row.subjects}</span> },
    { id: 'status', header: 'STATUS', width: '100px', cell: (row) => <Badge variant={STATUS_BADGE[row.status] ?? 'default'}>{row.status.replace('_', ' ')}</Badge> },
    { id: 'joined', header: 'JOINED', width: '90px', accessor: 'joined' },
    {
      id: 'actions', header: 'ACTIONS', width: '80px', align: 'right',
      cell: () => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button className="cursor-pointer hover:underline">View</button>
          <span className="text-[#d7dce1]">|</span>
          <button className="cursor-pointer hover:underline">Edit</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Teachers & Staff"
        subtitle="87 employees across departments · 2024–25"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={ALL_TEACHERS} filename="teachers" formats={['csv', 'excel']}
              columns={[{ header: 'Name', accessor: 'name' }, { header: 'Employee ID', accessor: 'employeeId' }, { header: 'Department', accessor: 'department' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary">+ Add Teacher</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TOTAL STAFF" value="87" trend="+2" trendPositive subtitle="this term" />
        <KpiCard title="ACTIVE" value="82" trend="94.3%" trendPositive subtitle="utilisation" />
        <KpiCard title="ON LEAVE" value="4" trend="−2" trendPositive={false} subtitle="vs last week" />
        <KpiCard title="AVG EXPERIENCE" value="8.4 yrs" subtitle="steady" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar placeholder="Search name or employee ID…" value={search} onChange={setSearch} className="w-64" />
          <Dropdown label="Department" value={dept} options={DEPT_OPTIONS} onChange={setDept} />
          <Dropdown label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <div className="flex-1" />
          <ExportButton label="Export" data={filtered} filename="teachers" formats={['csv', 'excel']}
            columns={[{ header: 'Name', accessor: 'name' }, { header: 'Employee ID', accessor: 'employeeId' }, { header: 'Department', accessor: 'department' }, { header: 'Status', accessor: 'status' }]} />
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

        <DataTable columns={columns} data={filtered} selectable onSelectionChange={setSelected} />

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
