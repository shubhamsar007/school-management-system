'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, SearchBar, Dropdown, Pagination, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface Announcement { id: string; title: string; category: string; audience: string; priority: string; publishedAt: string; status: string; }

const DATA: Announcement[] = [
  { id: '1', title: 'Independence Day Celebration', category: 'GENERAL', audience: 'All', priority: 'HIGH', publishedAt: '14 Aug 2025', status: 'PUBLISHED' },
  { id: '2', title: 'Mid Term Exam Schedule Released', category: 'ACADEMIC', audience: 'Students & Parents', priority: 'HIGH', publishedAt: '10 Aug 2025', status: 'PUBLISHED' },
  { id: '3', title: 'Staff Meeting – 29 Aug 2025', category: 'ADMINISTRATIVE', audience: 'Teachers', priority: 'MEDIUM', publishedAt: '25 Aug 2025', status: 'PUBLISHED' },
  { id: '4', title: 'School Closure – 02 Sep 2025', category: 'GENERAL', audience: 'All', priority: 'HIGH', publishedAt: '28 Aug 2025 10:00 AM', status: 'SCHEDULED' },
  { id: '5', title: 'PTM Schedule – Sep 2025', category: 'ACADEMIC', audience: 'Parents', priority: 'MEDIUM', publishedAt: '20 Aug 2025', status: 'PUBLISHED' },
  { id: '6', title: 'Fee Reminder – Q2 Due', category: 'FINANCE', audience: 'Parents', priority: 'HIGH', publishedAt: '01 Aug 2025', status: 'PUBLISHED' },
  { id: '7', title: 'New Library Books Available', category: 'GENERAL', audience: 'Students', priority: 'LOW', publishedAt: '—', status: 'DRAFT' },
  { id: '8', title: 'Sports Day Registration Open', category: 'EVENTS', audience: 'All', priority: 'MEDIUM', publishedAt: '—', status: 'DRAFT' },
];

const PRIORITY_BADGE: Record<string, 'left' | 'pending' | 'default'> = { HIGH: 'left', MEDIUM: 'pending', LOW: 'default' };
const STATUS_BADGE: Record<string, 'active' | 'default' | 'pending' | 'left'> = { PUBLISHED: 'active', DRAFT: 'default', SCHEDULED: 'pending', ARCHIVED: 'left' };
const CAT_BADGE: Record<string, 'active' | 'graduated' | 'pending' | 'default'> = { GENERAL: 'default', ACADEMIC: 'graduated', ADMINISTRATIVE: 'active', FINANCE: 'pending', EVENTS: 'default' };

const STATUS_OPTIONS = [{ label: 'All Statuses', value: 'all' }, { label: 'Published', value: 'PUBLISHED' }, { label: 'Draft', value: 'DRAFT' }, { label: 'Scheduled', value: 'SCHEDULED' }, { label: 'Archived', value: 'ARCHIVED' }];
const PRIORITY_OPTIONS = [{ label: 'All Priorities', value: 'all' }, { label: 'High', value: 'HIGH' }, { label: 'Medium', value: 'MEDIUM' }, { label: 'Low', value: 'LOW' }];
const AUDIENCE_OPTIONS = [{ label: 'All Audiences', value: 'all' }, { label: 'All', value: 'All' }, { label: 'Students', value: 'Students' }, { label: 'Teachers', value: 'Teachers' }, { label: 'Parents', value: 'Parents' }];

export default function AnnouncementsPage() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selected, setSelected] = React.useState<Announcement[]>([]);

  const columns: ColumnDef<Announcement>[] = [
    {
      id: 'title', header: 'TITLE', width: 'minmax(200px,1.4fr)',
      cell: (r) => (
        <div>
          <div className="text-sm font-medium text-[#14181c]">{r.title}</div>
          <div className="mt-0.5"><Badge variant={CAT_BADGE[r.category] ?? 'default'}>{r.category}</Badge></div>
        </div>
      ),
    },
    { id: 'audience', header: 'AUDIENCE', width: '140px', accessor: 'audience' },
    { id: 'priority', header: 'PRIORITY', width: '90px', cell: (r) => <Badge variant={PRIORITY_BADGE[r.priority] ?? 'default'}>{r.priority}</Badge> },
    { id: 'publishedAt', header: 'PUBLISHED AT', width: '140px', cell: (r) => <span className="text-sm text-[#6b7480]">{r.publishedAt}</span> },
    { id: 'status', header: 'STATUS', width: '100px', cell: (r) => <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '120px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>View</button><span className="text-[#d7dce1]">|</span><button>Edit</button><span className="text-[#d7dce1]">|</span><button>Archive</button></div> },
  ];

  const filtered = DATA.filter((a) =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (priorityFilter === 'all' || a.priority === priorityFilter) &&
    (!search || a.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="School-wide communications and notices"
        actions={
          <div className="flex gap-2">
            <ExportButton label="Export" data={DATA} filename="announcements" formats={['csv', 'excel']}
              columns={[{ header: 'Title', accessor: 'title' }, { header: 'Audience', accessor: 'audience' }, { header: 'Status', accessor: 'status' }]} />
            <Button variant="primary">+ New Announcement</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="PUBLISHED" value="24" subtitle="this term" />
        <KpiCard title="DRAFTS" value="3" subtitle="unpublished" />
        <KpiCard title="REACH" value="1,335" subtitle="total recipients" />
        <KpiCard title="SCHEDULED" value="2" subtitle="upcoming" />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar placeholder="Search announcements…" value={search} onChange={setSearch} className="w-64" />
          <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
          <Dropdown label="Priority" value={priorityFilter} options={PRIORITY_OPTIONS} onChange={setPriorityFilter} />
          <div className="flex-1" />
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b border-[#e2ebf6] bg-[#f3f7fc] px-4 py-2.5 text-sm">
            <span className="font-medium">{selected.length} selected</span>
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
