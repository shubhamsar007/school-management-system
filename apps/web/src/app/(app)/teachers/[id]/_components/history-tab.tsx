'use client';

import * as React from 'react';
import { History, ArrowRight, User } from 'lucide-react';
import { useLifecycleEvents } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':
    case 'CONFIRMED':   return 'active';
    case 'PROBATION':
    case 'ONBOARDING':
    case 'ON_LEAVE':    return 'pending';
    case 'EXITED':
    case 'ARCHIVED':    return 'left';
    default:            return 'default';
  }
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    JOINED:        'Joined',
    CONFIRMED:     'Confirmed',
    PROMOTED:      'Promoted',
    TRANSFERRED:   'Transferred',
    STATUS_CHANGE: 'Status changed',
    RESIGNED:      'Resigned',
    TERMINATED:    'Terminated',
    RETIRED:       'Retired',
    REINSTATED:    'Reinstated',
    ON_LEAVE:      'Placed on leave',
    RETURNED:      'Returned from leave',
  };
  return labels[type] ?? type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const EVENT_TYPE_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  JOINED:        { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  CONFIRMED:     { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  PROMOTED:      { bg: '#dbeafe', fg: '#1e40af', dot: '#3b82f6' },
  TRANSFERRED:   { bg: '#ede9fe', fg: '#5b21b6', dot: '#8b5cf6' },
  STATUS_CHANGE: { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b' },
  RESIGNED:      { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  TERMINATED:    { bg: '#fee2e2', fg: '#991b1b', dot: '#ef4444' },
  RETIRED:       { bg: '#f3f4f6', fg: '#374151', dot: '#9ca3af' },
  REINSTATED:    { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
  ON_LEAVE:      { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b' },
  RETURNED:      { bg: '#dcfce7', fg: '#166534', dot: '#22c55e' },
};

// ─── Timeline event ───────────────────────────────────────────────────────────

function TimelineEvent({
  event,
  isLast,
}: {
  event: import('@/lib/hooks/use-teachers').LifecycleEvent;
  isLast: boolean;
}) {
  const color = EVENT_TYPE_COLORS[event.eventType] ?? { bg: '#f3f4f6', fg: '#6b7280', dot: '#9ca3af' };

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 28 }}>
        <div
          className="rounded-full flex-shrink-0"
          style={{ width: 12, height: 12, background: color.dot, marginTop: 4 }}
        />
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: '#e6e8eb', marginTop: 4 }} />
        )}
      </div>

      {/* Event card */}
      <div
        className="flex-1 bg-white rounded-xl border border-[#e6e8eb]"
        style={{ padding: '14px 18px', marginBottom: isLast ? 0 : 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Event type label */}
            <div
              className="rounded-full px-2 py-0.5"
              style={{ background: color.bg }}
            >
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: color.fg }}>
                {eventTypeLabel(event.eventType)}
              </span>
            </div>

            {/* Status transition */}
            {event.fromStatus && (
              <div className="flex items-center gap-1.5">
                <Badge variant={statusVariant(event.fromStatus)}>
                  {statusLabel(event.fromStatus)}
                </Badge>
                <ArrowRight size={13} style={{ color: '#b0b6bc' }} />
                <Badge variant={statusVariant(event.toStatus)}>
                  {statusLabel(event.toStatus)}
                </Badge>
              </div>
            )}
            {!event.fromStatus && (
              <Badge variant={statusVariant(event.toStatus)}>
                {statusLabel(event.toStatus)}
              </Badge>
            )}
          </div>

          {/* Date */}
          <span style={{ fontSize: '12px', color: '#8a929b', flexShrink: 0 }}>
            {formatDate(event.effectiveDate)}
          </span>
        </div>

        {/* Reason / remarks */}
        {(event.reason || event.remarks) && (
          <p style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 8, lineHeight: 1.5 }}>
            {event.reason ?? event.remarks}
          </p>
        )}

        {/* Performed by */}
        {event.performedBy && (
          <div className="flex items-center gap-1 mt-2">
            <User size={11} style={{ color: '#b0b6bc' }} />
            <span style={{ fontSize: '11.5px', color: '#8a929b' }}>{event.performedBy}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

export function HistoryTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useLifecycleEvents(employeeId);
  const events = (data ?? []).slice().sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="flex gap-4" key={i}>
            <div className="flex flex-col items-center" style={{ width: 28 }}>
              <Skeleton width={12} height={12} className="rounded-full" style={{ marginTop: 4 }} />
            </div>
            <div
              className="flex-1 bg-white rounded-xl border border-[#e6e8eb] p-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 12 }}
            >
              <div className="flex justify-between">
                <Skeleton height={20} width={180} className="rounded-full" />
                <Skeleton height={12} width={80} />
              </div>
              <Skeleton height={11} width={260} className="mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<History size={24} />}
          title="No lifecycle events"
          description="Status changes, promotions, transfers, and other employment events will appear here."
        />
      </div>
    );
  }

  return (
    <div>
      {events.map((event, i) => (
        <TimelineEvent key={event.id} event={event} isLast={i === events.length - 1} />
      ))}
    </div>
  );
}
