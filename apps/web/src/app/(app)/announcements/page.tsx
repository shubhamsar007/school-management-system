'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, SearchBar, Dropdown, Pagination, DataTable, ExportButton, Modal, ConfirmDialog } from '@/components/ui';
import { Input, Select } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { KpiSkeleton } from '@/components/ui/skeleton';
import {
  useAnnouncements,
  useCreateAnnouncement,
  usePublishAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type Announcement,
} from '@/lib/hooks/use-comms';
import { useOrganization, useCampuses } from '@/lib/hooks/use-academics';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Students', value: 'STUDENTS' },
  { label: 'Teachers', value: 'TEACHERS' },
  { label: 'Parents', value: 'PARENTS' },
  { label: 'Staff', value: 'STAFF' },
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const STATUS_BADGE: Record<string, 'active' | 'default' | 'pending' | 'left'> = {
  PUBLISHED: 'active',
  DRAFT: 'default',
  ARCHIVED: 'left',
};

const AUDIENCE_BADGE: Record<string, 'active' | 'graduated' | 'pending' | 'default'> = {
  ALL: 'default',
  STUDENTS: 'graduated',
  TEACHERS: 'active',
  PARENTS: 'pending',
  STAFF: 'default',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Create / Edit modal ──────────────────────────────────────────────────────

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  announcement?: Announcement;
}

