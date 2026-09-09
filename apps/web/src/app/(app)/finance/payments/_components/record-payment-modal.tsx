'use client';

import * as React from 'react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { financeApi, type RecordPaymentData } from '@/lib/finance-api';

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface Allocation {
  invoiceId: string;
  amount: string;
}

interface FormState {
  studentId: string;
  amount: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
}

const INITIAL: FormState = {
  studentId: '',
  amount: '',
  paymentMethod: '',
  transactionReference: '',
  paymentDate: '',
};

const METHOD_OPTIONS = [
  { label: 'Select method', value: '' },
  { label: 'Cash', value: 'CASH' },
  { label: 'UPI', value: 'UPI' },
  { label: 'Online Transfer', value: 'ONLINE' },
  { label: 'Cheque', value: 'CHEQUE' },
  { label: 'DD', value: 'DD' },
  { label: 'NEFT', value: 'NEFT' },
  { label: 'Card', value: 'CARD' },
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

export function RecordPaymentModal({ open, onClose, onSaved }: RecordPaymentModalProps) {
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [allocations, setAllocations] = React.useState<Allocation[]>([]);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  function handleClose() {
    setForm(INITIAL);
    setAllocations([]);
    setErrors({});
    setApiError(null);
    onClose();
  }

  const setF = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.studentId.trim()) e.studentId = 'Student ID is required';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      e.amount = 'Valid amount is required';
    if (!form.paymentMethod) e.paymentMethod = 'Payment method is required';
    if (!form.paymentDate) e.paymentDate = 'Payment date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addAllocation() {
    setAllocations((prev) => [...prev, { invoiceId: '', amount: '' }]);
  }

  function updateAllocation(idx: number, field: keyof Allocation, value: string) {
    setAllocations((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  }

  function removeAllocation(idx: number) {
    setAllocations((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalAmount = parseFloat(form.amount) || 0;
  const allocatedAmount = allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  const unallocated = totalAmount - allocatedAmount;

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      const validAllocations = allocations.filter(
        (a) => a.invoiceId.trim() && parseFloat(a.amount) > 0
      );
      const data: RecordPaymentData = {
        studentId: form.studentId.trim(),
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        transactionReference: form.transactionReference.trim() || undefined,
        paymentDate: form.paymentDate,
        allocations:
          validAllocations.length > 0
            ? validAllocations.map((a) => ({
                invoiceId: a.invoiceId.trim(),
                amount: parseFloat(a.amount),
              }))
            : undefined,
      };
      await financeApi.payments.record(data);
      onSaved();
      handleClose();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Record Payment"
      description="Record a fee payment from a student."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Recording…' : 'Record Payment'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={SECTION_LABEL_STYLE}>Payment Details</div>

        <FormField label="Student ID" required {...(errors.studentId ? { error: errors.studentId } : {})}>
          <Input
            placeholder="e.g. STU-2024-001"
            value={form.studentId}
            onChange={setF('studentId')}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Amount (₹)" required {...(errors.amount ? { error: errors.amount } : {})}>
            <Input
              type="number"
              placeholder="e.g. 12500"
              value={form.amount}
              onChange={setF('amount')}
              min="0"
            />
          </FormField>
          <FormField label="Payment Date" required {...(errors.paymentDate ? { error: errors.paymentDate } : {})}>
            <Input
              type="date"
              value={form.paymentDate}
              onChange={setF('paymentDate')}
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Payment Method" required {...(errors.paymentMethod ? { error: errors.paymentMethod } : {})}>
            <Select
              options={METHOD_OPTIONS}
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            />
          </FormField>
          <FormField label="Transaction Reference" hint="Optional">
            <Input
              placeholder="e.g. UPI ref no."
              value={form.transactionReference}
              onChange={setF('transactionReference')}
            />
          </FormField>
        </div>

        {/* Invoice Allocation section */}
        <div style={SECTION_LABEL_STYLE}>Invoice Allocation (Optional)</div>

        {allocations.map((alloc, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: 8,
              alignItems: 'end',
            }}
          >
            <FormField label="Invoice ID">
              <Input
                placeholder="e.g. INV-2024-001"
                value={alloc.invoiceId}
                onChange={(e) => updateAllocation(idx, 'invoiceId', e.target.value)}
              />
            </FormField>
            <FormField label="Amount (₹)">
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={alloc.amount}
                onChange={(e) => updateAllocation(idx, 'amount', e.target.value)}
                min="0"
              />
            </FormField>
            <button
              onClick={() => removeAllocation(idx)}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                color: '#b3261e',
                background: 'none',
                border: '1px solid #f5c6c6',
                borderRadius: 6,
                cursor: 'pointer',
                marginBottom: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}

        <Button variant="secondary" onClick={addAllocation} size="sm">
          + Allocate to Invoice
        </Button>

        {allocations.length > 0 && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: '#f5f2e8',
              border: '1px solid #e6e1d5',
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6d746e', marginBottom: 4 }}>
              <span>Total Payment</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6d746e', marginBottom: 4 }}>
              <span>Allocated</span>
              <span>₹{allocatedAmount.toLocaleString('en-IN')}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 600,
                color: unallocated < 0 ? '#b3261e' : '#3f6152',
                borderTop: '1px solid #e6e1d5',
                paddingTop: 4,
              }}
            >
              <span>Unallocated</span>
              <span>₹{unallocated.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

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
    </Modal>
  );
}
