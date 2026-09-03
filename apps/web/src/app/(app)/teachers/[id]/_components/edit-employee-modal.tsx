'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  useUpdateTeacher,
  useFormOptions,
  useEmployeeDepartments,
  type Employee,
  type UpdateEmployeePayload,
} from '@/lib/hooks/use-teachers';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { label: 'Male',   value: 'MALE'   },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other',  value: 'OTHER'  },
];

const BLOOD_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({
  label: v,
  value: v,
}));

const EMP_TYPE_OPTIONS = [
  { label: 'Full-time', value: 'FULL_TIME' },
  { label: 'Part-time', value: 'PART_TIME' },
  { label: 'Contract',  value: 'CONTRACT'  },
  { label: 'Visiting',  value: 'VISITING'  },
];

const STATUS_OPTIONS = [
  { label: 'Draft',               value: 'DRAFT'               },
  { label: 'Onboarding',          value: 'ONBOARDING'          },
  { label: 'Probation',           value: 'PROBATION'           },
  { label: 'Confirmed',           value: 'CONFIRMED'           },
  { label: 'Active',              value: 'ACTIVE'              },
  { label: 'On Leave',            value: 'ON_LEAVE'            },
  { label: 'Suspended',           value: 'SUSPENDED'           },
  { label: 'Exit Initiated',      value: 'EXIT_INITIATED'      },
  { label: 'Exited',              value: 'EXITED'              },
  { label: 'Archived',            value: 'ARCHIVED'            },
];

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#8a929b',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginTop: 24,
        marginBottom: 14,
        paddingBottom: 6,
        borderBottom: '1px solid #f2f4f6',
      }}
    >
      {children}
    </p>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  // Personal
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  nationality: string;
  email: string;
  phone: string;
  alternatePhone: string;
  // Employment
  employeeNumber: string;
  joiningDate: string;
  employmentStatus: string;
  employmentType: string;
  workLocation: string;
  departmentId: string;
  designationId: string;
  employeeTypeId: string;
  campusId: string;
  probationStart: string;
  probationEnd: string;
  confirmationDate: string;
  contractStart: string;
  contractEnd: string;
  noticePeriodDays: string;
  leavingDate: string;
  leavingReason: string;
}

