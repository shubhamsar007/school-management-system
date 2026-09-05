'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReferenceItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  employeeCount?: number;
  [key: string]: unknown;
}

export interface FieldConfig {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'select';
  options?: { label: string; value: string }[];
  maxLength?: number;
}

export interface ReferenceDataPanelProps {
  title: string;
  items: ReferenceItem[];
  isLoading: boolean;
  fields: FieldConfig[];
  onAdd: (data: Record<string, string>) => Promise<void>;
  onEdit: (id: string, data: Record<string, string>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  extraColumns?: {
    header: string;
    render: (item: ReferenceItem) => React.ReactNode;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEmptyForm(fields: FieldConfig[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    out[f.key] = '';
  }
  return out;
}

function buildFormFromItem(
  item: ReferenceItem,
  fields: FieldConfig[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const val = item[f.key];
    out[f.key] = val !== null && val !== undefined ? String(val) : '';
  }
  return out;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReferenceDataPanel({
  title,
  items,
  isLoading,
  fields,
  onAdd,
  onEdit,
  onDelete,
  extraColumns = [],
}: ReferenceDataPanelProps) {
  // Form modal state
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ReferenceItem | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  // Delete modal state
  const [deleteItem, setDeleteItem] = React.useState<ReferenceItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  function openAdd() {
    setEditingItem(null);
    setFormValues(buildEmptyForm(fields));
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(item: ReferenceItem) {
    setEditingItem(item);
    setFormValues(buildFormFromItem(item, fields));
    setFormErrors({});
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingItem(null);
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !formValues[f.key]?.trim()) {
        errors[f.key] = `${f.label} is required`;
      }
      if (f.maxLength && (formValues[f.key]?.length ?? 0) > f.maxLength) {
        errors[f.key] = `${f.label} must be at most ${f.maxLength} characters`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    // Build payload — only include non-empty optional fields
    const payload: Record<string, string> = {};
    for (const f of fields) {
      const val = formValues[f.key] ?? '';
      if (f.required === true) {
        payload[f.key] = val;
      } else if (val.trim() !== '') {
        payload[f.key] = val;
      }
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await onEdit(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      closeForm();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await onDelete(deleteItem.id);
      setDeleteItem(null);
    } finally {
      setDeleting(false);
    }
  }

  const singularTitle = title.endsWith('s') ? title.slice(0, -1) : title;

  return (
    <>
      {/* ─── Panel ─────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e6e8eb',
          boxShadow: '0 1px 3px rgba(20,24,28,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e6e8eb',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#14181c',
            }}
          >
            {title}
          </span>
          <Button variant="primary" onClick={openAdd}>
            + Add {singularTitle}
          </Button>
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `1fr 120px${extraColumns.map(() => ' 140px').join('')} 100px 80px 80px`,
            padding: '8px 20px',
            borderBottom: '1px solid #f5f6f7',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Name
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Code
          </span>
          {extraColumns.map((col) => (
            <span
              key={col.header}
              style={{ fontSize: '11px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            >
              {col.header}
            </span>
          ))}
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Employees
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Status
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Actions
          </span>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `1fr 120px${extraColumns.map(() => ' 140px').join('')} 100px 80px 80px`,
                  padding: '12px 20px',
                  borderBottom: '1px solid #f5f6f7',
                  alignItems: 'center',
                }}
              >
                <div style={{ height: '14px', width: '60%', borderRadius: '4px', background: '#f0f1f3' }} />
                <div style={{ height: '14px', width: '50%', borderRadius: '4px', background: '#f0f1f3' }} />
                {extraColumns.map((col) => (
                  <div key={col.header} style={{ height: '14px', width: '60%', borderRadius: '4px', background: '#f0f1f3' }} />
                ))}
                <div style={{ height: '14px', width: '40%', borderRadius: '4px', background: '#f0f1f3' }} />
                <div style={{ height: '20px', width: '56px', borderRadius: '10px', background: '#f0f1f3' }} />
                <div style={{ height: '14px', width: '60px', borderRadius: '4px', background: '#f0f1f3' }} />
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#8a929b',
              fontSize: '13px',
            }}
          >
            No {title.toLowerCase()} yet. Click "+ Add {singularTitle}" to create one.
          </div>
        )}

        {/* Rows */}
        {!isLoading &&
          items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: `1fr 120px${extraColumns.map(() => ' 140px').join('')} 100px 80px 80px`,
                padding: '12px 20px',
                borderBottom: idx < items.length - 1 ? '1px solid #f5f6f7' : 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>
                  {item.name}
                </span>
                {item.description && (
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#8a929b',
                      margin: '2px 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '280px',
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: '#6b7480',
                  fontFamily: 'monospace',
                }}
              >
                {item.code}
              </span>
              {extraColumns.map((col) => (
                <div key={col.header}>{col.render(item)}</div>
              ))}
              <span style={{ fontSize: '13px', color: '#6b7480' }}>
                {item.employeeCount ?? 0}
              </span>
              <div>
                <Badge
                  variant={item.status === 'ACTIVE' ? 'active' : 'default'}
                >
                  {item.status === 'ACTIVE' ? 'Active' : item.status}
                </Badge>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEdit(item)}
                  style={{
                    fontSize: '12px',
                    color: '#2b5fa8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 500,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteItem(item)}
                  style={{
                    fontSize: '12px',
                    color: '#b3261e',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 500,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ─── Add / Edit Modal ───────────────────────────────────── */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingItem ? `Edit ${singularTitle}` : `Add ${singularTitle}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : editingItem ? 'Save Changes' : `Add ${singularTitle}`}
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {fields.map((field) =>
            field.type === 'select' && field.options ? (
              <Select
                key={field.key}
                label={field.required === true ? `${field.label} *` : field.label}
                options={field.options}
                placeholder={`Select ${field.label}`}
                value={formValues[field.key] ?? ''}
                onChange={(e) => {
                  setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                  if (formErrors[field.key]) {
                    setFormErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                  }
                }}
                error={formErrors[field.key]}
              />
            ) : (
              <Input
                key={field.key}
                label={field.required === true ? `${field.label} *` : field.label}
                value={formValues[field.key] ?? ''}
                onChange={(e) => {
                  setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                  if (formErrors[field.key]) {
                    setFormErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                  }
                }}
                maxLength={field.maxLength}
                error={formErrors[field.key]}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ),
          )}
        </form>
      </Modal>

      {/* ─── Delete Confirm Modal ───────────────────────────────── */}
      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title={`Delete ${singularTitle}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteItem(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '13px', color: '#3d4349', margin: 0 }}>
          Are you sure you want to delete{' '}
          <strong>{deleteItem?.name}</strong>? This cannot be undone if employees
          are assigned.
        </p>
      </Modal>
    </>
  );
}
