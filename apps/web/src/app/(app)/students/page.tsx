'use client';

import * as React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Pencil, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { KpiCard } from '@/components/ui/kpi-card';
import { SearchBar } from '@/components/ui/search-bar';
import { Dropdown } from '@/components/ui/dropdown';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layouts/page-header';

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'ACTIVE' | 'PENDING' | 'LEFT' | 'GRADUATED';

interface Student {
  id: string;
  name: string;
  email: string;
  admissionNo: string;
  class: string;
  guardian: string;
  guardianPhone: string;
  status: Status;
  joined: string;
}

// ─── Sample data ─────────────────────────────────────────────────────────────

const STUDENTS: Student[] = [
  { id: '1', name: 'Aarav Mehta',      email: 'aarav.m@school.in',   admissionNo: 'ADM-2024-0117', class: 'Grade 8 · B',  guardian: 'Rohit Mehta',      guardianPhone: '+91 98220 41187', status: 'ACTIVE',    joined: '15 Apr 2024' },
  { id: '2', name: 'Diya Krishnan',    email: 'diya.k@school.in',    admissionNo: 'ADM-2024-0118', class: 'Grade 8 · B',  guardian: 'Latha Krishnan',   guardianPhone: '+91 99401 20934', status: 'ACTIVE',    joined: '15 Apr 2024' },
  { id: '3', name: 'Ishaan Bose',      email: 'ishaan.b@school.in',  admissionNo: 'ADM-2023-0904', class: 'Grade 9 · A',  guardian: 'Sujoy Bose',       guardianPhone: '+91 98301 77420', status: 'ACTIVE',    joined: '02 Apr 2023' },
  { id: '4', name: 'Kavya Nair',       email: 'kavya.n@school.in',   admissionNo: 'ADM-2024-0121', class: 'Grade 6 · C',  guardian: 'Priya Nair',       guardianPhone: '+91 94470 18823', status: 'PENDING',   joined: '18 Apr 2024' },
  { id: '5', name: 'Manav Sethi',      email: 'manav.s@school.in',   admissionNo: 'ADM-2022-0455', class: 'Grade 11 · A', guardian: 'Anil Sethi',       guardianPhone: '+91 98110 65302', status: 'ACTIVE',    joined: '11 Apr 2022' },
  { id: '6', name: 'Nikhil Rana',      email: 'nikhil.r@school.in',  admissionNo: 'ADM-2021-0312', class: 'Grade 12 · B', guardian: 'Vikas Rana',       guardianPhone: '+91 98730 44519', status: 'LEFT',      joined: '09 Apr 2021' },
  { id: '7', name: 'Saanvi Deshpande', email: 'saanvi.d@school.in',  admissionNo: 'ADM-2024-0129', class: 'Grade 7 · A',  guardian: 'Meera Deshpande',  guardianPhone: '+91 90280 33176', status: 'ACTIVE',    joined: '22 Apr 2024' },
  { id: '8', name: 'Vihaan Gupta',     email: 'vihaan.g@school.in',  admissionNo: 'ADM-2020-0198', class: 'Grade 12 · A', guardian: 'Shalini Gupta',    guardianPhone: '+91 98180 90211', status: 'GRADUATED', joined: '06 Apr 2020' },
];

// ─── Filter options ───────────────────────────────────────────────────────────

const CLASS_OPTIONS = [
  { label: 'All Classes', value: 'all' },
  { label: 'Grade 6', value: 'Grade 6' },
  { label: 'Grade 7', value: 'Grade 7' },
  { label: 'Grade 8', value: 'Grade 8' },
  { label: 'Grade 9', value: 'Grade 9' },
  { label: 'Grade 11', value: 'Grade 11' },
  { label: 'Grade 12', value: 'Grade 12' },
];

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Left', value: 'LEFT' },
  { label: 'Graduated', value: 'GRADUATED' },
];

const SECTION_OPTIONS = [
  { label: 'All Sections', value: 'all' },
  { label: 'Section A', value: 'A' },
  { label: 'Section B', value: 'B' },
  { label: 'Section C', value: 'C' },
];

const YEAR_OPTIONS = [
  { label: 'Any Year', value: 'all' },
  { label: '2020', value: '2020' },
  { label: '2021', value: '2021' },
  { label: '2022', value: '2022' },
  { label: '2023', value: '2023' },
  { label: '2024', value: '2024' },
];

// ─── Helper: status → badge variant ──────────────────────────────────────────

function statusVariant(status: Status): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':    return 'active';
    case 'PENDING':   return 'pending';
    case 'LEFT':      return 'left';
    case 'GRADUATED': return 'graduated';
  }
}

// ─── Sortable column key ──────────────────────────────────────────────────────

type SortKey = 'name' | 'admissionNo' | 'class' | 'status' | 'joined';

