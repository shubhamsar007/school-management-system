'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge, Spinner, EmptyState } from '@/components/ui';
import {
  payrollApi,
  type PayrollAnalyticsOverview,
  type DepartmentPayrollSummary,
  type PayrollMonthSummary,
  type TdsEmployeeSummary,
  formatCurrency,
  currentFinancialYear,
} from '@/lib/payroll-api';
import { BarChart2, ChevronDown, TrendingUp, Users, Receipt, Landmark } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── FY selector ──────────────────────────────────────────────────────────────

function buildFyOptions(): string[] {
  const now  = new Date();
  const year = now.getFullYear();
  return [
    `${year - 1}-${year}`,
    `${year}-${year + 1}`,
    `${year + 1}-${year + 2}`,
  ];
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color = '#4a9b6f',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        background: '#fff', border: '1px solid #e2ddd5',
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: '#e8f5ee', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#6d746e', fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2c322f' }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Custom tooltip for recharts ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff', border: '1px solid #e2ddd5', borderRadius: 8,
        padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#2c322f' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'by-dept' | 'month-trend' | 'tds';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayrollReportsPage() {
  const [fy, setFy]         = React.useState(currentFinancialYear());
  const [tab, setTab]       = React.useState<Tab>('overview');
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState<string | null>(null);

  const [overview,    setOverview]    = React.useState<PayrollAnalyticsOverview | null>(null);
  const [byDept,      setByDept]      = React.useState<DepartmentPayrollSummary[]>([]);
  const [monthTrend,  setMonthTrend]  = React.useState<PayrollMonthSummary[]>([]);
  const [tdsSummary,  setTdsSummary]  = React.useState<TdsEmployeeSummary[]>([]);

  async function loadData(financialYear: string, activeTab: Tab) {
    setLoading(true);
    setError(null);
    try {
      const params = { financialYear };
      if (activeTab === 'overview') {
        const data = await payrollApi.analytics.overview(params);
        setOverview(data);
      } else if (activeTab === 'by-dept') {
        const data = await payrollApi.analytics.byDepartment(params);
        setByDept(data);
      } else if (activeTab === 'month-trend') {
        const data = await payrollApi.analytics.monthTrend(params);
        setMonthTrend(data);
      } else {
        const data = await payrollApi.analytics.tdsSummary(params);
        setTdsSummary(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadData(fy, tab); }, [fy, tab]);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',    label: 'Overview' },
    { id: 'by-dept',     label: 'By Department' },
    { id: 'month-trend', label: 'Month Trend' },
    { id: 'tds',         label: 'TDS Summary' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Payroll Reports & Analytics"
        subtitle="Financial year summaries, department breakdowns, and TDS analysis"
      />

      {/* ── Controls bar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* FY selector */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#2c322f' }}>FY:</label>
          <div style={{ position: 'relative' }}>
            <select
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              style={{
                appearance: 'none', padding: '7px 32px 7px 12px',
                border: '1px solid #e2ddd5', borderRadius: 8,
                fontSize: 13, background: '#fff', color: '#2c322f', cursor: 'pointer',
              }}
            >
              {buildFyOptions().map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown
              size={13}
              style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6d746e' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: '1px solid',
                borderColor: tab === t.id ? '#4a9b6f' : '#e2ddd5',
                background:  tab === t.id ? '#e8f5ee' : '#fff',
                color:       tab === t.id ? '#2c7a3f' : '#6d746e',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', color: '#b04a3a', fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {tab === 'overview' && overview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <StatCard label="Total Payroll Runs"   value={overview.totalRuns}              icon={<BarChart2 size={18} />} />
                <StatCard label="Unique Employees Paid" value={overview.totalEmployees}         icon={<Users size={18} />} />
                <StatCard label="Total Gross Salary"   value={formatCurrency(overview.totalGross)} icon={<TrendingUp size={18} />} />
                <StatCard label="Total Net Salary"     value={formatCurrency(overview.totalNet)}   icon={<Landmark size={18} />} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <StatCard label="Total Deductions"     value={formatCurrency(overview.totalDeductions)} icon={<TrendingUp size={18} />} color="#b04a3a" />
                <StatCard label="Total TDS Collected"  value={formatCurrency(overview.totalTds)}        icon={<Receipt size={18} />} color="#7a5c00" />
              </div>

              {/* Summary card */}
              <div
                style={{
                  background: '#fff', border: '1px solid #e2ddd5',
                  borderRadius: 12, padding: '20px 24px',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 12 }}>
                  FY {overview.financialYear} — Cost Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Total Gross Salary',  value: overview.totalGross,      color: '#2c322f' },
                    { label: 'Total Deductions',     value: `−${overview.totalDeductions}`, color: '#b04a3a' },
                    { label: 'Total TDS',            value: `−${overview.totalTds}`,        color: '#7a5c00' },
                    { label: 'Total Net Disbursed',  value: overview.totalNet,        color: '#2c7a3f', bold: true },
                  ].map(({ label, value, color, bold }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0ede6' }}>
                      <span style={{ fontSize: 13, color: '#6d746e' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color }}>
                        {typeof value === 'string' && value.startsWith('−')
                          ? `−${formatCurrency(value.slice(1))}`
                          : formatCurrency(value as string)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BY DEPARTMENT TAB */}
          {tab === 'by-dept' && (
            byDept.length === 0 ? (
              <EmptyState icon={<BarChart2 size={32} />} title="No data" description={`No payroll data for FY ${fy}.`} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #e2ddd5', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}>
                    Department-wise Payroll (FY {fy})
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byDept.map((d) => ({
                      name:  d.departmentName,
                      Gross: parseFloat(d.totalGross),
                      Net:   parseFloat(d.totalNet),
                      TDS:   parseFloat(d.totalTds),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6d746e' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6d746e' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Gross" fill="#4a9b6f" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Net"   fill="#7ec4a0" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="TDS"   fill="#f5d475" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2ddd5', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Department', 'Employees', 'Total Gross', 'Total Net', 'Total TDS'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', fontWeight: 500, fontSize: 12, color: '#6d746e', textAlign: 'left', borderBottom: '1px solid #e2ddd5', background: '#fafaf7' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byDept.map((d) => (
                        <tr key={d.departmentName}>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#2c322f', borderTop: '1px solid #f0ede6' }}>{d.departmentName}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#6d746e', borderTop: '1px solid #f0ede6' }}>{d.employeeCount}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, borderTop: '1px solid #f0ede6' }}>{formatCurrency(d.totalGross)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#2c7a3f', fontWeight: 600, borderTop: '1px solid #f0ede6' }}>{formatCurrency(d.totalNet)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#7a5c00', borderTop: '1px solid #f0ede6' }}>{formatCurrency(d.totalTds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* MONTH TREND TAB */}
          {tab === 'month-trend' && (
            monthTrend.length === 0 ? (
              <EmptyState icon={<TrendingUp size={32} />} title="No data" description={`No payroll runs found for FY ${fy}.`} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #e2ddd5', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}>
                    Month-by-Month Payroll Trend (FY {fy})
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthTrend.map((m) => ({
                      month: m.period,
                      Gross: parseFloat(m.totalGross),
                      Net:   parseFloat(m.totalNet),
                      TDS:   parseFloat(m.totalTds),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6d746e' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6d746e' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Gross" stroke="#4a9b6f" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Net"   stroke="#7ec4a0" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="TDS"   stroke="#f5a623" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2ddd5', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Month', 'Status', 'Headcount', 'Total Gross', 'Total Net', 'Total TDS'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', fontWeight: 500, fontSize: 12, color: '#6d746e', textAlign: 'left', borderBottom: '1px solid #e2ddd5', background: '#fafaf7' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthTrend.map((m) => (
                        <tr key={m.runId}>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#2c322f', borderTop: '1px solid #f0ede6' }}>{m.period}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, borderTop: '1px solid #f0ede6' }}>
                            <Badge variant={m.status === 'PAID' ? 'active' : m.status === 'APPROVED' ? 'pending' : 'inactive'}>
                              {m.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#6d746e', borderTop: '1px solid #f0ede6' }}>{m.headcount}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, borderTop: '1px solid #f0ede6' }}>{formatCurrency(m.totalGross)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#2c7a3f', fontWeight: 600, borderTop: '1px solid #f0ede6' }}>{formatCurrency(m.totalNet)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#7a5c00', borderTop: '1px solid #f0ede6' }}>{formatCurrency(m.totalTds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* TDS SUMMARY TAB */}
          {tab === 'tds' && (
            tdsSummary.length === 0 ? (
              <EmptyState icon={<Receipt size={32} />} title="No TDS data" description={`No tax declarations for FY ${fy}.`} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #e2ddd5', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}>
                    Annual TDS per Employee (FY {fy})
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(200, tdsSummary.length * 36)}>
                    <BarChart
                      layout="vertical"
                      data={tdsSummary.map((t) => ({
                        name:    t.employeeName,
                        'Annual Tax': parseFloat(String(t.annualTax)),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6d746e' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#6d746e' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="Annual Tax" fill="#f5a623" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2ddd5', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Employee', 'Regime', 'Taxable Income', '80C', 'HRA', 'Annual TDS', 'Monthly TDS'].map((h) => (
                          <th key={h} style={{ padding: '10px 14px', fontWeight: 500, fontSize: 12, color: '#6d746e', textAlign: 'left', borderBottom: '1px solid #e2ddd5', background: '#fafaf7' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tdsSummary.map((t) => (
                        <tr key={t.employeeId}>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#2c322f', borderTop: '1px solid #f0ede6' }}>{t.employeeName}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, borderTop: '1px solid #f0ede6' }}>
                            <Badge variant={t.taxRegime === 'NEW' ? 'active' : 'pending'}>{t.taxRegime}</Badge>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 13, borderTop: '1px solid #f0ede6' }}>{formatCurrency(String(t.taxableIncome))}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#6d746e', borderTop: '1px solid #f0ede6' }}>{formatCurrency(t.section80C)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#6d746e', borderTop: '1px solid #f0ede6' }}>{formatCurrency(t.hraExemption)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#7a5c00', borderTop: '1px solid #f0ede6' }}>{formatCurrency(String(t.annualTax))}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#6d746e', borderTop: '1px solid #f0ede6' }}>{formatCurrency(String(t.monthlyTds))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
