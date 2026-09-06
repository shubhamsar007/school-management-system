'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import {
  useStudentHealthAlerts,
  useStaffHealthAlerts,
  type StudentHealthAlert,
  type StaffHealthAlert,
} from '@/lib/hooks/use-attendance';

// ─── Props ────────────────────────────────────────────────────────────────────

interface HealthAlertsPanelProps {
  campusId: string;
  academicYearId: string;
  date: string;
  onTabChange: (tab: string) => void;
  pendingLeaveRequests?: number;
}

// ─── Alert Modal ──────────────────────────────────────────────────────────────

type AlertModalState =
  | { type: 'studentBelowThreshold'; data: StudentHealthAlert[] }
  | { type: 'studentConsecutiveAbsent'; data: StudentHealthAlert[] }
  | { type: 'studentFrequentLate'; data: StudentHealthAlert[] }
  | { type: 'staffMissingCheckout'; data: StaffHealthAlert[] }
  | { type: 'staffConsecutiveAbsent'; data: StaffHealthAlert[] }
  | { type: 'staffBelowHours'; data: StaffHealthAlert[] }
  | null;

function alertModalTitle(state: AlertModalState): string {
  if (!state) return '';
  switch (state.type) {
    case 'studentBelowThreshold': return 'Students Below 75% Attendance';
    case 'studentConsecutiveAbsent': return 'Students with 3+ Consecutive Absences';
    case 'studentFrequentLate': return 'Students with 5+ Late Arrivals This Month';
    case 'staffMissingCheckout': return 'Staff Missing Checkout';
    case 'staffConsecutiveAbsent': return 'Staff with 3+ Consecutive Absences';
    case 'staffBelowHours': return 'Staff Below 7.5 Working Hours Today';
  }
}

