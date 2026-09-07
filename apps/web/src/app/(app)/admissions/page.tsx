'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, Button, Badge, Avatar, KpiCard, SearchBar, Dropdown,
  Pagination, Tabs, DataTable, ExportButton, Spinner, EmptyState,
} from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  useEnquiries, useApplications, useAdmissionStats,
  useReviewApplication, useApproveApplication,
  type Enquiry, type Application,
} from '@/lib/hooks/use-admissions';
import { AddEnquiryModal } from './_components/add-enquiry-modal';
import { NewApplicationModal } from './_components/new-application-modal';

// ─── Enum maps ────────────────────────────────────────────────────────────────

const ENQ_STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  NEW: 'pending',
  CONTACTED: 'default',
  VISITED: 'active',
  APPLIED: 'active',
  CONVERTED: 'graduated',
  DROPPED: 'left',
};

const ENQ_STATUS_LABEL: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  VISITED: 'Visited',
  APPLIED: 'Applied',
  CONVERTED: 'Converted',
  DROPPED: 'Dropped',
};

const SRC_VARIANT: Record<string, 'active' | 'graduated' | 'default'> = {
  WALK_IN: 'default',
  PHONE: 'default',
  WEBSITE: 'graduated',
  REFERRAL: 'active',
  SOCIAL_MEDIA: 'graduated',
  ADVERTISEMENT: 'default',
  OTHER: 'default',
};

const SRC_LABEL: Record<string, string> = {
  WALK_IN: 'Walk-in',
  PHONE: 'Phone',
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social',
  ADVERTISEMENT: 'Ad',
  OTHER: 'Other',
};

const APP_STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  DRAFT: 'default',
  SUBMITTED: 'pending',
  UNDER_REVIEW: 'active',
  APPROVED: 'graduated',
  REJECTED: 'left',
};

// ─── Filter options ───────────────────────────────────────────────────────────

const ENQ_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Visited', value: 'VISITED' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Dropped', value: 'DROPPED' },
];

const SOURCE_OPTIONS = [
  { label: 'All Sources', value: 'all' },
  { label: 'Walk-in', value: 'WALK_IN' },
  { label: 'Phone', value: 'PHONE' },
  { label: 'Website', value: 'WEBSITE' },
  { label: 'Referral', value: 'REFERRAL' },
  { label: 'Social Media', value: 'SOCIAL_MEDIA' },
  { label: 'Advertisement', value: 'ADVERTISEMENT' },
];

