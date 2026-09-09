'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Settings } from 'lucide-react';

export default function PayrollConfigurationPage() {
  return (
    <div>
      <PageHeader
        title="Payroll Configuration"
        subtitle="System-wide payroll settings"
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
            background: '#eef0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Settings size={24} style={{ color: '#6b7480' }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#2c322f', marginBottom: 6 }}>
          Configuration — Coming Soon
        </div>
        <div style={{ fontSize: 13, color: '#6b7480', maxWidth: 400, lineHeight: 1.6 }}>
          Payroll configuration options including pay periods, tax brackets, and approval workflows will be available here.
        </div>
      </div>
    </div>
  );
}
