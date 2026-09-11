'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  useAnalyticsOverview,
  useAnalyticsByChannel,
  useAnalyticsByEventType,
  useAnalyticsByCategory,
  useAnalyticsTimeline,
  useAnalyticsFailures,
  type AnalyticsChannelRow,
  type AnalyticsEventTypeRow,
  type AnalyticsCategoryRow,
  type AnalyticsTimelineDay,
} from '@/lib/hooks/use-comms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const CHANNEL_COLOR: Record<string, string> = {
  IN_APP:   '#1a6fa6',
  EMAIL:    '#166534',
  SMS:      '#6b21a8',
  WHATSAPP: '#15803d',
  PUSH:     '#c2410c',
};

const CATEGORY_COLOR: Record<string, string> = {
  ACADEMIC:     '#1a6fa6',
  ATTENDANCE:   '#166534',
  EXAMINATION:  '#6b21a8',
  FINANCE:      '#b45309',
  ADMISSIONS:   '#b91c1c',
  HR:           '#0f766e',
  SUBSTITUTION: '#7c3aed',
  ANNOUNCEMENT: '#1d4ed8',
  PTM:          '#be185d',
  SYSTEM:       '#4b5563',
  GENERAL:      '#9ca3af',
};

function pct(val: number, total: number) {
  return total > 0 ? Math.round((val / total) * 100) : 0;
}

// ─── Components ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = '#f0f2f5', textColor = '#1a1d23' }: {
  label: string; value: string | number; sub?: string; color?: string; textColor?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white px-5 py-4 flex flex-col gap-1">
      <p className="text-xs font-medium text-[#8a929b]">{label}</p>
      <p className="text-2xl font-bold" style={{ color: textColor }}>{value}</p>
      {sub && <p className="text-xs text-[#8a929b]">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-[#e6e8eb] bg-[#f9fafb]">
        <p className="text-sm font-semibold text-[#1a1d23]">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// A minimal CSS bar chart row — no external library needed
function Bar({ value, max, color, label, count }: {
  value: number; max: number; color: string; label: string; count: number;
}) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <p className="text-xs text-[#4a5260] w-28 truncate flex-shrink-0">{label}</p>
      <div className="flex-1 bg-[#f0f2f5] rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, background: color }} />
      </div>
      <p className="text-xs font-medium text-[#1a1d23] w-10 text-right flex-shrink-0">{count}</p>
    </div>
  );
}

