'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { StepWizard, type WizardStep } from '@/components/ui/step-wizard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useCreateTeacher, useFormOptions, useEmployeeDepartments, type CreateEmployeePayload } from '@/lib/hooks/use-teachers';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: WizardStep[] = [
  { id: 'personal',   label: 'Personal'   },
  { id: 'employment', label: 'Employment' },
  { id: 'review',     label: 'Review'     },
];

const GENDER_OPTIONS   = [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }, { label: 'Other', value: 'OTHER' }];
const BLOOD_OPTIONS    = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ label: v, value: v }));
const EMP_TYPE_OPTIONS = [
  { label: 'Full-time', value: 'FULL_TIME' },
  { label: 'Part-time', value: 'PART_TIME' },
  { label: 'Contract',  value: 'CONTRACT'  },
  { label: 'Visiting',  value: 'VISITING'  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  firstName: string; middleName: string; lastName: string;
  gender: string; dateOfBirth: string; bloodGroup: string;
  nationality: string; email: string; phone: string; alternatePhone: string;
  employeeNumber: string; joiningDate: string; employmentType: string;
  workLocation: string; departmentId: string; designationId: string;
  employeeTypeId: string; campusId: string;
}

const EMPTY: FormState = {
  firstName: '', middleName: '', lastName: '', gender: '',
  dateOfBirth: '', bloodGroup: '', nationality: '', email: '',
  phone: '', alternatePhone: '', employeeNumber: '', joiningDate: '',
  employmentType: '', workLocation: '', departmentId: '', designationId: '',
  employeeTypeId: '', campusId: '',
};

interface Errors {
  firstName?: string | undefined;
  lastName?: string | undefined;
  employeeNumber?: string | undefined;
  joiningDate?: string | undefined;
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-[#f2f4f6]">
      <span style={{ width: 160, flexShrink: 0, fontSize: '12px', color: '#8a929b' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#14181c', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AddEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddEmployeeModal({ open, onClose }: AddEmployeeModalProps) {
  const [step, setStep]     = React.useState(0);
  const [form, setForm]     = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});

  const toast                      = useToast();
  const create                     = useCreateTeacher();
  const { data: opts, isLoading: optsLoading } = useFormOptions();
  const { data: departments }      = useEmployeeDepartments();

  React.useEffect(() => {
    if (open) { setStep(0); setForm(EMPTY); setErrors({}); }
  }, [open]);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(stepIdx: number): boolean {
    const errs: Errors = {};
    if (stepIdx === 0) {
      if (!form.firstName.trim()) errs.firstName = 'First name is required';
      if (!form.lastName.trim())  errs.lastName  = 'Last name is required';
    }
    if (stepIdx === 1) {
      if (!form.employeeNumber.trim()) errs.employeeNumber = 'Employee number is required';
      if (!form.joiningDate)           errs.joiningDate    = 'Joining date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validate(step)) setStep((s) => s + 1); }
  function back() { setErrors({}); setStep((s) => s - 1); }

  async function handleSubmit() {
    // Build payload imperatively to satisfy exactOptionalPropertyTypes
    const payload: CreateEmployeePayload = {
      firstName:      form.firstName.trim(),
      lastName:       form.lastName.trim(),
      employeeNumber: form.employeeNumber.trim(),
      joiningDate:    form.joiningDate,
    };
    if (form.middleName.trim())     payload.middleName     = form.middleName.trim();
    if (form.gender)                payload.gender         = form.gender;
    if (form.dateOfBirth)           payload.dateOfBirth    = form.dateOfBirth;
    if (form.bloodGroup)            payload.bloodGroup     = form.bloodGroup;
    if (form.nationality.trim())    payload.nationality    = form.nationality.trim();
    if (form.email.trim())          payload.email          = form.email.trim();
    if (form.phone.trim())          payload.phone          = form.phone.trim();
    if (form.alternatePhone.trim()) payload.alternatePhone = form.alternatePhone.trim();
    if (form.employeeTypeId)        payload.employeeTypeId = form.employeeTypeId;
    if (form.departmentId)          payload.departmentId   = form.departmentId;
    if (form.designationId)         payload.designationId  = form.designationId;
    if (form.campusId)              payload.campusId       = form.campusId;

    try {
      await create.mutateAsync(payload);
      const name = [form.firstName, form.lastName].filter(Boolean).join(' ');
      toast.success(`${name} has been added successfully.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as any)?.message ?? 'Failed to add employee. Please try again.');
    }
  }

  // Lookup helpers for Review step
  const deptName  = (departments ?? []).find((d) => d.id === form.departmentId)?.name;
  const desigName = opts?.designations.find((d) => d.id === form.designationId)?.name;
  const etName    = opts?.employeeTypes.find((d) => d.id === form.employeeTypeId)?.name;
  const campName  = opts?.campuses.find((d) => d.id === form.campusId)?.name;
  const etLabel   = EMP_TYPE_OPTIONS.find((o) => o.value === form.employmentType)?.label;

  const footer = (
    <>
      {step > 0 && (
        <Button variant="secondary" onClick={back} disabled={create.isPending}>Back</Button>
      )}
      <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
      {step < 2 ? (
        <Button variant="primary" onClick={next}>Continue</Button>
      ) : (
        <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
          {create.isPending ? 'Adding…' : 'Add Employee'}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Employee"
      description="Enter the employee's details to create their profile."
      size="lg"
      footer={footer}
    >
      <div style={{ marginBottom: 28 }}>
        <StepWizard steps={STEPS} currentStep={step} />
      </div>

      {/* ── Step 0: Personal ── */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <Input
            label="First Name"
            required
            value={form.firstName}
            onChange={set('firstName')}
            placeholder="e.g. Rahul"
            {...(errors.firstName && { error: errors.firstName })}
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
            placeholder="e.g. Sharma"
            {...(errors.lastName && { error: errors.lastName })}
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
          <div />
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
      )}

      {/* ── Step 1: Employment ── */}
      {step === 1 && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <Input
            label="Employee Number"
            required
            value={form.employeeNumber}
            onChange={set('employeeNumber')}
            placeholder="e.g. EMP-0042"
            {...(errors.employeeNumber && { error: errors.employeeNumber })}
          />
          <Input
            label="Joining Date"
            required
            type="date"
            value={form.joiningDate}
            onChange={set('joiningDate')}
            {...(errors.joiningDate && { error: errors.joiningDate })}
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
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Personal
          </p>
          <ReviewRow label="Name"            value={[form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ')} />
          <ReviewRow label="Gender"          value={form.gender} />
          <ReviewRow label="Date of Birth"   value={form.dateOfBirth} />
          <ReviewRow label="Blood Group"     value={form.bloodGroup} />
          <ReviewRow label="Nationality"     value={form.nationality} />
          <ReviewRow label="Email"           value={form.email} />
          <ReviewRow label="Phone"           value={form.phone} />
          <ReviewRow label="Alternate Phone" value={form.alternatePhone} />

          <p style={{ fontSize: '12px', fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 20, marginBottom: 8 }}>
            Employment
          </p>
          <ReviewRow label="Employee Number" value={form.employeeNumber} />
          <ReviewRow label="Joining Date"    value={form.joiningDate} />
          <ReviewRow label="Employment Type" value={etLabel} />
          <ReviewRow label="Work Location"   value={form.workLocation} />
          <ReviewRow label="Department"      value={deptName} />
          <ReviewRow label="Designation"     value={desigName} />
          <ReviewRow label="Employee Type"   value={etName} />
          <ReviewRow label="Campus"          value={campName} />
        </div>
      )}
    </Modal>
  );
}
