'use client';

import * as React from 'react';
import { CreditCard, Star } from 'lucide-react';
import { useEmployeeBankDetails } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Account type label ───────────────────────────────────────────────────────

function accountTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SAVINGS: 'Savings',
    CURRENT: 'Current',
    SALARY:  'Salary',
  };
  return labels[type] ?? type;
}

// ─── Masked account number ────────────────────────────────────────────────────

function maskAccount(number: string): string {
  if (number.length <= 4) return number;
  return '•••• ' + number.slice(-4);
}

// ─── Bank card ────────────────────────────────────────────────────────────────

function BankCard({ detail }: { detail: import('@/lib/hooks/use-teachers').EmployeeBankDetail }) {
  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb] hover:border-[#c8d0d9] transition-colors"
      style={{ padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 42, height: 42, background: '#dfeaf1' }}
        >
          <CreditCard size={18} style={{ color: '#3d6678' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#14181c' }}>{detail.bankName}</p>
                {detail.isPrimary && (
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: '#fef3c7' }}>
                    <Star size={10} style={{ color: '#92400e', fill: '#92400e' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#92400e' }}>Primary</span>
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', fontFamily: 'monospace', color: '#6b7480', marginTop: 2 }}>
                {maskAccount(detail.accountNumber)}
              </p>
            </div>
            <Badge variant="default">{accountTypeLabel(detail.accountType)}</Badge>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-3">
            <span style={{ fontSize: '12px', color: '#8a929b' }}>
              IFSC: <span style={{ fontFamily: 'monospace', color: '#14181c' }}>{detail.ifscCode}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bank tab ─────────────────────────────────────────────────────────────────

export function BankTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useEmployeeBankDetails(employeeId);
  const details = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start gap-3">
              <Skeleton width={42} height={42} className="rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton height={14} width={180} className="mb-2" />
                <Skeleton height={12} width={120} className="mb-3" />
                <Skeleton height={11} width={140} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (details.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<CreditCard size={24} />}
          title="No bank details added"
          description="Bank account details for salary disbursement will appear here once added."
        />
      </div>
    );
  }

  const primary = details.find((d) => d.isPrimary);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Accounts linked', value: details.length },
          { label: 'Primary account', value: primary ? primary.bankName : '—' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-[#e6e8eb] px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#14181c' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#8a929b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {/* Primary first, already sorted by server */}
        {details.map((d) => <BankCard key={d.id} detail={d} />)}
      </div>
    </div>
  );
}