// Spark-like timeline: 7/14/30 day bars
function TimelineBars({ data, days }: { data: AnalyticsTimelineDay[]; days: number }) {
  // Show last N days proportionally
  const slice = days <= 14 ? data : data.slice(-days);
  const maxVal = Math.max(...slice.map((d) => d.sent + d.failed), 1);

  // For 30/90 days, show every Nth label
  const labelEvery = days <= 14 ? 1 : days <= 30 ? 7 : 14;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-0.5 h-24">
        {slice.map((d, i) => {
          const sentH = Math.round(((d.sent) / maxVal) * 88);
          const failH = Math.round(((d.failed) / maxVal) * 88);
          return (
            <div key={d.date} className="flex flex-col items-center gap-0 flex-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-[#1a1d23] text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                <span>{d.date}</span>
                <span>Sent: {d.sent}</span>
                <span>Failed: {d.failed}</span>
                <span>Read: {d.read}</span>
              </div>
              <div className="flex flex-col-reverse w-full gap-0">
                {failH > 0 && (
                  <div style={{ height: failH, background: '#fca5a5', borderRadius: '2px 2px 0 0' }} />
                )}
                {sentH > 0 && (
                  <div style={{ height: sentH, background: '#1a6fa6', borderRadius: failH > 0 ? '2px 2px 0 0' : '2px 2px 0 0' }} />
                )}
                {sentH === 0 && failH === 0 && (
                  <div style={{ height: 2, background: '#e6e8eb', borderRadius: 2 }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Date labels */}
      <div className="flex gap-0.5">
        {slice.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-[9px] text-[#8a929b]">
                {d.date.slice(5)} {/* MM-DD */}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#1a6fa6]" /><span className="text-xs text-[#4a5260]">Sent</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#fca5a5]" /><span className="text-xs text-[#4a5260]">Failed</span></div>
      </div>
    </div>
  );
}

// Delivery funnel
function Funnel({ total, delivered, read }: { total: number; delivered: number; read: number }) {
  const stages = [
    { label: 'Sent', count: total, color: '#e8f4fd', text: '#1a6fa6' },
    { label: 'Delivered', count: delivered, color: '#e8fdf0', text: '#166534' },
    { label: 'Read', count: read, color: '#f3e8ff', text: '#6b21a8' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {stages.map((s, i) => {
        const width = total > 0 ? Math.max(10, Math.round((s.count / total) * 100)) : 10;
        const prev = stages[i - 1];
        const drop = i > 0 && prev ? pct(prev.count - s.count, prev.count) : 0;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <p className="text-xs text-[#4a5260] w-20 flex-shrink-0">{s.label}</p>
            <div className="flex-1 rounded-full h-6 bg-[#f0f2f5] overflow-hidden">
              <div
                className="h-full rounded-full flex items-center px-2 transition-all"
                style={{ width: `${width}%`, background: s.color }}
              >
                <span className="text-xs font-semibold" style={{ color: s.text }}>{s.count.toLocaleString()}</span>
              </div>
            </div>
            {i > 0 && drop > 0 && (
              <span className="text-[10px] text-red-400 flex-shrink-0 w-14 text-right">-{drop}% drop</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Channel breakdown table ──────────────────────────────────────────────────

function ChannelTable({ rows }: { rows: AnalyticsChannelRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#8a929b] py-4 text-center">No data for this period</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#f0f2f5]">
          {['Channel', 'Sent', 'Delivered', 'Failed', 'Delivery Rate', 'Read Rate'].map((h) => (
            <th key={h} className="py-2 text-left text-xs font-semibold text-[#6b7280] pr-4">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#f9fafb]">
        {rows.map((r) => (
          <tr key={r.channel}>
            <td className="py-2.5 pr-4">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: `${CHANNEL_COLOR[r.channel]}18`, color: CHANNEL_COLOR[r.channel] ?? '#4a5260' }}
              >
                {r.channel}
              </span>
            </td>
            <td className="py-2.5 pr-4 font-medium">{r.total.toLocaleString()}</td>
            <td className="py-2.5 pr-4">{r.delivered.toLocaleString()}</td>
            <td className="py-2.5 pr-4 text-red-500">{r.failed > 0 ? r.failed.toLocaleString() : '—'}</td>
            <td className="py-2.5 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#166534] rounded-full" style={{ width: `${r.deliveryRate}%` }} />
                </div>
                <span className="text-xs">{r.deliveryRate}%</span>
              </div>
            </td>
            <td className="py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6b21a8] rounded-full" style={{ width: `${r.readRate}%` }} />
                </div>
                <span className="text-xs">{r.readRate}%</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Event type table ─────────────────────────────────────────────────────────

function EventTypeTable({ rows }: { rows: AnalyticsEventTypeRow[] }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  if (rows.length === 0) {
    return <p className="text-sm text-[#8a929b] py-4 text-center">No data for this period</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((r) => (
        <div key={r.eventType} className="flex items-center gap-3 py-1.5 group">
          <p className="text-xs text-[#1a1d23] font-mono w-44 truncate flex-shrink-0">
            {r.eventType.replace(/_/g, ' ')}
          </p>
          <div className="flex-1 bg-[#f0f2f5] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, Math.round((r.total / max) * 100))}%`, background: '#1a6fa6' }}
            />
          </div>
          <span className="text-xs font-medium text-[#1a1d23] w-8 text-right">{r.total}</span>
          <span className={`text-[10px] w-10 text-right ${r.deliveryRate >= 80 ? 'text-[#166534]' : r.deliveryRate >= 50 ? 'text-[#b45309]' : 'text-red-500'}`}>
            {r.deliveryRate}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Category distribution ────────────────────────────────────────────────────

function CategoryBars({ rows }: { rows: AnalyticsCategoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#8a929b] py-4 text-center">No data for this period</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {rows.map((r) => (
        <div key={r.category} className="flex items-center gap-3 py-1">
          <p className="text-xs text-[#4a5260] w-28 flex-shrink-0">{r.category}</p>
          <div className="flex-1 bg-[#f0f2f5] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, r.pct)}%`, background: CATEGORY_COLOR[r.category] ?? '#9ca3af' }}
            />
          </div>
          <span className="text-xs text-[#4a5260] w-8 text-right">{r.pct}%</span>
          <span className="text-xs font-medium text-[#1a1d23] w-10 text-right">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [days, setDays] = React.useState(30);

  const { data: overview, isLoading: loadingOv } = useAnalyticsOverview(days);
  const { data: byChannel = [], isLoading: loadingCh } = useAnalyticsByChannel(days);
  const { data: byEventType = [], isLoading: loadingEt } = useAnalyticsByEventType(days);
  const { data: byCategory = [], isLoading: loadingCat } = useAnalyticsByCategory(days);
  const { data: timeline = [], isLoading: loadingTl } = useAnalyticsTimeline(days);
  const { data: failures, isLoading: loadingFail } = useAnalyticsFailures(days);

  const loading = loadingOv || loadingCh || loadingEt || loadingCat || loadingTl || loadingFail;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle="Delivery performance, channel efficiency, and failure diagnostics"
        actions={
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  days === p.value
                    ? 'bg-[#1a1d23] text-white border-[#1a1d23]'
                    : 'bg-white text-[#4a5260] border-[#e6e8eb] hover:border-[#1a1d23]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">
          Loading analytics…
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <KpiCard label="Total Sent" value={(overview?.total ?? 0).toLocaleString()} sub={`Last ${days} days`} />
            <KpiCard label="Sent Today" value={(overview?.sentToday ?? 0).toLocaleString()} />
            <KpiCard label="Delivered" value={(overview?.delivered ?? 0).toLocaleString()} textColor="#166534" />
            <KpiCard label="Read" value={(overview?.read ?? 0).toLocaleString()} textColor="#6b21a8" />
            <KpiCard label="Failed" value={(overview?.failed ?? 0).toLocaleString()} textColor="#b91c1c" />
            <KpiCard
              label="Delivery Rate"
              value={`${overview?.deliveryRate ?? 0}%`}
              textColor={(overview?.deliveryRate ?? 0) >= 90 ? '#166534' : (overview?.deliveryRate ?? 0) >= 70 ? '#b45309' : '#b91c1c'}
            />
            <KpiCard
              label="Read Rate"
              value={`${overview?.readRate ?? 0}%`}
              textColor={(overview?.readRate ?? 0) >= 50 ? '#166534' : '#b45309'}
            />
          </div>

          {/* Row 2: Timeline + Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SectionCard title={`Daily Activity — Last ${days} Days`}>
                {timeline.length > 0 ? (
                  <TimelineBars data={timeline} days={days} />
                ) : (
                  <p className="text-sm text-[#8a929b] py-4 text-center">No data for this period</p>
                )}
              </SectionCard>
            </div>
            <SectionCard title="Delivery Funnel">
              <Funnel
                total={overview?.total ?? 0}
                delivered={overview?.delivered ?? 0}
                read={overview?.read ?? 0}
              />
              <div className="mt-4 pt-3 border-t border-[#f0f2f5] grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#8a929b]">Failure Rate</p>
                  <p className={`text-lg font-bold ${(overview?.failureRate ?? 0) > 10 ? 'text-red-500' : 'text-[#166534]'}`}>
                    {overview?.failureRate ?? 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8a929b]">Pending</p>
                  <p className="text-lg font-bold text-[#b45309]">{overview?.pending ?? 0}</p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Row 3: Channel table + Category bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Channel Performance">
              <ChannelTable rows={byChannel} />
            </SectionCard>
            <SectionCard title="Category Distribution">
              <CategoryBars rows={byCategory} />
            </SectionCard>
          </div>

          {/* Row 4: Event type breakdown */}
          <SectionCard title="Top Event Types">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8a929b]">Top 15 event types by volume · delivery rate shown</p>
            </div>
            <EventTypeTable rows={byEventType} />
          </SectionCard>

          {/* Row 5: Failure analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Failure Analysis">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex-1 text-center">
                    <p className="text-2xl font-bold text-red-600">{failures?.permanentFails ?? 0}</p>
                    <p className="text-xs text-red-500 mt-0.5">Permanently Failed</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[#4a5260] mb-2">Failed by Channel</p>
                    {(failures?.byChannel ?? []).length === 0 ? (
                      <p className="text-xs text-[#8a929b]">No failures in this period</p>
                    ) : (
                      (failures?.byChannel ?? []).map((c) => (
                        <Bar
                          key={c.channel}
                          label={c.channel}
                          value={c.count}
                          max={Math.max(...(failures?.byChannel ?? []).map((x) => x.count), 1)}
                          color={CHANNEL_COLOR[c.channel] ?? '#8a929b'}
                          count={c.count}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Top Error Messages">
              {(failures?.topErrors ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <p className="text-2xl">✓</p>
                  <p className="text-sm font-medium text-[#166534]">No errors in this period</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {(failures?.topErrors ?? []).map((e, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 py-1.5 border-b border-[#f0f2f5] last:border-0">
                      <p className="text-xs text-[#4a5260] flex-1 break-all">
                        {e.message ?? '(unknown error)'}
                      </p>
                      <span className="text-xs font-semibold text-red-500 flex-shrink-0 bg-red-50 px-1.5 py-0.5 rounded">
                        ×{e.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
