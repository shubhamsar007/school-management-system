'use client';

import * as React from 'react';
import {
  GraduationCap, CalendarDays, Phone, Mail,
  BookOpen, ClipboardList, Wallet, UserCheck,
  ArrowRight,
} from 'lucide-react';
import { type Student, type StudentGuardian } from '@/lib/hooks/use-students';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between py-2.5" style={{ borderBottom: '1px solid #f5f6f7' }}>
      <span style={{ fontSize: '12.5px', color: '#8a929b', minWidth: 140 }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#14181c', fontWeight: 500, textAlign: 'right' }}>
        {value || '—'}
      </span>
    </div>
  );
}

// ─── Personal summary card ─────────────────────────────────────────────────────

function PersonalSummary({ student }: { student: Student }) {
  const { person } = student;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <InfoRow label="Full Name"    value={[person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ')} />
      <InfoRow label="Date of Birth" value={formatDate(person.dateOfBirth)} />
      <InfoRow label="Gender"       value={person.gender ? person.gender.charAt(0) + person.gender.slice(1).toLowerCase() : undefined} />
      <InfoRow label="Blood Group"  value={person.bloodGroup} />
      <InfoRow label="Nationality"  value={person.nationality} />
      <InfoRow label="Email"        value={person.email} />
      <InfoRow label="Phone"        value={person.phone} />
    </Card>
  );
}

// ─── Enrollment summary card ───────────────────────────────────────────────────

function EnrollmentSummary({ student }: { student: Student }) {
  const current = student.enrollments[0];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Enrollment</CardTitle>
      </CardHeader>
      {current ? (
        <>
          <InfoRow label="Academic Year"  value={current.academicYear.name} />
          <InfoRow label="Class"          value={current.class.name} />
          <InfoRow label="Section"        value={current.section.name} />
          <InfoRow label="Roll Number"    value={current.rollNumber} />
          <InfoRow label="Enrolled On"    value={formatDate(current.enrollmentDate)} />
          <InfoRow label="Status"         value={current.status} />
        </>
      ) : (
        <p style={{ fontSize: '13px', color: '#8a929b', padding: '8px 0' }}>
          Not enrolled in any class yet.
        </p>
      )}
    </Card>
  );
}

// ─── Guardian quick card ──────────────────────────────────────────────────────

function GuardianQuick({ guardians }: { guardians: StudentGuardian[] }) {
  const primary = guardians.find((g) => g.isPrimary) ?? guardians[0];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Guardian</CardTitle>
      </CardHeader>
      {primary ? (
        <div className="flex items-start gap-3">
          <Avatar
            name={`${primary.guardian.person.firstName} ${primary.guardian.person.lastName}`}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>
              {primary.guardian.person.firstName} {primary.guardian.person.lastName}
            </p>
            <p style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>
              {primary.relationship.charAt(0) + primary.relationship.slice(1).toLowerCase()}
            </p>
            {primary.guardian.person.phone && (
              <div className="flex items-center gap-1.5 mt-2">
                <Phone size={12} className="text-[#8a929b]" />
                <span style={{ fontSize: '13px', color: '#14181c' }}>{primary.guardian.person.phone}</span>
              </div>
            )}
            {primary.guardian.person.email && (
              <div className="flex items-center gap-1.5 mt-1">
                <Mail size={12} className="text-[#8a929b]" />
                <span style={{ fontSize: '13px', color: '#6b7480' }}>{primary.guardian.person.email}</span>
              </div>
            )}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {primary.isEmergencyContact && <Badge variant="active">Emergency Contact</Badge>}
              {primary.canPickup && <Badge variant="default">Can Pickup</Badge>}
            </div>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: '#8a929b' }}>No guardian linked.</p>
      )}
    </Card>
  );
}

// ─── Module links ─────────────────────────────────────────────────────────────

const MODULE_LINKS = [
  { icon: CalendarDays, label: 'Attendance',   sub: 'View attendance records',   color: '#dbe8dc', fg: '#33604a' },
  { icon: BookOpen,     label: 'Examinations', sub: 'Marks & results',           color: '#dfeaf1', fg: '#4e6a7d' },
  { icon: Wallet,       label: 'Fees',         sub: 'Fee invoices & payments',   color: '#f7e2d5', fg: '#8c4f31' },
  { icon: ClipboardList,label: 'Academics',    sub: 'Timetable & homework',      color: '#e6e1ef', fg: '#584a75' },
];

function ModuleLinks({ studentId }: { studentId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
      </CardHeader>
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

// ─── Student details card ─────────────────────────────────────────────────────

function StudentDetails({ student }: { student: Student }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admission Details</CardTitle>
      </CardHeader>
      <InfoRow label="Admission No."      value={student.admissionNumber} />
      <InfoRow label="Registration No."   value={student.registrationNumber} />
      <InfoRow label="Admission Date"     value={formatDate(student.admissionDate)} />
      <InfoRow label="Joining Date"       value={formatDate(student.joiningDate)} />
      <InfoRow label="Status"             value={student.studentStatus.charAt(0) + student.studentStatus.slice(1).toLowerCase()} />
    </Card>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

export function OverviewTab({
  student,
  guardians,
}: {
  student: Student;
  guardians: StudentGuardian[];
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PersonalSummary student={student} />
          <EnrollmentSummary student={student} />
        </div>
        <StudentDetails student={student} />
      </div>

      {/* Right column */}
      <div className="space-y-5">
        <GuardianQuick guardians={guardians} />
        <ModuleLinks studentId={student.id} />
      </div>
    </div>
  );
}
