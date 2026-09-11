'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  useDeliveries,
  useDeliveryStats,
  useRetryDelivery,
  useBulkRetryFailed,
  type NotificationDelivery,
} from '@/lib/hooks/use-comms';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  QUEUED:             'bg-[#f0f2f5] text-[#6b7280]',
  SENT:               'bg-[#e8f4fd] text-[#1a6fa6]',
  DELIVERED:          'bg-[#e8fdf0] text-[#166534]',
  FAILED:             'bg-[#fde8e8] text-[#b91c1c]',
  RETRYING:           'bg-[#fff3e8] text-[#b45309]',
  FAILED_PERMANENTLY: 'bg-[#fde8e8] text-[#7f1d1d] font-semibold',
};

const CHANNEL_COLOR: Record<string, string> = {
  IN_APP:   'bg-[#e8f4fd] text-[#1a6fa6]',
  EMAIL:    'bg-[#e8fdf0] text-[#166534]',
  SMS:      'bg-[#f3e8ff] text-[#6b21a8]',
  WHATSAPP: 'bg-[#e8fdf0] text-[#15803d]',
  PUSH:     'bg-[#fff3e8] text-[#c2410c]',
};

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];
const STATUSES = ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING', 'FAILED_PERMANENTLY'];

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DeliveryDetail({
  delivery,
  onClose,
  onRetry,
}: {
  delivery: NotificationDelivery;
  onClose: () => void;
  onRetry: (id: string) => void;
}) {
  const canRetry = ['FAILED', 'FAILED_PERMANENTLY'].includes(delivery.status);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e8eb]">
          <h2 className="text-sm font-semibold text-[#1a1d23]">Delivery Detail</h2>
          <button onClick={onClose} className="text-[#8a929b] hover:text-[#1a1d23]">✕</button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Status">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[delivery.status] ?? ''}`}>
                {delivery.status}
              </span>
            </Field>
            <Field label="Channel">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLOR[delivery.notification.channel] ?? ''}`}>
                {delivery.notification.channel}
              </span>
            </Field>
            <Field label="Provider">{delivery.provider}</Field>
            <Field label="Retry Count">{delivery.retryCount}</Field>
            <Field label="Notification">{delivery.notification.title}</Field>
            <Field label="Event">{delivery.notification.eventType.replace(/_/g, ' ')}</Field>
            {delivery.providerMessageId && (
              <Field label="Provider ID" className="col-span-2 font-mono text-xs break-all">
                {delivery.providerMessageId}
              </Field>
            )}
            {delivery.errorMessage && (
              <div className="col-span-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <p className="text-xs font-medium text-red-700 mb-1">Error</p>
                <p className="text-xs text-red-600 break-all">{delivery.errorMessage}</p>
              </div>
            )}
            <Field label="Sent At">{delivery.sentAt ? new Date(delivery.sentAt).toLocaleString() : '—'}</Field>
            <Field label="Delivered At">{delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString() : '—'}</Field>
            {delivery.nextRetryAt && (
              <Field label="Next Retry" className="col-span-2">
                {new Date(delivery.nextRetryAt).toLocaleString()}
              </Field>
            )}
            <Field label="Created">{new Date(delivery.createdAt).toLocaleString()}</Field>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e6e8eb]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#4a5260] hover:text-[#1a1d23]">
            Close
          </button>
          {canRetry && (
            <button
              onClick={() => { onRetry(delivery.id); onClose(); }}
              className="px-4 py-2 bg-[#1a1d23] text-white text-sm rounded-lg hover:bg-[#2a2d33]"
            >
              Retry Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs text-[#8a929b]">{label}</span>
      <span className="text-sm text-[#1a1d23]">{children}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryLogsPage() {
  const [filterStatus, setFilterStatus] = React.useState('');
  const [filterChannel, setFilterChannel] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<NotificationDelivery | null>(null);

  const { data, isLoading, isError } = useDeliveries({
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterChannel ? { channel: filterChannel } : {}),
    page,
    limit: 50,
  });
  const { data: stats } = useDeliveryStats();
  const retryDelivery = useRetryDelivery();
  const bulkRetry = useBulkRetryFailed();

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const statsCards = [
    { label: 'Queued', value: stats?.queued ?? 0, color: 'bg-[#f0f2f5] text-[#4a5260]' },
    { label: 'Sent', value: stats?.sent ?? 0, color: 'bg-[#e8f4fd] text-[#1a6fa6]' },
    { label: 'Delivered', value: stats?.delivered ?? 0, color: 'bg-[#e8fdf0] text-[#166534]' },
    { label: 'Retrying', value: stats?.retrying ?? 0, color: 'bg-[#fff3e8] text-[#b45309]' },
    { label: 'Failed', value: stats?.failed ?? 0, color: 'bg-[#fde8e8] text-[#b91c1c]' },
    { label: 'Success Rate', value: `${stats?.successRate ?? 0}%`, color: 'bg-[#f3e8ff] text-[#6b21a8]' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Delivery Logs"
        subtitle="Per-provider delivery status, retry history, and failure diagnostics"
        actions={
          <button
            onClick={() => bulkRetry.mutate()}
            disabled={bulkRetry.isPending}
            className="px-4 py-2 bg-[#1a1d23] text-white text-sm rounded-lg hover:bg-[#2a2d33] disabled:opacity-50"
          >
            {bulkRetry.isPending ? 'Queuing…' : 'Retry All Failed'}
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {statsCards.map((c) => (
          <div key={c.label} className={`rounded-xl px-3 py-3 ${c.color}`}>
            <p className="text-xs font-medium opacity-70">{c.label}</p>
            <p className="text-lg font-bold mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#4a5260] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#4a5260] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
          value={filterChannel}
          onChange={(e) => { setFilterChannel(e.target.value); setPage(1); }}
        >
          <option value="">All Channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-sm text-[#8a929b]">
            Loading delivery logs…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-24 text-sm text-red-600">
            Failed to load delivery logs.
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div style={{ fontSize: 32 }}>📋</div>
            <p className="text-sm font-semibold text-[#4a5260]">No delivery records</p>
            <p className="text-xs text-[#8a929b] text-center max-w-sm">
              Delivery records appear when automation rules fire notifications through external channels.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e6e8eb] bg-[#f9fafb]">
                  {['Notification', 'Channel', 'Provider', 'Status', 'Retries', 'Sent At', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {data.items.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-[#f9fafb] transition-colors cursor-pointer"
                    onClick={() => setSelected(d)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-[#1a1d23] truncate max-w-[200px]">{d.notification.title}</p>
                      <p className="text-xs text-[#8a929b] mt-0.5">{d.notification.eventType.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLOR[d.notification.channel] ?? ''}`}>
                        {d.notification.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a5260]">{d.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[d.status] ?? ''}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-[#4a5260]">
                      {d.retryCount > 0 ? (
                        <span className="text-amber-600 font-medium">{d.retryCount}</span>
                      ) : (
                        <span className="text-[#8a929b]">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8a929b]">
                      {d.sentAt ? new Date(d.sentAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {['FAILED', 'FAILED_PERMANENTLY'].includes(d.status) && (
                        <button
                          onClick={() => retryDelivery.mutate(d.id)}
                          disabled={retryDelivery.isPending}
                          className="text-xs text-[#1a6fa6] hover:text-[#1a1d23] px-2 py-1 rounded hover:bg-[#f0f2f5]"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#e6e8eb]">
                <p className="text-xs text-[#8a929b]">
                  {data.total} total · page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border border-[#e6e8eb] rounded-lg disabled:opacity-40 hover:bg-[#f0f2f5]"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs border border-[#e6e8eb] rounded-lg disabled:opacity-40 hover:bg-[#f0f2f5]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <DeliveryDetail
          delivery={selected}
          onClose={() => setSelected(null)}
          onRetry={(id) => retryDelivery.mutate(id)}
        />
      )}
    </div>
  );
}
