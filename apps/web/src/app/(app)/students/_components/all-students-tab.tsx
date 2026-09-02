'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Pencil, Users } from 'lucide-react';
import { useStudents, type StudentListParams } from '@/lib/hooks/use-students';
import { useClasses, useSections } from '@/lib/hooks/use-academics';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { SearchBar } from '@/components/ui/search-bar';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':      return 'active';
    case 'GRADUATED':   return 'graduated';
    case 'TRANSFERRED':
    case 'LEFT':        return 'left';
    default:            return 'pending';
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Th helpers ───────────────────────────────────────────────────────────────

type SortKey = 'name' | 'admissionNumber' | 'class' | 'status' | 'admissionDate';

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th
      style={{
        padding: '0 12px',
        height: 40,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#8a929b',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function SortableTh({
  label, col, sortKey, sortDir, onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
}) {
  const isActive = col === sortKey;
  const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: '0 12px',
        height: 40,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: isActive ? '#2b5fa8' : '#8a929b',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      className="hover:text-[#14181c] transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon size={11} className={isActive ? 'text-[#2b5fa8]' : 'opacity-40'} />
      </span>
    </th>
  );
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

const BULK_ACTIONS: DropdownOption[] = [
  { label: 'Assign Section',     value: 'assign-section' },
  { label: 'Change House',       value: 'change-house' },
  { label: 'Export Selected',    value: 'export' },
  { label: 'Send Notification',  value: 'notify' },
  { label: 'Deactivate',         value: 'deactivate' },
];

