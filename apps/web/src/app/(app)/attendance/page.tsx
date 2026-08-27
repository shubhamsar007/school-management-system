'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Avatar, KpiCard, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface StudentAtt { id: string; name: string; cls: string; admissionNo: string; date: string; status: string; markedBy: string; remarks: string; }
interface EmployeeAtt { id: string; name: string; designation: string; employeeId: string; date: string; checkIn: string; checkOut: string; status: string; remarks: string; }
interface LeaveReq { id: string; name: string; designation: string; leaveType: string; from: string; to: string; days: string; reason: string; status: string; }

const STUDENT_ATT: StudentAtt[] = [
  { id: '1', name: 'Aarav Mehta', cls: 'Grade 8·B', admissionNo: 'ADM-2024-0117', date: '27 Aug 2025', status: 'PRESENT', markedBy: 'Priya Sharma', remarks: '—' },
  { id: '2', name: 'Diya Krishnan', cls: 'Grade 8·B', admissionNo: 'ADM-2024-0118', date: '27 Aug 2025', status: 'PRESENT', markedBy: 'Priya Sharma', remarks: '—' },
  { id: '3', name: 'Ishaan Bose', cls: 'Grade 9·A', admissionNo: 'ADM-2023-0904', date: '27 Aug 2025', status: 'ABSENT', markedBy: 'Ravi Kumar', remarks: 'Medical leave' },
  { id: '4', name: 'Kavya Nair', cls: 'Grade 6·C', admissionNo: 'ADM-2024-0121', date: '27 Aug 2025', status: 'LATE', markedBy: 'Ananya Das', remarks: 'Arrived 15 min late' },
  { id: '5', name: 'Manav Sethi', cls: 'Grade 11·A', admissionNo: 'ADM-2022-0455', date: '27 Aug 2025', status: 'PRESENT', markedBy: 'Suresh Menon', remarks: '—' },
  { id: '6', name: 'Nikhil Rana', cls: 'Grade 12·B', admissionNo: 'ADM-2021-0312', date: '27 Aug 2025', status: 'EXCUSED', markedBy: 'Lakshmi Nair', remarks: 'Sports day' },
  { id: '7', name: 'Saanvi Deshpande', cls: 'Grade 7·A', admissionNo: 'ADM-2024-0129', date: '27 Aug 2025', status: 'PRESENT', markedBy: 'Deepa Rao', remarks: '—' },
  { id: '8', name: 'Vihaan Gupta', cls: 'Grade 12·A', admissionNo: 'ADM-2020-0198', date: '27 Aug 2025', status: 'PRESENT', markedBy: 'Suresh Menon', remarks: '—' },
];

const EMP_ATT: EmployeeAtt[] = [
  { id: '1', name: 'Priya Sharma', designation: 'Senior Teacher', employeeId: 'EMP-2019-0042', date: '27 Aug 2025', checkIn: '07:55 AM', checkOut: '03:45 PM', status: 'PRESENT', remarks: '—' },
  { id: '2', name: 'Ravi Kumar', designation: 'Teacher', employeeId: 'EMP-2021-0078', date: '27 Aug 2025', checkIn: '08:02 AM', checkOut: '03:50 PM', status: 'PRESENT', remarks: '—' },
  { id: '3', name: 'Ananya Das', designation: 'Teacher', employeeId: 'EMP-2020-0055', date: '27 Aug 2025', checkIn: '07:48 AM', checkOut: '03:30 PM', status: 'PRESENT', remarks: '—' },
  { id: '4', name: 'Suresh Menon', designation: 'Senior Teacher', employeeId: 'EMP-2018-0023', date: '27 Aug 2025', checkIn: '—', checkOut: '—', status: 'ABSENT', remarks: 'No prior notice' },
  { id: '5', name: 'Lakshmi Nair', designation: 'Teacher', employeeId: 'EMP-2022-0091', date: '27 Aug 2025', checkIn: '08:10 AM', checkOut: '03:45 PM', status: 'PRESENT', remarks: '—' },
  { id: '6', name: 'Amit Joshi', designation: 'Teacher', employeeId: 'EMP-2023-0104', date: '27 Aug 2025', checkIn: '—', checkOut: '—', status: 'ON_LEAVE', remarks: 'Approved leave' },
  { id: '7', name: 'Deepa Rao', designation: 'Senior Teacher', employeeId: 'EMP-2017-0011', date: '27 Aug 2025', checkIn: '07:50 AM', checkOut: '12:00 PM', status: 'HALF_DAY', remarks: 'Medical appointment' },
  { id: '8', name: 'Kiran Bhat', designation: 'Teacher', employeeId: 'EMP-2024-0112', date: '27 Aug 2025', checkIn: '08:05 AM', checkOut: '03:45 PM', status: 'PRESENT', remarks: '—' },
];

