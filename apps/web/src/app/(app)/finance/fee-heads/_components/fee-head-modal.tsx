'use client';

import * as React from 'react';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { financeApi, type FeeHead, type CreateFeeHeadData } from '@/lib/finance-api';

interface FeeHeadModalProps {
  open: boolean;
  onClose: () => void;
  feeHead?: FeeHead | undefined;
  onSaved: () => void;
}

interface FormState {
  name: string;
  code: string;
  category: string;
  isRefundable: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

const INITIAL: FormState = {
  name: '',
  code: '',
  category: '',
  isRefundable: false,
  status: 'ACTIVE',
};

const CATEGORY_OPTIONS = [
  { label: 'Select category', value: '' },
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Hostel', value: 'HOSTEL' },
  { label: 'Activity', value: 'ACTIVITY' },
  { label: 'Examination', value: 'EXAMINATION' },
  { label: 'Administrative', value: 'ADMINISTRATIVE' },
  { label: 'Miscellaneous', value: 'MISC' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export function FeeHeadModal({ open, onClose, feeHead, onSaved }: FeeHeadModalProps) {
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (feeHead) {
      setForm({
        name: feeHead.name,
        code: feeHead.code,
        category: feeHead.category,
        isRefundable: feeHead.isRefundable,
        status: feeHead.status,
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
    setApiError(null);
  }, [feeHead, open]);

  const set = (field: keyof FormState) => (val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.code.trim()) e.code = 'Code is required';
    if (!form.category) e.category = 'Category is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleClose() {
    setForm(INITIAL);
    setErrors({});
    setApiError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      const data: CreateFeeHeadData = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        category: form.category,
        isRefundable: form.isRefundable,
        status: form.status,
      };
      if (feeHead) {
        await financeApi.feeHeads.update(feeHead.id, data);
      } else {
        await financeApi.feeHeads.create(data);
      }
      onSaved();
      handleClose();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={feeHead ? 'Edit Fee Head' : 'Add Fee Head'}
      description={feeHead ? 'Update fee head details.' : 'Create a new fee type for billing.'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : feeHead ? 'Save Changes' : 'Create Fee Head'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Name" required {...(errors.name ? { error: errors.name } : {})}>
            <Input
              placeholder="e.g. Tuition Fee"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
            />
          </FormField>
          <FormField label="Code" required {...(errors.code ? { error: errors.code } : {})} hint="Unique identifier e.g. TUITION">
            <Input
              placeholder="e.g. TUITION"
              value={form.code}
              onChange={(e) => set('code')(e.target.value.toUpperCase())}
              style={{ fontFamily: 'monospace' }}
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Category" required {...(errors.category ? { error: errors.category } : {})}>
            <Select
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(e) => set('category')(e.target.value)}
            />
          </FormField>
          <FormField label="Status">
            <Select
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => set('status')(e.target.value as 'ACTIVE' | 'INACTIVE')}
            />
          </FormField>
        </div>

        <FormField label="Refundable">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: '#2c322f',
            }}
          >
            <input
              type="checkbox"
              checked={form.isRefundable}
              onChange={(e) => setForm((f) => ({ ...f, isRefundable: e.target.checked }))}
              style={{ width: 15, height: 15, accentColor: '#3f6152' }}
            />
            This fee is refundable
          </label>
        </FormField>

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