function SortIcon({ column, sortKey, dir }: { column: SortKey; sortKey: SortKey; dir: 'asc' | 'desc' }) {
  if (column !== sortKey) return <ArrowUpDown size={12} className="ml-1 opacity-40" />;
  return dir === 'asc'
    ? <ArrowUp size={12} className="ml-1 text-[#2b5fa8]" />
    : <ArrowDown size={12} className="ml-1 text-[#2b5fa8]" />;
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [search, setSearch] = React.useState('');
  const [classFilter, setClassFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sectionFilter, setSectionFilter] = React.useState('all');
  const [yearFilter, setYearFilter] = React.useState('all');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = React.useState<SortKey>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // ── Filtering ──
  const filtered = React.useMemo(() => {
    return STUDENTS.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.admissionNo.toLowerCase().includes(q)) return false;
      }
      if (classFilter !== 'all' && !s.class.startsWith(classFilter)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (sectionFilter !== 'all' && !s.class.includes(`· ${sectionFilter}`)) return false;
      if (yearFilter !== 'all' && !s.joined.includes(yearFilter)) return false;
      return true;
    });
  }, [search, classFilter, statusFilter, sectionFilter, yearFilter]);

  // ── Sorting ──
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as string;
      const bv = b[sortKey] as string;
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Pagination ──
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch('');
    setClassFilter('all');
    setStatusFilter('all');
    setSectionFilter('all');
    setYearFilter('all');
    setPage(1);
  }

  // ── Select all (current page) ──
  const allPageSelected = paginated.length > 0 && paginated.every((s) => selectedIds.has(s.id));
  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasActiveFilters =
    search || classFilter !== 'all' || statusFilter !== 'all' || sectionFilter !== 'all' || yearFilter !== 'all';

  return (
    <>
      {/* Page header */}
      <PageHeader
        title="Students"
        subtitle="1,248 enrolled across 6 classes · academic year 2024–25"
        actions={
          <>
            <Button variant="secondary">Import CSV</Button>
            <Button variant="primary">+ Add Student</Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <KpiCard
          title="TOTAL ENROLLED"
          value="1,248"
          trend="+3.2%"
          trendPositive={true}
          subtitle="vs last year"
        />
        <KpiCard
          title="ACTIVE"
          value="1,189"
          trend="+18"
          trendPositive={true}
          subtitle="this term"
        />
        <KpiCard
          title="PENDING APPROVAL"
          value="34"
          trend="12 urgent"
          trendPositive={false}
          subtitle="awaiting review"
        />
        <KpiCard
          title="ATTENDANCE RATE"
          value="91.4%"
          trend="−0.8%"
          trendPositive={false}
          subtitle="vs last month"
        />
      </div>

      {/* Main card */}
      <div
        className="bg-white rounded-xl border border-[#e6e8eb]"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e8eb] px-5 py-3">
          <SearchBar
            placeholder="Search name or admission no."
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            className="w-56"
          />
          <Dropdown
            label="Class"
            value={classFilter}
            options={CLASS_OPTIONS}
            onChange={(v) => { setClassFilter(v); setPage(1); }}
          />
          <Dropdown
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          />
          <Dropdown
            label="Section"
            value={sectionFilter}
            options={SECTION_OPTIONS}
            onChange={(v) => { setSectionFilter(v); setPage(1); }}
          />
          <Dropdown
            label="Joined"
            value={yearFilter}
            options={YEAR_OPTIONS}
            onChange={(v) => { setYearFilter(v); setPage(1); }}
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" size="icon" title="Manage columns">
            <Columns3 size={15} />
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #e6e8eb' }}>
                <Th style={{ width: 44, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    style={{
                      width: 15,
                      height: 15,
                      accentColor: '#2b5fa8',
                      cursor: 'pointer',
                    }}
                  />
                </Th>
                <SortableTh label="STUDENT"      col="name"        sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="ADMISSION NO" col="admissionNo" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="CLASS"        col="class"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <Th>GUARDIAN</Th>
                <SortableTh label="STATUS"       col="status"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="JOINED"       col="joined"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <Th style={{ textAlign: 'right' }}>ACTIONS</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[13px] text-[#8a929b]">
                    No students match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((student) => {
                  const isSelected = selectedIds.has(student.id);
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
                          onChange={() => toggleSelect(student.id)}
                          style={{
                            width: 15,
                            height: 15,
                            accentColor: '#2b5fa8',
                            cursor: 'pointer',
                          }}
                        />
                      </td>

                      {/* Student */}
                      <td style={{ padding: '0 12px', minWidth: 220 }}>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={student.name} size="sm" />
                          <div>
                            <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>
                              {student.name}
                            </p>
                            <p style={{ fontSize: '12px', color: '#8a929b' }}>{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Admission No */}
                      <td style={{ padding: '0 12px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                        {student.admissionNo}
                      </td>

                      {/* Class */}
                      <td style={{ padding: '0 12px', fontSize: '13px', color: '#14181c', whiteSpace: 'nowrap' }}>
                        {student.class}
                      </td>

                      {/* Guardian */}
                      <td style={{ padding: '0 12px', minWidth: 180 }}>
                        <p style={{ fontSize: '13px', color: '#14181c' }}>{student.guardian}</p>
                        <p style={{ fontSize: '12px', color: '#8a929b' }}>{student.guardianPhone}</p>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0 12px', whiteSpace: 'nowrap' }}>
                        <Badge variant={statusVariant(student.status)}>
                          {student.status.charAt(0) + student.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>

                      {/* Joined */}
                      <td style={{ padding: '0 12px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                        {student.joined}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="gap-1 text-[#2b5fa8] hover:text-[#24518f]">
                            <Eye size={13} />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-[#6b7480]">
                            <Pencil size={13} />
                            Edit
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
        <div className="border-t border-[#e6e8eb] px-5 py-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      </div>
    </>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────

function Th({
  children,
  style,
  className,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <th
      className={className}
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
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
}) {
  const isActive = col === sortKey;
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
      <span className="inline-flex items-center">
        {label}
        <SortIcon column={col} sortKey={sortKey} dir={sortDir} />
      </span>
    </th>
  );
}
