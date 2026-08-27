'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, SearchBar, Dropdown, Pagination, Tabs, DataTable, ExportButton, FileUpload, Modal } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface Document { id: string; name: string; fileType: string; category: string; uploadedBy: string; uploadedAt: string; size: string; status: string; }

const ALL_DOCS: Document[] = [
  { id: '1', name: 'Aarav_Mehta_Admission_Form.pdf', fileType: 'PDF', category: 'STUDENT', uploadedBy: 'Admin User', uploadedAt: '15 Apr 2024', size: '245 KB', status: 'VERIFIED' },
  { id: '2', name: 'Grade8_Marksheet_Q1.xlsx', fileType: 'Excel', category: 'STUDENT', uploadedBy: 'Priya Sharma', uploadedAt: '20 Jul 2024', size: '89 KB', status: 'VERIFIED' },
  { id: '3', name: 'Staff_Contracts_2024.pdf', fileType: 'PDF', category: 'STAFF', uploadedBy: 'HR Admin', uploadedAt: '01 Apr 2024', size: '1.2 MB', status: 'VERIFIED' },
  { id: '4', name: 'Fee_Collection_Report_Aug.pdf', fileType: 'PDF', category: 'FINANCE', uploadedBy: 'Finance Admin', uploadedAt: '25 Aug 2024', size: '380 KB', status: 'PENDING' },
  { id: '5', name: 'Kavya_Nair_TC.pdf', fileType: 'PDF', category: 'STUDENT', uploadedBy: 'Admin User', uploadedAt: '18 Apr 2024', size: '156 KB', status: 'VERIFIED' },
  { id: '6', name: 'Payroll_Aug2024.xlsx', fileType: 'Excel', category: 'FINANCE', uploadedBy: 'Payroll Admin', uploadedAt: '31 Aug 2024', size: '212 KB', status: 'PENDING' },
  { id: '7', name: 'School_Calendar_2024-25.pdf', fileType: 'PDF', category: 'GENERAL', uploadedBy: 'Admin User', uploadedAt: '01 Apr 2024', size: '520 KB', status: 'VERIFIED' },
  { id: '8', name: 'Amit_Joshi_Medical.pdf', fileType: 'PDF', category: 'STAFF', uploadedBy: 'HR Admin', uploadedAt: '26 Aug 2024', size: '98 KB', status: 'PENDING' },
];

const CAT_BADGE: Record<string, 'graduated' | 'active' | 'pending' | 'default'> = { STUDENT: 'graduated', STAFF: 'active', FINANCE: 'pending', GENERAL: 'default' };
const STATUS_BADGE: Record<string, 'active' | 'pending' | 'left'> = { VERIFIED: 'active', PENDING: 'pending', REJECTED: 'left' };

const TABS = [{ id: 'files', label: 'All Files', count: 284 }, { id: 'pending', label: 'Pending Verification', count: 43 }];
const CAT_OPTIONS = [{ label: 'All Categories', value: 'all' }, { label: 'Student', value: 'STUDENT' }, { label: 'Staff', value: 'STAFF' }, { label: 'Finance', value: 'FINANCE' }, { label: 'General', value: 'GENERAL' }];
const STATUS_OPTIONS = [{ label: 'All Statuses', value: 'all' }, { label: 'Verified', value: 'VERIFIED' }, { label: 'Pending', value: 'PENDING' }, { label: 'Rejected', value: 'REJECTED' }];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = React.useState('files');
  const [search, setSearch] = React.useState('');
  const [catFilter, setCatFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const makeColumns = (showVerifyActions: boolean): ColumnDef<Document>[] => [
    {
      id: 'name', header: 'FILE NAME', width: 'minmax(200px,1.4fr)',
      cell: (r) => (
        <div>
          <div className="text-sm font-medium text-[#14181c]">{r.name}</div>
          <div className="text-[11px] text-[#8a929b]">{r.fileType}</div>
        </div>
      ),
    },
    { id: 'category', header: 'CATEGORY', width: '100px', cell: (r) => <Badge variant={CAT_BADGE[r.category] ?? 'default'}>{r.category}</Badge> },
    { id: 'uploadedBy', header: 'UPLOADED BY', width: '120px', accessor: 'uploadedBy' },
    { id: 'uploadedAt', header: 'UPLOADED AT', width: '110px', accessor: 'uploadedAt' },
    { id: 'size', header: 'SIZE', width: '80px', align: 'right', accessor: 'size' },
    { id: 'status', header: 'STATUS', width: '90px', cell: (r) => <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge> },
    {
      id: 'actions', header: 'ACTIONS', width: showVerifyActions ? '150px' : '120px', align: 'right',
      cell: () => showVerifyActions
        ? <div className="flex justify-end gap-1.5 text-xs font-medium"><button className="text-[#146b41]">Verify</button><span className="text-[#d7dce1]">|</span><button className="text-[#b3261e]">Reject</button><span className="text-[#d7dce1]">|</span><button className="text-[#2b5fa8]">View</button></div>
        : <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>View</button><span className="text-[#d7dce1]">|</span><button>Download</button><span className="text-[#d7dce1]">|</span><button className="text-[#b3261e]">Delete</button></div>,
    },
  ];

  const filtered = ALL_DOCS.filter((d) =>
    (catFilter === 'all' || d.category === catFilter) &&
    (statusFilter === 'all' || d.status === statusFilter) &&
    (!search || d.name.toLowerCase().includes(search.toLowerCase()))
  );
  const pending = ALL_DOCS.filter((d) => d.status === 'PENDING');
  const displayData = activeTab === 'pending' ? pending : filtered;

  return (
    <div>
      <PageHeader
        title="Documents & Files"
        subtitle="Uploaded files, verification, and storage"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={ALL_DOCS} filename="documents" formats={['csv', 'excel']}
              columns={[{ header: 'File Name', accessor: 'name' }, { header: 'Category', accessor: 'category' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary" onClick={() => setUploadOpen(true)}>+ Upload Document</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TOTAL FILES" value="284" subtitle="stored" />
        <KpiCard title="VERIFIED" value="241" trend="84.9%" trendPositive subtitle="of total" />
        <KpiCard title="PENDING VERIFICATION" value="43" trend="awaiting" trendPositive={false} />
        <KpiCard title="STORAGE USED" value="1.2 GB" trend="of 10 GB" trendPositive subtitle="used" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {activeTab === 'files' && (
          <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
            <SearchBar placeholder="Search files…" value={search} onChange={setSearch} className="w-64" />
            <Dropdown label="Category" value={catFilter} options={CAT_OPTIONS} onChange={setCatFilter} />
            <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
            <div className="flex-1" />
          </div>
        )}

        <DataTable columns={makeColumns(activeTab === 'pending')} data={displayData} />

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize} total={displayData.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document" size="md"
        footer={<><Button variant="secondary" onClick={() => setUploadOpen(false)}>Cancel</Button><Button variant="primary">Upload</Button></>}>
        <FileUpload accept={['pdf', 'excel', 'csv']} maxSizeMB={10} multiple />
      </Modal>
    </div>
  );
}