function StudentAlertList({ data }: { data: StudentHealthAlert[] }) {
  if (data.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((s) => (
        <div
          key={s.studentId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#fafbfc',
            borderRadius: 6,
            border: '1px solid #eef0f2',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>{s.studentName}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {s.rate !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#991b1b',
                  background: '#fee2e2',
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                {s.rate}%
              </span>
            )}
            {s.count !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#92400e',
                  background: '#fef3c7',
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                {s.count}x
              </span>
            )}
            {s.lastDate && (
              <span style={{ fontSize: '11px', color: '#8a929b' }}>Last: {s.lastDate}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffAlertList({ data }: { data: StaffHealthAlert[] }) {
  if (data.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((s) => (
        <div
          key={s.employeeId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#fafbfc',
            borderRadius: 6,
            border: '1px solid #eef0f2',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>{s.employeeName}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {s.workHours !== undefined && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#92400e',
                  background: '#fef3c7',
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                {s.workHours}h
              </span>
            )}
            {s.date && (
              <span style={{ fontSize: '11px', color: '#8a929b' }}>Last: {s.date}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

interface AlertRowProps {
  dot: string;
  dotColor: string;
  label: string;
  count: number;
  onClick: () => void;
}

function AlertRow({ dot, dotColor, label, count, onClick }: AlertRowProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        borderRadius: 6,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ fontSize: '16px', color: dotColor }}>{dot}</span>
      <span style={{ fontSize: '13px', color: '#14181c', flex: 1 }}>
        <strong>{count}</strong> {label}
      </span>
      <span style={{ fontSize: '11px', color: '#2b5fa8', fontWeight: 500 }}>View</span>
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HealthAlertsPanel({
  campusId,
  academicYearId,
  date,
  onTabChange,
  pendingLeaveRequests = 0,
}: HealthAlertsPanelProps) {
  const { data: studentAlerts } = useStudentHealthAlerts(
    campusId || undefined,
    academicYearId || undefined,
  );
  const { data: staffAlerts } = useStaffHealthAlerts(campusId || undefined, date);

  const [alertModal, setAlertModal] = React.useState<AlertModalState>(null);

  const belowThreshold = studentAlerts?.belowThreshold ?? [];
  const stuConsAbsent = studentAlerts?.consecutiveAbsent ?? [];
  const frequentLate = studentAlerts?.frequentLate ?? [];
  const missingCheckout = staffAlerts?.missingCheckout ?? [];
  const staffConsAbsent = staffAlerts?.consecutiveAbsent ?? [];
  const belowHours = staffAlerts?.belowHours ?? [];

  const totalCount =
    belowThreshold.length +
    stuConsAbsent.length +
    frequentLate.length +
    missingCheckout.length +
    staffConsAbsent.length +
    belowHours.length +
    pendingLeaveRequests;

  if (totalCount === 0) {
    return (
      <div
        style={{
          marginBottom: 16,
          padding: '12px 16px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '14px', color: '#166534' }}>&#10003;</span>
        <span style={{ fontSize: '13px', color: '#166534', fontWeight: 500 }}>
          All attendance metrics look good
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          background: '#fffbf0',
          border: '1px solid #f5c842',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid #f5e09a',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#7a5c00' }}>Requires Attention</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              background: '#f5c842',
              color: '#7a5c00',
              padding: '1px 7px',
              borderRadius: 20,
            }}
          >
            {totalCount}
          </span>
        </div>

        <div style={{ padding: '6px 0' }}>
          {belowThreshold.length > 0 && (
            <AlertRow
              dot="&#x25CF;"
              dotColor="#dc2626"
              label="students below 75% attendance threshold"
              count={belowThreshold.length}
              onClick={() => setAlertModal({ type: 'studentBelowThreshold', data: belowThreshold })}
            />
          )}
          {stuConsAbsent.length > 0 && (
            <AlertRow
              dot="&#x25CF;"
              dotColor="#ea580c"
              label="students absent 3+ consecutive days"
              count={stuConsAbsent.length}
              onClick={() => setAlertModal({ type: 'studentConsecutiveAbsent', data: stuConsAbsent })}
            />
          )}
          {frequentLate.length > 0 && (
            <AlertRow
              dot="&#x25CF;"
              dotColor="#ca8a04"
              label="students with 5+ late arrivals this month"
              count={frequentLate.length}
              onClick={() => setAlertModal({ type: 'studentFrequentLate', data: frequentLate })}
            />
          )}
          {missingCheckout.length > 0 && (
            <AlertRow
              dot="&#x26A0;"
              dotColor="#dc2626"
              label="staff members missing checkout"
              count={missingCheckout.length}
              onClick={() => setAlertModal({ type: 'staffMissingCheckout', data: missingCheckout })}
            />
          )}
          {staffConsAbsent.length > 0 && (
            <AlertRow
              dot="&#x26A0;"
              dotColor="#ea580c"
              label="staff absent 3+ consecutive days"
              count={staffConsAbsent.length}
              onClick={() => setAlertModal({ type: 'staffConsecutiveAbsent', data: staffConsAbsent })}
            />
          )}
          {belowHours.length > 0 && (
            <AlertRow
              dot="&#x25A1;"
              dotColor="#6b7480"
              label="staff below 7.5 working hours today"
              count={belowHours.length}
              onClick={() => setAlertModal({ type: 'staffBelowHours', data: belowHours })}
            />
          )}
          {pendingLeaveRequests > 0 && (
            <AlertRow
              dot="&#x26A0;"
              dotColor="#ca8a04"
              label="leave requests pending approval"
              count={pendingLeaveRequests}
              onClick={() => onTabChange('leave')}
            />
          )}
        </div>
      </div>

      {/* Alert detail modal */}
      <Modal
        open={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModalTitle(alertModal)}
        size="md"
      >
        {alertModal && (
          <>
            {(alertModal.type === 'studentBelowThreshold' ||
              alertModal.type === 'studentConsecutiveAbsent' ||
              alertModal.type === 'studentFrequentLate') && (
              <StudentAlertList data={alertModal.data as StudentHealthAlert[]} />
            )}
            {(alertModal.type === 'staffMissingCheckout' ||
              alertModal.type === 'staffConsecutiveAbsent' ||
              alertModal.type === 'staffBelowHours') && (
              <StaffAlertList data={alertModal.data as StaffHealthAlert[]} />
            )}
          </>
        )}
      </Modal>
    </>
  );
}
