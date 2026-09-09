'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge, Avatar, Pagination, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useSubstitutionAssignments } from '@/lib/substitution-api';
import type { SubstitutionAssignment } from '@/lib/substitution-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ASSIGN_BADGE: Record<string, 'active' | 'pending' | 'left' | 'graduated' | 'default'> = {
  CONFIRMED: 'active',
  COMPLETED: 'graduated',
  SUGGESTED: 'pending',
  DECLINED: 'left',
  CANCELLED: 'left',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const { data, isLoading, isError } = useSubstitutionAssignments({ page, limit: pageSize });
  const assignments = data?.data ?? [];
  const total = data?.total ?? 0;

  // Build per-teacher substitution counts
  const teacherCounts = React.useMemo(() => {
    const map: Record<string, { name: string; accepted: number; declined: number; cancelled: number }> = {};
    for (const a of assignments) {
      const empId = a.substituteTeacherId;
      if (!empId) continue;
      const emp = a.substituteEmployee;
      const name = emp ? `${emp.person.firstName} ${emp.person.lastName}` : 'Unknown';
      if (!map[empId]) map[empId] = { name, accepted: 0, declined: 0, cancelled: 0 };
      if (a.status === 'CONFIRMED' || a.status === 'COMPLETED') map[empId].accepted++;
      else if (a.status === 'DECLINED') map[empId].declined++;
      else if (a.status === 'CANCELLED') map[empId].cancelled++;
    }
    return Object.entries(map).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.accepted - a.accepted);
  }, [assignments]);

  const columns: ColumnDef<SubstitutionAssignment>[] = [
    {
      id: 'date',
      header: 'DATE',
      width: '110px',
      cell: (r) => <span className="text-sm">{r.substitutionRequest?.date ? fmtDate(r.substitutionRequest.date) : '—'}</span>,
    },
    {
      id: 'substitute',
      header: 'SUBSTITUTE',
      width: 'minmax(140px,1.3fr)',
      cell: (r) => {
        const name = r.substituteEmployee
          ? `${r.substituteEmployee.person.firstName} ${r.substituteEmployee.person.lastName}`
          : '—';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="md" />
            <span className="text-sm font-medium truncate">{name}</span>
          </div>
        );
      },
    },
    {
      id: 'covering',
      header: 'COVERING FOR',
      width: '150px',
      cell: (r) => {
        const emp = r.substitutionRequest?.leaveRequest?.employee;
        return <span className="text-sm">{emp ? `${emp.person.firstName} ${emp.person.lastName}` : '—'}</span>;
      },
    },
    {
      id: 'class',
      header: 'CLASS',
      width: '120px',
      cell: (r) => <span className="text-sm">{r.timetableEntry?.section?.name ?? '—'}</span>,
    },
    {
      id: 'subject',
      header: 'SUBJECT',
      width: '110px',
      cell: (r) => <span className="text-sm">{r.timetableEntry?.subject?.name ?? '—'}</span>,
    },
    {
      id: 'period',
      header: 'PERIOD',
      width: '100px',
      cell: (r) => <span className="text-sm text-[#6b7480]">{r.timetableEntry?.period?.name ?? '—'}</span>,
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '110px',
      cell: (r) => <Badge variant={ASSIGN_BADGE[r.status] ?? 'default'}>{r.status}</Badge>,
    },
    {
      id: 'score',
      header: 'SCORE',
      width: '65px',
      align: 'center',
      cell: (r) => {
        const s = r.algorithmScore ? Number(r.algorithmScore) : null;
        if (s === null) return <span className="text-xs text-[#8a929b]">—</span>;
        return (
          <span className="text-sm font-semibold" style={{ color: s >= 80 ? '#146b41' : s >= 60 ? '#8a5a00' : '#b3261e' }}>
            {Math.round(s)}
          </span>
        );
      },
    },
  ];

  const exportData = assignments.map((a) => ({
    date: a.substitutionRequest?.date ? fmtDate(a.substitutionRequest.date) : '—',
    substitute: a.substituteEmployee ? `${a.substituteEmployee.person.firstName} ${a.substituteEmployee.person.lastName}` : '—',
    class: a.timetableEntry?.section?.name ?? '—',
    subject: a.timetableEntry?.subject?.name ?? '—',
    period: a.timetableEntry?.period?.name ?? '—',
    status: a.status,
    score: a.algorithmScore ? Math.round(Number(a.algorithmScore)) : '—',
  }));

  return (
    <div>
      <PageHeader
        title="Substitution History"
        subtitle="All-time substitution log"
        actions={
          <ExportButton
            label="Export"
            data={exportData}
            filename="substitution-history"
            formats={['csv']}
            columns={[
              { header: 'Date', accessor: 'date' },
              { header: 'Substitute', accessor: 'substitute' },
              { header: 'Class', accessor: 'class' },
              { header: 'Subject', accessor: 'subject' },
              { header: 'Period', accessor: 'period' },
              { header: 'Status', accessor: 'status' },
              { header: 'Score', accessor: 'score' },
            ]}
          />
        }
      />

      <div className="flex gap-4 mb-6">
        {/* Fairness table */}
        <div className="flex-1 rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e6e8eb]" style={{ background: '#fafbfc' }}>
            <p className="text-xs font-semibold text-[#6b7480] uppercase tracking-wide">Substitution Count by Teacher</p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {teacherCounts.length === 0 ? (
              <p className="text-xs text-center text-[#8a929b] py-6">No data</p>
            ) : (
              teacherCounts.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f3f4f6] last:border-0">
                  <span className="text-sm text-[#8a929b] w-5">{i + 1}</span>
                  <Avatar name={t.name} size="sm" />
                  <span className="text-sm font-medium flex-1 truncate">{t.name}</span>
                  <span className="text-sm font-bold text-[#146b41]">{t.accepted}</span>
                  {t.declined > 0 && <span className="text-xs text-[#b3261e]">{t.declined} declined</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full history table */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading history…</div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#b3261e]">Failed to load history.</div>
        ) : assignments.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">No substitution history found.</div>
        ) : (
          <DataTable columns={columns} data={assignments} />
        )}
        <div className="border-t border-[#eef0f2] p-3">
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
