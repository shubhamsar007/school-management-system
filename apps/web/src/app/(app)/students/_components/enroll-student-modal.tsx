'use client';

import * as React from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StepWizard, type WizardStep } from '@/components/ui/step-wizard';
import { AddressForm, EMPTY_ADDRESS, type AddressData } from '@/components/forms/address-form';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import {
  useCreateStudent,
  useCreateEnrollment,
  useCreateGuardian,
} from '@/lib/hooks/use-students';
import {
  useClasses,
  useSections,
  useOrganization,
  useAcademicYears,
  useCampuses,
} from '@/lib/hooks/use-academics';

// ─── Constants ────────────────────────────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = [
  { id: 'enrollment', label: 'Enrollment' },
  { id: 'personal',   label: 'Personal'   },
  { id: 'contact',    label: 'Contact'    },
  { id: 'admission',  label: 'Admission'  },
  { id: 'guardians',  label: 'Guardians'  },
  { id: 'review',     label: 'Review'     },
];

const GENDER_OPTIONS = [
  { label: 'Male',   value: 'MALE'   },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other',  value: 'OTHER'  },
];

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => ({
  label: bg,
  value: bg,
}));

const STUDENT_TYPE_OPTIONS = [
  { label: 'New Admission',  value: 'NEW_ADMISSION'  },
  { label: 'Transfer',       value: 'TRANSFER'       },
  { label: 'Returning',      value: 'RETURNING'      },
  { label: 'Existing',       value: 'EXISTING'       },
];

const ADMISSION_SOURCE_OPTIONS = [
  { label: 'Admission Portal', value: 'PORTAL'    },
  { label: 'Walk-in',          value: 'WALK_IN'   },
  { label: 'Referral',         value: 'REFERRAL'  },
  { label: 'Transfer',         value: 'TRANSFER'  },
  { label: 'Other',            value: 'OTHER'     },
];

const STUDENT_STATUS_OPTIONS = [
  { label: 'Active',       value: 'ACTIVE'      },
  { label: 'Inactive',     value: 'INACTIVE'    },
];

const RELATIONSHIP_OPTIONS = [
  { label: 'Father',         value: 'FATHER'         },
  { label: 'Mother',         value: 'MOTHER'         },
  { label: 'Grandfather',    value: 'GRANDFATHER'    },
  { label: 'Grandmother',    value: 'GRANDMOTHER'    },
  { label: 'Uncle',          value: 'UNCLE'          },
  { label: 'Aunt',           value: 'AUNT'           },
  { label: 'Sibling',        value: 'SIBLING'        },
  { label: 'Legal Guardian', value: 'LEGAL_GUARDIAN' },
  { label: 'Other',          value: 'OTHER'          },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrollmentForm {
  // Step 0 — Enrollment Details
  academicYearId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  enrollmentDate: string;
  studentType: string;
  admissionSource: string;

  // Step 1 — Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  nationality: string;
  motherTongue: string;
  religion: string;
  category: string;
  caste: string;

  // Step 2 — Contact Information
  phone: string;
  alternatePhone: string;
  email: string;
  permanentAddress: AddressData;
  sameAddress: boolean;
  currentAddress: AddressData;

  // Step 3 — Admission Details
  admissionNumber: string;
  registrationNumber: string;
  admissionDate: string;
  joiningDate: string;
  studentStatus: string;
}

interface GuardianEntry {
  _key: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  alternatePhone: string;
  email: string;
  relationship: string;
  occupation: string;
  organization: string;
  designation: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  canPickup: boolean;
  canReceiveNotifications: boolean;
  canAccessPortal: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_FORM: EnrollmentForm = {
  academicYearId: '', campusId: '', classId: '', sectionId: '',
  rollNumber: '', enrollmentDate: '', studentType: 'NEW_ADMISSION', admissionSource: '',
  firstName: '', middleName: '', lastName: '', preferredName: '',
  dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian',
  motherTongue: '', religion: '', category: '', caste: '',
  phone: '', alternatePhone: '', email: '',
  permanentAddress: EMPTY_ADDRESS, sameAddress: true, currentAddress: EMPTY_ADDRESS,
  admissionNumber: '', registrationNumber: '',
  admissionDate: '', joiningDate: '', studentStatus: 'ACTIVE',
};

function makeGuardian(isPrimary = false): GuardianEntry {
  return {
    _key: Math.random().toString(36).slice(2),
    firstName: '', lastName: '', gender: '', phone: '', alternatePhone: '',
    email: '', relationship: '', occupation: '', organization: '', designation: '',
    isPrimary,
    isEmergencyContact: isPrimary,
    canPickup: isPrimary,
    canReceiveNotifications: true,
    canAccessPortal: false,
  };
}

function today(): string {
  return new Date().toISOString().split('T')[0]!;
}

// ─── Shared micro-components (internal to this file) ─────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: '#8a929b', margin: '8px 0 4px',
    }}>
      {children}
    </p>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {children}
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', fontSize: 13, color: '#14181c',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: '#2e6644', flexShrink: 0 }}
      />
      {label}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>{children}</p>
  );
}

