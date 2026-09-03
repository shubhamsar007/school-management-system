'use client';

import * as React from 'react';
import { type Employee } from '@/lib/hooks/use-teachers';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

function formatDate(iso: string | undefined) {
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

export function PersonalTab({ employee }: { employee: Employee }) {
  const { person } = employee;

  const fullName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
  const gender   = person.gender ? person.gender.charAt(0) + person.gender.slice(1).toLowerCase() : undefined;

  return (
    <div className="space-y-5">
      <Section title="Personal Information">
        <Field label="Full Name"    value={fullName} />
        <Field label="Date of Birth" value={formatDate(person.dateOfBirth)} />
        <Field label="Gender"       value={gender} />
        <Field label="Blood Group"  value={person.bloodGroup} />
        <Field label="Nationality"  value={person.nationality} />
      </Section>

      <Section title="Contact Information">
        <Field label="Email"          value={person.email} />
        <Field label="Phone"          value={person.phone} />
        <Field label="Alternate Phone" value={person.alternatePhone} />
      </Section>
    </div>
  );
}
