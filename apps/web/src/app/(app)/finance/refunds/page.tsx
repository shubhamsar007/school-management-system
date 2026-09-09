'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, DataTable, Spinner, EmptyState, Modal, Input, Select, FormField } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { financeApi, formatCurrency, formatDate, type FeeRefund, type CreateRefundData } from '@/lib/finance-api';

type BadgeVariant = 'active' | 'pending' | 'default';

const REFUND_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PROCESSED: 'active',
  APPROVED: 'default',
  PENDING: 'pending',
};

const REFUND_STATUS_LABEL: Record<string, string> = {
  PROCESSED: 'Processed',
  APPROVED: 'Approved',
  PENDING: 'Pending',
};

const METHOD_OPTIONS = [
  { label: 'Select method', value: '' },
  { label: 'Cash', value: 'CASH' },
  { label: 'UPI', value: 'UPI' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  { label: 'Cheque', value: 'CHEQUE' },
  { label: 'NEFT', value: 'NEFT' },
];

interface RefundFormState {
  paymentId: string;
  amount: string;
  reason: string;
  refundMethod: string;
  transactionReference: string;
}

const INITIAL_FORM: RefundFormState = {
  paymentId: '',
  amount: '',
  reason: '',
  refundMethod: '',
  transactionReference: '',
};

export default function RefundsPage() {
  const [paymentIdInput, setPaymentIdInput] = React.useState('');
  const [lookedUpPaymentId, setLookedUpPaymentId] = React.useState<string | null>(null);
  const [refunds, setRefunds] = React.useState<FeeRefund[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState<RefundFormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof RefundFormState, string>>>({});
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  async function lookupRefunds(pid: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await financeApi.refunds.list(pid);
      setRefunds(data);
      setLookedUpPaymentId(pid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load refunds for this payment');
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }

  function handleLookup() {
    if (!paymentIdInput.trim()) return;
    lookupRefunds(paymentIdInput.trim());
  }

  function openCreate() {
    setForm({ ...INITIAL_FORM, paymentId: lookedUpPaymentId ?? '' });
    setFormErrors({});
    setApiError(null);
    setShowCreate(true);
  }

  function validateForm(): boolean {
    const e: Partial<Record<keyof RefundFormState, string>> = {};
    if (!form.paymentId.trim()) e.paymentId = 'Payment ID is required';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      e.amount = 'Valid amount required';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    if (!form.refundMethod) e.refundMethod = 'Refund method is required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    setSaving(true);
    setApiError(null);
    try {
      const data: CreateRefundData = {
        amount: parseFloat(form.amount),
        reason: form.reason.trim(),
        refundMethod: form.refundMethod,
        transactionReference: form.transactionReference.trim() || undefined,
      };
      await financeApi.refunds.create(form.paymentId.trim(), data);
      setShowCreate(false);
      lookupRefunds(form.paymentId.trim());
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to create refund.');
    } finally {
      setSaving(false);
    }
  }

  const setF = (field: keyof RefundFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const columns: ColumnDef<FeeRefund>[] = [
    {
      id: 'refundNumber',
      header: 'REFUND NO',
      width: '140px',
      cell: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6d746e' }}>
          {r.refundNumber}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'AMOUNT',
      width: '100px',
      align: 'right',
      cell: (r) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>
          {formatCurrency(r.amount)}
        </span>
      ),
    },
    {
      id: 'method',
      header: 'METHOD',
      width: '120px',
      cell: (r) => (
        <span style={{ fontSize: 12, color: '#6d746e' }}>{r.refundMethod}</span>
      ),
    },
    {
      id: 'reason',
      header: 'REASON',
      width: 'minmax(120px, 1fr)',
      cell: (r) => (
        <span style={{ fontSize: 12, color: '#6d746e' }}>{r.reason}</span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => (
        <Badge variant={REFUND_STATUS_VARIANT[r.status] ?? 'default'}>
          {REFUND_STATUS_LABEL[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      id: 'processedAt',
      header: 'PROCESSED',
      width: '110px',
      cell: (r) => (
        <span style={{ fontSize: 12, color: '#6d746e' }}>
          {r.processedAt ? formatDate(r.processedAt) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Refunds"
        subtitle="Lookup and process refunds by payment ID"
        actions={
          <Button variant="primary" onClick={openCreate}>
            + Create Refund
          </Button>
        }
      />

      {/* Payment ID lookup */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, maxWidth: 360 }}>
          <FormField label="Lookup by Payment ID">
            <Input
              placeholder="Enter payment ID or receipt number"
              value={paymentIdInput}
              onChange={(e) => setPaymentIdInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
            />
          </FormField>
        </div>
        <Button variant="secondary" onClick={handleLookup} disabled={!paymentIdInput.trim()}>
          Look Up
        </Button>
      </div>

      {/* Refund list */}
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {!lookedUpPaymentId ? (
          <EmptyState
            title="Enter a payment ID to view refunds"
            description="Refunds are linked to payments. Enter a payment ID above to look up existing refunds or create a new one."
            action={
              <Button variant="primary" onClick={openCreate}>
                + Create Refund
              </Button>
            }
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: '16px 20px', color: '#b3261e', fontSize: 13 }}>{error}</div>
        ) : refunds.length === 0 ? (
          <EmptyState
            title="No refunds for this payment"
            description="No refunds have been processed for the specified payment ID."
            action={
              <Button variant="primary" onClick={openCreate}>
                + Create Refund
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} data={refunds} />
        )}
      </div>

      {/* Create Refund Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Refund"
        description="Process a refund for a confirmed payment."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Processing…' : 'Create Refund'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Payment ID" required {...(formErrors.paymentId ? { error: formErrors.paymentId } : {})}>
            <Input
              placeholder="Enter payment ID"
              value={form.paymentId}
              onChange={setF('paymentId')}
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Refund Amount (₹)" required {...(formErrors.amount ? { error: formErrors.amount } : {})}>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={form.amount}
                onChange={setF('amount')}
                min="0"
              />
            </FormField>
            <FormField label="Refund Method" required {...(formErrors.refundMethod ? { error: formErrors.refundMethod } : {})}>
              <Select
                options={METHOD_OPTIONS}
                value={form.refundMethod}
                onChange={(e) => setForm((f) => ({ ...f, refundMethod: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Reason" required {...(formErrors.reason ? { error: formErrors.reason } : {})}>
            <Input
              placeholder="Reason for refund"
              value={form.reason}
              onChange={setF('reason')}
            />
          </FormField>
          <FormField label="Transaction Reference" hint="Optional">
            <Input
              placeholder="e.g. Bank reference number"
              value={form.transactionReference}
              onChange={setF('transactionReference')}
            />
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
    </div>
  );
}
