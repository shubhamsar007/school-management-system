'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTeachers } from '@/lib/hooks/use-teachers';
import { useLeaveTypes, useCreateLeaveRequest } from '@/lib/hooks/use-attendance';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveRequestModalProps {
  open: boolean;
  onClose: () => void;
  employeeId?: string;
}

interface FormState {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: string;
  reason: string;
}

const EMPTY: FormState = {
  employeeId: '',
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  totalDays: '1',
  reason: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeaveRequestModal({ open, onClose, employeeId: propEmployeeId }: LeaveRequestModalProps) {
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>({
    ...EMPTY,
    employeeId: propEmployeeId ?? '',
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const { data: employeesRes } = useTeachers({ limit: 200 });
  const employees = employeesRes?.data ?? [];
  const { data: leaveTypes = [] } = useLeaveTypes();
  const create = useCreateLeaveRequest();

  React.useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, employeeId: propEmployeeId ?? '' });
      setErrors({});
    }
  }, [open, propEmployeeId]);

  // Auto-compute total days from dates
  React.useEffect(() => {
    if (form.startDate && form.endDate) {
      setForm((prev) => ({
        ...prev,
        totalDays: String(daysBetween(form.startDate, form.endDate)),
      }));
    }
  }, [form.startDate, form.endDate]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.employeeId) errs.employeeId = 'Required';
    if (!form.leaveTypeId) errs.leaveTypeId = 'Required';
    if (!form.startDate) errs.startDate = 'Required';
    if (!form.endDate) errs.endDate = 'Required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      errs.endDate = 'End date must be on or after start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    create.mutate(
      {
        employeeId: form.employeeId,
        dto: {
          leaveTypeId: form.leaveTypeId,
          startDate: form.startDate,
          endDate: form.endDate,
          totalDays: Number(form.totalDays) || 1,
          ...(form.reason ? { reason: form.reason } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success('Leave request submitted');
          onClose();
        },
        onError: () => {
          toast.error('Failed to submit leave request. Please try again.');
        },
      },
    );
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    border: '1px solid #d7dce1',
    borderRadius: 6,
    padding: '0 10px',
    fontSize: '13px',
    color: '#14181c',
    background: '#fff',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7480',
    display: 'block',
    marginBottom: 4,
    fontWeight: 500,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#b3261e',
    marginTop: 3,
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Leave Request"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Submitting…' : 'Submit Request'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Employee selector (hidden if pre-filled) */}
        {!propEmployeeId && (
          <div>
            <label style={labelStyle}>Employee *</label>
            <select
              value={form.employeeId}
              onChange={(e) => set('employeeId', e.target.value)}
              style={{
                ...fieldStyle,
                borderColor: errors.employeeId ? '#b3261e' : '#d7dce1',
              }}
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.person.firstName} {emp.person.lastName}
                  {emp.employeeNumber ? ` (${emp.employeeNumber})` : ''}
                </option>
              ))}
            </select>
            {errors.employeeId && <div style={errorStyle}>{errors.employeeId}</div>}
          </div>
        )}

        {/* Leave Type */}
        <div>
          <label style={labelStyle}>Leave Type *</label>
          <select
            value={form.leaveTypeId}
            onChange={(e) => set('leaveTypeId', e.target.value)}
            style={{
              ...fieldStyle,
              borderColor: errors.leaveTypeId ? '#b3261e' : '#d7dce1',
            }}
          >
            <option value="">Select leave type…</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name} ({lt.code})
              </option>
            ))}
          </select>
          {errors.leaveTypeId && <div style={errorStyle}>{errors.leaveTypeId}</div>}
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Start Date *</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              style={{
                ...fieldStyle,
                borderColor: errors.startDate ? '#b3261e' : '#d7dce1',
              }}
            />
            {errors.startDate && <div style={errorStyle}>{errors.startDate}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>End Date *</label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => set('endDate', e.target.value)}
              style={{
                ...fieldStyle,
                borderColor: errors.endDate ? '#b3261e' : '#d7dce1',
              }}
            />
            {errors.endDate && <div style={errorStyle}>{errors.endDate}</div>}
          </div>
        </div>

        {/* Total Days */}
        <div>
          <label style={labelStyle}>Total Days</label>
          <input
            type="number"
            min={1}
            value={form.totalDays}
            onChange={(e) => set('totalDays', e.target.value)}
            style={fieldStyle}
          />
        </div>

        {/* Reason */}
        <div>
          <label style={labelStyle}>Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
            placeholder="Reason for leave (optional)…"
            rows={3}
            style={{
              ...fieldStyle,
              height: 'auto',
              padding: '8px 10px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
