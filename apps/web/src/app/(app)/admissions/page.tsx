'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Avatar, KpiCard, SearchBar, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface Enquiry { id: string; applicant: string; parent: string; grade: string; contact: string; source: string; date: string; status: string; }
interface Application { id: string; name: string; appNo: string; grade: string; submitted: string; docsComplete: number; docsTotal: number; status: string; }

const ENQUIRIES: Enquiry[] = [
  { id: '1', applicant: 'Riya Verma', parent: 'Meena Verma', grade: 'Grade 5', contact: '+91 98101 22334', source: 'ONLINE', date: '24 Aug 2025', status: 'NEW' },
  { id: '2', applicant: 'Aryan Kapoor', parent: 'Sanjay Kapoor', grade: 'Grade 8', contact: '+91 99210 44556', source: 'WALK_IN', date: '22 Aug 2025', status: 'CONTACTED' },
  { id: '3', applicant: 'Anvi Patel', parent: 'Rahul Patel', grade: 'Grade 3', contact: '+91 98330 66778', source: 'REFERRAL', date: '20 Aug 2025', status: 'SCHEDULED' },
  { id: '4', applicant: 'Sid Malhotra', parent: 'Priti Malhotra', grade: 'Grade 6', contact: '+91 97440 88990', source: 'ONLINE', date: '18 Aug 2025', status: 'ADMITTED' },
  { id: '5', applicant: 'Zoya Khan', parent: 'Imran Khan', grade: 'Grade 9', contact: '+91 96550 11223', source: 'PHONE', date: '15 Aug 2025', status: 'REJECTED' },
  { id: '6', applicant: 'Kabir Singh', parent: 'Harjit Singh', grade: 'Grade 1', contact: '+91 95660 33445', source: 'WALK_IN', date: '12 Aug 2025', status: 'ADMITTED' },
  { id: '7', applicant: 'Mira Joshi', parent: 'Deepak Joshi', grade: 'Grade 7', contact: '+91 94770 55667', source: 'ONLINE', date: '10 Aug 2025', status: 'WITHDRAWN' },
  { id: '8', applicant: 'Dev Sharma', parent: 'Anil Sharma', grade: 'Grade 11', contact: '+91 93880 77889', source: 'REFERRAL', date: '08 Aug 2025', status: 'CONTACTED' },
];

const APPLICATIONS: Application[] = [
  { id: '1', name: 'Riya Verma', appNo: 'APP-2025-0048', grade: 'Grade 5', submitted: '25 Aug 2025', docsComplete: 3, docsTotal: 5, status: 'SUBMITTED' },
  { id: '2', name: 'Aryan Kapoor', appNo: 'APP-2025-0047', grade: 'Grade 8', submitted: '23 Aug 2025', docsComplete: 5, docsTotal: 5, status: 'UNDER_REVIEW' },
  { id: '3', name: 'Anvi Patel', appNo: 'APP-2025-0046', grade: 'Grade 3', submitted: '21 Aug 2025', docsComplete: 5, docsTotal: 5, status: 'INTERVIEW_SCHEDULED' },
  { id: '4', name: 'Sid Malhotra', appNo: 'APP-2025-0040', grade: 'Grade 6', submitted: '19 Aug 2025', docsComplete: 5, docsTotal: 5, status: 'ADMITTED' },
  { id: '5', name: 'Kabir Singh', appNo: 'APP-2025-0038', grade: 'Grade 1', submitted: '13 Aug 2025', docsComplete: 5, docsTotal: 5, status: 'ADMITTED' },
  { id: '6', name: 'Dev Sharma', appNo: 'APP-2025-0035', grade: 'Grade 11', submitted: '09 Aug 2025', docsComplete: 4, docsTotal: 5, status: 'UNDER_REVIEW' },
  { id: '7', name: 'Priya Mehta', appNo: 'APP-2025-0032', grade: 'Grade 4', submitted: '07 Aug 2025', docsComplete: 5, docsTotal: 5, status: 'ADMITTED' },
  { id: '8', name: 'Raj Pillai', appNo: 'APP-2025-0029', grade: 'Grade 7', submitted: '04 Aug 2025', docsComplete: 2, docsTotal: 5, status: 'SUBMITTED' },
];

const ENQ_STATUS: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = { NEW: 'pending', CONTACTED: 'default', SCHEDULED: 'active', ADMITTED: 'graduated', REJECTED: 'left', WITHDRAWN: 'left' };
const SRC_BADGE: Record<string, 'active' | 'graduated' | 'default'> = { WALK_IN: 'default', ONLINE: 'graduated', REFERRAL: 'active', PHONE: 'default' };
const APP_STATUS: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = { SUBMITTED: 'pending', UNDER_REVIEW: 'default', INTERVIEW_SCHEDULED: 'active', ADMITTED: 'graduated', REJECTED: 'left' };

