'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, DataTable, Spinner, EmptyState, ConfirmDialog } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { financeApi, type FeeHead } from '@/lib/finance-api';
import { FeeHeadModal } from './_components/fee-head-modal';

type BadgeVariant = 'active' | 'pending' | 'default' | 'graduated' | 'left';

const CATEGORY_BADGE: Record<string, BadgeVariant> = {
  ACADEMIC: 'active',
  TRANSPORT: 'graduated',
  HOSTEL: 'pending',
  ACTIVITY: 'default',
  EXAMINATION: 'default',
  ADMINISTRATIVE: 'default',
  MISC: 'default',
};

const CATEGORY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Hostel', value: 'HOSTEL' },
  { label: 'Activity', value: 'ACTIVITY' },
  { label: 'Examination', value: 'EXAMINATION' },
  { label: 'Administrative', value: 'ADMINISTRATIVE' },
  { label: 'Misc', value: 'MISC' },
];

export default function FeeHeadsPage() {
  const [feeHeads, setFeeHeads] = React.useState<FeeHead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [showModal, setShowModal] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<FeeHead | undefined>();
  const [deleteTarget, setDeleteTarget] = React.useState<FeeHead | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await financeApi.feeHeads.list(
        categoryFilter !== 'all' ? { category: categoryFilter } : undefined
      );
      setFeeHeads(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fee heads');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleStatus(feeHead: FeeHead) {
    const newStatus = feeHead.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await financeApi.feeHeads.update(feeHead.id, { status: newStatus });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update status');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await financeApi.feeHeads.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete fee head');
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<FeeHead>[] = [
    {
      id: 'name',
      header: 'NAME',
      width: 'minmax(160px, 1.5fr)',
      cell: (r) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#2c322f' }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#8a929b', fontFamily: 'monospace' }}>{r.code}</div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'CATEGORY',
      width: '140px',
      cell: (r) => (
        <Badge variant={CATEGORY_BADGE[r.category] ?? 'default'}>
          {r.category.charAt(0) + r.category.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'refundable',
      header: 'REFUNDABLE',
      width: '110px',
      align: 'center',
      cell: (r) => (
        <span style={{ fontSize: 13, color: r.isRefundable ? '#3f6152' : '#8a929b' }}>
          {r.isRefundable ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => (
        <Badge variant={r.status === 'ACTIVE' ? 'active' : 'default'}>
          {r.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '180px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button
            onClick={() => { setEditTarget(r); setShowModal(true); }}
            className="hover:underline"
          >
            Edit
          </button>
          <span className="text-[#d7dce1]">|</span>
          <button
            onClick={() => toggleStatus(r)}
            className="hover:underline"
            style={{ color: r.status === 'ACTIVE' ? '#6d746e' : '#3f6152' }}
          >
            {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
          <span className="text-[#d7dce1]">|</span>
          <button
            onClick={() => setDeleteTarget(r)}
            className="hover:underline"
            style={{ color: '#b3261e' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Fee Heads"
        subtitle="Configure fee types and categories"
        actions={
          <Button
            variant="primary"
            onClick={() => { setEditTarget(undefined); setShowModal(true); }}
          >
            + Add Fee Head
          </Button>
        }
      />

      {/* Category filter */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setCategoryFilter(f.value)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: categoryFilter === f.value ? 600 : 400,
              border: '1px solid',
              borderColor: categoryFilter === f.value ? '#3f6152' : '#e6e1d5',
              background: categoryFilter === f.value ? '#d8e9de' : '#fffdf8',
              color: categoryFilter === f.value ? '#2c322f' : '#6d746e',
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px 20px',
              color: '#b3261e',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : feeHeads.length === 0 ? (
          <EmptyState
            title="No fee heads found"
            description={
              categoryFilter !== 'all'
                ? 'No fee heads in this category. Try a different filter.'
                : 'Add your first fee head to start configuring billing.'
            }
            action={
              <Button
                variant="primary"
                onClick={() => { setEditTarget(undefined); setShowModal(true); }}
              >
                + Add Fee Head
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} data={feeHeads} />
        )}
      </div>

      <FeeHeadModal
        open={showModal}
        onClose={() => setShowModal(false)}
        feeHead={editTarget}
        onSaved={load}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Fee Head"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
