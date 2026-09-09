'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, Dropdown, DataTable, Pagination } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { KpiSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  useNotifications,
  useMarkNotificationRead,
  useNotificationStats,
  useSendNotification,
  type AppNotification,
} from '@/lib/hooks/use-comms';
import { useCurrentUser } from '@/lib/hooks/use-identity';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Attendance', value: 'ATTENDANCE' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'Admissions', value: 'ADMISSIONS' },
  { label: 'HR', value: 'HR' },
  { label: 'System', value: 'SYSTEM' },
];

const CHANNEL_FILTER_OPTIONS = [
  { label: 'All Channels', value: 'all' },
  { label: 'In-App', value: 'IN_APP' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
];

const CATEGORY_COLOR: Record<string, string> = {
  ACADEMIC: '#2b5fa8',
  ATTENDANCE: '#7c3aed',
  EXAMINATION: '#0891b2',
  FINANCE: '#059669',
  ADMISSIONS: '#d97706',
  HR: '#b45309',
  SUBSTITUTION: '#c2410c',
  ANNOUNCEMENT: '#be185d',
  PTM: '#0f766e',
  SYSTEM: '#6b7280',
  GENERAL: '#9ca3af',
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  URGENT: { color: '#991b1b', bg: '#fee2e2', label: 'Urgent' },
  HIGH: { color: '#92400e', bg: '#fef3c7', label: 'High' },
  NORMAL: { color: '#374151', bg: '#f3f4f6', label: 'Normal' },
  LOW: { color: '#9ca3af', bg: '#f9fafb', label: 'Low' },
};

const STATUS_BADGE: Record<string, 'active' | 'default' | 'pending'> = {
  SENT: 'active',
  READ: 'active',
  PENDING: 'pending',
  FAILED: 'default',
};

const CHANNEL_OPTIONS = [
  { label: 'In-App', value: 'IN_APP' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'Push', value: 'PUSH' },
];

const CATEGORY_OPTIONS = [
  { label: 'General', value: 'GENERAL' },
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Attendance', value: 'ATTENDANCE' },
  { label: 'Examination', value: 'EXAMINATION' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'Admissions', value: 'ADMISSIONS' },
  { label: 'HR', value: 'HR' },
  { label: 'Substitution', value: 'SUBSTITUTION' },
  { label: 'Announcement', value: 'ANNOUNCEMENT' },
  { label: 'PTM', value: 'PTM' },
  { label: 'System', value: 'SYSTEM' },
];

const PRIORITY_OPTIONS = [
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Low', value: 'LOW' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
}: {
  notification: AppNotification;
  onClose: () => void;
  onMarkRead: (n: AppNotification) => void;
}) {
  const router = useRouter();
  const priority = PRIORITY_STYLE[notification.priority] ?? PRIORITY_STYLE.NORMAL;
  const catColor = CATEGORY_COLOR[notification.category] ?? '#9ca3af';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(20,24,28,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #eef0f2' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 8, height: 8, borderRadius: '50%', marginTop: 6,
                background: notification.readAt ? '#d1d5db' : '#b3563a',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#14181c', marginBottom: 4 }}>
                {notification.title}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: catColor,
                  background: catColor + '18', borderRadius: 6, padding: '2px 7px',
                }}>
                  {notification.category}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: priority.color, background: priority.bg,
                  borderRadius: 6, padding: '2px 7px',
                }}>
                  {priority.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ color: '#9ca3af', fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Full message */}
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 20 }}>
            {notification.message}
          </p>

          {/* Meta grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 12px',
            fontSize: 13, marginBottom: 20,
          }}>
            <span style={{ color: '#9ca3af', fontWeight: 500 }}>Event</span>
            <span style={{ color: '#374151' }}>{formatEventType(notification.eventType)}</span>

            <span style={{ color: '#9ca3af', fontWeight: 500 }}>Channel</span>
            <span style={{ color: '#374151' }}>{notification.channel.replace('_', ' ')}</span>

            <span style={{ color: '#9ca3af', fontWeight: 500 }}>Status</span>
            <Badge variant={STATUS_BADGE[notification.status] ?? 'default'}>
              {notification.status}
            </Badge>

            {notification.entityType && (
              <>
                <span style={{ color: '#9ca3af', fontWeight: 500 }}>Source</span>
                <span style={{ color: '#374151' }}>
                  {notification.entityType}
                  {notification.entityId && (
                    <span style={{ color: '#9ca3af' }}> · {notification.entityId}</span>
                  )}
                </span>
              </>
            )}

            <span style={{ color: '#9ca3af', fontWeight: 500 }}>Sent</span>
            <span style={{ color: '#374151' }}>
              {notification.sentAt ? formatDate(notification.sentAt) : formatDate(notification.createdAt)}
            </span>

            {notification.readAt && (
              <>
                <span style={{ color: '#9ca3af', fontWeight: 500 }}>Read</span>
                <span style={{ color: '#374151' }}>{formatDate(notification.readAt)}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {notification.actionUrl && (
              <Button
                variant="primary"
                onClick={() => { router.push(notification.actionUrl!); onClose(); }}
              >
                Open →
              </Button>
            )}
            {!notification.readAt && (
              <Button variant="ghost" onClick={() => { onMarkRead(notification); onClose(); }}>
                Mark as read
              </Button>
            )}
            <div style={{ flex: 1 }} />
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Send Notification Modal ──────────────────────────────────────────────────

function SendNotificationModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const sendNotification = useSendNotification();
  const [form, setForm] = React.useState({
    recipientUserId: '',
    title: '',
    message: '',
    eventType: 'MANUAL',
    channel: 'IN_APP',
    category: 'GENERAL',
    priority: 'NORMAL',
    actionUrl: '',
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.recipientUserId.trim() || !form.title.trim() || !form.message.trim()) {
      toast.error('Recipient ID, title, and message are required.');
      return;
    }
    try {
      await sendNotification.mutateAsync({
        recipientUserId: form.recipientUserId.trim(),
        eventType: form.eventType,
        category: form.category,
        priority: form.priority,
        title: form.title.trim(),
        message: form.message.trim(),
        channel: form.channel,
        actionUrl: form.actionUrl.trim() || undefined,
      });
      toast.success('Notification sent.');
      onClose();
    } catch {
      toast.error('Failed to send notification.');
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(20,24,28,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #eef0f2' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#14181c' }}>Send Notification</div>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Recipient User ID">
            <input
              style={inputStyle}
              placeholder="UUID of the recipient user"
              value={form.recipientUserId}
              onChange={(e) => set('recipientUserId', e.target.value)}
            />
          </Field>
          <Field label="Title">
            <input
              style={inputStyle}
              placeholder="Notification title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field label="Message">
            <textarea
              style={{ ...inputStyle, height: 80, resize: 'vertical' }}
              placeholder="Notification body"
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Channel">
              <select
                style={inputStyle}
                value={form.channel}
                onChange={(e) => set('channel', e.target.value)}
              >
                {CHANNEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                style={inputStyle}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Priority">
              <select
                style={inputStyle}
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Deep Link (optional)">
              <input
                style={inputStyle}
                placeholder="/finance/invoices/..."
                value={form.actionUrl}
                onChange={(e) => set('actionUrl', e.target.value)}
              />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              disabled={sendNotification.isPending}
            >
              {sendNotification.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', borderRadius: 8, border: '1px solid #e5e7eb',
  padding: '8px 10px', fontSize: 13, color: '#14181c',
  background: '#fafafa', outline: 'none', boxSizing: 'border-box',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const toast = useToast();
  const [categoryTab, setCategoryTab] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [channelFilter, setChannelFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [selectedNotif, setSelectedNotif] = React.useState<AppNotification | null>(null);
  const [showSend, setShowSend] = React.useState(false);

  const { data: currentUser } = useCurrentUser();
  const { data: stats, isLoading: statsLoading } = useNotificationStats();

  const apiFilters: { recipientUserId?: string; channel?: string; category?: string } = {};
  if (currentUser?.id) apiFilters.recipientUserId = currentUser.id;
  if (channelFilter !== 'all') apiFilters.channel = channelFilter;
  if (categoryTab !== 'all') apiFilters.category = categoryTab;

  const { data: notifications = [], isLoading, isError } = useNotifications(
    currentUser?.id ? apiFilters : undefined,
  );
  const markRead = useMarkNotificationRead();

  // Local read/unread filter
  const filtered = notifications.filter((n) => {
    if (statusFilter === 'unread') return !n.readAt;
    if (statusFilter === 'read') return !!n.readAt;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const unread = notifications.filter((n) => !n.readAt).length;
  const failed = notifications.filter((n) => n.status === 'FAILED').length;

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
    if (unreadItems.length === 0) return;
    try {
      await Promise.all(unreadItems.map((n) => markRead.mutateAsync(n.id)));
      toast.success(`Marked ${unreadItems.length} notifications as read.`);
    } catch {
      toast.error('Failed to mark all as read.');
    }
  }

  const columns: ColumnDef<AppNotification>[] = [
    {
      id: 'dot',
      header: '',
      width: '28px',
      cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: r.readAt ? '#e5e7eb'
                : r.priority === 'URGENT' ? '#ef4444'
                : r.priority === 'HIGH' ? '#f59e0b'
                : '#b3563a',
            }}
          />
        </div>
      ),
    },
    {
      id: 'notification',
      header: 'NOTIFICATION',
      width: 'minmax(220px,1.8fr)',
      cell: (r) => (
        <div>
          <div style={{ fontWeight: r.readAt ? 400 : 600, color: '#14181c', fontSize: 13 }}>
            {r.title}
          </div>
          <div className="mt-0.5 text-xs text-[#8a929b] line-clamp-1">{r.message}</div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'CATEGORY',
      width: '110px',
      cell: (r) => {
        const color = CATEGORY_COLOR[r.category] ?? '#9ca3af';
        return (
          <span style={{
            fontSize: 11, fontWeight: 600, color,
            background: color + '18', borderRadius: 6, padding: '2px 7px',
          }}>
            {r.category}
          </span>
        );
      },
    },
    {
      id: 'priority',
      header: 'PRIORITY',
      width: '80px',
      cell: (r) => {
        if (r.priority === 'NORMAL' || r.priority === 'LOW') return null;
        const p = PRIORITY_STYLE[r.priority];
        return (
          <span style={{
            fontSize: 11, fontWeight: 600, color: p.color, background: p.bg,
            borderRadius: 6, padding: '2px 7px',
          }}>
            {p.label}
          </span>
        );
      },
    },
    {
      id: 'channel',
      header: 'CHANNEL',
      width: '80px',
      cell: (r) => <Badge variant="default">{r.channel.replace('_', ' ')}</Badge>,
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '80px',
      cell: (r) => (
        <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge>
      ),
    },
    {
      id: 'time',
      header: 'TIME',
      width: '110px',
      cell: (r) => (
        <span title={formatDate(r.createdAt)} style={{ fontSize: 12, color: '#8a929b' }}>
          {formatRelativeTime(r.createdAt)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '90px',
      align: 'right',
      cell: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {r.actionUrl && (
            <a
              href={r.actionUrl}
              style={{ fontSize: 12, color: '#2b5fa8', fontWeight: 500, textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              Open →
            </a>
          )}
          {!r.readAt && (
            <button
              className="text-xs font-medium text-[#2b5fa8]"
              onClick={(e) => { e.stopPropagation(); void handleMarkRead(r); }}
            >
              Read
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Communication control center"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {unread > 0 && (
              <Button variant="ghost" onClick={() => void handleMarkAllRead()}>
                Mark all read
              </Button>
            )}
            <Button variant="primary" onClick={() => setShowSend(true)}>
              Send Notification
            </Button>
          </div>
        }
      />

      {/* ─── KPI Cards ─── */}
      {statsLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-3">
            <KpiCard
              title="SENT TODAY"
              value={stats.sentToday.toLocaleString('en-IN')}
              subtitle="org-wide"
              variant="sage"
            />
            <KpiCard
              title="DELIVERED"
              value={stats.delivered.toLocaleString('en-IN')}
              subtitle="total sent or read"
              variant="blue"
            />
            <KpiCard
              title="FAILED"
              value={stats.failed.toLocaleString('en-IN')}
              subtitle="delivery failures"
              variant="clay"
            />
            <KpiCard
              title="UNREAD"
              value={stats.unread.toLocaleString('en-IN')}
              subtitle="awaiting attention"
              variant="clay"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <KpiCard
              title="DELIVERY RATE"
              value={`${stats.deliveryRate}%`}
              subtitle="sent / (sent + failed)"
              variant={stats.deliveryRate >= 95 ? 'sage' : 'clay'}
            />
            <KpiCard
              title="READ RATE"
              value={`${stats.readRate}%`}
              subtitle="read / delivered"
              variant="blue"
            />
            <KpiCard
              title="PENDING"
              value={stats.pending.toLocaleString('en-IN')}
              subtitle="queued for delivery"
              variant="neutral"
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <KpiCard title="TOTAL" value={String(notifications.length)} subtitle="all time" variant="sage" />
          <KpiCard title="UNREAD" value={String(unread)} subtitle="need attention" variant="clay" />
          <KpiCard title="READ" value={String(notifications.length - unread - failed)} subtitle="seen" variant="blue" />
          <KpiCard title="FAILED" value={String(failed)} subtitle="delivery failures" variant="heather" />
        </div>
      )}

      {/* ─── Inbox Table ─── */}
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {/* Category Tabs */}
        <div
          style={{
            display: 'flex', gap: 2, padding: '10px 14px 0',
            borderBottom: '1px solid #eef0f2', overflowX: 'auto',
          }}
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setCategoryTab(tab.value); setPage(1); }}
              style={{
                padding: '7px 13px',
                fontSize: 12,
                fontWeight: categoryTab === tab.value ? 600 : 400,
                color: categoryTab === tab.value ? '#3f6152' : '#6d746e',
                borderBottom: categoryTab === tab.value ? '2px solid #3f6152' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: 2,
                borderBottomColor: categoryTab === tab.value ? '#3f6152' : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 120ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
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
              {unread} unread
            </span>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Loading notifications…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">Failed to load notifications</p>
            <p className="text-xs text-[#8a929b]">Check your connection and try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">
              {statusFilter === 'unread'
                ? 'All caught up!'
                : categoryTab !== 'all'
                ? `No ${categoryTab.toLowerCase()} notifications`
                : 'No notifications'}
            </p>
            <p className="text-xs text-[#8a929b]">
              {statusFilter === 'unread'
                ? 'You have no unread notifications.'
                : 'Notifications will appear here when activity occurs.'}
            </p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginated}
              onRowClick={(row) => setSelectedNotif(row)}
            />
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

      {/* ─── Detail Modal ─── */}
      {selectedNotif && (
        <NotificationDetailModal
          notification={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          onMarkRead={(n) => { void handleMarkRead(n); setSelectedNotif(null); }}
        />
      )}

      {/* ─── Send Modal ─── */}
      {showSend && <SendNotificationModal onClose={() => setShowSend(false)} />}
    </div>
  );
}
