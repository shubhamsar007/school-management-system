'use client';

import * as React from 'react';
import { type Employee } from '@/lib/hooks/use-teachers';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';

function formatDate(iso: string | undefined | null) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: '14px', color: value ? '#14181c' : '#c4c9cf' }}>
        {value ?? 'Not provided'}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </Card>
  );
}

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':      return 'active';
    case 'CONFIRMED':   return 'active';
    case 'PROBATION':
    case 'ONBOARDING':
    case 'ON_LEAVE':    return 'pending';
    case 'EXITED':
    case 'ARCHIVED':    return 'left';
    default:            return 'default';
  }
}

const EMP_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time',
  CONTRACT: 'Contract', VISITING: 'Visiting',
};

export function EmploymentTab({ employee }: { employee: Employee }) {
  const statusLabel = employee.employmentStatus.charAt(0) + employee.employmentStatus.slice(1).toLowerCase().replace('_', ' ');
  const empTypeLabel = employee.employmentType ? (EMP_TYPE_LABEL[employee.employmentType] ?? employee.employmentType) : undefined;

  return (
    <div className="space-y-5">
      {/* Status & identity */}
      <Section title="Employment Status">
        <Field label="Employee Number" value={employee.employeeNumber} />
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 8 }}>
            Status
          </p>
          <Badge variant={statusVariant(employee.employmentStatus)}>{statusLabel}</Badge>
        </div>
        <Field label="Employment Type" value={empTypeLabel} />
        <Field label="Work Location"   value={employee.workLocation} />
      </Section>

      {/* Organisation */}
      <Section title="Organisation">
        <Field label="Department"       value={employee.department?.name} />
        <Field label="Designation"      value={employee.designation?.name} />
        <Field label="Employee Type"    value={employee.employeeType?.name} />
        <Field label="Campus"           value={employee.campus?.name} />
        <Field label="Reporting Manager" value={employee.reportingManager?.name} />
      </Section>

      {/* Key dates */}
      <Section title="Key Dates">
        <Field label="Joining Date"       value={formatDate(employee.joiningDate)} />
        <Field label="Probation Start"    value={formatDate(employee.probationStart)} />
        <Field label="Probation End"      value={formatDate(employee.probationEnd)} />
        <Field label="Confirmation Date"  value={formatDate(employee.confirmationDate)} />
        <Field label="Contract Start"     value={formatDate(employee.contractStart)} />
        <Field label="Contract End"       value={formatDate(employee.contractEnd)} />
        {employee.leavingDate && (
          <Field label="Leaving Date"   value={formatDate(employee.leavingDate)} />
        )}
        {employee.noticePeriodDays != null && (
          <Field label="Notice Period"  value={`${employee.noticePeriodDays} days`} />
        )}
      </Section>

      {/* Exit info — only shown if employee has left */}
      {(employee.employmentStatus === 'EXITED' || employee.employmentStatus === 'EXIT_INITIATED') && (
        <Section title="Exit Details">
          <Field label="Leaving Date"   value={formatDate(employee.leavingDate)} />
          <Field label="Leaving Reason" value={employee.leavingReason} />
        </Section>
      )}
    </div>
  );
}