const APP_STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export default function AdmissionsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState('enquiries');
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sourceFilter, setSourceFilter] = React.useState('all');
  const [appStatusFilter, setAppStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [showAddEnquiry, setShowAddEnquiry] = React.useState(false);
  const [showNewApplication, setShowNewApplication] = React.useState(false);
  const [selected, setSelected] = React.useState<Enquiry[]>([]);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  React.useEffect(() => { setPage(1); }, [statusFilter, sourceFilter, appStatusFilter, activeTab]);

  const { data: stats } = useAdmissionStats();

  const { data: enquiryData, isLoading: enqLoading } = useEnquiries({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { data: appData, isLoading: appLoading } = useApplications({
    status: appStatusFilter !== 'all' ? appStatusFilter : undefined,
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const reviewApp = useReviewApplication();
  const approveApp = useApproveApplication();

  // Filter enquiries by source client-side (not in API since source filter isn't supported server-side for list)
  const enquiries = React.useMemo(() => {
    const rows = enquiryData?.data ?? [];
    if (sourceFilter === 'all') return rows;
    return rows.filter((e) => e.source === sourceFilter);
  }, [enquiryData, sourceFilter]);

  const applications = appData?.data ?? [];

  const enquiryTotal = sourceFilter !== 'all'
    ? enquiries.length
    : (enquiryData?.meta.total ?? 0);
  const appTotal = appData?.meta.total ?? 0;

  const TABS = [
    { id: 'enquiries', label: 'Enquiries', count: stats?.enquiries.total ?? enquiryData?.meta.total },
    { id: 'applications', label: 'Applications', count: stats?.applications.total ?? appData?.meta.total },
  ];

  // ─── Columns ──────────────────────────────────────────────────

  const enquiryColumns: ColumnDef<Enquiry>[] = [
    {
      id: 'applicant',
      header: 'APPLICANT',
      width: 'minmax(160px,1.4fr)',
      cell: (r) => (
        <div>
          <div className="text-sm font-medium text-[#14181c]">{r.studentName}</div>
          <div className="text-[11px] text-[#8a929b]">{r.parentName ?? '—'}</div>
        </div>
      ),
    },
    {
      id: 'grade',
      header: 'CLASS INTERESTED',
      width: '130px',
      cell: (r) => (
        <span className="text-sm text-[#6b7480]">
          {r.classInterested?.name ?? '—'}
        </span>
      ),
    },
    {
      id: 'contact',
      header: 'CONTACT',
      width: '140px',
      cell: (r) => <span className="text-sm text-[#6b7480]">{r.phone}</span>,
    },
    {
      id: 'source',
      header: 'SOURCE',
      width: '100px',
      cell: (r) => (
        <Badge variant={SRC_VARIANT[r.source] ?? 'default'}>
          {SRC_LABEL[r.source] ?? r.source}
        </Badge>
      ),
    },
    {
      id: 'date',
      header: 'ENQUIRY DATE',
      width: '110px',
      cell: (r) => (
        <span className="text-sm text-[#6b7480]">
          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'apps',
      header: 'APPS',
      width: '60px',
      align: 'center',
      cell: (r) => (
        <span className="text-sm text-[#6b7480]">{r._count.applications}</span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '110px',
      cell: (r) => (
        <Badge variant={ENQ_STATUS_VARIANT[r.status] ?? 'default'}>
          {ENQ_STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '110px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button onClick={() => router.push(`/admissions/enquiries/${r.id}`)}>View</button>
        </div>
      ),
    },
  ];

  const appColumns: ColumnDef<Application>[] = [
    {
      id: 'name',
      header: 'APPLICANT',
      width: 'minmax(140px,1.4fr)',
      cell: (r) => {
        const name = r.enquiry?.studentName ?? r.applicationNumber;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="md" />
            <div>
              <div className="text-sm font-medium text-[#14181c]">{name}</div>
              {r.enquiry?.parentName && (
                <div className="text-[11px] text-[#8a929b]">{r.enquiry.parentName}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'appNo',
      header: 'APP NO',
      width: '140px',
      cell: (r) => <span className="font-mono text-xs text-[#6b7480]">{r.applicationNumber}</span>,
    },
    {
      id: 'grade',
      header: 'CLASS',
      width: '100px',
      cell: (r) => <span className="text-sm text-[#6b7480]">{r.class?.name ?? '—'}</span>,
    },
    {
      id: 'submitted',
      header: 'SUBMITTED',
      width: '100px',
      cell: (r) => (
        <span className="text-sm text-[#6b7480]">
          {r.submittedAt
            ? new Date(r.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            : '—'}
        </span>
      ),
    },
    {
      id: 'docs',
      header: 'DOCS',
      width: '70px',
      align: 'center',
      cell: (r) => (
        <span className="text-sm font-medium" style={{ color: r._count.documents > 0 ? '#146b41' : '#8a929b' }}>
          {r._count.documents}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '130px',
      cell: (r) => (
        <Badge variant={APP_STATUS_VARIANT[r.status] ?? 'default'}>
          {r.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '160px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button onClick={() => router.push(`/admissions/applications/${r.id}`)}>
            Review
          </button>
          {r.status === 'SUBMITTED' && (
            <>
              <span className="text-[#d7dce1]">|</span>
              <button
                onClick={() => reviewApp.mutate(r.id)}
                disabled={reviewApp.isPending}
              >
                Start Review
              </button>
            </>
          )}
          {(r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW') && (
            <>
              <span className="text-[#d7dce1]">|</span>
              <button
                onClick={() => approveApp.mutate(r.id)}
                disabled={approveApp.isPending}
                className="text-[#146b41]"
              >
                Approve
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ─── KPI values ───────────────────────────────────────────────

  const totalEnquiries = stats?.enquiries.total ?? enquiryData?.meta.total ?? 0;
  const totalApplications = stats?.applications.total ?? appData?.meta.total ?? 0;
  const approved = stats?.applications.byStatus['APPROVED'] ?? 0;
  const pendingReview = stats?.applications.pendingReview ?? 0;
  const conversionRate = totalEnquiries > 0
    ? ((approved / totalEnquiries) * 100).toFixed(0)
    : '0';

  const isLoading = activeTab === 'enquiries' ? enqLoading : appLoading;

  return (
    <div>
      <PageHeader
        title="Admissions Pipeline"
        subtitle="Enquiries, applications, and enrolments"
        actions={
          <div className="flex gap-2">
            <ExportButton
              label="Export"
              data={(activeTab === 'enquiries' ? enquiries : applications) as unknown[]}
              filename={activeTab}
              formats={['csv', 'excel']}
              columns={[
                { header: 'Name', accessor: (r: unknown) => {
                  const row = r as Enquiry & Application;
                  return row.studentName ?? row.enquiry?.studentName ?? row.applicationNumber ?? '';
                }},
              ]}
            />
            <Button variant="secondary" onClick={() => setShowNewApplication(true)}>
              + New Application
            </Button>
            <Button variant="primary" onClick={() => setShowAddEnquiry(true)}>
              + Add Enquiry
            </Button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="TOTAL ENQUIRIES" value={String(totalEnquiries)} subtitle="this term" />
        <KpiCard title="APPLICATIONS" value={String(totalApplications)} subtitle="submitted" />
        <KpiCard
          title="APPROVED"
          value={String(approved)}
          trend={`${conversionRate}%`}
          trendPositive
          subtitle="conversion"
        />
        <KpiCard
          title="PENDING REVIEW"
          value={String(pendingReview)}
          trendPositive={false}
          subtitle="need action"
        />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={(t) => { setActiveTab(t); setSearch(''); setPage(1); }} className="mb-4" />

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar
            placeholder={activeTab === 'enquiries' ? 'Search applicant…' : 'Search app no…'}
            value={search}
            onChange={setSearch}
            className="w-64"
          />
          {activeTab === 'enquiries' && (
            <>
              <Dropdown
                label="Status"
                value={statusFilter}
                options={ENQ_STATUS_OPTIONS}
                onChange={setStatusFilter}
              />
              <Dropdown
                label="Source"
                value={sourceFilter}
                options={SOURCE_OPTIONS}
                onChange={setSourceFilter}
              />
            </>
          )}
          {activeTab === 'applications' && (
            <Dropdown
              label="Status"
              value={appStatusFilter}
              options={APP_STATUS_OPTIONS}
              onChange={setAppStatusFilter}
            />
          )}
          <div className="flex-1" />
        </div>

        {/* Bulk bar */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b border-[#e2ebf6] bg-[#f3f7fc] px-4 py-2.5 text-sm">
            <span className="font-medium">{selected.length} selected</span>
            <div className="flex-1" />
            <button className="text-[#6b7480]" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : activeTab === 'enquiries' ? (
          enquiries.length === 0 ? (
            <EmptyState
              title="No enquiries found"
              description={debouncedSearch || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first enquiry to get started.'}
              action={<Button variant="primary" onClick={() => setShowAddEnquiry(true)}>+ Add Enquiry</Button>}
            />
          ) : (
            <DataTable columns={enquiryColumns} data={enquiries} selectable onSelectionChange={setSelected} />
          )
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications found"
            description={debouncedSearch || appStatusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first application to get started.'}
            action={(!debouncedSearch && appStatusFilter === 'all') ? <Button variant="primary" onClick={() => setShowNewApplication(true)}>+ New Application</Button> : undefined}
          />
        ) : (
          <DataTable columns={appColumns} data={applications} />
        )}

        {/* Pagination */}
        {!isLoading && (
          <div className="border-t border-[#eef0f2] p-3">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={activeTab === 'enquiries' ? enquiryTotal : appTotal}
              onPageChange={setPage}
              onPageSizeChange={() => {}}
            />
          </div>
        )}
      </div>

      <AddEnquiryModal open={showAddEnquiry} onClose={() => setShowAddEnquiry(false)} />
      <NewApplicationModal open={showNewApplication} onClose={() => setShowNewApplication(false)} />
    </div>
  );
}
