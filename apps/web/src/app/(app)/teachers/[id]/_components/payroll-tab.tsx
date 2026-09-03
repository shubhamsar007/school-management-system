'use client';

import * as React from 'react';
import { Wallet } from 'lucide-react';
import { useEmployeePayHistory } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sLabel = s.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const eLabel = e.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  return sLabel === eLabel ? sLabel : `${sLabel} – ${eLabel}`;
}

function runStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'PAID':      return 'active';
    case 'APPROVED':  return 'graduated';
    case 'COMPLETED': return 'pending';
    case 'HELD':      return 'left';
    default:          return 'default';
  }
}

// ─── Payroll tab ──────────────────────────────────────────────────────────────

export function PayrollTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useEmployeePayHistory(employeeId);
  const records = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-[#e6e8eb] p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <Skeleton height={10} width={80} className="mb-2" />
              <Skeleton height={24} width={100} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-[#f5f6f7]">
              <Skeleton height={13} width={120} />
              <Skeleton height={13} width={100} />
              <Skeleton height={13} width={80} />
              <Skeleton height={20} width={60} className="rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<Wallet size={24} />}
          title="No payroll history"
          description="This employee has not been included in any payroll runs yet."
        />
      </div>
    );
  }

  // Summary
  const totalPaid    = records.filter((r) => r.status === 'PAID').reduce((s, r) => s + Number(r.netSalary), 0);
  const latestNet    = records[0] ? Number(records[0].netSalary) : 0;
  const latestGross  = records[0] ? Number(records[0].gross) : 0;

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Latest net salary', value: formatCurrency(latestNet),   color: '#33604a', bg: '#dbe8dc' },
          { label: 'Latest gross',      value: formatCurrency(latestGross),  color: '#3d6678', bg: '#dfeaf1' },
          { label: 'Total paid (all)',   value: formatCurrency(totalPaid),   color: '#584a75', bg: '#e6e1ef' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e6e8eb] px-4 py-3 bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '11.5px', color: '#8a929b', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>Payroll History</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #e6e8eb' }}>
                {['Period', 'Gross', 'Deductions', 'Net Salary', 'Attendance', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '0 16px', height: 36, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a929b', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} style={{ height: 52, borderBottom: '1px solid #f0f2f4' }} className="hover:bg-[#fafbfc]">
                  <td style={{ padding: '0 16px', fontSize: '13.5px', fontWeight: 600, color: '#14181c', whiteSpace: 'nowrap' }}>
                    {formatPeriod(rec.payrollRun.periodStart, rec.payrollRun.periodEnd)}
                  </td>
                  <td style={{ padding: '0 16px', fontSize: '13px', color: '#14181c', whiteSpace: 'nowrap' }}>
                    {formatCurrency(Number(rec.gross))}
                  </td>
                  <td style={{ padding: '0 16px', fontSize: '13px', color: '#b3261e', whiteSpace: 'nowrap' }}>
                    -{formatCurrency(Number(rec.totalDeductions))}
                  </td>
                  <td style={{ padding: '0 16px', fontSize: '13px', fontWeight: 700, color: '#33604a', whiteSpace: 'nowrap' }}>
                    {formatCurrency(Number(rec.netSalary))}
                  </td>
                  <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                    {rec.presentDays != null && rec.workingDays != null
                      ? `${rec.presentDays}/${rec.workingDays} days`
                      : '—'}
                  </td>
                  <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                    <Badge variant={runStatusVariant(rec.status)}>
                      {rec.status.charAt(0) + rec.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
