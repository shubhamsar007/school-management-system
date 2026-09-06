'use client';

import * as React from 'react';
import { Badge, DataTable } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
  useAllocateLeaveBalances,
  type LeaveType,
} from '@/lib/hooks/use-attendance';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeaveSetupTabProps {
  academicYearId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APPLICABLE_VARIANT: Record<string, { bg: string; color: string }> = {
  EMPLOYEE: { bg: '#dbeafe', color: '#1d4ed8' },
  STUDENT: { bg: '#ede9fe', color: '#6d28d9' },
  ALL: { bg: '#f0f1f3', color: '#4b5563' },
};

const STATUS_VARIANT: Record<string, 'active' | 'default'> = {
  ACTIVE: 'active',
  INACTIVE: 'default',
};

// ─── Create Leave Type Modal ──────────────────────────────────────────────────

interface CreateLeaveTypeModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateLeaveTypeModal({ open, onClose }: CreateLeaveTypeModalProps) {
  const toast = useToast();
  const create = useCreateLeaveType();

  const [form, setForm] = React.useState({
    name: '',
    code: '',
    applicableTo: 'EMPLOYEE',
    annualLimit: '',
    isPaid: true,
    carryForward: false,
  });

  React.useEffect(() => {
    if (open) {
      setForm({ name: '', code: '', applicableTo: 'EMPLOYEE', annualLimit: '', isPaid: true, carryForward: false });
    }
  }, [open]);

  function handleSubmit() {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and Code are required');
      return;
    }
    try {
      create.mutate(
        {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          applicableTo: form.applicableTo,
          ...(form.annualLimit !== '' ? { annualLimit: Number(form.annualLimit) } : {}),
          isPaid: form.isPaid,
          carryForward: form.carryForward,
        },
        {
          onSuccess: () => {
            toast.success('Leave type created');
            onClose();
          },
          onError: () => {
            toast.error('Failed to create leave type');
          },
        },
      );
    } catch {
      toast.error('Failed to create leave type');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    border: '1px solid #d7dce1',
    borderRadius: 6,
    padding: '0 10px',
    fontSize: '13px',
    color: '#14181c',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7480',
    fontWeight: 500,
    display: 'block',
    marginBottom: 4,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Leave Type"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Casual Leave"
          />
        </div>
        <div>
          <label style={labelStyle}>Code *</label>
          <input
            style={inputStyle}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. CL"
          />
        </div>
        <div>
          <label style={labelStyle}>Applicable To</label>
          <select
            style={inputStyle}
            value={form.applicableTo}
            onChange={(e) => setForm((f) => ({ ...f, applicableTo: e.target.value }))}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="STUDENT">Student</option>
            <option value="ALL">All</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Annual Limit (days, leave blank for unlimited)</label>
          <input
            style={inputStyle}
            type="number"
            min={0}
            value={form.annualLimit}
            onChange={(e) => setForm((f) => ({ ...f, annualLimit: e.target.value }))}
            placeholder="e.g. 12"
          />
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#14181c', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isPaid}
              onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.checked }))}
            />
            Paid Leave
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#14181c', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.carryForward}
              onChange={(e) => setForm((f) => ({ ...f, carryForward: e.target.checked }))}
            />
            Carry Forward
          </label>
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit Leave Type Modal ────────────────────────────────────────────────────

interface EditLeaveTypeModalProps {
  open: boolean;
  leaveType: LeaveType | null;
  onClose: () => void;
}

