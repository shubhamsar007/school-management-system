'use client';

import * as React from 'react';
import { NotificationSubNav } from '../_components/notification-sub-nav';
import { useInboundMessages, useMarkInboundProcessed, type InboundMessage } from '@/lib/hooks/use-comms';
import { MessageSquare, CheckCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const CHANNELS = ['', 'SMS', 'WHATSAPP', 'EMAIL'];
const STATUSES = ['', 'RECEIVED', 'PROCESSED'];

function channelBadge(ch: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    SMS:      { bg: '#e3f2fd', color: '#0d47a1' },
    WHATSAPP: { bg: '#e8f5e9', color: '#1b5e20' },
    EMAIL:    { bg: '#fff8e1', color: '#e65100' },
    PUSH:     { bg: '#f3e5f5', color: '#4a148c' },
  };
  const s = colors[ch] ?? { bg: '#f0f0f0', color: '#555' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
      background: s.bg, color: s.color, textTransform: 'uppercase' as const,
    }}>{ch}</span>
  );
}

function MessageDetail({
  msg, onProcess, processing,
}: {
  msg: InboundMessage;
  onProcess: () => void;
  processing: boolean;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 18, border: '1px solid #eaede7',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            {channelBadge(msg.channel)}
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
              background: msg.status === 'PROCESSED' ? '#e8f5e9' : '#fff3e0',
              color: msg.status === 'PROCESSED' ? '#2e7d32' : '#e65100',
            }}>{msg.status}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6d746e' }}>
            From: <strong style={{ color: '#2c322f' }}>{msg.fromAddress}</strong>
          </div>
          {msg.providerMsgId && (
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
              Msg ID: {msg.providerMsgId}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap' }}>
          {new Date(msg.createdAt).toLocaleString()}
        </div>
      </div>

      <div style={{
        background: '#f9f8f4', borderRadius: 8, padding: '10px 14px',
        fontSize: 13, color: '#2c322f', lineHeight: 1.5,
      }}>
        {msg.body}
      </div>

      {msg.status === 'RECEIVED' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onProcess}
            disabled={processing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              borderRadius: 7, border: 'none', background: '#2c7a51', color: '#fff',
              fontSize: 12, fontWeight: 600, cursor: processing ? 'wait' : 'pointer',
              opacity: processing ? 0.7 : 1,
            }}
          >
            <CheckCircle size={13} />
            Mark Processed
          </button>
        </div>
      )}
    </div>
  );
}

export default function InboundPage() {
  const [channelFilter, setChannelFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const filters = {
    ...(channelFilter ? { channel: channelFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading, error, refetch } = useInboundMessages(filters, page, limit);
  const processMutation = useMarkInboundProcessed();
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function handleProcess(id: string) {
    setProcessingId(id);
    try {
      await processMutation.mutateAsync(id);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <NotificationSubNav />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Inbound Messages</h1>
            <p style={{ margin: '4px 0 0', color: '#6d746e', fontSize: 13 }}>
              Two-way channel replies from students, parents, and staff
            </p>
          </div>
          <button onClick={() => void refetch()} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #dde0d9',
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Summary chips */}
        {data && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: '6px 14px', borderRadius: 20, background: '#fff3e0', color: '#e65100', fontSize: 12, fontWeight: 600 }}>
              {items.filter((m) => m.status === 'RECEIVED').length} unprocessed on this page
            </div>
            <div style={{ padding: '6px 14px', borderRadius: 20, background: '#f9f8f4', color: '#6d746e', fontSize: 12 }}>
              {total} total
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #dde0d9', fontSize: 13, background: '#fff' }}
          >
            <option value="">All channels</option>
            {CHANNELS.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #dde0d9', fontSize: 13, background: '#fff' }}
          >
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6d746e' }}>Loading messages…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#c0392b' }}>Failed to load messages</div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12,
            border: '1px dashed #dde0d9', color: '#6d746e',
          }}>
            <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No inbound messages</div>
            <div style={{ fontSize: 13 }}>Replies from two-way channels (SMS, WhatsApp) will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((msg) => (
              <MessageDetail
                key={msg.id}
                msg={msg}
                onProcess={() => void handleProcess(msg.id)}
                processing={processingId === msg.id}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, marginTop: 24,
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 12px', borderRadius: 7, border: '1px solid #dde0d9',
                background: '#fff', cursor: page === 1 ? 'default' : 'pointer',
                opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: '#6d746e' }}>
              Page {page} of {totalPages} ({total} total)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 12px', borderRadius: 7, border: '1px solid #dde0d9',
                background: '#fff', cursor: page === totalPages ? 'default' : 'pointer',
                opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
