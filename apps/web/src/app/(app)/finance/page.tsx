'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, KpiCard, Spinner } from '@/components/ui';
import { financeApi, formatCurrency, type FeeInvoice, type FeePayment } from '@/lib/finance-api';
import Link from 'next/link';
import { AlertTriangle, FileText } from 'lucide-react';

function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function isSameWeek(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  const startOfWeek = new Date(ref);
  startOfWeek.setDate(ref.getDate() - ref.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export default function FinancePage() {
  const [invoices, setInvoices] = React.useState<FeeInvoice[]>([]);
  const [payments, setPayments] = React.useState<FeePayment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const [invData, payData] = await Promise.all([
          financeApi.invoices.list(),
          financeApi.payments.list(),
        ]);
        setInvoices(invData);
        setPayments(payData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load finance data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date();

  const totalBilled = invoices.reduce((s, inv) => s + parseFloat(inv.total || '0'), 0);
  const totalPaid = payments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);
  const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : '0.0';
  const invoicesIssued = invoices.length;
  const pendingPayments = payments.filter((p) => p.status === 'PENDING').length;

  const confirmedPayments = payments.filter((p) => p.status === 'CONFIRMED');
  const todayTotal = confirmedPayments
    .filter((p) => isSameDay(p.paymentDate, today))
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
  const weekTotal = confirmedPayments
    .filter((p) => isSameWeek(p.paymentDate, today))
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
  const monthTotal = confirmedPayments
    .filter((p) => isSameMonth(p.paymentDate, today))
    .reduce((s, p) => s + parseFloat(p.amount || '0'), 0);

  const maxBar = Math.max(todayTotal, weekTotal, monthTotal, 1);

  const draftStructures: number = 0; // Computed after we fetch fee structures — simplify for now

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Fee Management" subtitle="2026–27" />
        <div
          style={{
            padding: '16px 20px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 10,
            color: '#b3261e',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  const isEmpty = invoices.length === 0 && payments.length === 0;

  return (
    <div>
      <PageHeader
        title="Fee Management"
        subtitle={isEmpty ? '2026–27 · Set up fee heads to get started' : '2026–27 · Financial overview'}
        actions={
          <div className="flex gap-2">
            <Link href="/finance/fee-structures">
              <Button variant="secondary">Generate Fees</Button>
            </Link>
            <Link href="/finance/payments">
              <Button variant="primary">Record Payment</Button>
            </Link>
          </div>
        }
      />

      {/* Primary KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard
          title="TOTAL BILLED"
          value={formatCurrency(totalBilled)}
          subtitle="this year"
        />
        <KpiCard
          title="COLLECTED"
          value={formatCurrency(totalPaid)}
          trend={`${collectionRate}%`}
          trendPositive
          subtitle="of billed"
        />
        <KpiCard
          title="OUTSTANDING"
          value={formatCurrency(totalOutstanding)}
          trendPositive={false}
          subtitle="to collect"
        />
        <KpiCard
          title="OVERDUE INVOICES"
          value={String(overdueCount)}
          trendPositive={overdueCount === 0}
          subtitle="need attention"
        />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="COLLECTION RATE"
          value={`${collectionRate}%`}
          subtitle="overall"
        />
        <KpiCard
          title="INVOICES ISSUED"
          value={String(invoicesIssued)}
          subtitle="total"
        />
        <KpiCard
          title="PENDING PAYMENTS"
          value={String(pendingPayments)}
          trendPositive={pendingPayments === 0}
          subtitle="awaiting confirmation"
        />
        <KpiCard
          title="OVERDUE COUNT"
          value={String(overdueCount)}
          trendPositive={overdueCount === 0}
          subtitle="overdue invoices"
        />
      </div>

      {/* Get-started strip — only when no data */}
      {isEmpty && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            marginBottom: 16,
            background: '#fffdf8',
            border: '1px solid #e6e1d5',
            borderRadius: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 2 }}>
              Get started with Fee Management
            </div>
            <div style={{ fontSize: 12, color: '#6d746e' }}>
              Create fee heads → build fee structures → assign to students → generate invoices
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/finance/fee-heads">
              <Button variant="secondary">+ Fee Heads</Button>
            </Link>
            <Link href="/finance/fee-structures">
              <Button variant="primary">+ Fee Structure</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom two-column section */}
      <div className="grid grid-cols-3 gap-4">
        {/* Collection trend */}
        <div
          className="col-span-2 rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm"
        >
          <h3
            style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}
          >
            Collection Trend
          </h3>
          <div className="flex items-end gap-6" style={{ height: 100 }}>
            {[
              { label: 'Today', value: todayTotal },
              { label: 'This Week', value: weekTotal },
              { label: 'This Month', value: monthTotal },
            ].map(({ label, value }) => {
              const pct = (value / maxBar) * 100;
              return (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#3f6152',
                      marginBottom: 4,
                    }}
                  >
                    {formatCurrency(value)}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(pct, 4)}px`,
                      maxHeight: 80,
                      background: '#3f6152',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.8,
                      transition: 'height 0.3s',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      color: '#6d746e',
                      marginTop: 4,
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attention items */}
        <div
          className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm"
        >
          <h3
            style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 12 }}
          >
            Attention Needed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overdueCount > 0 && (
              <Link
                href="/finance/overdues"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#fde8e7',
                  border: '1px solid #f5c6c6',
                  textDecoration: 'none',
                }}
              >
                <AlertTriangle size={15} style={{ color: '#b3261e', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#b3261e' }}>
                    {overdueCount} Overdue Invoice{overdueCount !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a929b' }}>View &amp; follow up →</div>
                </div>
              </Link>
            )}
            {draftStructures > 0 && (
              <Link
                href="/finance/fee-structures"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#fff8e6',
                  border: '1px solid #ffe8a0',
                  textDecoration: 'none',
                }}
              >
                <FileText size={15} style={{ color: '#b07000', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#b07000' }}>
                    {draftStructures} Draft Fee Structure{draftStructures !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a929b' }}>Publish to generate invoices →</div>
                </div>
              </Link>
            )}
            {overdueCount === 0 && draftStructures === 0 && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#f0f9f0',
                  border: '1px solid #c3e6d0',
                  fontSize: 12,
                  color: '#3f6152',
                  fontWeight: 500,
                }}
              >
                All clear — no pending actions.
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: '#6d746e', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick links
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'Create Invoice', href: '/finance/invoices' },
                { label: 'Record Payment', href: '/finance/payments' },
                { label: 'Student Ledger', href: '/finance/student-fees' },
                { label: 'Fee Structures', href: '/finance/fee-structures' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: 12,
                    color: '#2b5fa8',
                    textDecoration: 'none',
                    padding: '2px 0',
                  }}
                >
                  {label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
