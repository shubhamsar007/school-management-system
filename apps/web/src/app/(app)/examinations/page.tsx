'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Avatar, KpiCard, SearchBar, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface ExamSchedule { id: string; name: string; cls: string; subject: string; date: string; time: string; duration: string; room: string; status: string; }
interface ExamResult { id: string; student: string; cls: string; subject: string; exam: string; marks: string; percentage: number; grade: string; date: string; }
interface ExamType { id: string; name: string; code: string; weightage: string; maxMarks: number; passingMarks: number; }

const SCHEDULE: ExamSchedule[] = [
  { id: '1', name: 'Mid Term Science', cls: 'Grade 9·A', subject: 'Science', date: '02 Sep 2025', time: '09:00 AM', duration: '3 hrs', room: 'Lab 201', status: 'SCHEDULED' },
  { id: '2', name: 'Mid Term Maths', cls: 'Grade 9·B', subject: 'Mathematics', date: '03 Sep 2025', time: '09:00 AM', duration: '3 hrs', room: 'Room 101', status: 'SCHEDULED' },
  { id: '3', name: 'Unit Test English', cls: 'Grade 6·C', subject: 'English', date: '04 Sep 2025', time: '10:00 AM', duration: '1.5 hrs', room: 'Room 102', status: 'SCHEDULED' },
  { id: '4', name: 'Mid Term History', cls: 'Grade 10·A', subject: 'History', date: '05 Sep 2025', time: '09:00 AM', duration: '3 hrs', room: 'Room 201', status: 'SCHEDULED' },
  { id: '5', name: 'Unit Test Science', cls: 'Grade 7·B', subject: 'Science', date: '06 Sep 2025', time: '10:00 AM', duration: '2 hrs', room: 'Lab 202', status: 'SCHEDULED' },
  { id: '6', name: 'Mid Term English', cls: 'Grade 8·B', subject: 'English', date: '28 Aug 2025', time: '09:00 AM', duration: '3 hrs', room: 'Room 101', status: 'COMPLETED' },
  { id: '7', name: 'Unit Test Maths', cls: 'Grade 6·A', subject: 'Mathematics', date: '26 Aug 2025', time: '10:00 AM', duration: '1.5 hrs', room: 'Room 102', status: 'COMPLETED' },
  { id: '8', name: 'Annual Science', cls: 'Grade 12·A', subject: 'Science', date: '15 Mar 2025', time: '09:00 AM', duration: '3 hrs', room: 'Hall 301', status: 'COMPLETED' },
];

const RESULTS: ExamResult[] = [
  { id: '1', student: 'Aarav Mehta', cls: 'Grade 8·B', subject: 'English', exam: 'Mid Term English', marks: '78 / 100', percentage: 78, grade: 'A', date: '28 Aug 2025' },
  { id: '2', student: 'Diya Krishnan', cls: 'Grade 8·B', subject: 'English', exam: 'Mid Term English', marks: '85 / 100', percentage: 85, grade: 'A+', date: '28 Aug 2025' },
  { id: '3', student: 'Ishaan Bose', cls: 'Grade 9·A', subject: 'Mathematics', exam: 'Unit Test Maths', marks: '62 / 100', percentage: 62, grade: 'B', date: '26 Aug 2025' },
  { id: '4', student: 'Kavya Nair', cls: 'Grade 6·C', subject: 'Mathematics', exam: 'Unit Test Maths', marks: '45 / 100', percentage: 45, grade: 'D', date: '26 Aug 2025' },
  { id: '5', student: 'Manav Sethi', cls: 'Grade 11·A', subject: 'Science', exam: 'Annual Science', marks: '88 / 100', percentage: 88, grade: 'A+', date: '15 Mar 2025' },
  { id: '6', student: 'Saanvi Deshpande', cls: 'Grade 7·A', subject: 'Science', exam: 'Annual Science', marks: '71 / 100', percentage: 71, grade: 'B', date: '15 Mar 2025' },
  { id: '7', student: 'Vihaan Gupta', cls: 'Grade 12·A', subject: 'Science', exam: 'Annual Science', marks: '92 / 100', percentage: 92, grade: 'A+', date: '15 Mar 2025' },
  { id: '8', student: 'Nikhil Rana', cls: 'Grade 12·B', subject: 'English', exam: 'Mid Term English', marks: '55 / 100', percentage: 55, grade: 'C', date: '28 Aug 2025' },
];

const EXAM_TYPES: ExamType[] = [
  { id: '1', name: 'Unit Test', code: 'UT', weightage: '20%', maxMarks: 50, passingMarks: 20 },
  { id: '2', name: 'Mid Term', code: 'MT', weightage: '30%', maxMarks: 100, passingMarks: 40 },
  { id: '3', name: 'Annual', code: 'ANN', weightage: '50%', maxMarks: 100, passingMarks: 40 },
  { id: '4', name: 'Practical', code: 'PRAC', weightage: '20%', maxMarks: 50, passingMarks: 20 },
  { id: '5', name: 'Assignment', code: 'ASGN', weightage: '10%', maxMarks: 25, passingMarks: 10 },
  { id: '6', name: 'Viva', code: 'VIVA', weightage: '10%', maxMarks: 25, passingMarks: 10 },
];