const TABS = [{ id: 'enquiries', label: 'Enquiries', count: 48 }, { id: 'applications', label: 'Applications', count: 32 }];
const STATUS_OPTIONS = [{ label: 'All Statuses', value: 'all' }, { label: 'New', value: 'NEW' }, { label: 'Contacted', value: 'CONTACTED' }, { label: 'Scheduled', value: 'SCHEDULED' }, { label: 'Admitted', value: 'ADMITTED' }, { label: 'Rejected', value: 'REJECTED' }];
const SOURCE_OPTIONS = [{ label: 'All Sources', value: 'all' }, { label: 'Walk-in', value: 'WALK_IN' }, { label: 'Online', value: 'ONLINE' }, { label: 'Referral', value: 'REFERRAL' }, { label: 'Phone', value: 'PHONE' }];

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = React.useState('enquiries');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sourceFilter, setSourceFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selected, setSelected] = React.useState<Enquiry[]>([]);

  const enquiryColumns: ColumnDef<Enquiry>[] = [
    {
      id: 'applicant', header: 'APPLICANT', width: 'minmax(160px,1.4fr)',
      cell: (r) => (
        <div>
          <div className="text-sm font-medium text-[#14181c]">{r.applicant}</div>
          <div className="text-[11px] text-[#8a929b]">{r.parent}</div>
        </div>
      ),
    },
    { id: 'grade', header: 'GRADE APPLIED', width: '110px', accessor: 'grade' },
    { id: 'contact', header: 'CONTACT', width: '140px', cell: (r) => <span className="text-sm text-[#6b7480]">{r.contact}</span> },
    { id: 'source', header: 'SOURCE', width: '100px', cell: (r) => <Badge variant={SRC_BADGE[r.source] ?? 'default'}>{r.source.replace('_', '-')}</Badge> },
    { id: 'date', header: 'ENQUIRY DATE', width: '110px', accessor: 'date' },
    { id: 'status', header: 'STATUS', width: '110px', cell: (r) => <Badge variant={ENQ_STATUS[r.status] ?? 'default'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '110px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>View</button><span className="text-[#d7dce1]">|</span><button>Follow Up</button></div> },
  ];

  const appColumns: ColumnDef<Application>[] = [
    { id: 'name', header: 'APPLICANT', width: 'minmax(140px,1.4fr)', cell: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size="md" /><span className="text-sm font-medium">{r.name}</span></div> },
    { id: 'appNo', header: 'APP NO', width: '130px', cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.appNo}</span> },
    { id: 'grade', header: 'GRADE', width: '90px', accessor: 'grade' },
    { id: 'submitted', header: 'SUBMITTED', width: '100px', accessor: 'submitted' },
    {
      id: 'docs', header: 'DOCUMENTS', width: '110px', align: 'center',
      cell: (r) => {
        const complete = r.docsComplete === r.docsTotal;
        return <span style={{ color: complete ? '#146b41' : '#8a5a00' }} className="text-sm font-medium">{r.docsComplete} of {r.docsTotal}</span>;
      },
    },
    { id: 'status', header: 'STATUS', width: '140px', cell: (r) => <Badge variant={APP_STATUS[r.status] ?? 'default'}>{r.status.replace(/_/g, ' ')}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '130px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>Review</button><span className="text-[#d7dce1]">|</span><button>Accept</button></div> },
  ];

  const filteredEnquiries = ENQUIRIES.filter((e) =>
    (statusFilter === 'all' || e.status === statusFilter) &&
    (sourceFilter === 'all' || e.source === sourceFilter) &&
    (!search || e.applicant.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title="Admissions Pipeline"
        subtitle="Enquiries, applications, and enrolments · 2024–25"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={ENQUIRIES} filename="admissions" formats={['csv', 'excel']}
              columns={[{ header: 'Applicant', accessor: 'applicant' }, { header: 'Grade', accessor: 'grade' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary">+ Add Enquiry</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TOTAL ENQUIRIES" value="48" subtitle="this term" />
        <KpiCard title="APPLICATIONS" value="32" trend="+4" trendPositive subtitle="this week" />
        <KpiCard title="ADMITTED" value="24" trend="75%" trendPositive subtitle="conversion" />
        <KpiCard title="PENDING REVIEW" value="12" trend="3 urgent" trendPositive={false} />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar placeholder="Search applicant…" value={search} onChange={setSearch} className="w-64" />
          {activeTab === 'enquiries' && (
            <>
              <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
              <Dropdown label="Source" value={sourceFilter} options={SOURCE_OPTIONS} onChange={setSourceFilter} />
            </>
          )}
          <div className="flex-1" />
          <ExportButton label="Export" data={(activeTab === 'enquiries' ? filteredEnquiries : APPLICATIONS) as unknown[]} filename={activeTab} formats={['csv', 'excel']}
            columns={[{ header: 'Name', accessor: (r: unknown) => String((r as { applicant?: string; name?: string }).applicant ?? (r as { name?: string }).name ?? '') }]} />
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b border-[#e2ebf6] bg-[#f3f7fc] px-4 py-2.5 text-sm">
            <span className="font-medium">{selected.length} selected</span>
            <div className="flex-1" />
            <button className="text-[#6b7480]" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}

        {activeTab === 'enquiries' && <DataTable columns={enquiryColumns} data={filteredEnquiries} selectable onSelectionChange={setSelected} />}
        {activeTab === 'applications' && <DataTable columns={appColumns} data={APPLICATIONS} />}

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize}
            total={activeTab === 'enquiries' ? filteredEnquiries.length : APPLICATIONS.length}
            onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
