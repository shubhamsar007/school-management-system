'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { BarChart2 } from 'lucide-react';

export default function PayrollReportsPage() {
  return (
    <div>
      <PageHeader
        title="Payroll Reports"
        subtitle="Analytics and reporting"
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
          background: '#fff',
          border: '1px solid #e6e8eb',
          borderRadius: 12,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#d8e9de',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <BarChart2 size={24} style={{ color: '#3f6152' }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#2c322f', marginBottom: 6 }}>
          Reports — Coming Soon
        </div>
        <div style={{ fontSize: 13, color: '#6b7480', maxWidth: 400, lineHeight: 1.6 }}>
          Payroll analytics including month-on-month trends, component breakdowns, and cost centre reports will be available here.
        </div>
      </div>
    </div>
  );
}
