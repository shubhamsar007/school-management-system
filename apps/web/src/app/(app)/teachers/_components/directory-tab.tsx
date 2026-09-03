'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Pencil, Users } from 'lucide-react';
import { useTeachers, useEmployeeDepartments, type TeacherListParams } from '@/lib/hooks/use-teachers';
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
    case 'PROBATION':
    case 'ON_LEAVE':
    case 'ONBOARDING':  return 'pending';
    case 'EXITED':
    case 'ARCHIVED':    return 'left';
    default:            return 'default';
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Sub-tab pills ────────────────────────────────────────────────────────────

type SubTab = 'all' | 'teaching' | 'non-teaching' | 'former';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'all',          label: 'All' },
  { id: 'teaching',     label: 'Teaching' },
  { id: 'non-teaching', label: 'Non-Teaching' },
  { id: 'former',       label: 'Former' },
];

function SubTabPills({ active, onChange }: { active: SubTab; onChange: (t: SubTab) => void }) {
  return (
    <div className="flex gap-1">
      {SUB_TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: active === t.id ? 600 : 400,
            borderRadius: 20,
            border: '1px solid',
            borderColor: active === t.id ? '#2b5fa8' : '#e6e8eb',
            background: active === t.id ? '#eef3fb' : 'transparent',
            color: active === t.id ? '#2b5fa8' : '#6b7480',
            cursor: 'pointer',
            transition: 'all 100ms',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Th helpers ───────────────────────────────────────────────────────────────

type SortKey = 'name' | 'employeeNumber' | 'department' | 'designation' | 'status' | 'joiningDate';

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: '0 12px', height: 40, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a929b', textAlign: 'left', whiteSpace: 'nowrap', ...style }}>
      {children}
    </th>
  );
}

function SortableTh({ label, col, sortKey, sortDir, onSort }: { label: string; col: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void }) {
  const isActive = col === sortKey;
  const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      onClick={() => onSort(col)}
      style={{ padding: '0 12px', height: 40, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: isActive ? '#2b5fa8' : '#8a929b', textAlign: 'left', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
      className="hover:text-[#14181c] transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon size={11} className={isActive ? 'text-[#2b5fa8]' : 'opacity-40'} />
      </span>
    </th>
  );
}

// ─── Bulk bar ─────────────────────────────────────────────────────────────────

const BULK_ACTIONS: DropdownOption[] = [
  { label: 'Export Selected',   value: 'export' },
  { label: 'Send Notification', value: 'notify' },
];

function BulkBar({ count, onClear }: { count: number; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[#e6e8eb]" style={{ background: '#f0f5fb' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#2b5fa8' }}>{count} selected</span>
      <Dropdown label="Bulk Actions" value="" options={BULK_ACTIONS} onChange={() => {}} />
      <button onClick={onClear} style={{ fontSize: '12px', color: '#8a929b', marginLeft: 'auto' }} className="hover:text-[#14181c]">
        Clear selection
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DirectoryTab() {
  // ── Sub-tab ──
  const [subTab, setSubTab] = React.useState<SubTab>('all');

  // ── Filters ──
  const [search, setSearch]         = React.useState('');
  const [departmentId, setDeptId]   = React.useState('');
  const [status, setStatus]         = React.useState('');
  const [empType, setEmpType]       = React.useState('');
  const [page, setPage]             = React.useState(1);
  const [pageSize, setPageSize]     = React.useState(25);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sortKey, setSortKey]       = React.useState<SortKey>('name');
  const [sortDir, setSortDir]       = React.useState<'asc' | 'desc'>('asc');

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  function resetPage() { setPage(1); }

  // ── Sub-tab → API params ──
  const categoryParam = subTab === 'teaching' ? 'TEACHING' : subTab === 'non-teaching' ? 'NON_TEACHING' : undefined;
  const statusParam   = subTab === 'former'
    ? 'EXITED'
    : status || undefined;

  const params: TeacherListParams = {
    ...(debouncedSearch  ? { search: debouncedSearch } : {}),
    ...(departmentId     ? { departmentId }             : {}),
    ...(statusParam      ? { status: statusParam }      : {}),
    ...(empType          ? { employmentType: empType }  : {}),
    ...(categoryParam    ? { category: categoryParam }  : {}),
    page,
    limit: pageSize,
  };

  const { data, isLoading, isFetching } = useTeachers(params);
  const employees = data?.data ?? [];
  const total     = data?.meta.total ?? 0;

  const { data: departments } = useEmployeeDepartments();

  // ── Filter options ──
  const deptOptions: DropdownOption[] = [
    { label: 'All Departments', value: '' },
    ...(departments ?? []).map((d) => ({ label: d.name, value: d.id })),
  ];
  const statusOptions: DropdownOption[] = [
    { label: 'All Statuses',  value: '' },
    { label: 'Active',        value: 'ACTIVE' },
    { label: 'Probation',     value: 'PROBATION' },
    { label: 'On Leave',      value: 'ON_LEAVE' },
    { label: 'Onboarding',    value: 'ONBOARDING' },
    { label: 'Confirmed',     value: 'CONFIRMED' },
  ];
  const empTypeOptions: DropdownOption[] = [
    { label: 'All Types',  value: '' },
    { label: 'Full-time',  value: 'FULL_TIME' },
    { label: 'Part-time',  value: 'PART_TIME' },
    { label: 'Contract',   value: 'CONTRACT' },
    { label: 'Visiting',   value: 'VISITING' },
  ];

  const hasFilters = !!(debouncedSearch || departmentId || status || empType);

  function clearFilters() {
    setSearch(''); setDeptId(''); setStatus(''); setEmpType(''); setPage(1);
  }

  // ── Sort (client-side on current page) ──
  const sorted = React.useMemo(() => {
    return [...employees].sort((a, b) => {
      let av = '', bv = '';
      if (sortKey === 'name')           { av = a.name;                        bv = b.name; }
      if (sortKey === 'employeeNumber') { av = a.employeeNumber;               bv = b.employeeNumber; }
      if (sortKey === 'department')     { av = a.department?.name ?? '';       bv = b.department?.name ?? ''; }
      if (sortKey === 'designation')    { av = a.designation?.name ?? '';      bv = b.designation?.name ?? ''; }
      if (sortKey === 'status')         { av = a.employmentStatus;             bv = b.employmentStatus; }
      if (sortKey === 'joiningDate')    { av = a.joiningDate;                  bv = b.joiningDate; }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [employees, sortKey, sortDir]);

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  // ── Select ──
  const allSelected = sorted.length > 0 && sorted.every((e) => selectedIds.has(e.id));
  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      sorted.forEach((e) => allSelected ? next.delete(e.id) : next.add(e.id));
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: isFetching && !isLoading ? 0.8 : 1, transition: 'opacity 150ms' }}
    >
      {/* Sub-tabs + filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e8eb] px-5 py-3">
        <SubTabPills active={subTab} onChange={(t) => { setSubTab(t); setStatus(''); setPage(1); }} />
        <div className="w-px h-4 bg-[#e6e8eb] mx-1" />
        <SearchBar
          placeholder="Search name or employee no…"
          value={search}
          onChange={(v) => { setSearch(v); resetPage(); }}
          className="w-52"
        />
        <Dropdown label="Department" value={departmentId} options={deptOptions}  onChange={(v) => { setDeptId(v); resetPage(); }} />
        {subTab === 'all' && (
          <Dropdown label="Status" value={status} options={statusOptions} onChange={(v) => { setStatus(v); resetPage(); }} />
        )}
        <Dropdown label="Type" value={empType} options={empTypeOptions} onChange={(v) => { setEmpType(v); resetPage(); }} />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
        )}
        <div className="flex-1" />
        {total > 0 && (
          <p style={{ fontSize: '12px', color: '#8a929b' }}>{total.toLocaleString()} employees</p>
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
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 14, height: 14, accentColor: '#2b5fa8', cursor: 'pointer' }} />
              </Th>
              <SortableTh label="Employee"    col="name"           sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Emp No"      col="employeeNumber" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Department"  col="department"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Designation" col="designation"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Status"      col="status"         sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh label="Joined"      col="joiningDate"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                <tr key={i} style={{ height: 52, borderBottom: '1px solid #f0f2f4' }}>
                  <td style={{ width: 44, padding: '0 12px' }}><Skeleton width={14} height={14} /></td>
                  <td style={{ padding: '0 12px' }}>
                    <div className="flex items-center gap-2.5">
                      <Skeleton width={32} height={32} className="rounded-full flex-shrink-0" />
                      <div><Skeleton height={12} width={120} className="mb-1.5" /><Skeleton height={10} width={90} /></div>
                    </div>
                  </td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={12} width={80} /></td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={12} width={90} /></td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={12} width={100} /></td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={20} width={60} className="rounded-full" /></td>
                  <td style={{ padding: '0 12px' }}><Skeleton height={12} width={80} /></td>
                  <td style={{ padding: '0 16px' }}><Skeleton height={28} width={60} className="ml-auto rounded-md" /></td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '56px 24px' }}>
                  <EmptyState
                    icon={<Users size={24} />}
                    title={hasFilters ? 'No employees match your filters' : 'No employees yet'}
                    description={hasFilters ? 'Try adjusting your search or filters.' : 'Add employees using the button above.'}
                    action={hasFilters ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button> : undefined}
                  />
                </td>
              </tr>
            ) : (
              sorted.map((emp) => {
                const isSelected = selectedIds.has(emp.id);
                return (
                  <tr
                    key={emp.id}
                    style={{ height: 52, borderBottom: '1px solid #f0f2f4', backgroundColor: isSelected ? '#f3f7fc' : undefined, transition: 'background-color 100ms' }}
                    className={isSelected ? '' : 'hover:bg-[#fafbfc]'}
                  >
                    {/* Checkbox */}
                    <td style={{ width: 44, textAlign: 'center', padding: '0 12px' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(emp.id)} style={{ width: 14, height: 14, accentColor: '#2b5fa8', cursor: 'pointer' }} />
                    </td>

                    {/* Employee */}
                    <td style={{ padding: '0 12px', minWidth: 200 }}>
                      <Link href={`/teachers/${emp.id}`} className="flex items-center gap-2.5 outline-none group">
                        <Avatar name={emp.name} size="sm" />
                        <div>
                          <p className="group-hover:underline" style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>{emp.name}</p>
                          <p style={{ fontSize: '11.5px', color: '#8a929b' }}>{emp.person.email ?? emp.person.phone ?? '—'}</p>
                        </div>
                      </Link>
                    </td>

                    {/* Emp No */}
                    <td style={{ padding: '0 12px', fontFamily: 'monospace', fontSize: '12px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                      {emp.employeeNumber}
                    </td>

                    {/* Department */}
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#14181c', whiteSpace: 'nowrap' }}>
                      {emp.department?.name ?? <span style={{ color: '#c4c9cf' }}>—</span>}
                    </td>

                    {/* Designation */}
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                      {emp.designation?.name ?? <span style={{ color: '#c4c9cf' }}>—</span>}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                      <Badge variant={statusVariant(emp.employmentStatus)}>
                        {emp.employmentStatus.charAt(0) + emp.employmentStatus.slice(1).toLowerCase().replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '0 12px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                      {formatDate(emp.joiningDate)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/teachers/${emp.id}`}>
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
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      )}
    </div>
  );
}
