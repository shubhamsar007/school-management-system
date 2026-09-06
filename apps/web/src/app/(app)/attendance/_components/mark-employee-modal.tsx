'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTeachers } from '@/lib/hooks/use-teachers';
import { useMarkEmployeeAttendance } from '@/lib/hooks/use-attendance';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Present', value: 'PRESENT' },
  { label: 'Absent', value: 'ABSENT' },
  { label: 'Late', value: 'LATE' },
  { label: 'Half Day', value: 'HALF_DAY' },
  { label: 'On Leave', value: 'ON_LEAVE' },
  { label: 'Holiday', value: 'HOLIDAY' },
  { label: 'Work From Home', value: 'WORK_FROM_HOME' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarkEmployeeAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  campusId: string;
  date: string;
}

interface FormState {
  employeeId: string;
  status: string;
  checkInTime: string;
  checkOutTime: string;
  remarks: string;
}

const EMPTY: FormState = {
  employeeId: '',
  status: 'PRESENT',
  checkInTime: '',
  checkOutTime: '',
  remarks: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MarkEmployeeAttendanceModal({
  open,
  onClose,
  campusId,
  date,
}: MarkEmployeeAttendanceModalProps) {
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<FormState>>({});

  const { data: employeesRes } = useTeachers({ limit: 200 });
  const employees = employeesRes?.data ?? [];
  const mark = useMarkEmployeeAttendance();

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
    }
  }, [open]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (!form.employeeId) errs.employeeId = 'Required';
    if (!form.status) errs.status = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    mark.mutate(
      {
        employeeId: form.employeeId,
        campusId,
        date,
        status: form.status,
        ...(form.checkInTime ? { checkInTime: form.checkInTime } : {}),
        ...(form.checkOutTime ? { checkOutTime: form.checkOutTime } : {}),
        ...(form.remarks ? { remarks: form.remarks } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Employee attendance marked');
          onClose();
        },
        onError: () => {
          toast.error('Failed to mark attendance. Please try again.');
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
      title="Mark Employee Attendance"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={mark.isPending}>
            {mark.isPending ? 'Saving…' : 'Mark Attendance'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Employee */}
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

        {/* Date */}
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            readOnly
            style={{ ...fieldStyle, background: '#f8f9fa', color: '#6b7480' }}
          />
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status *</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            style={{
              ...fieldStyle,
              borderColor: errors.status ? '#b3261e' : '#d7dce1',
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Times */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Check-in Time</label>
            <input
              type="time"
              value={form.checkInTime}
              onChange={(e) => set('checkInTime', e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Check-out Time</label>
            <input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => set('checkOutTime', e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label style={labelStyle}>Remarks</label>
          <textarea
            value={form.remarks}
            onChange={(e) => set('remarks', e.target.value)}
            placeholder="Optional notes…"
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
