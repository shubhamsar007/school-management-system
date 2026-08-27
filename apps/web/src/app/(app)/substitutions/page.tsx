'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Avatar, KpiCard, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface SubRequest { id: string; absentTeacher: string; classPeriod: string; date: string; subject: string; reason: string; status: string; }
interface Assignment { id: string; substitute: string; covering: string; classPeriod: string; date: string; subject: string; score: number; assignedBy: string; }

const REQUESTS: SubRequest[] = [
  { id: '1', absentTeacher: 'Amit Joshi', classPeriod: 'Grade 8·B · Period 3', date: '27 Aug 2025', subject: 'Mathematics', reason: 'Sick Leave', status: 'ASSIGNED' },
  { id: '2', absentTeacher: 'Suresh Menon', classPeriod: 'Grade 10·A · Period 5', date: '28 Aug 2025', subject: 'History', reason: 'Personal Leave', status: 'PENDING' },
  { id: '3', absentTeacher: 'Deepa Rao', classPeriod: 'Grade 7·A · Period 2', date: '27 Aug 2025', subject: 'Drawing', reason: 'Medical', status: 'ASSIGNED' },
  { id: '4', absentTeacher: 'Amit Joshi', classPeriod: 'Grade 9·B · Period 6', date: '28 Aug 2025', subject: 'Mathematics', reason: 'Sick Leave', status: 'PENDING' },
  { id: '5', absentTeacher: 'Suresh Menon', classPeriod: 'Grade 6·C · Period 1', date: '29 Aug 2025', subject: 'History', reason: 'Personal Leave', status: 'PENDING' },
  { id: '6', absentTeacher: 'Lakshmi Nair', classPeriod: 'Grade 11·A · Period 4', date: '26 Aug 2025', subject: 'Biology', reason: 'Family emergency', status: 'ASSIGNED' },
];

const ASSIGNMENTS: Assignment[] = [
  { id: '1', substitute: 'Priya Sharma', covering: 'Amit Joshi', classPeriod: 'Grade 8·B · Period 3', date: '27 Aug 2025', subject: 'Mathematics', score: 87, assignedBy: 'AUTO' },
  { id: '2', substitute: 'Ravi Kumar', covering: 'Deepa Rao', classPeriod: 'Grade 7·A · Period 2', date: '27 Aug 2025', subject: 'Drawing', score: 72, assignedBy: 'AUTO' },
  { id: '3', substitute: 'Ananya Das', covering: 'Suresh Menon', classPeriod: 'Grade 10·A · Period 1', date: '25 Aug 2025', subject: 'History', score: 65, assignedBy: 'AUTO' },
  { id: '4', substitute: 'Lakshmi Nair', covering: 'Amit Joshi', classPeriod: 'Grade 9·B · Period 5', date: '25 Aug 2025', subject: 'Mathematics', score: 91, assignedBy: 'AUTO' },
  { id: '5', substitute: 'Kiran Bhat', covering: 'Suresh Menon', classPeriod: 'Grade 6·C · Period 4', date: '24 Aug 2025', subject: 'History', score: 58, assignedBy: 'MANUAL' },
  { id: '6', substitute: 'Priya Sharma', covering: 'Amit Joshi', classPeriod: 'Grade 11·A · Period 2', date: '24 Aug 2025', subject: 'Mathematics', score: 88, assignedBy: 'AUTO' },
  { id: '7', substitute: 'Ravi Kumar', covering: 'Deepa Rao', classPeriod: 'Grade 8·B · Period 6', date: '23 Aug 2025', subject: 'Drawing', score: 70, assignedBy: 'AUTO' },
  { id: '8', substitute: 'Ananya Das', covering: 'Suresh Menon', classPeriod: 'Grade 9·A · Period 3', date: '22 Aug 2025', subject: 'History', score: 63, assignedBy: 'AUTO' },
];

const REQ_BADGE: Record<string, 'active' | 'pending' | 'left'> = { ASSIGNED: 'active', PENDING: 'pending', CANCELLED: 'left' };
const TABS = [{ id: 'requests', label: 'Requests', count: 6 }, { id: 'assignments', label: 'Assignments', count: 8 }];

export default function SubstitutionsPage() {
  const [activeTab, setActiveTab] = React.useState('requests');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const requestColumns: ColumnDef<SubRequest>[] = [
    { id: 'absentTeacher', header: 'ABSENT TEACHER', width: 'minmax(140px,1.3fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.absentTeacher} size="md" /><span className="text-sm font-medium">{r.absentTeacher}</span></div> },
    { id: 'classPeriod', header: 'CLASS & PERIOD', width: '140px', accessor: 'classPeriod' },
    { id: 'date', header: 'DATE', width: '100px', accessor: 'date' },
    { id: 'subject', header: 'SUBJECT', width: '110px', accessor: 'subject' },
    { id: 'reason', header: 'REASON', width: '120px', cell: (r) => <span className="truncate text-sm text-[#6b7480]">{r.reason}</span> },
    { id: 'status', header: 'STATUS', width: '100px', cell: (r) => <Badge variant={REQ_BADGE[r.status] ?? 'default'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '90px', align: 'right', cell: (r) => r.status === 'PENDING' ? <button className="text-xs font-medium text-[#2b5fa8]">Assign</button> : <button className="text-xs font-medium text-[#2b5fa8]">View</button> },
  ];

  const assignmentColumns: ColumnDef<Assignment>[] = [
    { id: 'substitute', header: 'SUBSTITUTE', width: 'minmax(140px,1.3fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.substitute} size="md" /><span className="text-sm font-medium">{r.substitute}</span></div> },
    { id: 'covering', header: 'COVERING FOR', width: '120px', accessor: 'covering' },
    { id: 'classPeriod', header: 'CLASS & PERIOD', width: '140px', accessor: 'classPeriod' },
    { id: 'date', header: 'DATE', width: '100px', accessor: 'date' },
    { id: 'subject', header: 'SUBJECT', width: '110px', accessor: 'subject' },
    {
      id: 'score', header: 'SCORE', width: '70px', align: 'center',
      cell: (r) => <span style={{ color: r.score >= 80 ? '#146b41' : r.score >= 60 ? '#8a5a00' : '#b3261e' }} className="text-sm font-semibold">{r.score}</span>,
    },
    { id: 'assignedBy', header: 'ASSIGNED BY', width: '110px', cell: (r) => <Badge variant={r.assignedBy === 'AUTO' ? 'graduated' : 'default'}>{r.assignedBy}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Substitutions"
        subtitle="Auto-assigned cover lessons · Aug 2025"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={REQUESTS} filename="substitutions" formats={['csv']}
              columns={[{ header: 'Absent Teacher', accessor: 'absentTeacher' }, { header: 'Subject', accessor: 'subject' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary">+ New Request</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="PENDING REQUESTS" value="3" subtitle="today" />
        <KpiCard title="AUTO-ASSIGNED" value="8" trend="+3" trendPositive subtitle="this week" />
        <KpiCard title="MANUAL ASSIGNMENTS" value="2" subtitle="this week" />
        <KpiCard title="COVERAGE RATE" value="100%" trend="all covered" trendPositive />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {activeTab === 'requests' && <DataTable columns={requestColumns} data={REQUESTS} />}
        {activeTab === 'assignments' && <DataTable columns={assignmentColumns} data={ASSIGNMENTS} />}
        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize} total={activeTab === 'requests' ? REQUESTS.length : ASSIGNMENTS.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
