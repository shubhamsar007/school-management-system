'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, DataTable, Dropdown, Spinner, EmptyState, ConfirmDialog } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { financeApi, formatCurrency, type FeeStructure } from '@/lib/finance-api';
import { CreateFeeStructureModal } from './_components/create-fee-structure-modal';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
];

const YEAR_OPTIONS = [
  { label: 'All Years', value: 'all' },
  { label: '2024–25', value: '2024-25' },
  { label: '2025–26', value: '2025-26' },
  { label: '2026–27', value: '2026-27' },
];

export default function FeeStructuresPage() {
  const [structures, setStructures] = React.useState<FeeStructure[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [yearFilter, setYearFilter] = React.useState('all');
  const [showCreate, setShowCreate] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = React.useState<FeeStructure | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [publishing, setPublishing] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string } = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await financeApi.feeStructures.list(params);
      setStructures(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    if (yearFilter === 'all') return structures;
    return structures.filter((s) => s.academicYearId === yearFilter);
  }, [structures, yearFilter]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handlePublish(id: string) {
    setPublishing(id);
    try {
      await financeApi.feeStructures.publish(id);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to publish');
    } finally {
      setPublishing(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await financeApi.feeStructures.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<FeeStructure>[] = [
    {
      id: 'name',
      header: 'STRUCTURE NAME',
      width: 'minmax(160px, 1.5fr)',
      cell: (r) => (
        <button
          onClick={() => toggleExpand(r.id)}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#2b5fa8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
          }}
        >
          {expanded.has(r.id) ? '▾ ' : '▸ '}{r.name}
        </button>
      ),
    },
    {
      id: 'academicYear',
      header: 'ACADEMIC YEAR',
      width: '130px',
      cell: (r) => (
        <span style={{ fontSize: 13, color: '#6d746e' }}>{r.academicYearId}</span>
      ),
    },
    {
      id: 'classId',
      header: 'CLASS',
      width: '110px',
      cell: (r) => (
        <span style={{ fontSize: 13, color: '#6d746e' }}>{r.classId}</span>
      ),
    },
    {
      id: 'total',
      header: 'TOTAL',
      width: '110px',
      align: 'right',
      cell: (r) => {
        const total = (r.items ?? []).reduce(
          (s, it) => s + parseFloat(it.amount || '0'),
          0
        );
        return (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>
            {formatCurrency(total)}
          </span>
        );
      },
    },
    {
      id: 'items',
      header: 'ITEMS',
      width: '70px',
      align: 'center',
      cell: (r) => (
        <span style={{ fontSize: 13, color: '#6d746e' }}>{(r.items ?? []).length}</span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => (
        <Badge variant={r.status === 'PUBLISHED' ? 'active' : 'default'}>
          {r.status === 'PUBLISHED' ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '170px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button onClick={() => toggleExpand(r.id)} className="hover:underline">
            {expanded.has(r.id) ? 'Collapse' : 'View'}
          </button>
          {r.status === 'DRAFT' && (
            <>
              <span className="text-[#d7dce1]">|</span>
              <button
                onClick={() => handlePublish(r.id)}
                className="hover:underline text-[#3f6152]"
                disabled={publishing === r.id}
              >
                {publishing === r.id ? 'Publishing…' : 'Publish'}
              </button>
              <span className="text-[#d7dce1]">|</span>
              <button
                onClick={() => setDeleteTarget(r)}
                className="hover:underline text-[#b3261e]"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Build rows including expansion rows
  const tableData = React.useMemo(() => {
    const rows: (FeeStructure & { _isExpansion?: boolean; _parentId?: string })[] = [];
    for (const s of filtered) {
      rows.push(s);
      if (expanded.has(s.id) && s.items?.length > 0) {
        // We show expansion inline using a trick: add a pseudo-row
        // Actually we'll handle expansion via the table row rendering — for DataTable
        // compatibility, we just toggle a state and render below the row via custom cell
      }
    }
    return rows;
  }, [filtered, expanded]);

  return (
    <div>
      <PageHeader
        title="Fee Structures"
        subtitle="Class-level fee templates"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + Create Structure
          </Button>
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <Dropdown
          label="Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
        <Dropdown
          label="Academic Year"
          value={yearFilter}
          options={YEAR_OPTIONS}
          onChange={setYearFilter}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: '16px 20px', color: '#b3261e', fontSize: 13 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No fee structures found"
            description="Create your first fee structure to start managing fees."
            action={
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                + Create Structure
              </Button>
            }
          />
        ) : (
          <div>
            <DataTable columns={columns} data={tableData} />
            {/* Expansion panels */}
            {filtered
              .filter((s) => expanded.has(s.id) && s.items?.length > 0)
              .map((s) => (
                <div
                  key={`expand-${s.id}`}
                  style={{
                    borderTop: '1px solid #f0f2f4',
                    background: '#fafafa',
                    padding: '12px 20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#6d746e',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 8,
                    }}
                  >
                    Items — {s.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {s.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: '#fff',
                          border: '1px solid #e6e8eb',
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 500, color: '#2c322f' }}>
                          {item.feeHead?.name ?? item.feeHeadId}
                        </span>
                        <div style={{ display: 'flex', gap: 16, color: '#6d746e' }}>
                          <span>{item.frequency.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 600, color: '#2c322f' }}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <CreateFeeStructureModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Fee Structure"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
