'use client';

import * as React from 'react';
import { Umbrella } from 'lucide-react';
import { useLeaveRequests } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'APPROVED':   return 'active';
    case 'PENDING':    return 'pending';
    case 'REJECTED':
    case 'CANCELLED':  return 'left';
    default:           return 'default';
  }
}

const STATUS_OPTIONS: DropdownOption[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending',      value: 'PENDING' },
  { label: 'Approved',     value: 'APPROVED' },
  { label: 'Rejected',     value: 'REJECTED' },
  { label: 'Cancelled',    value: 'CANCELLED' },
];

// ─── Leave tab ────────────────────────────────────────────────────────────────

export function LeaveTab({ employeeId }: { employeeId: string }) {
  const [statusFilter, setStatusFilter] = React.useState('');

  const { data, isLoading } = useLeaveRequests(employeeId);
  const all = data ?? [];

  const requests = statusFilter
    ? all.filter((r) => r.status === statusFilter)
    : all;

  // Summary counts
  const pending  = all.filter((r) => r.status === 'PENDING').length;
  const approved = all.filter((r) => r.status === 'APPROVED').length;
  const totalDaysApproved = all
    .filter((r) => r.status === 'APPROVED')
    .reduce((s, r) => s + r.totalDays, 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-[#e6e8eb] p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <Skeleton height={10} width={80} className="mb-2" />
              <Skeleton height={24} width={40} />
            </div>
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#e6e8eb] p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex justify-between">
              <Skeleton height={13} width={120} />
              <Skeleton height={20} width={70} className="rounded-full" />
            </div>
            <Skeleton height={11} width={200} className="mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending approval', value: pending,           color: '#92400e', bg: '#fef3c7' },
          { label: 'Approved',         value: approved,          color: '#33604a', bg: '#dbe8dc' },
          { label: 'Days approved',    value: totalDaysApproved, color: '#3d6678', bg: '#dfeaf1' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e6e8eb] px-4 py-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '11.5px', color: '#8a929b', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + list */}
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0f2f4]">
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>
            Leave Requests {all.length > 0 && <span style={{ color: '#8a929b', fontWeight: 400 }}>({all.length})</span>}
          </p>
          <Dropdown
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: '40px 24px' }}>
            <EmptyState
              icon={<Umbrella size={24} />}
              title={statusFilter ? 'No matching requests' : 'No leave requests'}
              description={statusFilter ? 'Try a different status filter.' : 'This employee has not submitted any leave requests.'}
            />
          </div>
        ) : (
          requests.map((req, idx) => (
            <div
              key={req.id}
              className="flex items-start justify-between gap-3 hover:bg-[#fafbfc] transition-colors"
              style={{ padding: '14px 20px', borderBottom: idx < requests.length - 1 ? '1px solid #f5f6f7' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>
                    {req.leaveType.name}
                  </p>
                  <span style={{ fontSize: '11.5px', color: '#8a929b' }}>
                    {req.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 3 }}>
                  {formatDate(req.startDate)}
                  {req.startDate !== req.endDate ? ` – ${formatDate(req.endDate)}` : ''}
                  <span style={{ color: '#b0b6bc', marginLeft: 6 }}>
                    {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                  </span>
                </p>
                {req.reason && (
                  <p style={{ fontSize: '12px', color: '#8a929b', marginTop: 3 }} className="truncate">
                    {req.reason}
                  </p>
                )}
                {req.rejectionReason && (
                  <p style={{ fontSize: '12px', color: '#b3261e', marginTop: 3 }}>
                    Rejected: {req.rejectionReason}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <Badge variant={statusVariant(req.status)}>
                  {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                </Badge>
                <span style={{ fontSize: '11px', color: '#b0b6bc' }}>
                  {formatDate(req.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