function AnnouncementModal({ open, onClose, announcement }: AnnouncementModalProps) {
  const toast = useToast();
  const isEdit = !!announcement;

  const { data: org } = useOrganization();
  const { data: campuses = [] } = useCampuses(org?.id);
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();

  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [audienceType, setAudienceType] = React.useState('ALL');
  const [campusId, setCampusId] = React.useState('');
  const [publishAt, setPublishAt] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setTitle(announcement?.title ?? '');
      setContent(announcement?.content ?? '');
      setAudienceType(announcement?.audienceType ?? 'ALL');
      setCampusId(announcement?.campusId ?? '');
      setPublishAt('');
      setExpiresAt('');
    }
  }, [open, announcement]);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: announcement!.id,
          title: title.trim(),
          content: content.trim(),
          audienceType,
        });
        toast.success('Announcement updated.');
      } else {
        await create.mutateAsync({
          title: title.trim(),
          content: content.trim(),
          audienceType,
          ...(campusId ? { campusId } : {}),
          ...(publishAt ? { publishAt } : {}),
          ...(expiresAt ? { expiresAt } : {}),
        });
        toast.success('Announcement created as draft.');
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to save.');
    }
  }

  const isPending = create.isPending || update.isPending;

  const campusOptions = [
    { label: '— All campuses —', value: '' },
    ...campuses.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Announcement' : 'New Announcement'}
      description={isEdit ? 'Update the announcement details.' : 'Create a new announcement. It starts as a draft.'}
      size="md"
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Draft'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. School Closure Notice"
        />
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            Content <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the full announcement…"
            rows={5}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 13,
              border: '1px solid #e0ddd5',
              borderRadius: 8,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#14181c',
              background: '#fff',
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Audience"
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value)}
            options={AUDIENCE_OPTIONS}
          />
          {!isEdit && (
            <Select
              label="Campus"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              options={campusOptions}
              hint="Leave blank to target all campuses"
            />
          )}
        </div>
        {!isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Schedule Publish At"
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              hint="Leave blank to publish manually"
            />
            <Input
              label="Expires At"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const toast = useToast();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selected, setSelected] = React.useState<Announcement[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Announcement | null>(null);

  const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
  const { data: announcements = [], isLoading } = useAnnouncements(filters);
  const publishMutation = usePublishAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const filtered = announcements.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // KPI counts from real data (all statuses)
  const { data: allAnnouncements = [] } = useAnnouncements();
  const published = allAnnouncements.filter((a) => a.status === 'PUBLISHED').length;
  const drafts = allAnnouncements.filter((a) => a.status === 'DRAFT').length;

  async function handlePublish(a: Announcement) {
    try {
      await publishMutation.mutateAsync(a.id);
      toast.success(`"${a.title}" published.`);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to publish.');
    }
  }

  async function handleArchive(a: Announcement) {
    try {
      await updateMutation.mutateAsync({ id: a.id, status: 'ARCHIVED' });
      toast.success(`"${a.title}" archived.`);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to archive.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete.');
    }
  }

  const columns: ColumnDef<Announcement>[] = [
    {
      id: 'title',
      header: 'TITLE',
      width: 'minmax(200px,1.4fr)',
      cell: (r) => (
        <div>
          <div className="text-sm font-medium text-[#14181c]">{r.title}</div>
          <div className="mt-0.5 text-xs text-[#8a929b] line-clamp-1">{r.content}</div>
        </div>
      ),
    },
    {
      id: 'audience',
      header: 'AUDIENCE',
      width: '110px',
      cell: (r) => <Badge variant={AUDIENCE_BADGE[r.audienceType] ?? 'default'}>{r.audienceType}</Badge>,
    },
    {
      id: 'publishedAt',
      header: 'PUBLISHED',
      width: '130px',
      accessor: (r) => formatDate(r.publishAt ?? r.updatedAt),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge>,
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '160px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium">
          {r.status === 'DRAFT' && (
            <>
              <button className="text-[#2b5fa8]" onClick={() => setEditTarget(r)}>Edit</button>
              <span className="text-[#d7dce1]">|</span>
              <button className="text-[#16a34a]" onClick={() => void handlePublish(r)}>Publish</button>
              <span className="text-[#d7dce1]">|</span>
              <button className="text-[#b3261e]" onClick={() => setDeleteTarget(r)}>Delete</button>
            </>
          )}
          {r.status === 'PUBLISHED' && (
            <>
              <button className="text-[#2b5fa8]" onClick={() => setEditTarget(r)}>Edit</button>
              <span className="text-[#d7dce1]">|</span>
              <button className="text-[#6b7280]" onClick={() => void handleArchive(r)}>Archive</button>
            </>
          )}
          {r.status === 'ARCHIVED' && (
            <span className="text-[#9ca3af]">Archived</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="School-wide communications and notices"
        actions={
          <div className="flex gap-2">
            <ExportButton
              label="Export"
              data={announcements}
              filename="announcements"
              formats={['csv', 'excel']}
              columns={[
                { header: 'Title', accessor: 'title' },
                { header: 'Audience', accessor: 'audienceType' },
                { header: 'Status', accessor: 'status' },
                { header: 'Published', accessor: (a: Announcement) => formatDate(a.publishAt) },
              ]}
            />
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              + New Announcement
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <KpiCard title="TOTAL" value={String(allAnnouncements.length)} subtitle="all announcements" variant="sage" />
          <KpiCard title="PUBLISHED" value={String(published)} subtitle="live" variant="blue" />
          <KpiCard title="DRAFTS" value={String(drafts)} subtitle="unpublished" variant="clay" />
          <KpiCard title="ARCHIVED" value={String(allAnnouncements.filter((a) => a.status === 'ARCHIVED').length)} subtitle="hidden" variant="heather" />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar placeholder="Search announcements…" value={search} onChange={setSearch} className="w-64" />
          <Dropdown label="Status" value={statusFilter} options={STATUS_FILTER_OPTIONS} onChange={setStatusFilter} />
          <div className="flex-1" />
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b border-[#e2ebf6] bg-[#f3f7fc] px-4 py-2.5 text-sm">
            <span className="font-medium">{selected.length} selected</span>
            <div className="flex-1" />
            <button className="text-[#6b7480]" onClick={() => setSelected([])}>Clear</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">Loading announcements…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">No announcements found</p>
            <p className="text-xs text-[#8a929b]">Create your first announcement to get started.</p>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>+ New Announcement</Button>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={paginated} selectable onSelectionChange={setSelected} />
            <div className="border-t border-[#eef0f2] p-3">
              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </div>
          </>
        )}
      </div>

      <AnnouncementModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {editTarget && (
        <AnnouncementModal open={!!editTarget} onClose={() => setEditTarget(null)} announcement={editTarget} />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
