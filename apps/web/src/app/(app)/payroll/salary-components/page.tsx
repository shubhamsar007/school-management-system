'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Spinner, DataTable, Tabs, EmptyState, Pagination } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  payrollApi,
  type SalaryComponent,
  type CreateSalaryComponentData,
} from '@/lib/payroll-api';
import { Plus, Puzzle } from 'lucide-react';

const TYPE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'EARNING', label: 'Earnings' },
  { id: 'DEDUCTION', label: 'Deductions' },
];

const CALC_LABEL: Record<SalaryComponent['calculationType'], string> = {
  FIXED: 'Fixed',
  PERCENTAGE_OF_BASIC: '% of Basic',
  PERCENTAGE_OF_GROSS: '% of Gross',
};

const EMPTY_FORM: CreateSalaryComponentData = {
  name: '',
  code: '',
  componentType: 'EARNING',
  calculationType: 'FIXED',
  isTaxable: false,
  status: 'ACTIVE',
};

export default function SalaryComponentsPage() {
  const [components, setComponents] = React.useState<SalaryComponent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CreateSalaryComponentData>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  async function load() {
    try {
      const data = await payrollApi.salaryComponents.list();
      setComponents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load salary components');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setFormError('Name and code are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await payrollApi.salaryComponents.update(editingId, form);
      } else {
        await payrollApi.salaryComponents.create(form);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save component');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await payrollApi.salaryComponents.delete(id);
      await load();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete component');
    }
  }

  function startEdit(comp: SalaryComponent) {
    setEditingId(comp.id);
    setForm({
      name: comp.name,
      code: comp.code,
      componentType: comp.componentType,
      calculationType: comp.calculationType,
      isTaxable: comp.isTaxable,
      status: comp.status,
    });
    setFormError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  const filtered =
    activeTab === 'all'
      ? components
      : components.filter((c) => c.componentType === activeTab);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnDef<SalaryComponent>[] = [
    {
      id: 'name',
      header: 'Component Name',
      sortable: true,
      cell: (row) => <span style={{ fontSize: 13, fontWeight: 500, color: '#14181c' }}>{row.name}</span>,
    },
    {
      id: 'code',
      header: 'Code',
      width: '90px',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7480' }}>{row.code}</span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      width: '110px',
      cell: (row) => (
        <Badge variant={row.componentType === 'EARNING' ? 'active' : 'left'}>
          {row.componentType === 'EARNING' ? 'Earning' : 'Deduction'}
        </Badge>
      ),
    },
    {
      id: 'calculation',
      header: 'Calculation',
      width: '130px',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#6b7480' }}>{CALC_LABEL[row.calculationType]}</span>
      ),
    },
    {
      id: 'taxable',
      header: 'Taxable',
      width: '90px',
      align: 'center',
      cell: (row) => (
        <Badge variant={row.isTaxable ? 'default' : 'graduated'}>
          {row.isTaxable ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '90px',
      cell: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'active' : 'default'}>
          {row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '120px',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            style={{ fontSize: 12, color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => startEdit(row)}
          >
            Edit
          </button>
          <span style={{ color: '#d7dce1' }}>|</span>
          <button
            style={{ fontSize: 12, color: '#b3261e', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Salary Components"
        subtitle="Configure earnings and deductions"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              cancelForm();
              setShowForm(true);
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} />
            Add Component
          </Button>
        }
      />

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 8,
            color: '#b3261e',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {deleteError && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 8,
            color: '#b3261e',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {deleteError}
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <div
          style={{
            padding: '20px 24px',
            marginBottom: 16,
            background: '#fff',
            border: '1px solid #e6e8eb',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2c322f', marginBottom: 16 }}>
            {editingId ? 'Edit Salary Component' : 'New Salary Component'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', display: 'block', marginBottom: 6 }}>
                  NAME
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. House Rent Allowance"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#14181c',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', display: 'block', marginBottom: 6 }}>
                  CODE
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. HRA"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    color: '#14181c',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', display: 'block', marginBottom: 6 }}>
                  TYPE
                </label>
                <select
                  value={form.componentType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, componentType: e.target.value as SalaryComponent['componentType'] }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#14181c',
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', display: 'block', marginBottom: 6 }}>
                  CALCULATION TYPE
                </label>
                <select
                  value={form.calculationType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, calculationType: e.target.value as SalaryComponent['calculationType'] }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#14181c',
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="FIXED">Fixed</option>
                  <option value="PERCENTAGE_OF_BASIC">% of Basic</option>
                  <option value="PERCENTAGE_OF_GROSS">% of Gross</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', display: 'block', marginBottom: 6 }}>
                  STATUS
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as SalaryComponent['status'] }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#14181c',
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input
                  type="checkbox"
                  id="isTaxable"
                  checked={form.isTaxable ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, isTaxable: e.target.checked }))}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
                <label htmlFor="isTaxable" style={{ fontSize: 13, color: '#14181c', cursor: 'pointer' }}>
                  Taxable
                </label>
              </div>
            </div>
            {formError && (
              <div style={{ fontSize: 12, color: '#b3261e', marginBottom: 12 }}>{formError}</div>
            )}
            <div className="flex gap-2">
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Component' : 'Create Component'}
              </Button>
              <Button variant="secondary" type="button" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <Tabs
        tabs={TYPE_TABS}
        activeTab={activeTab}
        onChange={(id) => { setActiveTab(id); setPage(1); }}
        className="mb-4"
      />

      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Puzzle size={28} style={{ color: '#8a929b' }} />}
            title="No salary components"
            description={
              activeTab === 'all'
                ? 'Add your first salary component to get started.'
                : `No ${activeTab === 'EARNING' ? 'earnings' : 'deductions'} configured yet.`
            }
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus size={14} style={{ marginRight: 6 }} />
                Add Component
              </Button>
            }
          />
        ) : (
          <>
            <DataTable<SalaryComponent> columns={columns} data={paged} />
            {filtered.length > pageSize && (
              <div className="border-t border-[#eef0f2] p-3">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={filtered.length}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
