'use client';

import * as React from 'react';
import { type Student } from '@/lib/hooks/use-students';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function Field({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: '14px', color: value ? '#14181c' : '#c4c9cf' }}>
        {value || 'Not provided'}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </Card>
  );
}

export function PersonalTab({ student }: { student: Student }) {
  const { person } = student;

  const fullName = [person.firstName, person.middleName, person.lastName]
    .filter(Boolean)
    .join(' ');

  const gender = person.gender
    ? person.gender.charAt(0) + person.gender.slice(1).toLowerCase()
    : undefined;

  const status = student.studentStatus.charAt(0) + student.studentStatus.slice(1).toLowerCase();

  return (
    <div className="space-y-5">
      {/* Identity */}
      <Section title="Personal Information">
        <Field label="Full Name"    value={fullName} />
        <Field label="Date of Birth" value={formatDate(person.dateOfBirth)} />
        <Field label="Gender"       value={gender} />
        <Field label="Blood Group"  value={person.bloodGroup} />
        <Field label="Nationality"  value={person.nationality} />
      </Section>

      {/* Contact */}
      <Section title="Contact Information">
        <Field label="Email"           value={person.email} />
        <Field label="Phone"           value={person.phone} />
        <Field label="Alternate Phone" value={person.alternatePhone} />
      </Section>

      {/* Admission */}
      <Section title="Admission & Status">
        <Field label="Admission Number"     value={student.admissionNumber} />
        <Field label="Registration Number"  value={student.registrationNumber} />
        <Field label="Admission Date"       value={formatDate(student.admissionDate)} />
        <Field label="Joining Date"         value={formatDate(student.joiningDate)} />
        <Field label="Student Status"       value={status} />
        {student.joiningDate === undefined && student.studentStatus !== 'ACTIVE' && (
          <Field label="Leaving Date"     value={formatDate((student as any).leavingDate)} />
        )}
      </Section>
    </div>
  );
}
