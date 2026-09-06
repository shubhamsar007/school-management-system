'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, Dropdown, DataTable, Pagination } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { KpiSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  useNotifications,
  useMarkNotificationRead,
  type AppNotification,
} from '@/lib/hooks/use-comms';
import { useCurrentUser } from '@/lib/hooks/use-identity';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
];

const CHANNEL_FILTER_OPTIONS = [
  { label: 'All Channels', value: 'all' },
  { label: 'In-App', value: 'IN_APP' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
];

const STATUS_BADGE: Record<string, 'active' | 'default' | 'pending'> = {
  SENT: 'active',
  PENDING: 'pending',
  FAILED: 'default',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [channelFilter, setChannelFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const { data: currentUser } = useCurrentUser();

  const apiFilters: { recipientUserId?: string; status?: string; channel?: string } = {};
  if (currentUser?.id) apiFilters.recipientUserId = currentUser.id;
  if (channelFilter !== 'all') apiFilters.channel = channelFilter;

  const { data: notifications = [], isLoading } = useNotifications(
    currentUser?.id ? apiFilters : undefined,
  );
  const markRead = useMarkNotificationRead();

  // Local filter for read/unread (not a backend param)
  const filtered = notifications.filter((n) => {
    if (statusFilter === 'unread') return !n.readAt;
    if (statusFilter === 'read') return !!n.readAt;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const unread = notifications.filter((n) => !n.readAt).length;
  const read = notifications.filter((n) => !!n.readAt).length;

  async function handleMarkRead(n: AppNotification) {
    if (n.readAt) return;
    try {
      await markRead.mutateAsync(n.id);
    } catch {
      toast.error('Failed to mark as read.');
    }
  }

  async function handleMarkAllRead() {
    const unreadItems = notifications.filter((n) => !n.readAt);
    try {
      await Promise.all(unreadItems.map((n) => markRead.mutateAsync(n.id)));
      toast.success(`Marked ${unreadItems.length} notifications as read.`);
    } catch {
      toast.error('Failed to mark all as read.');
    }
  }

  const columns: ColumnDef<AppNotification>[] = [
    {
      id: 'status-dot',
      header: '',
      width: '28px',
      cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: r.readAt ? '#d1d5db' : '#b3563a',
              flexShrink: 0,
            }}
          />
        </div>
      ),
    },
    {
      id: 'title',
      header: 'NOTIFICATION',
      width: 'minmax(220px,1.6fr)',
      cell: (r) => (
        <div>
          <div
            className="text-sm"
            style={{ fontWeight: r.readAt ? 400 : 600, color: '#14181c' }}
          >
            {r.title}
          </div>
          <div className="mt-0.5 text-xs text-[#8a929b] line-clamp-1">{r.message}</div>
        </div>
      ),
    },
    {
      id: 'eventType',
      header: 'TYPE',
      width: '140px',
      cell: (r) => (
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#6b7280',
            background: '#f3f4f6',
            borderRadius: 6,
            padding: '2px 6px',
          }}
        >
          {r.eventType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'channel',
      header: 'CHANNEL',
      width: '90px',
      cell: (r) => <Badge variant="default">{r.channel}</Badge>,
    },
    {
      id: 'deliveryStatus',
      header: 'STATUS',
      width: '90px',
      cell: (r) => (
        <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge>
      ),
    },
    {
      id: 'createdAt',
      header: 'TIME',
      width: '120px',
      cell: (r) => (
        <span title={formatDate(r.createdAt)} style={{ fontSize: 12, color: '#8a929b' }}>
          {formatRelativeTime(r.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      cell: (r) =>
        !r.readAt ? (
          <button
            className="text-xs font-medium text-[#2b5fa8]"
            onClick={() => void handleMarkRead(r)}
          >
            Mark read
          </button>
        ) : (
          <span className="text-xs text-[#d1d5db]">Read</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Your personal activity feed and alerts"
        actions={
          unread > 0 ? (
            <Button variant="ghost" onClick={() => void handleMarkAllRead()}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {Array.from({ length: 3 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KpiCard title="TOTAL" value={String(notifications.length)} subtitle="all time" variant="sage" />
          <KpiCard title="UNREAD" value={String(unread)} subtitle="need attention" variant="clay" />
          <KpiCard title="READ" value={String(read)} subtitle="already seen" variant="blue" />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <Dropdown
            label="Status"
            value={statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          />
          <Dropdown
            label="Channel"
            value={channelFilter}
            options={CHANNEL_FILTER_OPTIONS}
            onChange={(v) => { setChannelFilter(v); setPage(1); }}
          />
          <div className="flex-1" />
          {unread > 0 && (
            <span className="text-xs text-[#8a929b]">
              {unread} unread notification{unread !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">
              {statusFilter === 'unread' ? 'All caught up!' : 'No notifications'}
            </p>
            <p className="text-xs text-[#8a929b]">
              {statusFilter === 'unread'
                ? 'You have no unread notifications.'
                : 'Notifications will appear here when activity occurs.'}
            </p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={paginated} />
            <div className="border-t border-[#eef0f2] p-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
