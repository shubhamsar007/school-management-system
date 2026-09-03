'use client';

import * as React from 'react';
import {
  CalendarDays, Clock, Wallet, ClipboardList, ArrowRight,
  Phone, Mail, Building2, UserCheck,
} from 'lucide-react';
import { type Employee } from '@/lib/hooks/use-teachers';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':      return 'active';
    case 'PROBATION':
    case 'ONBOARDING':
    case 'ON_LEAVE':    return 'pending';
    case 'EXITED':
    case 'ARCHIVED':    return 'left';
    default:            return 'default';
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2.5" style={{ borderBottom: '1px solid #f5f6f7' }}>
      <span style={{ fontSize: '12.5px', color: '#8a929b', minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: '13px', color: value ? '#14181c' : '#c4c9cf', fontWeight: 500, textAlign: 'right' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── Personal summary card ────────────────────────────────────────────────────

function PersonalSummary({ employee }: { employee: Employee }) {
  const { person } = employee;
  const gender = person.gender
    ? person.gender.charAt(0) + person.gender.slice(1).toLowerCase()
    : undefined;

  return (
    <Card>
      <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
      <InfoRow label="Full Name"    value={[person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ')} />
      <InfoRow label="Date of Birth" value={formatDate(person.dateOfBirth)} />
      <InfoRow label="Gender"       value={gender} />
      <InfoRow label="Blood Group"  value={person.bloodGroup} />
      <InfoRow label="Nationality"  value={person.nationality} />
      <InfoRow label="Email"        value={person.email} />
      <InfoRow label="Phone"        value={person.phone} />
    </Card>
  );
}

// ─── Employment summary card ──────────────────────────────────────────────────

function EmploymentSummary({ employee }: { employee: Employee }) {
  const empTypeLabelMap: Record<string, string> = {
    FULL_TIME: 'Full-time', PART_TIME: 'Part-time',
    CONTRACT: 'Contract', VISITING: 'Visiting',
  };
  const statusLabel = employee.employmentStatus.charAt(0) + employee.employmentStatus.slice(1).toLowerCase().replace('_', ' ');

  return (
    <Card>
      <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
      <InfoRow label="Employee No."  value={employee.employeeNumber} />
      <InfoRow label="Department"    value={employee.department?.name} />
      <InfoRow label="Designation"   value={employee.designation?.name} />
      <InfoRow label="Employee Type" value={employee.employeeType?.name} />
      <InfoRow label="Emp. Type"     value={employee.employmentType ? (empTypeLabelMap[employee.employmentType] ?? employee.employmentType) : undefined} />
      <InfoRow label="Joining Date"  value={formatDate(employee.joiningDate)} />
      <div className="flex items-start justify-between py-2.5">
        <span style={{ fontSize: '12.5px', color: '#8a929b', minWidth: 140 }}>Status</span>
        <Badge variant={statusVariant(employee.employmentStatus)}>{statusLabel}</Badge>
      </div>
    </Card>
  );
}

// ─── Reporting manager card ───────────────────────────────────────────────────

function ReportingManager({ employee }: { employee: Employee }) {
  const manager = employee.reportingManager;
  return (
    <Card>
      <CardHeader><CardTitle>Reporting Manager</CardTitle></CardHeader>
      {manager ? (
        <div className="flex items-center gap-3 py-2">
          <Avatar name={manager.name} size="md" />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>{manager.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <UserCheck size={12} className="text-[#8a929b]" />
              <span style={{ fontSize: '12px', color: '#8a929b' }}>Direct Manager</span>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: '#c4c9cf', padding: '8px 0' }}>No reporting manager assigned.</p>
      )}
    </Card>
  );
}

// ─── Current assignments card ─────────────────────────────────────────────────

function AssignmentsSummary({ employee }: { employee: Employee }) {
  const assignments = employee.teacherAssignments ?? [];
  const active = assignments.filter((a) => a.status === 'ACTIVE').slice(0, 4);

  return (
    <Card>
      <CardHeader><CardTitle>Current Assignments</CardTitle></CardHeader>
      {active.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#c4c9cf', padding: '8px 0' }}>No active assignments.</p>
      ) : (
        <div className="space-y-2 pt-1">
          {active.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: '#f8fafb' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>{a.subject.name}</p>
                <p style={{ fontSize: '11.5px', color: '#8a929b' }}>
                  {a.class.name} · {a.section.name}
                  {a.isClassTeacher && <span style={{ color: '#2b5fa8', marginLeft: 6 }}>· Class Teacher</span>}
                </p>
              </div>
              <span style={{ fontSize: '11px', color: '#8a929b' }}>{a.academicYear.name}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Module quick links ───────────────────────────────────────────────────────

const MODULE_LINKS = [
  { icon: CalendarDays, label: 'Attendance',  sub: 'Attendance records',      color: '#dbe8dc', fg: '#33604a' },
  { icon: Clock,        label: 'Timetable',   sub: 'Class schedule',          color: '#dfeaf1', fg: '#4e6a7d' },
  { icon: Wallet,       label: 'Payroll',     sub: 'Salary & payslips',       color: '#f7e2d5', fg: '#8c4f31' },
  { icon: ClipboardList,label: 'Leave',       sub: 'Leave requests',          color: '#e6e1ef', fg: '#584a75' },
];

function ModuleLinks() {
  return (
    <Card>
      <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
      <div className="grid grid-cols-2 gap-2">
        {MODULE_LINKS.map((m) => (
          <button
            key={m.label}
            className="flex items-center gap-2.5 rounded-xl p-3 text-left hover:opacity-80 transition-opacity"
            style={{ background: m.color, border: `1px solid ${m.color}` }}
          >
            <m.icon size={16} style={{ color: m.fg, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '13px', fontWeight: 600, color: m.fg }}>{m.label}</p>
              <p style={{ fontSize: '11px', color: m.fg, opacity: 0.75 }} className="truncate">{m.sub}</p>
            </div>
            <ArrowRight size={13} style={{ color: m.fg, opacity: 0.5, flexShrink: 0 }} />
          </button>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: '#c4c9cf', marginTop: 12, textAlign: 'center' }}>
        Full module views coming soon
      </p>
    </Card>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

export function OverviewTab({ employee }: { employee: Employee }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PersonalSummary employee={employee} />
          <EmploymentSummary employee={employee} />
        </div>
        <AssignmentsSummary employee={employee} />
      </div>

      {/* Right column */}
      <div className="space-y-5">
        <ReportingManager employee={employee} />
        <ModuleLinks />
      </div>
    </div>
  );
}
