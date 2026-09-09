'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import {
  payrollApi,
  type TaxDeclaration,
  type TaxRegime,
  type UpsertTaxDeclarationData,
  formatCurrency,
  currentFinancialYear,
} from '@/lib/payroll-api';
import { Receipt, ChevronDown } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

function buildFyOptions(): string[] {
  const now  = new Date();
  const year = now.getFullYear();
  return [
    `${year - 1}-${year}`,
    `${year}-${year + 1}`,
    `${year + 1}-${year + 2}`,
  ];
}

const REGIME_BADGE: Record<TaxRegime, 'active' | 'pending'> = {
  NEW: 'active',
  OLD: 'pending',
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontWeight: 500,
  fontSize: 12,
  color: '#6d746e',
  textAlign: 'left',
  borderBottom: '1px solid #e2ddd5',
  background: '#fafaf7',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  verticalAlign: 'middle',
  borderTop: '1px solid #f0ede6',
};

interface EditForm {
  taxRegime: TaxRegime;
  section80C: number;
  hraExemption: number;
  otherDeductions: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaxDeclarationsPage() {
  const [declarations, setDeclarations] = React.useState<TaxDeclaration[]>([]);
  const [loading, setLoading]           = React.useState(true);
  const [error, setError]               = React.useState<string | null>(null);
  const [fy, setFy]                     = React.useState(currentFinancialYear());
  const [editingId, setEditingId]       = React.useState<string | null>(null);
  // editingId is the employeeId being edited; null means no edit in progress
  const [editForm, setEditForm]         = React.useState<EditForm>({
    taxRegime: 'NEW', section80C: 0, hraExemption: 0, otherDeductions: 0,
  });
  const [saving, setSaving]             = React.useState(false);
  const [saveError, setSaveError]       = React.useState<string | null>(null);

  async function load(financialYear: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await payrollApi.tax.list({ financialYear });
      setDeclarations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load declarations');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(fy); }, [fy]);

  function startEdit(decl: TaxDeclaration) {
    setEditingId(decl.employeeId);
    setEditForm({
      taxRegime:       decl.taxRegime,
      section80C:      parseFloat(decl.section80C),
      hraExemption:    parseFloat(decl.hraExemption),
      otherDeductions: parseFloat(decl.otherDeductions),
    });
    setSaveError(null);
  }

  async function handleSave(employeeId: string) {
    setSaving(true);
    setSaveError(null);
    try {
      const payload: UpsertTaxDeclarationData = {
        employeeId,
        financialYear:   fy,
        taxRegime:       editForm.taxRegime,
        section80C:      editForm.section80C,
      };
      if (editForm.hraExemption > 0)    payload.hraExemption    = editForm.hraExemption;
      if (editForm.otherDeductions > 0) payload.otherDeductions = editForm.otherDeductions;
      await payrollApi.tax.upsert(payload);
      setEditingId(null);
      await load(fy);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save declaration');
    } finally {
      setSaving(false);
    }
  }

  const totalExemptions = (decl: TaxDeclaration) =>
    Math.min(parseFloat(decl.section80C), 150000) +
    parseFloat(decl.hraExemption) +
    parseFloat(decl.otherDeductions);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Tax / TDS Declarations"
        subtitle="Manage employee investment declarations and tax regime choices for accurate TDS computation"
      />

      {/* ── Info banner ──────────────────────────────────────────── */}
      <div
        style={{
          background: '#f0f9f4', border: '1px solid #c3e6d1',
          borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#2c7a3f',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}
      >
        <Receipt size={16} style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <strong>How TDS is computed:</strong> During payroll processing, each employee's monthly
          gross is annualized (× 12), standard deduction of ₹50,000 applied, then the declared
          exemptions (80C, HRA, etc.) are subtracted from taxable income for OLD regime. Tax is
          computed per slabs, 87A rebate applied, 4% education cess added, and divided by 12 for
          monthly TDS. Declarations must be submitted before the payroll run is processed.
        </div>
      </div>

      {/* ── Financial year selector ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#2c322f' }}>Financial Year:</label>
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
            size={14}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6d746e' }}
          />
        </div>
      </div>

      {/* ── Regime comparison card ───────────────────────────────── */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        }}
      >
        {[
          {
            regime: 'OLD' as TaxRegime,
            slabs: '0%→₹2.5L | 5%→₹5L | 20%→₹10L | 30%+',
            exemptions: '80C (₹1.5L), HRA, 80D, 80E, Standard ₹50K',
            best: 'Best when declarations > ₹3.5L',
          },
          {
            regime: 'NEW' as TaxRegime,
            slabs: '0%→₹3L | 5%→₹6L | 10%→₹9L | 15%→₹12L | 20%→₹15L | 30%+',
            exemptions: 'Standard deduction ₹50K only',
            best: 'Rebate up to ₹7L taxable income (zero tax)',
          },
        ].map(({ regime, slabs, exemptions, best }) => (
          <div
            key={regime}
            style={{
              background: '#fff', border: '1px solid #e2ddd5',
              borderRadius: 10, padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Badge variant={REGIME_BADGE[regime]}>{regime} Regime</Badge>
            </div>
            <div style={{ fontSize: 12, color: '#6d746e', lineHeight: 1.6 }}>
              <div><strong style={{ color: '#2c322f' }}>Slabs:</strong> {slabs}</div>
              <div><strong style={{ color: '#2c322f' }}>Exemptions:</strong> {exemptions}</div>
              <div style={{ color: '#4a9b6f', marginTop: 4 }}>{best}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Declarations table ───────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner />
        </div>
      ) : error ? (
        <div
          style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', color: '#b04a3a', fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : declarations.length === 0 ? (
        <EmptyState
          icon={<Receipt size={32} />}
          title="No declarations for this year"
          description={`No tax declarations found for FY ${fy}. Declarations are created when employees submit their investment proofs or when an admin sets their regime.`}
        />
      ) : (
        <div
          style={{
            background: '#fff', border: '1px solid #e2ddd5',
            borderRadius: 12, overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Regime</th>
                <th style={thStyle}>Section 80C</th>
                <th style={thStyle}>HRA Exemption</th>
                <th style={thStyle}>Other Deductions</th>
                <th style={thStyle}>Total Exemptions</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {declarations.map((decl) => {
                const isEditing = editingId === decl.employeeId;
                return (
                  <React.Fragment key={decl.id}>
                    <tr style={{ background: isEditing ? '#f9f7f2' : undefined }}>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6d746e' }}>
                          {decl.employeeId.slice(0, 8)}…
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={REGIME_BADGE[decl.taxRegime]}>{decl.taxRegime}</Badge>
                      </td>
                      <td style={tdStyle}>{formatCurrency(decl.section80C)}</td>
                      <td style={tdStyle}>{formatCurrency(decl.hraExemption)}</td>
                      <td style={tdStyle}>{formatCurrency(decl.otherDeductions)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {formatCurrency(totalExemptions(decl))}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {!isEditing && (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(decl)}>
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                    {isEditing && (
                      <tr style={{ background: '#f9f7f2' }}>
                        <td colSpan={7} style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                                Tax Regime
                              </label>
                              <select
                                value={editForm.taxRegime}
                                onChange={(e) => setEditForm((f) => ({ ...f, taxRegime: e.target.value as TaxRegime }))}
                                style={{
                                  width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                                  borderRadius: 7, fontSize: 13, background: '#fff',
                                }}
                              >
                                <option value="NEW">NEW</option>
                                <option value="OLD">OLD</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                                Section 80C (max ₹1,50,000)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="150000"
                                step="1"
                                value={editForm.section80C || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, section80C: parseFloat(e.target.value) || 0 }))}
                                style={{
                                  width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                                  borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                                HRA Exemption
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={editForm.hraExemption || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, hraExemption: parseFloat(e.target.value) || 0 }))}
                                style={{
                                  width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                                  borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, color: '#6d746e', display: 'block', marginBottom: 4 }}>
                                Other Deductions (80D, NPS…)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={editForm.otherDeductions || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, otherDeductions: parseFloat(e.target.value) || 0 }))}
                                style={{
                                  width: '100%', padding: '7px 10px', border: '1px solid #e2ddd5',
                                  borderRadius: 7, fontSize: 13, boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </div>
                          {editForm.taxRegime === 'NEW' && (editForm.section80C > 0 || editForm.hraExemption > 0 || editForm.otherDeductions > 0) && (
                            <div
                              style={{
                                background: '#fef9e7', border: '1px solid #f5d475',
                                borderRadius: 7, padding: '8px 12px', fontSize: 12,
                                color: '#7a5c00', marginBottom: 8,
                              }}
                            >
                              Note: In NEW regime, Section 80C, HRA, and other deductions are not applicable. Only the standard deduction of ₹50,000 will be used.
                            </div>
                          )}
                          {saveError && (
                            <div style={{ color: '#b04a3a', fontSize: 12, marginBottom: 8 }}>{saveError}</div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button size="sm" disabled={saving} onClick={() => handleSave(decl.employeeId)}>
                              {saving ? <Spinner size="sm" /> : 'Save'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
