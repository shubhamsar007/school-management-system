'use client';

import * as React from 'react';
import { Badge, Button, DataTable, SearchBar, Pagination, ExportButton, SubjectTypeBadge, Select } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useSubjects } from '@/lib/hooks/use-academics';
import type { Subject } from '@/lib/types/academics';
import { AddSubjectModal } from './add-subject-modal';
import { EditSubjectModal } from './edit-subject-modal';
import { DeleteSubjectDialog } from './delete-subject-dialog';

const TYPE_FILTER_OPTIONS = [
  { label: 'All Types',      value: '' },
  { label: 'Core',           value: 'CORE' },
  { label: 'Elective',       value: 'ELECTIVE' },
  { label: 'Co-Curricular',  value: 'CO_CURRICULAR' },
  { label: 'Language',       value: 'LANGUAGE' },
];

export function SubjectsTab() {
  const { data: subjects = [], isLoading } = useSubjects();
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Subject | null>(null);

  const filtered = React.useMemo(
    () =>
      subjects.filter((s) => {
        const matchSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase());
        const matchType = !typeFilter || s.subjectType === typeFilter;
        return matchSearch && matchType;
      }),
    [subjects, search, typeFilter],
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnDef<Subject>[] = [
    {
      id: 'name',
      header: 'SUBJECT NAME',
      width: '200px',
      sortable: true,
      cell: (row) => (
        <span style={{ fontWeight: 500, color: '#14181c' }}>{row.name}</span>
      ),
    },
    {
      id: 'code',
      header: 'CODE',
      width: '110px',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7480' }}>{row.code}</span>
      ),
    },
    {
      id: 'type',
      header: 'TYPE',
      width: '130px',
      cell: (row) => <SubjectTypeBadge type={row.subjectType} />,
    },
    {
      id: 'description',
      header: 'DESCRIPTION',
      width: '220px',
      cell: (row) => (
        <span
          style={{
            fontSize: 12,
            color: '#6b7480',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {row.description || '—'}
        </span>
      ),
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
            placeholder="Search subjects…"
            value={search}
            onChange={setSearch}
            className="w-64"
          />
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={TYPE_FILTER_OPTIONS}
          />
          <div className="flex-1" />
          <ExportButton
            label="Export"
            data={filtered as unknown[]}
            filename="subjects"
            formats={['csv', 'excel']}
            columns={[
              { header: 'Subject Name', accessor: (r) => String((r as Subject).name) },
              { header: 'Code',         accessor: (r) => String((r as Subject).code) },
              { header: 'Type',         accessor: (r) => String((r as Subject).subjectType) },
              { header: 'Description',  accessor: (r) => String((r as Subject).description ?? '') },
              { header: 'Status',       accessor: (r) => String((r as Subject).status) },
            ]}
          />
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            + Add Subject
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

      <AddSubjectModal open={addOpen} onClose={() => setAddOpen(false)} />

      {editTarget && (
        <EditSubjectModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          subject={editTarget}
        />
      )}

      {deleteTarget && (
        <DeleteSubjectDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          subject={deleteTarget}
        />
      )}
    </>
  );
}
