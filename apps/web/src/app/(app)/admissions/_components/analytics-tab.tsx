'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Spinner } from '@/components/ui';
import { useAdmissionAnalytics } from '@/lib/hooks/use-admissions';

// ─── Constants ───────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
  WALK_IN: 'Walk-in',
  PHONE: 'Phone',
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  ADVERTISEMENT: 'Advertisement',
  OTHER: 'Other',
};

const PIE_COLORS = ['#3f6152', '#d4a96a', '#7ab3a8', '#b96f4f', '#6b7280', '#8b5cf6', '#9ca3af'];
const FUNNEL_COLORS = ['#3f4f45', '#3f6152', '#5a8a6e', '#7ab3a8', '#a8d4c2'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl border px-5 py-4"
      style={{
        background: highlight ? '#f0f7f3' : '#fff',
        borderColor: highlight ? '#3f6152' : '#e6e8eb',
      }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a929b]">
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-bold"
        style={{
          color: highlight ? '#3f6152' : '#14181c',
          fontFamily: 'var(--font-fraunces)',
        }}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-[#8a929b]">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-[#14181c]">{title}</h3>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsTab() {
  const { data, isLoading } = useAdmissionAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[#8a929b]">
        No analytics data available.
      </div>
    );
  }

  const { funnel, sourceBreakdown, monthlyTrend, topClassDemand, metrics } = data;
  const maxFunnelCount = funnel[0]?.count || 1;
  const sourceTotal = sourceBreakdown.reduce((a, b) => a + b.count, 0);
  const hasMonthlyData = monthlyTrend.some((m) => m.enquiries > 0 || m.applications > 0);

  return (
    <div className="space-y-5">

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Enq → App Conversion"
          value={`${metrics.conversionRate}%`}
          sub={`${metrics.totalApplications} of ${metrics.totalEnquiries} enquiries applied`}
        />
        <MetricCard
          label="Acceptance Rate"
          value={`${metrics.acceptanceRate}%`}
          sub="of all decided applications"
        />
        <MetricCard
          label="Withdrawal Rate"
          value={`${metrics.withdrawalRate}%`}
          sub="of all applications withdrawn"
        />
        <MetricCard
          label="Enrolled"
          value={String(metrics.enrolled)}
          sub={`of ${metrics.approved} approved`}
          highlight
        />
      </div>

      {/* ── Funnel + Source pie ── */}
      <div className="grid grid-cols-5 gap-5">

        {/* Funnel — 3 cols */}
        <div className="col-span-3">
          <SectionCard title="Admissions Funnel">
            <div className="space-y-3">
              {funnel.map((item, i) => {
                const pct = (item.count / maxFunnelCount) * 100;
                const prev = funnel[i - 1];
                const dropPct =
                  prev && prev.count > 0
                    ? Math.round(((prev.count - item.count) / prev.count) * 100)
                    : null;
                return (
                  <div key={item.stage}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#14181c]">{item.stage}</span>
                      <div className="flex items-center gap-3">
                        {dropPct !== null && dropPct > 0 && (
                          <span className="text-[11px] text-[#b96f4f]">−{dropPct}%</span>
                        )}
                        <span className="text-xs font-semibold text-[#14181c]">
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="h-7 w-full overflow-hidden rounded-md bg-[#f4f1e9]">
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: FUNNEL_COLORS[i] ?? '#9ca3af',
                          minWidth: item.count > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Source pie — 2 cols */}
        <div className="col-span-2">
          <SectionCard title="Enquiry Sources">
            {sourceBreakdown.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-[#8a929b]">
                No data
              </div>
            ) : (
              <>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={82}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {sourceBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e6e8eb', fontSize: 12 }}
                        formatter={(v, _n, props) => [
                          `${v} (${sourceTotal > 0 ? Math.round((Number(v) / sourceTotal) * 100) : 0}%)`,
                          SOURCE_LABEL[props.payload.source] ?? props.payload.source,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {sourceBreakdown.map((s, i) => {
                    const pct = sourceTotal > 0 ? Math.round((s.count / sourceTotal) * 100) : 0;
                    return (
                      <div key={s.source} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-[#6b7480]">
                            {SOURCE_LABEL[s.source] ?? s.source}
                          </span>
                        </div>
                        <span className="font-medium text-[#14181c]">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── Monthly trend ── */}
      <SectionCard title="Monthly Trend — Last 6 Months">
        {!hasMonthlyData ? (
          <div className="flex h-40 items-center justify-center text-sm text-[#8a929b]">
            No activity in the last 6 months
          </div>
        ) : (
          <>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="enqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3f6152" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3f6152" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a96a" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#d4a96a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede4" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#8a929b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#8a929b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e6e8eb', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="enquiries"
                    name="Enquiries"
                    stroke="#3f6152"
                    strokeWidth={2}
                    fill="url(#enqGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    name="Applications"
                    stroke="#d4a96a"
                    strokeWidth={2}
                    fill="url(#appGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-5">
              <div className="flex items-center gap-1.5 text-xs text-[#6b7480]">
                <div className="h-0.5 w-5 rounded-full bg-[#3f6152]" />
                Enquiries
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6b7480]">
                <div className="h-0.5 w-5 rounded-full bg-[#d4a96a]" />
                Applications
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* ── Class interest ── */}
      {topClassDemand.length > 0 && (
        <SectionCard title="Class Interest Distribution">
          <div style={{ height: Math.max(120, topClassDemand.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClassDemand}
                layout="vertical"
                margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#8a929b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="className"
                  tick={{ fontSize: 12, fill: '#14181c' }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e6e8eb', fontSize: 12 }}
                  formatter={(v) => [v, 'Enquiries']}
                />
                <Bar dataKey="count" fill="#3f6152" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
