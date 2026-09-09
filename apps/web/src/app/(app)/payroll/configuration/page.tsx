'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge } from '@/components/ui';
import { Settings, Receipt, Layers, TrendingUp, Landmark, Handshake } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff', border: '1px solid #e2ddd5',
        borderRadius: 12, overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px', borderBottom: '1px solid #e2ddd5',
          background: '#fafaf7',
        }}
      >
        <span style={{ color: '#4a9b6f' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>{title}</span>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {children}
      </div>
    </div>
  );
}

function SlabTable({ slabs }: { slabs: { range: string; rate: string; note?: string }[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          {['Income Range', 'Tax Rate', 'Note'].map((h) => (
            <th
              key={h}
              style={{
                padding: '8px 12px', textAlign: 'left', fontWeight: 500,
                fontSize: 12, color: '#6d746e', borderBottom: '1px solid #e2ddd5',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {slabs.map((s, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : '#fff' }}>
            <td style={{ padding: '8px 12px', borderTop: '1px solid #f0ede6' }}>{s.range}</td>
            <td style={{ padding: '8px 12px', borderTop: '1px solid #f0ede6', fontWeight: 600, color: '#2c322f' }}>{s.rate}</td>
            <td style={{ padding: '8px 12px', borderTop: '1px solid #f0ede6', color: '#6d746e' }}>{s.note ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FormulaRow({ label, formula }: { label: string; formula: string }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '9px 0', borderBottom: '1px solid #f0ede6', gap: 16,
      }}
    >
      <span style={{ fontSize: 13, color: '#6d746e', flexShrink: 0 }}>{label}</span>
      <code
        style={{
          fontSize: 12, background: '#f4f1e9', padding: '3px 8px',
          borderRadius: 5, color: '#2c322f', textAlign: 'right',
        }}
      >
        {formula}
      </code>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const OLD_REGIME_SLABS = [
  { range: 'Up to ₹2,50,000',              rate: '0%',  note: 'Basic exemption' },
  { range: '₹2,50,001 – ₹5,00,000',        rate: '5%',  note: '87A rebate if total ≤ ₹5L' },
  { range: '₹5,00,001 – ₹10,00,000',       rate: '20%', note: '' },
  { range: 'Above ₹10,00,000',             rate: '30%', note: '' },
];

const NEW_REGIME_SLABS = [
  { range: 'Up to ₹3,00,000',              rate: '0%',  note: 'Basic exemption' },
  { range: '₹3,00,001 – ₹6,00,000',        rate: '5%',  note: '87A rebate if total ≤ ₹7L' },
  { range: '₹6,00,001 – ₹9,00,000',        rate: '10%', note: '' },
  { range: '₹9,00,001 – ₹12,00,000',       rate: '15%', note: '' },
  { range: '₹12,00,001 – ₹15,00,000',      rate: '20%', note: '' },
  { range: 'Above ₹15,00,000',             rate: '30%', note: '' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayrollConfigurationPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Payroll Configuration Reference"
        subtitle="Tax slabs, computation formulas, statutory limits, and the payroll processing lifecycle"
      />

      {/* ── Tax slabs ───────────────────────────────────────────── */}
      <Section title="Income Tax Slabs — Old Regime (FY 2025-26)" icon={<Receipt size={16} />}>
        <div style={{ marginBottom: 12, fontSize: 13, color: '#6d746e', lineHeight: 1.7 }}>
          Standard deduction: <strong style={{ color: '#2c322f' }}>₹50,000</strong> &nbsp;|&nbsp;
          80C limit: <strong style={{ color: '#2c322f' }}>₹1,50,000</strong> &nbsp;|&nbsp;
          Education cess: <strong style={{ color: '#2c322f' }}>4%</strong> on tax after rebate
        </div>
        <SlabTable slabs={OLD_REGIME_SLABS} />
        <div style={{ marginTop: 10, fontSize: 12, color: '#6d746e' }}>
          87A rebate: up to ₹12,500 if total taxable income ≤ ₹5,00,000
        </div>
      </Section>

      <Section title="Income Tax Slabs — New Regime (FY 2025-26, Default)" icon={<Receipt size={16} />}>
        <div style={{ marginBottom: 12, fontSize: 13, color: '#6d746e', lineHeight: 1.7 }}>
          Standard deduction: <strong style={{ color: '#2c322f' }}>₹50,000</strong> &nbsp;|&nbsp;
          No 80C/HRA deductions &nbsp;|&nbsp;
          Education cess: <strong style={{ color: '#2c322f' }}>4%</strong> on tax after rebate
        </div>
        <SlabTable slabs={NEW_REGIME_SLABS} />
        <div style={{ marginTop: 10, fontSize: 12, color: '#6d746e' }}>
          87A rebate: up to ₹25,000 if total taxable income ≤ ₹7,00,000
        </div>
      </Section>

      {/* ── TDS computation formula ─────────────────────────────── */}
      <Section title="TDS Computation Formula" icon={<TrendingUp size={16} />}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FormulaRow label="Annualized Gross"    formula="Monthly Gross × 12" />
          <FormulaRow label="Standard Deduction"  formula="₹50,000 (both regimes)" />
          <FormulaRow label="80C (OLD only)"       formula="min(declared, ₹1,50,000)" />
          <FormulaRow label="Taxable Income"       formula="Annualized − Std Ded − Exemptions" />
          <FormulaRow label="Income Tax"           formula="Apply slabs to taxable income" />
          <FormulaRow label="Rebate 87A (OLD)"     formula="min(tax, ₹12,500) if income ≤ ₹5L" />
          <FormulaRow label="Rebate 87A (NEW)"     formula="min(tax, ₹25,000) if income ≤ ₹7L" />
          <FormulaRow label="Education Cess"       formula="(Tax − Rebate) × 4%" />
          <FormulaRow label="Annual TDS"           formula="Tax − Rebate + Cess" />
          <FormulaRow label="Monthly TDS"          formula="Annual TDS ÷ 12" />
        </div>
      </Section>

      {/* ── Salary computation lifecycle ────────────────────────── */}
      <Section title="Payroll Run Lifecycle" icon={<Layers size={16} />}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'DRAFT',      variant: 'inactive' as const },
            { label: '→',          variant: null },
            { label: 'PROCESSING', variant: 'pending' as const },
            { label: '→',          variant: null },
            { label: 'COMPLETED',  variant: 'pending' as const },
            { label: '→',          variant: null },
            { label: 'APPROVED',   variant: 'active' as const },
            { label: '→',          variant: null },
            { label: 'PAID',       variant: 'active' as const },
          ].map((item, i) =>
            item.variant ? (
              <Badge key={i} variant={item.variant}>{item.label}</Badge>
            ) : (
              <span key={i} style={{ fontSize: 18, color: '#6d746e' }}>{item.label}</span>
            ),
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#6d746e', lineHeight: 1.7 }}>
          <div><strong style={{ color: '#2c322f' }}>DRAFT:</strong> Run created, no records computed yet. Can be deleted.</div>
          <div><strong style={{ color: '#2c322f' }}>PROCESSING → COMPLETED:</strong> Triggers salary computation for all active employees. Attendance fetched, LOP deducted, adjustments applied, loan EMIs deducted, TDS computed. Records can be held individually.</div>
          <div><strong style={{ color: '#2c322f' }}>APPROVED:</strong> Finance sign-off. Bank export CSV becomes available.</div>
          <div><strong style={{ color: '#2c322f' }}>PAID:</strong> Payments disbursed. Payslips locked and downloadable as PDF.</div>
        </div>
      </Section>

      {/* ── Statutory limits ────────────────────────────────────── */}
      <Section title="Statutory Limits & Computation Rules" icon={<Landmark size={16} />}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FormulaRow label="PF Employee Contribution"  formula="12% of Basic (capped at ₹15,000 basic)" />
          <FormulaRow label="PF Employer Contribution"  formula="12% of Basic (of which 8.33% → EPS)" />
          <FormulaRow label="ESI Employee"              formula="0.75% of Gross (if Gross ≤ ₹21,000/month)" />
          <FormulaRow label="ESI Employer"              formula="3.25% of Gross (if Gross ≤ ₹21,000/month)" />
          <FormulaRow label="Professional Tax"          formula="State-specific slab (default ₹200/month)" />
          <FormulaRow label="LOP per day"               formula="Monthly Gross ÷ Total working days in month" />
          <FormulaRow label="Leave encashment rate"     formula="Monthly CTC ÷ 26 × pending leave days" />
          <FormulaRow label="Gratuity eligibility"      formula="≥ 5 years of continuous service" />
          <FormulaRow label="Gratuity formula"          formula="(Monthly ÷ 26) × 15 × years of service" />
        </div>
      </Section>

      {/* ── FnF summary ─────────────────────────────────────────── */}
      <Section title="Full & Final Settlement Components" icon={<Handshake size={16} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#6d746e', lineHeight: 1.8 }}>
          <div><strong style={{ color: '#2c322f' }}>Partial Month Salary:</strong> Prorated from the 1st of the last working month to the last working day.</div>
          <div><strong style={{ color: '#2c322f' }}>Leave Encashment:</strong> Pending earned leave days encashed at daily rate (CTC ÷ 26).</div>
          <div><strong style={{ color: '#2c322f' }}>Gratuity:</strong> Applicable if employee has ≥ 5 years of service. Formula: (Last monthly salary ÷ 26) × 15 × completed years.</div>
          <div><strong style={{ color: '#2c322f' }}>Loan Recovery:</strong> Sum of outstanding balances on all active loans recovered from FnF amount.</div>
          <div><strong style={{ color: '#2c322f' }}>Net Settlement:</strong> Total Payable (salary + encashment + gratuity) minus Total Deductions (loan recovery).</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'DRAFT',    variant: 'inactive' as const },
            { label: '→',        variant: null },
            { label: 'APPROVED', variant: 'pending' as const },
            { label: '→',        variant: null },
            { label: 'PAID',     variant: 'active' as const },
          ].map((item, i) =>
            item.variant ? (
              <Badge key={i} variant={item.variant}>{item.label}</Badge>
            ) : (
              <span key={i} style={{ fontSize: 18, color: '#6d746e' }}>{item.label}</span>
            ),
          )}
        </div>
      </Section>
    </div>
  );
}
