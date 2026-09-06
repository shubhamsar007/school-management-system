'use client';

import * as React from 'react';
import { Badge, Button, DataTable, SearchBar, Pagination, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useClasses } from '@/lib/hooks/use-academics';
import type { AcademicClass } from '@/lib/types/academics';
import { AddClassModal } from './add-class-modal';
import { EditClassModal } from './edit-class-modal';
import { DeleteClassDialog } from './delete-class-dialog';
import { SectionsManagerModal } from '../sections/sections-manager-modal';

export function ClassesTab() {
  const { data: classes = [], isLoading } = useClasses();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<AcademicClass | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AcademicClass | null>(null);
  const [sectionsTarget, setSectionsTarget] = React.useState<AcademicClass | null>(null);

  const filtered = React.useMemo(
    () =>
      search
        ? classes.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.code.toLowerCase().includes(search.toLowerCase()),
          )
        : classes,
    [classes, search],
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnDef<AcademicClass>[] = [
    {
      id: 'name',
      header: 'CLASS NAME',
      width: '180px',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 500, color: '#14181c' }}>{row.name}</span>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8a929b' }}>{row.code}</span>
        </div>
      ),
    },
    {
      id: 'level',
      header: 'LEVEL',
      width: '70px',
      align: 'center',
      accessor: (row) => row.level ?? '—',
    },
    {
      id: 'sections',
      header: 'SECTIONS',
      width: '90px',
      align: 'center',
      cell: (row) => {
        const count = row.sections?.length ?? 0;
        return (
          <button
            onClick={() => setSectionsTarget(row)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#2b5fa8',
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            {count} section{count !== 1 ? 's' : ''}
          </button>
        );
      },
    },
    {
      id: 'students',
      header: 'STUDENTS',
      width: '90px',
      align: 'center',
      accessor: (row) => row._count?.studentEnrollments ?? 0,
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '90px',
      cell: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'active' : 'inactive'}>
          {row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '90px',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2 text-xs font-medium text-[#2b5fa8]">
          <button className="hover:underline cursor-pointer" onClick={() => setEditTarget(row)}>
            Edit
          </button>
          <span className="text-[#d7dce1]">|</span>
          <button
            className="hover:underline cursor-pointer text-[#b3261e]"
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar
            placeholder="Search classes…"
            value={search}
            onChange={setSearch}
            className="w-64"
          />
          <div className="flex-1" />
          <ExportButton
            label="Export"
            data={filtered as unknown[]}
            filename="classes"
            formats={['csv', 'excel']}
            columns={[
              { header: 'Class Name', accessor: (r) => String((r as AcademicClass).name) },
              { header: 'Code',       accessor: (r) => String((r as AcademicClass).code) },
              { header: 'Level',      accessor: (r) => String((r as AcademicClass).level ?? '') },
              { header: 'Sections',   accessor: (r) => String((r as AcademicClass).sections?.length ?? 0) },
              { header: 'Students',   accessor: (r) => String((r as AcademicClass)._count?.studentEnrollments ?? 0) },
              { header: 'Status',     accessor: (r) => String((r as AcademicClass).status) },
            ]}
          />
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            + Add Class
          </Button>
        </div>

        <DataTable columns={columns} data={paginated} loading={isLoading} />

        <div className="border-t border-[#eef0f2] p-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      </div>

      <AddClassModal open={addOpen} onClose={() => setAddOpen(false)} />

      {editTarget && (
        <EditClassModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          cls={editTarget}
        />
      )}

      {deleteTarget && (
        <DeleteClassDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          cls={deleteTarget}
        />
      )}

      {sectionsTarget && (
        <SectionsManagerModal
          open={!!sectionsTarget}
          onClose={() => setSectionsTarget(null)}
          cls={sectionsTarget}
        />
      )}
    </>
  );
}