function EditLeaveTypeModal({ open, leaveType, onClose }: EditLeaveTypeModalProps) {
  const toast = useToast();
  const update = useUpdateLeaveType();

  const [form, setForm] = React.useState({
    name: '',
    code: '',
    applicableTo: 'EMPLOYEE',
    annualLimit: '',
    isPaid: true,
    carryForward: false,
    status: 'ACTIVE',
  });

  React.useEffect(() => {
    if (open && leaveType) {
      setForm({
        name: leaveType.name,
        code: leaveType.code,
        applicableTo: leaveType.applicableTo,
        annualLimit: leaveType.annualLimit != null ? String(leaveType.annualLimit) : '',
        isPaid: leaveType.isPaid,
        carryForward: leaveType.carryForward,
        status: leaveType.status,
      });
    }
  }, [open, leaveType]);

  function handleSubmit() {
    if (!leaveType) return;
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and Code are required');
      return;
    }
    try {
      update.mutate(
        {
          id: leaveType.id,
          dto: {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            applicableTo: form.applicableTo,
            annualLimit: form.annualLimit !== '' ? Number(form.annualLimit) : null,
            isPaid: form.isPaid,
            carryForward: form.carryForward,
            status: form.status,
          },
        },
        {
          onSuccess: () => {
            toast.success('Leave type updated');
            onClose();
          },
          onError: () => {
            toast.error('Failed to update leave type');
          },
        },
      );
    } catch {
      toast.error('Failed to update leave type');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    border: '1px solid #d7dce1',
    borderRadius: 6,
    padding: '0 10px',
    fontSize: '13px',
    color: '#14181c',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7480',
    fontWeight: 500,
    display: 'block',
    marginBottom: 4,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Leave Type"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Code *</label>
          <input style={inputStyle} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Applicable To</label>
          <select style={inputStyle} value={form.applicableTo} onChange={(e) => setForm((f) => ({ ...f, applicableTo: e.target.value }))}>
            <option value="EMPLOYEE">Employee</option>
            <option value="STUDENT">Student</option>
            <option value="ALL">All</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Annual Limit (days, leave blank for unlimited)</label>
          <input
            style={inputStyle}
            type="number"
            min={0}
            value={form.annualLimit}
            onChange={(e) => setForm((f) => ({ ...f, annualLimit: e.target.value }))}
          />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#14181c', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isPaid} onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.checked }))} />
            Paid Leave
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#14181c', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.carryForward} onChange={(e) => setForm((f) => ({ ...f, carryForward: e.target.checked }))} />
            Carry Forward
          </label>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Leave Type Confirm Modal ──────────────────────────────────────────

interface DeleteLeaveTypeModalProps {
  open: boolean;
  leaveType: LeaveType | null;
  onClose: () => void;
}

function DeleteLeaveTypeModal({ open, leaveType, onClose }: DeleteLeaveTypeModalProps) {
  const toast = useToast();
  const deleteType = useDeleteLeaveType();

  function handleDelete() {
    if (!leaveType) return;
    try {
      deleteType.mutate(leaveType.id, {
        onSuccess: () => {
          toast.success('Leave type deleted');
          onClose();
        },
        onError: () => {
          toast.error('Failed to delete leave type. It may have existing requests.');
        },
      });
    } catch {
      toast.error('Failed to delete leave type');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Leave Type"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleDelete}
            disabled={deleteType.isPending}
            style={{ background: '#b3261e', borderColor: '#b3261e' }}
          >
            {deleteType.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      <p style={{ fontSize: '13px', color: '#14181c', margin: 0 }}>
        Are you sure you want to delete <strong>{leaveType?.name}</strong>? This action cannot be undone.
        Leave types with existing requests cannot be deleted.
      </p>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeaveSetupTab({ academicYearId }: LeaveSetupTabProps) {
  const toast = useToast();
  const { data: leaveTypes = [], isLoading } = useLeaveTypes();
  const allocate = useAllocateLeaveBalances();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<LeaveType | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<LeaveType | null>(null);
  const [allocatingId, setAllocatingId] = React.useState<string | null>(null);

  function handleAllocate(leaveTypeId?: string) {
    setAllocatingId(leaveTypeId ?? '__all__');
    try {
      allocate.mutate(
        {
          academicYearId,
          ...(leaveTypeId !== undefined ? { leaveTypeId } : {}),
        },
        {
          onSuccess: (data) => {
            toast.success(`Allocated balances for ${(data as { count: number }).count} employee/type pair(s)`);
            setAllocatingId(null);
          },
          onError: () => {
            toast.error('Failed to allocate leave balances');
            setAllocatingId(null);
          },
        },
      );
    } catch {
      toast.error('Failed to allocate leave balances');
      setAllocatingId(null);
    }
  }

  const columns: ColumnDef<LeaveType>[] = [
    {
      id: 'name',
      header: 'NAME',
      width: 'minmax(140px,1.5fr)',
      cell: (r) => <span style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>{r.name}</span>,
    },
    {
      id: 'code',
      header: 'CODE',
      width: '80px',
      cell: (r) => (
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            background: '#f0f1f3',
            color: '#4b5563',
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {r.code}
        </span>
      ),
    },
    {
      id: 'applicableTo',
      header: 'APPLICABLE TO',
      width: '130px',
      cell: (r) => {
        const v = APPLICABLE_VARIANT[r.applicableTo] ?? { bg: '#f1f5f9', color: '#475569' };
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: v.bg,
              color: v.color,
              padding: '2px 8px',
              borderRadius: 20,
            }}
          >
            {r.applicableTo}
          </span>
        );
      },
    },
    {
      id: 'annualLimit',
      header: 'ANNUAL LIMIT',
      width: '110px',
      align: 'center',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>
          {r.annualLimit != null ? `${r.annualLimit} days` : '—'}
        </span>
      ),
    },
    {
      id: 'isPaid',
      header: 'TYPE',
      width: '90px',
      cell: (r) => (
        <Badge variant={r.isPaid ? 'active' : 'left'}>{r.isPaid ? 'Paid' : 'Unpaid'}</Badge>
      ),
    },
    {
      id: 'carryForward',
      header: 'CARRY FWD',
      width: '90px',
      align: 'center',
      cell: (r) => (
        <span style={{ fontSize: '13px', color: r.carryForward ? '#146b41' : '#8a929b' }}>
          {r.carryForward ? '✓' : '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '90px',
      cell: (r) => (
        <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>
          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '110px',
      align: 'right',
      cell: (r) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            onClick={() => setEditTarget(r)}
            style={{ fontSize: '12px', fontWeight: 500, color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Edit
          </button>
          <span style={{ color: '#d7dce1' }}>|</span>
          <button
            onClick={() => setDeleteTarget(r)}
            style={{ fontSize: '12px', fontWeight: 500, color: '#b3261e', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Section 1: Leave Types ────────────────────────────── */}
        <div
          style={{
            borderRadius: 10,
            border: '1px solid #e6e8eb',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid #f0f1f3',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>Leave Types</div>
              <div style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>
                Configure available leave types for your organization
              </div>
            </div>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              + Add Leave Type
            </Button>
          </div>

          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              Loading leave types…
            </div>
          ) : leaveTypes.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              No leave types configured yet.
              <br />
              <button
                onClick={() => setCreateOpen(true)}
                style={{ marginTop: 10, fontSize: '12px', color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Add your first leave type
              </button>
            </div>
          ) : (
            <DataTable columns={columns} data={leaveTypes} />
          )}
        </div>

        {/* ── Section 2: Leave Allocation ───────────────────────── */}
        <div
          style={{
            borderRadius: 10,
            border: '1px solid #e6e8eb',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid #f0f1f3',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>Annual Leave Allocation</div>
              <div style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>
                Allocate annual leave balances for all active employees for the selected academic year.
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => handleAllocate(undefined)}
              disabled={allocate.isPending || !academicYearId || leaveTypes.length === 0}
            >
              {allocatingId === '__all__' && allocate.isPending ? 'Allocating…' : 'Allocate All'}
            </Button>
          </div>

          {leaveTypes.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              Add leave types above before allocating balances.
            </div>
          ) : (
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {leaveTypes.map((lt) => (
                <div
                  key={lt.id}
                  style={{
                    border: '1px solid #e6e8eb',
                    borderRadius: 8,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>{lt.name}</div>
                      <div style={{ fontSize: '11px', color: '#8a929b', marginTop: 2 }}>
                        {lt.annualLimit != null ? `${lt.annualLimit} days / year` : 'Unlimited'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        background: '#f0f1f3',
                        color: '#4b5563',
                        padding: '2px 6px',
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      {lt.code}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleAllocate(lt.id)}
                    disabled={allocate.isPending || !academicYearId}
                  >
                    {allocatingId === lt.id && allocate.isPending ? 'Allocating…' : 'Allocate'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateLeaveTypeModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditLeaveTypeModal open={!!editTarget} leaveType={editTarget} onClose={() => setEditTarget(null)} />
      <DeleteLeaveTypeModal open={!!deleteTarget} leaveType={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