const LEAVE_REQS: LeaveReq[] = [
  { id: '1', name: 'Amit Joshi', designation: 'Teacher', leaveType: 'Sick Leave', from: '25 Aug', to: '29 Aug', days: '5 days', reason: 'Fever and flu', status: 'PENDING' },
  { id: '2', name: 'Suresh Menon', designation: 'Senior Teacher', leaveType: 'Casual Leave', from: '01 Sep', to: '01 Sep', days: '1 day', reason: 'Personal work', status: 'PENDING' },
  { id: '3', name: 'Deepa Rao', designation: 'Senior Teacher', leaveType: 'Medical Leave', from: '27 Aug', to: '27 Aug', days: '1 day', reason: 'Medical appointment', status: 'APPROVED' },
  { id: '4', name: 'Priya Sharma', designation: 'Senior Teacher', leaveType: 'Casual Leave', from: '15 Aug', to: '15 Aug', days: '1 day', reason: 'Independence Day', status: 'APPROVED' },
  { id: '5', name: 'Ravi Kumar', designation: 'Teacher', leaveType: 'Earned Leave', from: '10 Aug', to: '14 Aug', days: '5 days', reason: 'Family function', status: 'APPROVED' },
  { id: '6', name: 'Lakshmi Nair', designation: 'Teacher', leaveType: 'Sick Leave', from: '05 Aug', to: '06 Aug', days: '2 days', reason: 'Cold', status: 'APPROVED' },
  { id: '7', name: 'Ananya Das', designation: 'Teacher', leaveType: 'Casual Leave', from: '02 Aug', to: '02 Aug', days: '1 day', reason: 'Personal', status: 'REJECTED' },
  { id: '8', name: 'Kiran Bhat', designation: 'Teacher', leaveType: 'Earned Leave', from: '20 Jul', to: '25 Jul', days: '6 days', reason: 'Vacation', status: 'APPROVED' },
];

const STU_STATUS: Record<string, 'active' | 'left' | 'pending' | 'default'> = { PRESENT: 'active', ABSENT: 'left', LATE: 'pending', EXCUSED: 'default' };
const EMP_STATUS: Record<string, 'active' | 'left' | 'pending' | 'default'> = { PRESENT: 'active', ABSENT: 'left', ON_LEAVE: 'pending', HALF_DAY: 'default' };
const LV_STATUS: Record<string, 'active' | 'left' | 'pending' | 'default'> = { PENDING: 'pending', APPROVED: 'active', REJECTED: 'left', CANCELLED: 'default' };