function BulkBar({ count, onClear }: { count: number; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5 border-b border-[#e6e8eb]"
      style={{ background: '#f0f5fb' }}
    >
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#2b5fa8' }}>
        {count} selected
      </span>
      <Dropdown
        label="Bulk Actions"
        value=""
        options={BULK_ACTIONS}
        onChange={() => {}}
      />
      <button
        onClick={onClear}
        style={{ fontSize: '12px', color: '#8a929b', marginLeft: 'auto' }}
        className="hover:text-[#14181c]"
      >
        Clear selection
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AllStudentsTab() {
  // ── Filter state ──
  const [search, setSearch] = React.useState('');
  const [classId, setClassId] = React.useState('');
  const [sectionId, setSectionId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = React.useState<SortKey>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  function resetPage() { setPage(1); }

  // ── API data ──
  const params: StudentListParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(classId   ? { classId }   : {}),
    ...(sectionId ? { sectionId } : {}),
    ...(status    ? { status }    : {}),
    ...(gender    ? { gender }    : {}),
    page,
    limit: pageSize,
  };
  const { data, isLoading, isFetching } = useStudents(params);
  const students = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const { data: classes } = useClasses();
  const { data: sections } = useSections(classId || null);

  // ── Filter options ──
  const classOptions: DropdownOption[] = [
    { label: 'All Classes', value: '' },
    ...(classes ?? []).map((c) => ({ label: c.name, value: c.id })),
  ];
  const sectionOptions: DropdownOption[] = [
    { label: 'All Sections', value: '' },
    ...(sections ?? []).map((s) => ({ label: `Section ${s.name}`, value: s.id })),
  ];
  const statusOptions: DropdownOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Graduated', value: 'GRADUATED' },
    { label: 'Transferred', value: 'TRANSFERRED' },
    { label: 'Suspended', value: 'SUSPENDED' },
  ];
  const genderOptions: DropdownOption[] = [
    { label: 'All Genders', value: '' },
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
  ];

  const hasFilters = !!(debouncedSearch || classId || sectionId || status || gender);

  function clearFilters() {
    setSearch(''); setClassId(''); setSectionId('');
    setStatus(''); setGender(''); setPage(1);
  }

  // ── Sort (client-side on current page) ──
  const sorted = React.useMemo(() => {
    return [...students].sort((a, b) => {
      let av = '', bv = '';
      if (sortKey === 'name')            { av = a.name;               bv = b.name; }
      if (sortKey === 'admissionNumber') { av = a.admissionNumber;    bv = b.admissionNumber; }
      if (sortKey === 'class')           { av = a.enrollments[0]?.class?.name ?? ''; bv = b.enrollments[0]?.class?.name ?? ''; }
      if (sortKey === 'status')          { av = a.studentStatus;      bv = b.studentStatus; }
      if (sortKey === 'admissionDate')   { av = a.admissionDate;      bv = b.admissionDate; }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [students, sortKey, sortDir]);

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  // ── Select ──
  const allSelected = sorted.length > 0 && sorted.every((s) => selectedIds.has(s.id));
  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      sorted.forEach((s) => allSelected ? next.delete(s.id) : next.add(s.id));
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: isFetching && !isLoading ? 0.8 : 1, transition: 'opacity 150ms' }}
    >
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e8eb] px-5 py-3">
        <SearchBar
          placeholder="Search student, admission no…"
          value={search}
          onChange={(v) => { setSearch(v); resetPage(); }}
          className="w-56"
        />
        <Dropdown
          label="Class"
          value={classId}
          options={classOptions}
          onChange={(v) => { setClassId(v); setSectionId(''); resetPage(); }}
        />
        <Dropdown
          label="Section"
          value={sectionId}
          options={sectionOptions}
          onChange={(v) => { setSectionId(v); resetPage(); }}
        />
        <Dropdown
          label="Status"
          value={status}
          options={statusOptions}
          onChange={(v) => { setStatus(v); resetPage(); }}
        />
        <Dropdown
          label="Gender"
          value={gender}
          options={genderOptions}
          onChange={(v) => { setGender(v); resetPage(); }}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
        <div className="flex-1" />
        {total > 0 && (
          <p style={{ fontSize: '12px', color: '#8a929b' }}>{total.toLocaleString()} students</p>
        )}
      </div>

      {/* Bulk bar */}
      <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #e6e8eb' }}>
              <Th style={{ width: 44, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ width: 14, height: 14, accentColor: '#2b5fa8', cursor: 'pointer' }}
                />
              </Th>
              <SortableTh label="Student"       col="name"            sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Admission No"  col="admissionNumber" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Class"         col="class"           sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Status"        col="status"          sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Admitted"      col="admissionDate"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                <tr key={i} style={{ height: 52, borderBottom: '1px solid #f0f2f4' }}>
                  <td style={{ width: 44, padding: '0 12px' }}><Skeleton width={14} height={14} /></td>
                  <td style={{ padding: '0 12px' }}>
                    <div className="flex items-center gap-2.5">
                      <Skeleton width={32} height={32} className="rounded-full flex-shrink-0" />
                      <div><Skeleton height={12} width={120} className="mb-1.5" /><Skeleton height={10} width={90} /></div>
                    </div>
                  </td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={12} width={100} /></td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={12} width={80} /></td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={20} width={60} className="rounded-full" /></td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={12} width={80} /></td>
                  <td style={{ padding: '0 16px' }}><Skeleton height={28} width={60} className="ml-auto rounded-md" /></td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '56px 24px' }}>
                  <EmptyState
                    icon={<Users size={24} />}
                    title={hasFilters ? 'No students match your filters' : 'No students yet'}
                    description={hasFilters ? 'Try adjusting your search or filters.' : 'Add students using the button above.'}
                    action={hasFilters ? (
                      <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
                    ) : undefined}
                  />
                </td>
              </tr>
            ) : (
              sorted.map((student) => {
                const isSelected = selectedIds.has(student.id);
                const enrollment = student.enrollments[0];
                return (
                  <tr
                    key={student.id}
                    style={{
                      height: 52,
                      borderBottom: '1px solid #f0f2f4',
                      backgroundColor: isSelected ? '#f3f7fc' : undefined,
                      transition: 'background-color 100ms',
                    }}
                    className={isSelected ? '' : 'hover:bg-[#fafbfc]'}
                  >
                    {/* Checkbox */}
                    <td style={{ width: 44, textAlign: 'center', padding: '0 12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(student.id)}
                        style={{ width: 14, height: 14, accentColor: '#2b5fa8', cursor: 'pointer' }}
                      />
                    </td>

                    {/* Student */}
                    <td style={{ padding: '0 12px', minWidth: 200 }}>
                      <Link href={`/students/${student.id}`} className="flex items-center gap-2.5 outline-none group">
                        <Avatar name={student.name} size="sm" />
                        <div>
                          <p className="group-hover:underline" style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>
                            {student.name}
                          </p>
                          <p style={{ fontSize: '11.5px', color: '#8a929b' }}>
                            {student.person.email ?? student.person.phone ?? '—'}
                          </p>
                        </div>
                      </Link>
                    </td>

                    {/* Admission No */}
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                      {student.admissionNumber}
                    </td>

                    {/* Class */}
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#14181c', whiteSpace: 'nowrap' }}>
                      {enrollment
                        ? `${enrollment.class.name} – ${enrollment.section.name}`
                        : <span style={{ color: '#c4c9cf' }}>Not enrolled</span>}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                      <Badge variant={statusVariant(student.studentStatus)}>
                        {student.studentStatus.charAt(0) + student.studentStatus.slice(1).toLowerCase()}
                      </Badge>
                    </td>

                    {/* Admitted */}
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                      {formatDate(student.admissionDate)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/students/${student.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-[#2b5fa8] hover:text-[#24518f]">
                            <Eye size={12} /> View
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="gap-1 text-[#6b7480]">
                          <Pencil size={12} /> Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="border-t border-[#e6e8eb] px-5 py-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      )}
    </div>
  );
}