const SCHED_BADGE: Record<string, 'active' | 'pending' | 'graduated' | 'left'> = { SCHEDULED: 'pending', ONGOING: 'active', COMPLETED: 'graduated', CANCELLED: 'left' };
const GRADE_BADGE: Record<string, 'active' | 'graduated' | 'default' | 'left'> = { 'A+': 'active', 'A': 'active', 'B': 'graduated', 'C': 'default', 'D': 'left' };
const TABS = [{ id: 'schedule', label: 'Schedule', count: 18 }, { id: 'results', label: 'Results', count: 12 }, { id: 'exam-types', label: 'Exam Types', count: 6 }];
const STATUS_OPTIONS = [{ label: 'All Statuses', value: 'all' }, { label: 'Scheduled', value: 'SCHEDULED' }, { label: 'Completed', value: 'COMPLETED' }, { label: 'Cancelled', value: 'CANCELLED' }];

export default function ExaminationsPage() {
  const [activeTab, setActiveTab] = React.useState('schedule');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const scheduleColumns: ColumnDef<ExamSchedule>[] = [
    { id: 'name', header: 'EXAM NAME', width: '150px', accessor: 'name' },
    { id: 'cls', header: 'CLASS', width: '100px', accessor: 'cls' },
    { id: 'subject', header: 'SUBJECT', width: '120px', accessor: 'subject' },
    { id: 'date', header: 'DATE', width: '100px', accessor: 'date' },
    { id: 'time', header: 'TIME', width: '90px', accessor: 'time' },
    { id: 'duration', header: 'DURATION', width: '80px', align: 'center', accessor: 'duration' },
    { id: 'room', header: 'ROOM', width: '80px', accessor: 'room' },
    { id: 'status', header: 'STATUS', width: '110px', cell: (r) => <Badge variant={SCHED_BADGE[r.status] ?? 'default'}>{r.status}</Badge> },
  ];

  const resultColumns: ColumnDef<ExamResult>[] = [
    { id: 'student', header: 'STUDENT', width: 'minmax(140px,1.4fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.student} size="md" /><span className="text-sm font-medium">{r.student}</span></div> },
    { id: 'cls', header: 'CLASS', width: '100px', accessor: 'cls' },
    { id: 'subject', header: 'SUBJECT', width: '120px', accessor: 'subject' },
    { id: 'exam', header: 'EXAM', width: '130px', accessor: 'exam' },
    { id: 'marks', header: 'MARKS', width: '90px', align: 'center', accessor: 'marks' },
    {
      id: 'percentage', header: 'PERCENTAGE', width: '100px', align: 'center',
      cell: (r) => <span style={{ color: r.percentage >= 75 ? '#146b41' : r.percentage >= 50 ? '#8a5a00' : '#b3261e' }} className="font-semibold text-sm">{r.percentage}%</span>,
    },
    { id: 'grade', header: 'GRADE', width: '80px', align: 'center', cell: (r) => <Badge variant={GRADE_BADGE[r.grade] ?? 'default'}>{r.grade}</Badge> },
    { id: 'date', header: 'DATE', width: '90px', accessor: 'date' },
  ];

  const typeColumns: ColumnDef<ExamType>[] = [
    { id: 'name', header: 'TYPE NAME', width: '150px', accessor: 'name' },
    { id: 'code', header: 'CODE', width: '80px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.code}</span> },
    { id: 'weightage', header: 'WEIGHTAGE', width: '100px', align: 'center', accessor: 'weightage' },
    { id: 'maxMarks', header: 'MAX MARKS', width: '100px', align: 'center', accessor: (r) => r.maxMarks },
    { id: 'passingMarks', header: 'PASSING MARKS', width: '120px', align: 'center', accessor: (r) => r.passingMarks },
    { id: 'actions', header: 'ACTIONS', width: '90px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>Edit</button><span className="text-[#d7dce1]">|</span><button>Delete</button></div> },
  ];

  const filteredSchedule = SCHEDULE.filter((s) => (statusFilter === 'all' || s.status === statusFilter) && (!search || s.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <PageHeader
        title="Examinations"
        subtitle="Exam schedules, marks, and report cards · 2024–25"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={SCHEDULE} filename="examinations" formats={['csv', 'excel']}
              columns={[{ header: 'Exam', accessor: 'name' }, { header: 'Class', accessor: 'cls' }, { header: 'Date', accessor: 'date' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary">+ Schedule Exam</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="EXAM TYPES" value="6" subtitle="configured" />
        <KpiCard title="SCHEDULED EXAMS" value="18" subtitle="this term" />
        <KpiCard title="RESULTS PUBLISHED" value="12" trend="of 18" trendPositive subtitle="completed" />
        <KpiCard title="AVG SCORE" value="72.4%" subtitle="across all exams" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar placeholder="Search…" value={search} onChange={setSearch} className="w-64" />
          {activeTab === 'schedule' && <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />}
          <div className="flex-1" />
        </div>

        {activeTab === 'schedule' && <DataTable columns={scheduleColumns} data={filteredSchedule} />}
        {activeTab === 'results' && <DataTable columns={resultColumns} data={RESULTS} />}
        {activeTab === 'exam-types' && <DataTable columns={typeColumns} data={EXAM_TYPES} />}

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize}
            total={activeTab === 'schedule' ? filteredSchedule.length : activeTab === 'results' ? RESULTS.length : EXAM_TYPES.length}
            onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