const TABS = [{ id: 'students', label: 'Student Attendance' }, { id: 'employees', label: 'Staff Attendance' }, { id: 'leave', label: 'Leave Requests', count: 4 }];
const CLASS_OPTIONS = [{ label: 'All Classes', value: 'all' }, { label: 'Grade 6', value: 'Grade 6' }, { label: 'Grade 7', value: 'Grade 7' }, { label: 'Grade 8', value: 'Grade 8' }, { label: 'Grade 9', value: 'Grade 9' }, { label: 'Grade 11', value: 'Grade 11' }, { label: 'Grade 12', value: 'Grade 12' }];
const STATUS_OPTIONS = [{ label: 'All Statuses', value: 'all' }, { label: 'Present', value: 'PRESENT' }, { label: 'Absent', value: 'ABSENT' }, { label: 'Late', value: 'LATE' }, { label: 'Excused', value: 'EXCUSED' }];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = React.useState('students');
  const [classFilter, setClassFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const studentColumns: ColumnDef<StudentAtt>[] = [
    { id: 'name', header: 'STUDENT', width: 'minmax(160px,1.4fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size="md" /><div><div className="text-sm font-medium">{r.name}</div><div className="text-[11px] text-[#8a929b]">{r.cls}</div></div></div> },
    { id: 'admissionNo', header: 'ADMISSION NO', width: '130px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.admissionNo}</span> },
    { id: 'cls', header: 'CLASS', width: '100px', accessor: 'cls' },
    { id: 'date', header: 'DATE', width: '100px', accessor: 'date' },
    { id: 'status', header: 'STATUS', width: '100px', cell: (r) => <Badge variant={STU_STATUS[r.status] ?? 'default'}>{r.status}</Badge> },
    { id: 'markedBy', header: 'MARKED BY', width: '120px', accessor: 'markedBy' },
    { id: 'remarks', header: 'REMARKS', width: '150px', cell: (r) => <span className="truncate text-sm text-[#6b7480]">{r.remarks}</span> },
  ];

  const empColumns: ColumnDef<EmployeeAtt>[] = [
    { id: 'name', header: 'EMPLOYEE', width: 'minmax(160px,1.4fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size="md" /><div><div className="text-sm font-medium">{r.name}</div><div className="text-[11px] text-[#8a929b]">{r.designation}</div></div></div> },
    { id: 'employeeId', header: 'EMPLOYEE ID', width: '120px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.employeeId}</span> },
    { id: 'date', header: 'DATE', width: '100px', accessor: 'date' },
    { id: 'checkIn', header: 'CHECK IN', width: '90px', accessor: 'checkIn' },
    { id: 'checkOut', header: 'CHECK OUT', width: '90px', accessor: 'checkOut' },
    { id: 'status', header: 'STATUS', width: '110px', cell: (r) => <Badge variant={EMP_STATUS[r.status] ?? 'default'}>{r.status.replace('_', ' ')}</Badge> },
    { id: 'remarks', header: 'REMARKS', width: '130px', cell: (r) => <span className="truncate text-sm text-[#6b7480]">{r.remarks}</span> },
  ];

  const leaveColumns: ColumnDef<LeaveReq>[] = [
    { id: 'name', header: 'EMPLOYEE', width: 'minmax(160px,1.4fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size="md" /><div><div className="text-sm font-medium">{r.name}</div><div className="text-[11px] text-[#8a929b]">{r.designation}</div></div></div> },
    { id: 'leaveType', header: 'LEAVE TYPE', width: '110px', accessor: 'leaveType' },
    { id: 'from', header: 'FROM', width: '90px', accessor: 'from' },
    { id: 'to', header: 'TO', width: '90px', accessor: 'to' },
    { id: 'days', header: 'DAYS', width: '70px', align: 'center', accessor: 'days' },
    { id: 'reason', header: 'REASON', width: '150px', cell: (r) => <span className="truncate text-sm text-[#6b7480]">{r.reason}</span> },
    { id: 'status', header: 'STATUS', width: '100px', cell: (r) => <Badge variant={LV_STATUS[r.status] ?? 'default'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '100px', align: 'right', cell: (r) => r.status === 'PENDING' ? <div className="flex justify-end gap-1.5 text-xs font-medium"><button className="text-[#146b41]">Approve</button><span className="text-[#d7dce1]">|</span><button className="text-[#b3261e]">Reject</button></div> : <button className="text-xs font-medium text-[#2b5fa8] hover:underline">View</button> },
  ];

  const filteredStudents = STUDENT_ATT.filter((s) => (classFilter === 'all' || s.cls.includes(classFilter)) && (statusFilter === 'all' || s.status === statusFilter));

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Student and staff attendance · Aug 2025"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={STUDENT_ATT} filename="attendance" formats={['csv', 'excel']}
              columns={[{ header: 'Student', accessor: 'name' }, { header: 'Class', accessor: 'cls' }, { header: 'Status', accessor: 'status' }]} />
            {activeTab !== 'leave' && <Button variant="primary">Mark Attendance</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TODAY'S RATE" value="91.4%" trend="−0.8%" trendPositive={false} subtitle="vs yesterday" />
        <KpiCard title="PRESENT TODAY" value="1,140" subtitle="of 1,248" />
        <KpiCard title="ABSENT TODAY" value="108" trend="8.6%" trendPositive={false} />
        <KpiCard title="ON LEAVE" value="4" subtitle="staff members" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          {activeTab === 'students' && (
            <>
              <input type="date" defaultValue="2025-08-27" className="h-9 rounded-md border border-[#d7dce1] px-3 text-sm text-[#14181c]" />
              <Dropdown label="Class" value={classFilter} options={CLASS_OPTIONS} onChange={setClassFilter} />
              <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
            </>
          )}
          {activeTab === 'employees' && (
            <input type="date" defaultValue="2025-08-27" className="h-9 rounded-md border border-[#d7dce1] px-3 text-sm text-[#14181c]" />
          )}
          <div className="flex-1" />
        </div>

        {activeTab === 'students' && <DataTable columns={studentColumns} data={filteredStudents} selectable />}
        {activeTab === 'employees' && <DataTable columns={empColumns} data={EMP_ATT} selectable />}
        {activeTab === 'leave' && <DataTable columns={leaveColumns} data={LEAVE_REQS} />}

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize}
            total={activeTab === 'students' ? filteredStudents.length : activeTab === 'employees' ? EMP_ATT.length : LEAVE_REQS.length}
            onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