// ─── Step 0 — Enrollment Details ─────────────────────────────────────────────

function StepEnrollmentDetails({
  form,
  set,
}: {
  form: EnrollmentForm;
  set: <K extends keyof EnrollmentForm>(k: K, v: EnrollmentForm[K]) => void;
}) {
  const { data: org }      = useOrganization();
  const { data: years }    = useAcademicYears(org?.id);
  const { data: campuses } = useCampuses(org?.id);
  const { data: classes }  = useClasses();
  const { data: sections } = useSections(form.classId || null);

  // Auto-select current academic year
  React.useEffect(() => {
    if (years && !form.academicYearId) {
      const current = years.find((y) => y.isCurrent) ?? years[0];
      if (current) set('academicYearId', current.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  // Auto-select if there is only one campus
  React.useEffect(() => {
    if (campuses?.length === 1 && !form.campusId) {
      set('campusId', campuses[0]!.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campuses]);

  // Default enrollment date to today
  React.useEffect(() => {
    if (!form.enrollmentDate) set('enrollmentDate', today());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yearOptions   = (years ?? []).map((y) => ({ label: y.name + (y.isCurrent ? ' (Current)' : ''), value: y.id }));
  const campusOptions = (campuses ?? []).map((c) => ({ label: c.name, value: c.id }));
  const classOptions  = (classes ?? []).map((c) => ({ label: c.name, value: c.id }));
  const sectionOptions = (sections ?? []).map((s) => ({ label: s.name, value: s.id }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle>Academic Placement</SectionTitle>

      <Grid2>
        <FormField label="Academic Year" required>
          <Select
            value={form.academicYearId}
            onChange={(e) => set('academicYearId', e.target.value)}
            options={yearOptions}
            placeholder="Select year"
          />
        </FormField>
        <FormField label="Campus" required>
          <Select
            value={form.campusId}
            onChange={(e) => set('campusId', e.target.value)}
            options={campusOptions}
            placeholder="Select campus"
          />
        </FormField>
      </Grid2>

      <Grid2>
        <FormField label="Class" required>
          <Select
            value={form.classId}
            onChange={(e) => { set('classId', e.target.value); set('sectionId', ''); }}
            options={classOptions}
            placeholder="Select class"
          />
        </FormField>
        <FormField label="Section" required>
          <Select
            value={form.sectionId}
            onChange={(e) => set('sectionId', e.target.value)}
            options={sectionOptions}
            placeholder={form.classId ? 'Select section' : 'Select class first'}
            disabled={!form.classId}
          />
        </FormField>
      </Grid2>

      <Grid2>
        <FormField label="Roll Number">
          <Input
            value={form.rollNumber}
            onChange={(e) => set('rollNumber', e.target.value)}
            placeholder="01"
          />
        </FormField>
        <FormField label="Enrollment Date" required>
          <Input
            type="date"
            value={form.enrollmentDate}
            onChange={(e) => set('enrollmentDate', e.target.value)}
          />
        </FormField>
      </Grid2>

      <SectionTitle>Admission Type</SectionTitle>

      <Grid2>
        <FormField label="Student Type">
          <Select
            value={form.studentType}
            onChange={(e) => set('studentType', e.target.value)}
            options={STUDENT_TYPE_OPTIONS}
          />
        </FormField>
        <FormField label="Admission Source">
          <Select
            value={form.admissionSource}
            onChange={(e) => set('admissionSource', e.target.value)}
            options={ADMISSION_SOURCE_OPTIONS}
            placeholder="Select source"
          />
        </FormField>
      </Grid2>
    </div>
  );
}

// ─── Step 1 — Personal Information ───────────────────────────────────────────

function StepPersonalInfo({
  form,
  set,
}: {
  form: EnrollmentForm;
  set: <K extends keyof EnrollmentForm>(k: K, v: EnrollmentForm[K]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle>Basic Information</SectionTitle>

      <Grid2>
        <FormField label="First Name" required>
          <Input
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            placeholder="Aarav"
          />
        </FormField>
        <FormField label="Middle Name">
          <Input
            value={form.middleName}
            onChange={(e) => set('middleName', e.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </Grid2>

      <Grid2>
        <FormField label="Last Name" required>
          <Input
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            placeholder="Mehta"
          />
        </FormField>
        <FormField label="Preferred Name">
          <Input
            value={form.preferredName}
            onChange={(e) => set('preferredName', e.target.value)}
            placeholder="What they go by (optional)"
          />
        </FormField>
      </Grid2>

      <Grid2>
        <FormField label="Date of Birth">
          <Input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </FormField>
        <FormField label="Gender" required>
          <Select
            value={form.gender}
            onChange={(e) => set('gender', e.target.value)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
        </FormField>
      </Grid2>

      <Grid2>
        <FormField label="Blood Group">
          <Select
            value={form.bloodGroup}
            onChange={(e) => set('bloodGroup', e.target.value)}
            options={BLOOD_GROUP_OPTIONS}
            placeholder="Select blood group"
          />
        </FormField>
        <FormField label="Nationality">
          <Input
            value={form.nationality}
            onChange={(e) => set('nationality', e.target.value)}
            placeholder="Indian"
          />
        </FormField>
      </Grid2>

      <SectionTitle>Additional Details <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></SectionTitle>

      <Grid2>
        <FormField label="Mother Tongue">
          <Input
            value={form.motherTongue}
            onChange={(e) => set('motherTongue', e.target.value)}
            placeholder="Hindi, Tamil, etc."
          />
        </FormField>
        <FormField label="Religion">
          <Input
            value={form.religion}
            onChange={(e) => set('religion', e.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </Grid2>

      <Grid2>
        <FormField label="Category">
          <Input
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="General / OBC / SC / ST"
          />
        </FormField>
        <FormField label="Caste">
          <Input
            value={form.caste}
            onChange={(e) => set('caste', e.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </Grid2>
    </div>
  );
}

// ─── Step 2 — Contact Information ────────────────────────────────────────────

function StepContactInfo({
  form,
  set,
}: {
  form: EnrollmentForm;
  set: <K extends keyof EnrollmentForm>(k: K, v: EnrollmentForm[K]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle>Student Contact</SectionTitle>

      <Grid2>
        <FormField label="Mobile Number">
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 98XXX XXXXX"
          />
        </FormField>
        <FormField label="Alternate Phone">
          <Input
            type="tel"
            value={form.alternatePhone}
            onChange={(e) => set('alternatePhone', e.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </Grid2>

      <FormField label="Email">
        <Input
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="student@example.com"
        />
      </FormField>

      <SectionTitle>Permanent Address</SectionTitle>
      <AddressForm
        value={form.permanentAddress}
        onChange={(addr) => set('permanentAddress', addr)}
      />

      <div style={{ marginTop: 4 }}>
        <CheckboxItem
          label="Current address is the same as permanent address"
          checked={form.sameAddress}
          onChange={(v) => set('sameAddress', v)}
        />
      </div>

      {!form.sameAddress && (
        <>
          <SectionTitle>Current Address</SectionTitle>
          <AddressForm
            value={form.currentAddress}
            onChange={(addr) => set('currentAddress', addr)}
          />
        </>
      )}
    </div>
  );
}

// ─── Step 3 — Admission Details ───────────────────────────────────────────────

function StepAdmissionDetails({
  form,
  set,
}: {
  form: EnrollmentForm;
  set: <K extends keyof EnrollmentForm>(k: K, v: EnrollmentForm[K]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle>Admission Record</SectionTitle>

      <Grid2>
        <FormField label="Admission Number" required>
          <Input
            value={form.admissionNumber}
            onChange={(e) => set('admissionNumber', e.target.value)}
            placeholder="ADM-2026-001"
          />
        </FormField>
        <FormField label="Registration Number">
          <Input
            value={form.registrationNumber}
            onChange={(e) => set('registrationNumber', e.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </Grid2>

      <Grid2>
        <FormField label="Admission Date" required>
          <Input
            type="date"
            value={form.admissionDate}
            onChange={(e) => set('admissionDate', e.target.value)}
          />
        </FormField>
        <FormField label="Joining Date">
          <Input
            type="date"
            value={form.joiningDate}
            onChange={(e) => set('joiningDate', e.target.value)}
          />
          <Hint>Date the student physically joins class</Hint>
        </FormField>
      </Grid2>

      <FormField label="Student Status">
        <Select
          value={form.studentStatus}
          onChange={(e) => set('studentStatus', e.target.value)}
          options={STUDENT_STATUS_OPTIONS}
        />
      </FormField>

      <div style={{ marginTop: 4, padding: '10px 12px', background: '#f8f9fa', borderRadius: 6, border: '1px solid #e6e8eb' }}>
        <p style={{ fontSize: 12, color: '#6b7480', margin: 0, lineHeight: 1.5 }}>
          <strong>Tip:</strong> If this student came from the Admissions module, pre-fill
          the admission number and date from their accepted application.
        </p>
      </div>
    </div>
  );
}

// ─── Step 4 — Guardians ───────────────────────────────────────────────────────

function GuardianCard({
  guardian,
  index,
  total,
  onChange,
  onSetPrimary,
  onRemove,
}: {
  guardian: GuardianEntry;
  index: number;
  total: number;
  onChange: (field: keyof GuardianEntry, value: string | boolean) => void;
  onSetPrimary: () => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      border: `1px solid ${guardian.isPrimary ? '#2e6644' : '#d7dce1'}`,
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: guardian.isPrimary ? '#f6faf7' : '#fff',
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: guardian.isPrimary ? '#2e6644' : '#6b7480' }}>
          Guardian {index + 1}{guardian.isPrimary ? ' · Primary' : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {!guardian.isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 5,
                border: '1px solid #2e6644', background: 'none',
                color: '#2e6644', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Set Primary
            </button>
          )}
          {total > 1 && (
            <button
              type="button"
              onClick={onRemove}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, padding: '3px 8px', borderRadius: 5,
                border: '1px solid #e6e8eb', background: 'none',
                color: '#6b7480', cursor: 'pointer',
              }}
            >
              <Trash2 size={12} /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Name row */}
      <Grid2>
        <FormField label="First Name" required>
          <Input
            value={guardian.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            placeholder="Rohit"
          />
        </FormField>
        <FormField label="Last Name" required>
          <Input
            value={guardian.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            placeholder="Mehta"
          />
        </FormField>
      </Grid2>

      {/* Relationship + Gender */}
      <Grid2>
        <FormField label="Relationship" required>
          <Select
            value={guardian.relationship}
            onChange={(e) => onChange('relationship', e.target.value)}
            options={RELATIONSHIP_OPTIONS}
            placeholder="Select relationship"
          />
        </FormField>
        <FormField label="Gender">
          <Select
            value={guardian.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
        </FormField>
      </Grid2>

      {/* Contact */}
      <Grid2>
        <FormField label="Mobile" required>
          <Input
            type="tel"
            value={guardian.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+91 98XXX XXXXX"
          />
        </FormField>
        <FormField label="Alternate Mobile">
          <Input
            type="tel"
            value={guardian.alternatePhone}
            onChange={(e) => onChange('alternatePhone', e.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </Grid2>

      <FormField label="Email">
        <Input
          type="email"
          value={guardian.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="guardian@example.com"
        />
      </FormField>

      {/* Occupation */}
      <Grid2>
        <FormField label="Occupation">
          <Input
            value={guardian.occupation}
            onChange={(e) => onChange('occupation', e.target.value)}
            placeholder="Engineer, Teacher, etc."
          />
        </FormField>
        <FormField label="Organization">
          <Input
            value={guardian.organization}
            onChange={(e) => onChange('organization', e.target.value)}
            placeholder="Company / School name"
          />
        </FormField>
      </Grid2>

      {/* Permissions */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 8 }}>
          Permissions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <CheckboxItem
            label="Emergency Contact"
            checked={guardian.isEmergencyContact}
            onChange={(v) => onChange('isEmergencyContact', v)}
          />
          <CheckboxItem
            label="Authorized Pickup"
            checked={guardian.canPickup}
            onChange={(v) => onChange('canPickup', v)}
          />
          <CheckboxItem
            label="Receive School Communications"
            checked={guardian.canReceiveNotifications}
            onChange={(v) => onChange('canReceiveNotifications', v)}
          />
          <CheckboxItem
            label="Access Student Portal"
            checked={guardian.canAccessPortal}
            onChange={(v) => onChange('canAccessPortal', v)}
          />
        </div>
      </div>
    </div>
  );
}

function StepGuardians({
  guardians,
  setGuardians,
}: {
  guardians: GuardianEntry[];
  setGuardians: React.Dispatch<React.SetStateAction<GuardianEntry[]>>;
}) {
  function updateField(key: string, field: keyof GuardianEntry, value: string | boolean) {
    setGuardians((prev) =>
      prev.map((g) => {
        if (g._key === key) return { ...g, [field]: value };
        // Only one guardian can be primary
        if (field === 'isPrimary' && value === true) return { ...g, isPrimary: false };
        return g;
      }),
    );
  }

  function setPrimary(key: string) {
    setGuardians((prev) =>
      prev.map((g) => ({ ...g, isPrimary: g._key === key })),
    );
  }

  function remove(key: string) {
    setGuardians((prev) => {
      const next = prev.filter((g) => g._key !== key);
      // Ensure exactly one primary
      if (next.length > 0 && !next.some((g) => g.isPrimary)) {
        next[0]!.isPrimary = true;
      }
      return next;
    });
  }

  function add() {
    setGuardians((prev) => [...prev, makeGuardian(false)]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {guardians.map((g, i) => (
        <GuardianCard
          key={g._key}
          guardian={g}
          index={i}
          total={guardians.length}
          onChange={(field, value) => updateField(g._key, field, value)}
          onSetPrimary={() => setPrimary(g._key)}
          onRemove={() => remove(g._key)}
        />
      ))}

      <button
        type="button"
        onClick={add}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 0', borderRadius: 8,
          border: '1px dashed #2e6644', background: 'none',
          fontSize: 13, fontWeight: 600, color: '#2e6644', cursor: 'pointer',
        }}
      >
        <Plus size={14} /> Add Another Guardian
      </button>
    </div>
  );
}

// ─── Step 5 — Review ──────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
      <span style={{ color: '#6b7480', flexShrink: 0, width: 140 }}>{label}</span>
      <span style={{ color: '#14181c', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #f0f0ee', paddingBottom: 16, marginBottom: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 10 }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function StepReview({
  form,
  guardians,
  classes,
  sections,
  years,
  campuses,
}: {
  form: EnrollmentForm;
  guardians: GuardianEntry[];
  classes: { id: string; name: string }[];
  sections: { id: string; name: string }[];
  years: { id: string; name: string }[];
  campuses: { id: string; name: string }[];
}) {
  const className   = classes.find((c) => c.id === form.classId)?.name;
  const sectionName = sections.find((s) => s.id === form.sectionId)?.name;
  const yearName    = years.find((y) => y.id === form.academicYearId)?.name;
  const campusName  = campuses.find((c) => c.id === form.campusId)?.name;
  const primary     = guardians.find((g) => g.isPrimary);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ReviewSection title="Enrollment">
        <ReviewRow label="Academic Year"   value={yearName} />
        <ReviewRow label="Campus"          value={campusName} />
        <ReviewRow label="Class"           value={className} />
        <ReviewRow label="Section"         value={sectionName} />
        <ReviewRow label="Roll Number"     value={form.rollNumber || '—'} />
        <ReviewRow label="Enrollment Date" value={form.enrollmentDate} />
        <ReviewRow label="Student Type"    value={form.studentType.replace(/_/g, ' ')} />
      </ReviewSection>

      <ReviewSection title="Personal">
        <ReviewRow label="Full Name"   value={[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')} />
        <ReviewRow label="Date of Birth" value={form.dateOfBirth || '—'} />
        <ReviewRow label="Gender"      value={form.gender} />
        <ReviewRow label="Blood Group" value={form.bloodGroup || '—'} />
        <ReviewRow label="Nationality" value={form.nationality} />
      </ReviewSection>

      <ReviewSection title="Contact">
        <ReviewRow label="Mobile"  value={form.phone || '—'} />
        <ReviewRow label="Email"   value={form.email || '—'} />
        <ReviewRow label="Address" value={form.permanentAddress.line1 ? `${form.permanentAddress.line1}, ${form.permanentAddress.city}` : '—'} />
      </ReviewSection>

      <ReviewSection title="Admission">
        <ReviewRow label="Admission No."  value={form.admissionNumber} />
        <ReviewRow label="Admission Date" value={form.admissionDate} />
        <ReviewRow label="Status"         value={form.studentStatus} />
      </ReviewSection>

      <ReviewSection title="Guardian(s)">
        {guardians.map((g, i) => (
          <ReviewRow
            key={g._key}
            label={`Guardian ${i + 1}${g.isPrimary ? ' (Primary)' : ''}`}
            value={`${g.firstName} ${g.lastName} · ${g.relationship} · ${g.phone}`}
          />
        ))}
      </ReviewSection>

      {primary && (
        <div style={{ padding: '10px 12px', background: '#f6faf7', border: '1px solid #c1d9c8', borderRadius: 6 }}>
          <p style={{ fontSize: 12, color: '#2e6644', margin: 0 }}>
            Primary guardian: <strong>{primary.firstName} {primary.lastName}</strong> ({primary.relationship.replace(/_/g, ' ')})
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      marginTop: 14, padding: '10px 12px',
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: 8, fontSize: 13, color: '#b3261e',
    }}>
      {message}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface EnrollStudentModalProps {
  open: boolean;
  onClose: () => void;
}

export function EnrollStudentModal({ open, onClose }: EnrollStudentModalProps) {
  const [step, setStep]       = React.useState(0);
  const [form, setForm]       = React.useState<EnrollmentForm>(INITIAL_FORM);
  const [guardians, setGuardians] = React.useState<GuardianEntry[]>([makeGuardian(true)]);
  const [error, setError]     = React.useState('');
  const [saving, setSaving]   = React.useState(false);

  // For the review step labels we need the lookup data
  const { data: org }      = useOrganization();
  const { data: years }    = useAcademicYears(org?.id);
  const { data: campuses } = useCampuses(org?.id);
  const { data: classes }  = useClasses();
  const { data: sections } = useSections(form.classId || null);

  const toast = useToast();

  const createStudent    = useCreateStudent();
  const createEnrollment = useCreateEnrollment();
  const createGuardian   = useCreateGuardian();

  // Lock body scroll while open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key closes
  React.useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof EnrollmentForm>(k: K, v: EnrollmentForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function reset() {
    setForm(INITIAL_FORM);
    setGuardians([makeGuardian(true)]);
    setStep(0);
    setError('');
  }

  function close() {
    reset();
    onClose();
  }

  // ── Validation per step ────────────────────────────────────────────────────

  function validate(): string | null {
    if (step === 0) {
      if (!form.academicYearId)  return 'Please select an academic year.';
      if (!form.campusId)        return 'Please select a campus.';
      if (!form.classId)         return 'Please select a class.';
      if (!form.sectionId)       return 'Please select a section.';
      if (!form.enrollmentDate)  return 'Enrollment date is required.';
    }
    if (step === 1) {
      if (!form.firstName.trim()) return 'First name is required.';
      if (!form.lastName.trim())  return 'Last name is required.';
      if (!form.gender)           return 'Please select a gender.';
    }
    if (step === 2) {
      // Validate student email format if provided
      const emailTrimmed = form.email.trim();
      if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        return 'Please enter a valid student email address.';
      }
    }
    if (step === 3) {
      if (!form.admissionNumber.trim()) return 'Admission number is required.';
      if (!form.admissionDate)          return 'Admission date is required.';
    }
    if (step === 4) {
      for (let i = 0; i < guardians.length; i++) {
        const g = guardians[i]!;
        if (!g.firstName.trim())  return `Guardian ${i + 1}: first name is required.`;
        if (!g.lastName.trim())   return `Guardian ${i + 1}: last name is required.`;
        if (!g.phone.trim())      return `Guardian ${i + 1}: phone is required.`;
        if (!g.relationship)      return `Guardian ${i + 1}: relationship is required.`;
        // Validate email format if the user typed something in the field
        const gEmail = g.email.trim();
        if (gEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gEmail)) {
          return `Guardian ${i + 1}: please enter a valid email address.`;
        }
      }
    }
    return null;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    if (step < WIZARD_STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final submit (on Review step)
    setSaving(true);
    try {
      // ── 1. Create student ──────────────────────────────────────────────────
      // If a previous attempt created the student but failed later, the admission
      // number will conflict (409). In that case, find and reuse the existing student.
      let studentId: string;
      try {
        const newStudent = await createStudent.mutateAsync({
          firstName:        form.firstName,
          ...(form.middleName.trim()         ? { middleName:         form.middleName.trim() }         : {}),
          lastName:         form.lastName,
          ...(form.dateOfBirth               ? { dateOfBirth:         form.dateOfBirth }               : {}),
          ...(form.gender                    ? { gender:              form.gender }                    : {}),
          ...(form.email.trim()              ? { email:               form.email.trim() }              : {}),
          ...(form.phone.trim()              ? { phone:               form.phone.trim() }              : {}),
          ...(form.alternatePhone.trim()     ? { alternatePhone:      form.alternatePhone.trim() }     : {}),
          ...(form.bloodGroup                ? { bloodGroup:          form.bloodGroup }                : {}),
          ...(form.nationality.trim()        ? { nationality:         form.nationality.trim() }        : {}),
          admissionNumber:  form.admissionNumber.trim(),
          ...(form.registrationNumber.trim() ? { registrationNumber:  form.registrationNumber.trim() } : {}),
          admissionDate:    form.admissionDate,
          ...(form.joiningDate               ? { joiningDate:         form.joiningDate }               : {}),
          ...(form.campusId                  ? { currentCampusId:     form.campusId }                  : {}),
          ...(form.preferredName.trim()    ? { preferredName:    form.preferredName.trim() }    : {}),
          ...(form.motherTongue.trim()     ? { motherTongue:     form.motherTongue.trim() }     : {}),
          ...(form.religion.trim()         ? { religion:         form.religion.trim() }         : {}),
          ...(form.category.trim()         ? { category:         form.category.trim() }         : {}),
          ...(form.caste.trim()            ? { caste:            form.caste.trim() }            : {}),
          ...(form.studentType             ? { studentType:      form.studentType }             : {}),
          ...(form.admissionSource         ? { admissionSource:  form.admissionSource }         : {}),
          // Send permanent address only if line1 is filled
          ...(form.permanentAddress.line1.trim() ? { permanentAddress: {
            line1:      form.permanentAddress.line1.trim()      || undefined,
            line2:      form.permanentAddress.line2.trim()      || undefined,
            city:       form.permanentAddress.city.trim()       || undefined,
            state:      form.permanentAddress.state.trim()      || undefined,
            country:    form.permanentAddress.country.trim()    || undefined,
            postalCode: form.permanentAddress.postalCode.trim() || undefined,
          }} : {}),
          // Send current address only if different from permanent and line1 is filled
          ...(!form.sameAddress && form.currentAddress.line1.trim() ? { currentAddress: {
            line1:      form.currentAddress.line1.trim()      || undefined,
            line2:      form.currentAddress.line2.trim()      || undefined,
            city:       form.currentAddress.city.trim()       || undefined,
            state:      form.currentAddress.state.trim()      || undefined,
            country:    form.currentAddress.country.trim()    || undefined,
            postalCode: form.currentAddress.postalCode.trim() || undefined,
          }} : {}),
        });
        studentId = newStudent.id;
      } catch (createErr: unknown) {
        // 409 = student already created from a previous partial attempt
        if (createErr instanceof Error && createErr.message.toLowerCase().includes('already exists')) {
          const found = await apiClient.get<{ data: Array<{ id: string }> }>(
            `/students?search=${encodeURIComponent(form.admissionNumber.trim())}&limit=1`,
          );
          if (found.data?.length) {
            studentId = found.data[0]!.id;
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }

      // ── 2. Create enrollment ───────────────────────────────────────────────
      // Ignore "already enrolled" conflict — same retry scenario.
      try {
        await createEnrollment.mutateAsync({
          studentId,
          data: {
            academicYearId: form.academicYearId,
            campusId:       form.campusId,
            classId:        form.classId,
            sectionId:      form.sectionId,
            enrollmentDate: form.enrollmentDate,
            ...(form.rollNumber.trim() ? { rollNumber: form.rollNumber.trim() } : {}),
          },
        });
      } catch (enrollErr: unknown) {
        if (enrollErr instanceof Error && enrollErr.message.toLowerCase().includes('already enrolled')) {
          // Already created — safe to continue with guardian
        } else {
          throw enrollErr;
        }
      }

      // ── 3. Create guardians ────────────────────────────────────────────────
      for (const g of guardians) {
        const gEmail          = g.email.trim();
        const gAlternatePhone = g.alternatePhone.trim();
        const gOccupation     = g.occupation.trim();
        const gEmployer       = g.organization.trim(); // "organization" in the form = employer in the DTO
        await createGuardian.mutateAsync({
          studentId,
          data: {
            firstName:                g.firstName.trim(),
            lastName:                 g.lastName.trim(),
            phone:                    g.phone.trim(),
            ...(gAlternatePhone       ? { alternatePhone: gAlternatePhone } : {}),
            ...(g.gender              ? { gender:         g.gender }         : {}),
            ...(gEmail                ? { email:          gEmail }            : {}),
            ...(gOccupation           ? { occupation:     gOccupation }       : {}),
            ...(gEmployer             ? { employer:       gEmployer }         : {}),
            relationship:             g.relationship,
            isPrimary:                g.isPrimary,
            isEmergencyContact:       g.isEmergencyContact,
            canPickup:                g.canPickup,
            canReceiveNotifications:  g.canReceiveNotifications,
            ...(g.designation.trim() ? { designation: g.designation.trim() } : {}),
            canAccessPortal:          g.canAccessPortal,
          },
        });
      }

      const studentName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ');
      toast.success(`${studentName} has been enrolled successfully.`);
      close();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to enroll student. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const isLastStep = step === WIZARD_STEPS.length - 1;

  const modal = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Enroll Student"
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(20,24,28,0.5)',
          backdropFilter: 'blur(2px)',
        }}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        style={{
          position: 'relative', zIndex: 51,
          width: '660px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0,
          padding: '18px 24px',
          borderBottom: '1px solid #f0f0ee',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#14181c', margin: 0 }}>
              Enroll Student
            </h2>
            <p style={{ fontSize: 12, color: '#8a929b', margin: '2px 0 0' }}>
              Step {step + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step]!.label}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6b7480',
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step wizard */}
        <div style={{ flexShrink: 0, padding: '16px 24px 0' }}>
          <StepWizard steps={WIZARD_STEPS} currentStep={step} />
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 8px' }}>
          {step === 0 && <StepEnrollmentDetails form={form} set={set} />}
          {step === 1 && <StepPersonalInfo      form={form} set={set} />}
          {step === 2 && <StepContactInfo       form={form} set={set} />}
          {step === 3 && <StepAdmissionDetails  form={form} set={set} />}
          {step === 4 && (
            <StepGuardians guardians={guardians} setGuardians={setGuardians} />
          )}
          {step === 5 && (
            <StepReview
              form={form}
              guardians={guardians}
              classes={classes ?? []}
              sections={sections ?? []}
              years={years ?? []}
              campuses={campuses ?? []}
            />
          )}

          {error && <ErrorBanner message={error} />}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          padding: '14px 24px',
          borderTop: '1px solid #f0f0ee',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            type="button"
            onClick={() => { setError(''); setStep((s) => s - 1); }}
            disabled={step === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid #d7dce1', background: '#fff',
              fontSize: 13, fontWeight: 600,
              color: step === 0 ? '#c4c9cf' : '#14181c',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={14} /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 8,
              border: 'none',
              background: saving ? '#a0b5a8' : '#2e6644',
              color: '#fff',
              fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving
              ? 'Saving…'
              : isLastStep
              ? 'Enroll Student'
              : 'Next'}
            {!saving && isLastStep  && <Check        size={14} />}
            {!saving && !isLastStep && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
