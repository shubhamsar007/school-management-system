'use client';

import * as React from 'react';
import { Badge, DataTable } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  useAttendanceSessions,
  useSubmitSession,
  useLockSession,
  type AttendanceSession,
} from '@/lib/hooks/use-attendance';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const SESSION_STATUS_VARIANT: Record<string, 'pending' | 'active' | 'default'> = {
  OPEN: 'pending',
  SUBMITTED: 'active',
  LOCKED: 'default',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SessionsTabProps {
  campusId: string;
  academicYearId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionsTab({ campusId, academicYearId }: SessionsTabProps) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');

  const { data: sessions = [], isLoading } = useAttendanceSessions({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  });

  const submit = useSubmitSession();
  const lock = useLockSession();

  function handleSubmit(id: string) {
    submit.mutate(id, {
      onSuccess: () => toast.success('Session submitted successfully'),
      onError: () => toast.error('Failed to submit session'),
    });
  }

  function handleLock(id: string) {
    lock.mutate(id, {
      onSuccess: () => toast.success('Session locked successfully'),
      onError: () => toast.error('Failed to lock session'),
    });
  }

  const columns: ColumnDef<AttendanceSession>[] = [
    {
      id: 'date',
      header: 'DATE',
      width: '120px',
      cell: (r) => (
        <span style={{ fontSize: '13px', color: '#14181c', fontWeight: 500 }}>
          {formatDate(r.date)}
        </span>
      ),
    },
    {
      id: 'section',
      header: 'SECTION',
      width: 'minmax(160px,1.4fr)',
      cell: (r) => (
        <div>
          <div style={{ fontSize: '13px', color: '#14181c', fontWeight: 500 }}>
            {r.section?.name ?? '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#8a929b' }}>
            {r.section?.academicClass?.name ?? ''}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '110px',
      cell: (r) => (
        <Badge variant={SESSION_STATUS_VARIANT[r.status] ?? 'default'}>
          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'created',
      header: 'CREATED',
      width: '130px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatDate(r.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '130px',
      align: 'right',
      cell: (r) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          {r.status === 'OPEN' && (
            <button
              onClick={() => handleSubmit(r.id)}
              disabled={submit.isPending}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#2b5fa8',
                background: 'none',
                border: '1px solid #2b5fa8',
                borderRadius: 5,
                padding: '3px 10px',
                cursor: 'pointer',
              }}
            >
              Submit
            </button>
          )}
          {r.status === 'SUBMITTED' && (
            <button
              onClick={() => handleLock(r.id)}
              disabled={lock.isPending}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#475569',
                background: 'none',
                border: '1px solid #d7dce1',
                borderRadius: 5,
                padding: '3px 10px',
                cursor: 'pointer',
              }}
            >
              Lock
            </button>
          )}
          {r.status === 'LOCKED' && (
            <span style={{ fontSize: '12px', color: '#8a929b' }}>—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: 10,
        border: '1px solid #e6e8eb',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid #eef0f2',
          padding: '10px 14px',
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: 32,
            border: '1px solid #d7dce1',
            borderRadius: 6,
            padding: '0 8px',
            fontSize: '13px',
            color: '#14181c',
          }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="LOCKED">Locked</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            height: 32,
            border: '1px solid #d7dce1',
            borderRadius: 6,
            padding: '0 8px',
            fontSize: '13px',
            color: '#14181c',
          }}
        />

        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            style={{
              fontSize: '12px',
              color: '#8a929b',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Clear date
          </button>
        )}

        <div style={{ flex: 1 }} />
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
          Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
          No attendance sessions.
          <br />
          <span style={{ fontSize: '12px', color: '#b0b6bc' }}>
            Sessions are created when you mark attendance for a class.
          </span>
        </div>
      ) : (
        <DataTable columns={columns} data={sessions} />
      )}
    </div>
  );
}
