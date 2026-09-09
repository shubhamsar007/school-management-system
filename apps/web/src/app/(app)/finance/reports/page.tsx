'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui';
import {
  TrendingUp,
  FileText,
  Clock,
  Tag,
  Users,
  CreditCard,
  BookOpen,
  Gift,
  RotateCcw,
} from 'lucide-react';

interface ReportCard {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}

const REPORTS: ReportCard[] = [
  {
    icon: TrendingUp,
    title: 'Collection Report',
    description: 'Daily and monthly fee collection summary with payment method breakdown.',
    badge: 'Daily / Monthly',
  },
  {
    icon: FileText,
    title: 'Outstanding Report',
    description: 'All unpaid and partially paid invoices grouped by class and student.',
  },
  {
    icon: Clock,
    title: 'Aging Report',
    description: 'Overdue invoices bucketed by age: 1–30, 31–60, 61–90, and 90+ days.',
    badge: 'Critical',
  },
  {
    icon: Tag,
    title: 'Fee Head Analysis',
    description: 'Revenue breakdown by fee type (tuition, transport, hostel, etc.).',
  },
  {
    icon: Users,
    title: 'Class-wise Collection',
    description: 'Collection summary per class or grade with comparison across terms.',
  },
  {
    icon: CreditCard,
    title: 'Payment Method Breakdown',
    description: 'Analysis of payments by method: cash, UPI, online, cheque, etc.',
  },
  {
    icon: BookOpen,
    title: 'Student Ledger',
    description: 'Complete financial history for a student — billed, paid, and balance.',
  },
  {
    icon: Gift,
    title: 'Concessions & Discounts',
    description: 'All approved concessions, scholarships, and waivers with totals.',
  },
  {
    icon: RotateCcw,
    title: 'Refunds Report',
    description: 'All processed refunds with status, method, and amount.',
  },
];

export default function ReportsPage() {
  function handleGenerate(title: string) {
    alert(`"${title}" report — Coming soon. This will be available in the next release.`);
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate and export financial reports"
      />

      {/* Coming soon banner */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: '#fff8e6',
          border: '1px solid #ffe8a0',
          fontSize: 13,
          color: '#7a5700',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 15 }}>⚡</span>
        <span>
          Report generation API is coming in the next release. Use the buttons below to preview
          what&apos;s available.
        </span>
      </div>

      {/* Report cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {REPORTS.map(({ icon: Icon, title, description, badge }) => (
          <div
            key={title}
            style={{
              background: '#fff',
              border: '1px solid #e6e8eb',
              borderRadius: 12,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#d8e9de',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={17} style={{ color: '#3f6152' }} strokeWidth={1.8} />
              </div>
              {badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#7a5700',
                    background: '#fff8e6',
                    border: '1px solid #ffe8a0',
                    borderRadius: 10,
                    padding: '2px 7px',
                    letterSpacing: '0.04em',
                  }}
                >
                  {badge}
                </span>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#2c322f',
                  marginBottom: 4,
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 12, color: '#6d746e', lineHeight: 1.5 }}>
                {description}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleGenerate(title)}
              style={{ alignSelf: 'flex-start' }}
            >
              Generate
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