function employeeToForm(e: Employee): FormState {
  return {
    firstName:        e.person.firstName         ?? '',
    middleName:       e.person.middleName        ?? '',
    lastName:         e.person.lastName          ?? '',
    gender:           e.person.gender            ?? '',
    dateOfBirth:      e.person.dateOfBirth       ? e.person.dateOfBirth.slice(0, 10) : '',
    bloodGroup:       e.person.bloodGroup        ?? '',
    nationality:      e.person.nationality       ?? '',
    email:            e.person.email             ?? '',
    phone:            e.person.phone             ?? '',
    alternatePhone:   e.person.alternatePhone    ?? '',
    employeeNumber:   e.employeeNumber           ?? '',
    joiningDate:      e.joiningDate              ? e.joiningDate.slice(0, 10) : '',
    employmentStatus: e.employmentStatus         ?? '',
    employmentType:   e.employmentType           ?? '',
    workLocation:     e.workLocation             ?? '',
    departmentId:     e.department?.id           ?? '',
    designationId:    e.designation?.id          ?? '',
    employeeTypeId:   e.employeeType?.id         ?? '',
    campusId:         e.campus?.id               ?? '',
    probationStart:   e.probationStart           ? e.probationStart.slice(0, 10) : '',
    probationEnd:     e.probationEnd             ? e.probationEnd.slice(0, 10) : '',
    confirmationDate: e.confirmationDate         ? e.confirmationDate.slice(0, 10) : '',
    contractStart:    e.contractStart            ? e.contractStart.slice(0, 10) : '',
    contractEnd:      e.contractEnd              ? e.contractEnd.slice(0, 10) : '',
    noticePeriodDays: e.noticePeriodDays != null ? String(e.noticePeriodDays) : '',
    leavingDate:      e.leavingDate              ? e.leavingDate.slice(0, 10) : '',
    leavingReason:    e.leavingReason            ?? '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee;
}

export function EditEmployeeModal({ open, onClose, employee }: EditEmployeeModalProps) {
  const [form, setForm] = React.useState<FormState>(() => employeeToForm(employee));

  const toast  = useToast();
  const update = useUpdateTeacher(employee.id);
  const { data: opts, isLoading: optsLoading } = useFormOptions();
  const { data: departments } = useEmployeeDepartments();

  // Re-sync when employee changes (e.g. after a save)
  React.useEffect(() => {
    setForm(employeeToForm(employee));
  }, [employee]);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSave() {
    // Build payload imperatively to satisfy exactOptionalPropertyTypes
    const payload: UpdateEmployeePayload = {};
    if (form.firstName.trim())      payload.firstName        = form.firstName.trim();
    if (form.middleName.trim())     payload.middleName       = form.middleName.trim();
    if (form.lastName.trim())       payload.lastName         = form.lastName.trim();
    if (form.gender)                payload.gender           = form.gender;
    if (form.dateOfBirth)           payload.dateOfBirth      = form.dateOfBirth;
    if (form.bloodGroup)            payload.bloodGroup       = form.bloodGroup;
    if (form.nationality.trim())    payload.nationality      = form.nationality.trim();
    if (form.email.trim())          payload.email            = form.email.trim();
    if (form.phone.trim())          payload.phone            = form.phone.trim();
    if (form.alternatePhone.trim()) payload.alternatePhone   = form.alternatePhone.trim();
    if (form.employeeNumber.trim()) payload.employeeNumber   = form.employeeNumber.trim();
    if (form.joiningDate)           payload.joiningDate      = form.joiningDate;
    if (form.employmentStatus)      payload.employmentStatus = form.employmentStatus;
    if (form.employmentType)        payload.employmentType   = form.employmentType;
    if (form.workLocation.trim())   payload.workLocation     = form.workLocation.trim();
    if (form.departmentId)          payload.departmentId     = form.departmentId;
    if (form.designationId)         payload.designationId    = form.designationId;
    if (form.employeeTypeId)        payload.employeeTypeId   = form.employeeTypeId;
    if (form.campusId)              payload.campusId         = form.campusId;
    if (form.probationStart)        payload.probationStart   = form.probationStart;
    if (form.probationEnd)          payload.probationEnd     = form.probationEnd;
    if (form.confirmationDate)      payload.confirmationDate = form.confirmationDate;
    if (form.contractStart)         payload.contractStart    = form.contractStart;
    if (form.contractEnd)           payload.contractEnd      = form.contractEnd;
    if (form.leavingDate)           payload.leavingDate      = form.leavingDate;
    if (form.leavingReason.trim())  payload.leavingReason    = form.leavingReason.trim();
    if (form.noticePeriodDays !== '') {
      const n = parseInt(form.noticePeriodDays, 10);
      if (!isNaN(n)) payload.noticePeriodDays = n;
    }

    try {
      await update.mutateAsync(payload);
      toast.success(`${form.firstName} ${form.lastName} has been updated.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as any)?.message ?? 'Failed to update employee. Please try again.');
    }
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Employee"
      description={`Update ${employee.name}'s profile information.`}
      size="lg"
      footer={footer}
    >
      {/* ── Personal Information ── */}
      <SectionHeading>Personal Information</SectionHeading>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Input
          label="First Name"
          required
          value={form.firstName}
          onChange={set('firstName')}
          placeholder="First name"
        />
        <Input
          label="Middle Name"
          value={form.middleName}
          onChange={set('middleName')}
          placeholder="Optional"
        />
        <Input
          label="Last Name"
          required
          value={form.lastName}
          onChange={set('lastName')}
          placeholder="Last name"
        />
        <Select
          label="Gender"
          value={form.gender}
          onChange={set('gender')}
          options={GENDER_OPTIONS}
          placeholder="Select gender"
        />
        <Input
          label="Date of Birth"
          type="date"
          value={form.dateOfBirth}
          onChange={set('dateOfBirth')}
        />
        <Select
          label="Blood Group"
          value={form.bloodGroup}
          onChange={set('bloodGroup')}
          options={BLOOD_OPTIONS}
          placeholder="Select blood group"
        />
        <Input
          label="Nationality"
          value={form.nationality}
          onChange={set('nationality')}
          placeholder="e.g. Indian"
        />
      </div>

      {/* ── Contact ── */}
      <SectionHeading>Contact</SectionHeading>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Input
          label="Work Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="e.g. rahul@school.edu"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="e.g. +91 98765 43210"
        />
        <Input
          label="Alternate Phone"
          type="tel"
          value={form.alternatePhone}
          onChange={set('alternatePhone')}
          placeholder="Optional"
        />
      </div>

      {/* ── Employment ── */}
      <SectionHeading>Employment</SectionHeading>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Input
          label="Employee Number"
          value={form.employeeNumber}
          onChange={set('employeeNumber')}
          placeholder="e.g. EMP-0042"
        />
        <Select
          label="Status"
          value={form.employmentStatus}
          onChange={set('employmentStatus')}
          options={STATUS_OPTIONS}
          placeholder="Select status"
        />
        <Select
          label="Employment Type"
          value={form.employmentType}
          onChange={set('employmentType')}
          options={EMP_TYPE_OPTIONS}
          placeholder="Select type"
        />
        <Input
          label="Work Location"
          value={form.workLocation}
          onChange={set('workLocation')}
          placeholder="e.g. Main Campus"
        />
        <Select
          label="Department"
          value={form.departmentId}
          onChange={set('departmentId')}
          options={(departments ?? []).map((d) => ({ label: d.name, value: d.id }))}
          placeholder="Select department"
        />
        <Select
          label="Designation"
          value={form.designationId}
          onChange={set('designationId')}
          options={(opts?.designations ?? []).map((d) => ({ label: d.name, value: d.id }))}
          placeholder={optsLoading ? 'Loading…' : 'Select designation'}
        />
        <Select
          label="Employee Type"
          value={form.employeeTypeId}
          onChange={set('employeeTypeId')}
          options={(opts?.employeeTypes ?? []).map((d) => ({
            label: `${d.name} (${d.category === 'TEACHING' ? 'Teaching' : 'Non-Teaching'})`,
            value: d.id,
          }))}
          placeholder={optsLoading ? 'Loading…' : 'Select employee type'}
        />
        <Select
          label="Campus"
          value={form.campusId}
          onChange={set('campusId')}
          options={(opts?.campuses ?? []).map((d) => ({ label: d.name, value: d.id }))}
          placeholder={optsLoading ? 'Loading…' : 'Select campus'}
        />
        <Input
          label="Joining Date"
          type="date"
          value={form.joiningDate}
          onChange={set('joiningDate')}
        />
        <Input
          label="Notice Period (days)"
          type="number"
          min={0}
          value={form.noticePeriodDays}
          onChange={set('noticePeriodDays')}
          placeholder="e.g. 30"
        />
      </div>

      {/* ── Key Dates ── */}
      <SectionHeading>Key Dates</SectionHeading>
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Input label="Probation Start"    type="date" value={form.probationStart}   onChange={set('probationStart')}   />
        <Input label="Probation End"      type="date" value={form.probationEnd}     onChange={set('probationEnd')}     />
        <Input label="Confirmation Date"  type="date" value={form.confirmationDate} onChange={set('confirmationDate')} />
        <div /> {/* spacer */}
        <Input label="Contract Start"     type="date" value={form.contractStart}    onChange={set('contractStart')}    />
        <Input label="Contract End"       type="date" value={form.contractEnd}      onChange={set('contractEnd')}      />
        <Input label="Leaving Date"       type="date" value={form.leavingDate}      onChange={set('leavingDate')}      />
        <Input label="Leaving Reason"     value={form.leavingReason}               onChange={set('leavingReason')} placeholder="Optional" />
      </div>
    </Modal>
  );
}
