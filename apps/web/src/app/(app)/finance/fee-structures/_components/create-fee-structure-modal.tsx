'use client';

import * as React from 'react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { financeApi, type FeeHead, type CreateFeeStructureData } from '@/lib/finance-api';

interface CreateFeeStructureModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface LineItem {
  feeHeadId: string;
  amount: string;
  frequency: string;
  dueDay: string;
}

interface Step1Form {
  name: string;
  classId: string;
  academicYearId: string;
}

const FREQUENCY_OPTIONS = [
  { label: 'Select frequency', value: '' },
  { label: 'One Time', value: 'ONE_TIME' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Quarterly', value: 'QUARTERLY' },
  { label: 'Half Yearly', value: 'HALF_YEARLY' },
  { label: 'Annually', value: 'ANNUALLY' },
];

const ACADEMIC_YEAR_OPTIONS = [
  { label: 'Select academic year', value: '' },
  { label: '2024–25', value: '2024-25' },
  { label: '2025–26', value: '2025-26' },
  { label: '2026–27', value: '2026-27' },
];

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#8a929b',
  textTransform: 'uppercase',
  paddingBottom: 4,
  borderBottom: '1px solid #f0f2f4',
};

export function CreateFeeStructureModal({ open, onClose, onSaved }: CreateFeeStructureModalProps) {
  const [step, setStep] = React.useState(1);
  const [step1, setStep1] = React.useState<Step1Form>({ name: '', classId: '', academicYearId: '' });
  const [items, setItems] = React.useState<LineItem[]>([
    { feeHeadId: '', amount: '', frequency: '', dueDay: '' },
  ]);
  const [feeHeads, setFeeHeads] = React.useState<FeeHead[]>([]);
  const [errors1, setErrors1] = React.useState<Partial<Record<keyof Step1Form, string>>>({});
  const [itemErrors, setItemErrors] = React.useState<Record<number, Partial<Record<keyof LineItem, string>>>>({});
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      financeApi.feeHeads.list().then(setFeeHeads).catch(() => {});
    }
  }, [open]);

  function handleClose() {
    setStep(1);
    setStep1({ name: '', classId: '', academicYearId: '' });
    setItems([{ feeHeadId: '', amount: '', frequency: '', dueDay: '' }]);
    setErrors1({});
    setItemErrors({});
    setApiError(null);
    onClose();
  }

  function validateStep1(): boolean {
    const e: Partial<Record<keyof Step1Form, string>> = {};
    if (!step1.name.trim()) e.name = 'Name is required';
    if (!step1.classId.trim()) e.classId = 'Class is required';
    if (!step1.academicYearId) e.academicYearId = 'Academic year is required';
    setErrors1(e);
    return Object.keys(e).length === 0;
  }

  function validateItems(): boolean {
    const errs: Record<number, Partial<Record<keyof LineItem, string>>> = {};
    items.forEach((item, idx) => {
      const e: Partial<Record<keyof LineItem, string>> = {};
      if (!item.feeHeadId) e.feeHeadId = 'Required';
      if (!item.amount || isNaN(parseFloat(item.amount))) e.amount = 'Valid amount required';
      if (!item.frequency) e.frequency = 'Required';
      if (Object.keys(e).length > 0) errs[idx] = e;
    });
    setItemErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function addItem() {
    setItems((prev) => [...prev, { feeHeadId: '', amount: '', frequency: '', dueDay: '' }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  const totalAmount = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);

  const feeHeadOptions = [
    { label: 'Select fee head', value: '' },
    ...feeHeads.map((fh) => ({ label: fh.name, value: fh.id })),
  ];

  async function handleSubmit() {
    if (!validateItems()) return;
    setSaving(true);
    setApiError(null);
    try {
      const data: CreateFeeStructureData = {
        academicYearId: step1.academicYearId,
        classId: step1.classId.trim(),
        name: step1.name.trim(),
        items: items.map((it) => ({
          feeHeadId: it.feeHeadId,
          amount: parseFloat(it.amount),
          frequency: it.frequency,
          dueDay: it.dueDay ? parseInt(it.dueDay, 10) : undefined,
        })),
      };
      await financeApi.feeStructures.create(data);
      onSaved();
      handleClose();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to create fee structure.');
    } finally {
      setSaving(false);
    }
  }

  const footer =
    step === 1 ? (
      <>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (validateStep1()) setStep(2);
          }}
        >
          Next: Add Items →
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={() => setStep(1)}>
          ← Back
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating…' : 'Create Structure'}
        </Button>
      </>
    );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Fee Structure"
      description={
        step === 1
          ? 'Step 1 of 2 — Structure info'
          : 'Step 2 of 2 — Add fee line items'
      }
      size="lg"
      footer={footer}
    >
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={SECTION_LABEL_STYLE}>Structure Details</div>

          <FormField label="Structure Name" required {...(errors1.name ? { error: errors1.name } : {})}>
            <Input
              placeholder="e.g. Grade 8 Fee Structure 2026–27"
              value={step1.name}
              onChange={(e) => setStep1((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Class" required {...(errors1.classId ? { error: errors1.classId } : {})} hint="Enter class name or ID">
              <Input
                placeholder="e.g. Grade 8 or class-uuid"
                value={step1.classId}
                onChange={(e) => setStep1((f) => ({ ...f, classId: e.target.value }))}
              />
            </FormField>
            <FormField label="Academic Year" required {...(errors1.academicYearId ? { error: errors1.academicYearId } : {})}>
              <Select
                options={ACADEMIC_YEAR_OPTIONS}
                value={step1.academicYearId}
                onChange={(e) => setStep1((f) => ({ ...f, academicYearId: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={SECTION_LABEL_STYLE}>Fee Line Items</div>

          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e6e8eb',
                background: '#fafafa',
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6d746e',
                  marginBottom: 10,
                }}
              >
                Item {idx + 1}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FormField label="Fee Head" required {...(itemErrors[idx]?.feeHeadId ? { error: itemErrors[idx]?.feeHeadId } : {})}>
                  <Select
                    options={feeHeadOptions}
                    value={item.feeHeadId}
                    onChange={(e) => updateItem(idx, 'feeHeadId', e.target.value)}
                  />
                </FormField>
                <FormField label="Frequency" required {...(itemErrors[idx]?.frequency ? { error: itemErrors[idx]?.frequency } : {})}>
                  <Select
                    options={FREQUENCY_OPTIONS}
                    value={item.frequency}
                    onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                  />
                </FormField>
                <FormField label="Amount (₹)" required {...(itemErrors[idx]?.amount ? { error: itemErrors[idx]?.amount } : {})}>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={item.amount}
                    onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                    min="0"
                  />
                </FormField>
                <FormField label="Due Day" hint="Day of month (1–31), optional">
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={item.dueDay}
                    onChange={(e) => updateItem(idx, 'dueDay', e.target.value)}
                    min="1"
                    max="31"
                  />
                </FormField>
              </div>

              {items.length > 1 && (
                <button
                  onClick={() => removeItem(idx)}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    fontSize: 11,
                    color: '#b3261e',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <Button variant="secondary" onClick={addItem} size="sm">
            + Add Item
          </Button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: 8,
              background: '#d8e9de',
              border: '1px solid #b2d4bf',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>
              Total Amount
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#3f6152' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {apiError && (
            <div
              style={{
                fontSize: 13,
                color: '#b3261e',
                background: '#fde8e7',
                border: '1px solid #f5c6c6',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              {apiError}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
