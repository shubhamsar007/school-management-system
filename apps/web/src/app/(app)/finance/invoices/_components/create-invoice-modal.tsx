'use client';

import * as React from 'react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { financeApi, type FeeHead, type CreateInvoiceData } from '@/lib/finance-api';

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface InvoiceItem {
  feeHeadId: string;
  description: string;
  amount: string;
  discount: string;
}

interface HeaderForm {
  studentId: string;
  enrollmentId: string;
  invoiceDate: string;
  dueDate: string;
  fine: string;
}

const INITIAL_HEADER: HeaderForm = {
  studentId: '',
  enrollmentId: '',
  invoiceDate: '',
  dueDate: '',
  fine: '',
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#8a929b',
  textTransform: 'uppercase',
  paddingBottom: 4,
  borderBottom: '1px solid #f0f2f4',
};

export function CreateInvoiceModal({ open, onClose, onSaved }: CreateInvoiceModalProps) {
  const [header, setHeader] = React.useState<HeaderForm>(INITIAL_HEADER);
  const [items, setItems] = React.useState<InvoiceItem[]>([
    { feeHeadId: '', description: '', amount: '', discount: '' },
  ]);
  const [feeHeads, setFeeHeads] = React.useState<FeeHead[]>([]);
  const [errors, setErrors] = React.useState<Partial<Record<keyof HeaderForm, string>>>({});
  const [itemErrors, setItemErrors] = React.useState<Record<number, Partial<Record<keyof InvoiceItem, string>>>>({});
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      financeApi.feeHeads.list().then(setFeeHeads).catch(() => {});
    }
  }, [open]);

  function handleClose() {
    setHeader(INITIAL_HEADER);
    setItems([{ feeHeadId: '', description: '', amount: '', discount: '' }]);
    setErrors({});
    setItemErrors({});
    setApiError(null);
    onClose();
  }

  const setH = (field: keyof HeaderForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setHeader((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const e: Partial<Record<keyof HeaderForm, string>> = {};
    if (!header.studentId.trim()) e.studentId = 'Student ID is required';
    if (!header.enrollmentId.trim()) e.enrollmentId = 'Enrollment ID is required';
    if (!header.invoiceDate) e.invoiceDate = 'Invoice date is required';
    if (!header.dueDate) e.dueDate = 'Due date is required';

    const ie: Record<number, Partial<Record<keyof InvoiceItem, string>>> = {};
    items.forEach((it, idx) => {
      const err: Partial<Record<keyof InvoiceItem, string>> = {};
      if (!it.feeHeadId) err.feeHeadId = 'Required';
      if (!it.amount || isNaN(parseFloat(it.amount))) err.amount = 'Valid amount required';
      if (Object.keys(err).length > 0) ie[idx] = err;
    });

    setErrors(e);
    setItemErrors(ie);
    return Object.keys(e).length === 0 && Object.keys(ie).length === 0;
  }

  function addItem() {
    setItems((prev) => [...prev, { feeHeadId: '', description: '', amount: '', discount: '' }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const totalDiscount = items.reduce((s, it) => s + (parseFloat(it.discount) || 0), 0);
  const fine = parseFloat(header.fine) || 0;
  const grandTotal = subtotal - totalDiscount + fine;

  const feeHeadOptions = [
    { label: 'Select fee head', value: '' },
    ...feeHeads.map((fh) => ({ label: fh.name, value: fh.id })),
  ];

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      const data: CreateInvoiceData = {
        studentId: header.studentId.trim(),
        enrollmentId: header.enrollmentId.trim(),
        invoiceDate: header.invoiceDate,
        dueDate: header.dueDate,
        fine: header.fine ? parseFloat(header.fine) : undefined,
        items: items.map((it) => ({
          feeHeadId: it.feeHeadId,
          description: it.description.trim() || undefined,
          amount: parseFloat(it.amount),
          discount: it.discount ? parseFloat(it.discount) : undefined,
        })),
      };
      await financeApi.invoices.create(data);
      onSaved();
      handleClose();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Invoice"
      description="Issue a new fee invoice for a student."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Invoice'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={SECTION_LABEL_STYLE}>Invoice Details</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Student ID" required {...(errors.studentId ? { error: errors.studentId } : {})}>
            <Input
              placeholder="e.g. STU-2024-001"
              value={header.studentId}
              onChange={setH('studentId')}
            />
          </FormField>
          <FormField label="Enrollment ID" required {...(errors.enrollmentId ? { error: errors.enrollmentId } : {})}>
            <Input
              placeholder="e.g. ENR-2024-001"
              value={header.enrollmentId}
              onChange={setH('enrollmentId')}
            />
          </FormField>
          <FormField label="Invoice Date" required {...(errors.invoiceDate ? { error: errors.invoiceDate } : {})}>
            <Input
              type="date"
              value={header.invoiceDate}
              onChange={setH('invoiceDate')}
            />
          </FormField>
          <FormField label="Due Date" required {...(errors.dueDate ? { error: errors.dueDate } : {})}>
            <Input
              type="date"
              value={header.dueDate}
              onChange={setH('dueDate')}
            />
          </FormField>
        </div>

        <FormField label="Fine / Late Fee (₹)" hint="Optional">
          <Input
            type="number"
            placeholder="e.g. 200"
            value={header.fine}
            onChange={setH('fine')}
            min="0"
          />
        </FormField>

        <div style={SECTION_LABEL_STYLE}>Line Items</div>

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
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6d746e', marginBottom: 10 }}>
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
              <FormField label="Description" hint="Optional">
                <Input
                  placeholder="e.g. Term 1 Tuition"
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
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
              <FormField label="Discount (₹)" hint="Optional">
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={item.discount}
                  onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                  min="0"
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

        {/* Running total */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: '#d8e9de',
            border: '1px solid #b2d4bf',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6d746e', marginBottom: 4 }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {totalDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6d746e', marginBottom: 4 }}>
              <span>Discount</span>
              <span>−₹{totalDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {fine > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#b3261e', marginBottom: 4 }}>
              <span>Fine</span>
              <span>+₹{fine.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              fontWeight: 700,
              color: '#2c322f',
              borderTop: '1px solid #b2d4bf',
              paddingTop: 6,
              marginTop: 4,
            }}
          >
            <span>Grand Total</span>
            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
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
    </Modal>
  );
}
