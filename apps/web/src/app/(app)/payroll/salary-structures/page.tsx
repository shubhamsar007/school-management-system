'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui';
import { Layers, Users } from 'lucide-react';

export default function SalaryStructuresPage() {
  return (
    <div>
      <PageHeader
        title="Salary Structures"
        subtitle="Employee salary configurations"
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
          padding: '24px',
          background: '#fff',
          border: '1px solid #e6e8eb',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#d8e9de',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Layers size={22} style={{ color: '#3f6152' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#2c322f', marginBottom: 6 }}>
            Per-Employee Salary Structures
          </div>
          <div style={{ fontSize: 13, color: '#6b7480', lineHeight: 1.6, marginBottom: 16 }}>
            Salary structures are managed per employee. Each employee has their own salary structure
            defining their basic salary, gross, and individual component amounts or percentages.
            Navigate to the Employees section to view and assign salary structures to staff members.
          </div>
          <Link href="/payroll/employees">
            <Button variant="primary">
              <Users size={14} style={{ marginRight: 6 }} />
              Go to Employees
            </Button>
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: '16px 20px',
          background: '#fffdf8',
          border: '1px solid #e6e1d5',
          borderRadius: 10,
          fontSize: 13,
          color: '#6b7480',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#2c322f' }}>How salary structures work:</strong>
        <ol style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>Configure salary components (earnings &amp; deductions) in <Link href="/payroll/salary-components" style={{ color: '#2b5fa8' }}>Salary Components</Link>.</li>
          <li>Assign a salary structure to each employee specifying basic salary and component amounts.</li>
          <li>When a payroll run is processed, the system uses each employee&apos;s active salary structure to compute their payslip.</li>
        </ol>
      </div>
    </div>
  );
}
