'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, SearchBar, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface ClassRow { id: string; name: string; sections: number; students: number; classTeacher: string; academicYear: string; }
interface Subject { id: string; name: string; code: string; department: string; classes: number; type: string; }

const CLASSES: ClassRow[] = [
  { id: '1', name: 'Grade 1', sections: 3, students: 92, classTeacher: 'Priya Sharma', academicYear: '2024–25' },
  { id: '2', name: 'Grade 2', sections: 3, students: 88, classTeacher: 'Ravi Kumar', academicYear: '2024–25' },
  { id: '3', name: 'Grade 3', sections: 3, students: 96, classTeacher: 'Ananya Das', academicYear: '2024–25' },
  { id: '4', name: 'Grade 4', sections: 3, students: 102, classTeacher: 'Suresh Menon', academicYear: '2024–25' },
  { id: '5', name: 'Grade 5', sections: 3, students: 108, classTeacher: 'Lakshmi Nair', academicYear: '2024–25' },
  { id: '6', name: 'Grade 6', sections: 3, students: 115, classTeacher: 'Deepa Rao', academicYear: '2024–25' },
  { id: '7', name: 'Grade 9', sections: 4, students: 142, classTeacher: 'Kiran Bhat', academicYear: '2024–25' },
  { id: '8', name: 'Grade 12', sections: 2, students: 74, classTeacher: 'Priya Sharma', academicYear: '2024–25' },
];

const SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', code: 'MTH-01', department: 'Maths', classes: 12, type: 'CORE' },
  { id: '2', name: 'Science', code: 'SCI-01', department: 'Science', classes: 10, type: 'CORE' },
  { id: '3', name: 'English', code: 'ENG-01', department: 'English', classes: 12, type: 'CORE' },
  { id: '4', name: 'History', code: 'HST-01', department: 'Social Studies', classes: 8, type: 'CORE' },
  { id: '5', name: 'Geography', code: 'GEO-01', department: 'Social Studies', classes: 6, type: 'CORE' },
  { id: '6', name: 'Drawing', code: 'DRW-01', department: 'Arts', classes: 8, type: 'ELECTIVE' },
  { id: '7', name: 'Physical Education', code: 'PHY-01', department: 'PE', classes: 12, type: 'CORE' },
  { id: '8', name: 'Statistics', code: 'STA-01', department: 'Maths', classes: 3, type: 'ELECTIVE' },
];

const TABS = [{ id: 'classes', label: 'Classes', count: 12 }, { id: 'subjects', label: 'Subjects', count: 28 }];
const ACTIONS_CELL = () => (
  <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
    <button className="cursor-pointer hover:underline">Edit</button>
    <span className="text-[#d7dce1]">|</span>
    <button className="cursor-pointer hover:underline">View</button>
  </div>
);

export default function AcademicsPage() {
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('classes');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const classColumns: ColumnDef<ClassRow>[] = [
    { id: 'name', header: 'CLASS NAME', width: '140px', accessor: 'name' },
    { id: 'sections', header: 'SECTIONS', width: '80px', align: 'center', accessor: (r) => r.sections },
    { id: 'students', header: 'STUDENTS', width: '90px', align: 'center', accessor: (r) => r.students },
    { id: 'classTeacher', header: 'CLASS TEACHER', width: '150px', accessor: 'classTeacher' },
    { id: 'academicYear', header: 'ACADEMIC YEAR', width: '130px', accessor: 'academicYear' },
    { id: 'actions', header: 'ACTIONS', width: '80px', align: 'right', cell: ACTIONS_CELL },
  ];

  const subjectColumns: ColumnDef<Subject>[] = [
    { id: 'name', header: 'SUBJECT NAME', width: '150px', accessor: 'name' },
    { id: 'code', header: 'CODE', width: '100px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.code}</span> },
    { id: 'department', header: 'DEPARTMENT', width: '130px', accessor: 'department' },
    { id: 'classes', header: 'CLASSES', width: '80px', align: 'center', accessor: (r) => r.classes },
    { id: 'type', header: 'TYPE', width: '90px', cell: (r) => <Badge variant={r.type === 'CORE' ? 'active' : 'default'}>{r.type}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '80px', align: 'right', cell: ACTIONS_CELL },
  ];

  const filteredClasses = CLASSES.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredSubjects = SUBJECTS.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Academics"
        subtitle="Classes, sections, and subjects · 2024–25"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={(activeTab === 'classes' ? CLASSES : SUBJECTS) as unknown[]} filename="academics" formats={['csv', 'excel']}
              columns={[{ header: 'Name', accessor: (r: unknown) => String((r as { name: string }).name) }]} />
            <Button variant="primary">{activeTab === 'classes' ? '+ Add Class' : '+ Add Subject'}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TOTAL CLASSES" value="12" subtitle="steady" />
        <KpiCard title="TOTAL SECTIONS" value="34" trend="+2" trendPositive subtitle="this year" />
        <KpiCard title="TOTAL STUDENTS" value="1,248" subtitle="enrolled" />
        <KpiCard title="AVG CLASS SIZE" value="37" subtitle="students" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar placeholder={activeTab === 'classes' ? 'Search classes…' : 'Search subjects…'} value={search} onChange={setSearch} className="w-64" />
          <div className="flex-1" />
        </div>

        {activeTab === 'classes'
          ? <DataTable columns={classColumns} data={filteredClasses} />
          : <DataTable columns={subjectColumns} data={filteredSubjects} />}

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize}
            total={activeTab === 'classes' ? filteredClasses.length : filteredSubjects.length}
            onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
