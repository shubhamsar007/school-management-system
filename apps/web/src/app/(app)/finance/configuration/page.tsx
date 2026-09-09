'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Settings, DollarSign, Clock, CreditCard, Calendar } from 'lucide-react';

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 10,
        borderBottom: '1px solid #e6e8eb',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: '#d8e9de',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} style={{ color: '#3f6152' }} strokeWidth={2} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#2c322f' }}>{title}</span>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '10px 0',
        borderBottom: '1px solid #f5f2e8',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#2c322f' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>{hint}</div>}
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#6d746e',
          fontWeight: 500,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 0',
        cursor: 'default',
        fontSize: 13,
        color: '#2c322f',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        readOnly
        style={{ width: 14, height: 14, accentColor: '#3f6152', cursor: 'default' }}
      />
      {label}
    </label>
  );
}

const PANEL_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e6e8eb',
  borderRadius: 12,
  padding: '20px 22px',
  marginBottom: 16,
};

export default function ConfigurationPage() {
  return (
    <div>
      <PageHeader
        title="Finance Configuration"
        subtitle="View and manage financial settings"
      />

      {/* API coming soon banner */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: '#f5f2e8',
          border: '1px solid #e6e1d5',
          fontSize: 13,
          color: '#6d746e',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Settings size={14} style={{ color: '#6d746e', flexShrink: 0 }} />
        <span>
          Finance configuration API is coming in the next release. Settings are displayed in
          read-only mode.
        </span>
      </div>

      {/* General settings */}
      <div style={PANEL_STYLE}>
        <SectionHeader icon={DollarSign} title="General" />
        <ConfigRow label="Currency" value="₹ INR — Indian Rupee" />
        <ConfigRow label="Fiscal Year Start" value="April" hint="Month when the fiscal year begins" />
        <ConfigRow label="Invoice Prefix" value="INV" hint="e.g. INV-2026-0001" />
        <ConfigRow label="Receipt Prefix" value="RCP" hint="e.g. RCP-2026-0001" />
        <ConfigRow label="Refund Prefix" value="REF" hint="e.g. REF-2026-0001" />
      </div>

      {/* Late fee policy */}
      <div style={PANEL_STYLE}>
        <SectionHeader icon={Clock} title="Late Fee Policy" />
        <ConfigRow label="Grace Period" value="5 days" hint="Days after due date before fine applies" />
        <ConfigRow label="Fine Type" value="Fixed" hint="FIXED / PERCENTAGE / PER_DAY / TIERED" />
        <ConfigRow label="Fine Amount" value="₹50 per invoice" />
      </div>

      {/* Payment methods */}
      <div style={PANEL_STYLE}>
        <SectionHeader icon={CreditCard} title="Enabled Payment Methods" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            { label: 'Cash', checked: true },
            { label: 'UPI', checked: true },
            { label: 'Online Transfer', checked: true },
            { label: 'Cheque', checked: true },
            { label: 'Demand Draft (DD)', checked: true },
            { label: 'NEFT', checked: true },
            { label: 'Card (POS)', checked: false },
          ].map(({ label, checked }) => (
            <CheckRow key={label} label={label} checked={checked} />
          ))}
        </div>
      </div>

      {/* Billing frequencies */}
      <div style={PANEL_STYLE}>
        <SectionHeader icon={Calendar} title="Billing Frequencies" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            { label: 'One Time', checked: true },
            { label: 'Monthly', checked: true },
            { label: 'Quarterly', checked: true },
            { label: 'Half Yearly', checked: true },
            { label: 'Annually', checked: true },
          ].map(({ label, checked }) => (
            <CheckRow key={label} label={label} checked={checked} />
          ))}
        </div>
      </div>
    </div>
  );
}
