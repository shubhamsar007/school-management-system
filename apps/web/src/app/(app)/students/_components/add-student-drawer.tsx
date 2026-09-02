'use client';

import * as React from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useCreateStudent, useCreateEnrollment, useCreateGuardian } from '@/lib/hooks/use-students';
import { useClasses, useSections, useOrganization, useAcademicYears, useCampuses } from '@/lib/hooks/use-academics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 – Personal
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  nationality: string;
  // Step 2 – Admission
  admissionNumber: string;
  registrationNumber: string;
  admissionDate: string;
  joiningDate: string;
  email: string;
  phone: string;
  // Step 3 – Enrollment
  academicYearId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  enrollmentDate: string;
  // Step 4 – Guardian
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
  guardianOccupation: string;
  guardianIsEmergency: boolean;
  guardianCanPickup: boolean;
}

const INITIAL: FormData = {
  firstName: '', middleName: '', lastName: '',
  dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian',
  admissionNumber: '', registrationNumber: '', admissionDate: '', joiningDate: '', email: '', phone: '',
  academicYearId: '', campusId: '', classId: '', sectionId: '', rollNumber: '', enrollmentDate: '',
  guardianFirstName: '', guardianLastName: '', guardianPhone: '', guardianEmail: '',
  guardianRelationship: '', guardianOccupation: '', guardianIsEmergency: false, guardianCanPickup: false,
};

const STEPS = ['Personal', 'Admission', 'Enrollment', 'Guardian'];

// ─── Shared field primitives ──────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7480', marginBottom: 5 }}>
      {children}{required && <span style={{ color: '#b3261e', marginLeft: 2 }}>*</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 8,
  border: '1px solid #d8dde3', fontSize: 13.5, color: '#14181c',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};

function Input({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input style={inputStyle} {...props} />
    </div>
  );
}

function Select({ label, required, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select style={{ ...inputStyle, appearance: 'auto' }} {...props}>
        {children}
      </select>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, color: '#14181c' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#2e6644' }} />
      {label}
    </label>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 12, marginTop: 4, ...style }}>{children}</p>;
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepPersonal({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Personal Information</SectionTitle>
      <Grid>
        <Input label="First Name" required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Aarav" />
        <Input label="Middle Name" value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Optional" />
      </Grid>
      <Input label="Last Name" required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Mehta" />
      <Grid>
        <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
        <Select label="Gender" value={form.gender} onChange={e => set('gender', e.target.value)}>
          <option value="">Select gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </Select>
      </Grid>
      <Grid>
        <Select label="Blood Group" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
          <option value="">Select blood group</option>
          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
        </Select>
        <Input label="Nationality" value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Indian" />
      </Grid>
    </div>
  );
}

function StepAdmission({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Admission Details</SectionTitle>
      <Grid>
        <Input label="Admission Number" required value={form.admissionNumber} onChange={e => set('admissionNumber', e.target.value)} placeholder="ADM-2026-001" />
        <Input label="Registration Number" value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} placeholder="Optional" />
      </Grid>
      <Grid>
        <Input label="Admission Date" required type="date" value={form.admissionDate} onChange={e => set('admissionDate', e.target.value)} />
        <Input label="Joining Date" type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
      </Grid>
      <SectionTitle style={{ marginTop: 8 }}>Contact</SectionTitle>
      <Grid>
        <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@example.com" />
        <Input label="Phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98XXX XXXXX" />
      </Grid>
    </div>
  );
}

function StepEnrollment({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  const { data: org }     = useOrganization();
  const { data: years }   = useAcademicYears(org?.id);
  const { data: campuses } = useCampuses(org?.id);
  const { data: classes } = useClasses();
  const { data: sections } = useSections(form.classId || null);

  // Auto-select if single campus
  React.useEffect(() => {
    if (campuses?.length === 1 && !form.campusId) set('campusId', campuses[0]!.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campuses]);

  // Auto-select current year
  React.useEffect(() => {
    if (years && !form.academicYearId) {
      const current = years.find(y => y.isCurrent) ?? years[0];
      if (current) set('academicYearId', current.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  // Auto-set enrollment date from joining/admission date
  React.useEffect(() => {
    if (!form.enrollmentDate) {
      if (form.joiningDate) set('enrollmentDate', form.joiningDate);
      else if (form.admissionDate) set('enrollmentDate', form.admissionDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Enrollment Details</SectionTitle>
      <Grid>
        <Select label="Academic Year" required value={form.academicYearId} onChange={e => set('academicYearId', e.target.value)}>
          <option value="">Select year</option>
          {years?.map(y => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (Current)' : ''}</option>)}
        </Select>
        <Select label="Campus" required value={form.campusId} onChange={e => set('campusId', e.target.value)}>
          <option value="">Select campus</option>
          {campuses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Grid>
      <Grid>
        <Select label="Class" required value={form.classId} onChange={e => { set('classId', e.target.value); set('sectionId', ''); }}>
          <option value="">Select class</option>
          {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Section" required value={form.sectionId} onChange={e => set('sectionId', e.target.value)} disabled={!form.classId}>
          <option value="">{form.classId ? 'Select section' : 'Select class first'}</option>
          {sections?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Grid>
      <Grid>
        <Input label="Roll Number" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} placeholder="01" />
        <Input label="Enrollment Date" required type="date" value={form.enrollmentDate} onChange={e => set('enrollmentDate', e.target.value)} />
      </Grid>
    </div>
  );
}

function StepGuardian({ form, set, setBool }: { form: FormData; set: (k: keyof FormData, v: string) => void; setBool: (k: keyof FormData, v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Primary Guardian</SectionTitle>
      <Grid>
        <Input label="First Name" required value={form.guardianFirstName} onChange={e => set('guardianFirstName', e.target.value)} placeholder="Rohit" />
        <Input label="Last Name" required value={form.guardianLastName} onChange={e => set('guardianLastName', e.target.value)} placeholder="Mehta" />
      </Grid>
      <Grid>
        <Input label="Phone" required type="tel" value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)} placeholder="+91 98XXX XXXXX" />
        <Input label="Email" type="email" value={form.guardianEmail} onChange={e => set('guardianEmail', e.target.value)} placeholder="Optional" />
      </Grid>
      <Grid>
        <Select label="Relationship" required value={form.guardianRelationship} onChange={e => set('guardianRelationship', e.target.value)}>
          <option value="">Select relationship</option>
          {['FATHER','MOTHER','GRANDFATHER','GRANDMOTHER','UNCLE','AUNT','SIBLING','LEGAL_GUARDIAN','OTHER'].map(r => (
            <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase().replace('_', ' ')}</option>
          ))}
        </Select>
        <Input label="Occupation" value={form.guardianOccupation} onChange={e => set('guardianOccupation', e.target.value)} placeholder="Optional" />
      </Grid>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <Checkbox label="Emergency contact" checked={form.guardianIsEmergency} onChange={v => setBool('guardianIsEmergency', v)} />
        <Checkbox label="Authorised to pick up student" checked={form.guardianCanPickup} onChange={v => setBool('guardianCanPickup', v)} />
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#2e6644' : active ? '#2e6644' : '#e6e8eb',
                color: done || active ? '#fff' : '#8a929b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? '#2e6644' : done ? '#2e6644' : '#8a929b', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current ? '#2e6644' : '#e6e8eb', margin: '0 6px', marginBottom: 20 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export function AddStudentDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep]     = React.useState(0);
  const [form, setForm]     = React.useState<FormData>(INITIAL);
  const [error, setError]   = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const createStudent   = useCreateStudent();
  const createEnrollment = useCreateEnrollment();
  const createGuardian  = useCreateGuardian();

  function set(k: keyof FormData, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function setBool(k: keyof FormData, v: boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function reset() {
    setForm(INITIAL);
    setStep(0);
    setError('');
  }

  function close() {
    reset();
    onClose();
  }

  function validate(): string | null {
    if (step === 0) {
      if (!form.firstName.trim()) return 'First name is required.';
      if (!form.lastName.trim()) return 'Last name is required.';
    }
    if (step === 1) {
      if (!form.admissionNumber.trim()) return 'Admission number is required.';
      if (!form.admissionDate) return 'Admission date is required.';
    }
    if (step === 2) {
      if (!form.academicYearId) return 'Academic year is required.';
      if (!form.campusId) return 'Campus is required.';
      if (!form.classId) return 'Class is required.';
      if (!form.sectionId) return 'Section is required.';
      if (!form.enrollmentDate) return 'Enrollment date is required.';
    }
    if (step === 3) {
      if (!form.guardianFirstName.trim()) return 'Guardian first name is required.';
      if (!form.guardianLastName.trim()) return 'Guardian last name is required.';
      if (!form.guardianPhone.trim()) return 'Guardian phone is required.';
      if (!form.guardianRelationship) return 'Guardian relationship is required.';
    }
    return null;
  }

  async function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    // Final submit
    setSaving(true);
    try {
      const student = await createStudent.mutateAsync({
        firstName:          form.firstName,
        ...(form.middleName     ? { middleName: form.middleName }         : {}),
        lastName:           form.lastName,
        ...(form.dateOfBirth    ? { dateOfBirth: form.dateOfBirth }       : {}),
        ...(form.gender         ? { gender: form.gender }                 : {}),
        ...(form.email          ? { email: form.email }                   : {}),
        ...(form.phone          ? { phone: form.phone }                   : {}),
        ...(form.bloodGroup     ? { bloodGroup: form.bloodGroup }         : {}),
        ...(form.nationality    ? { nationality: form.nationality }       : {}),
        admissionNumber:    form.admissionNumber,
        ...(form.registrationNumber ? { registrationNumber: form.registrationNumber } : {}),
        admissionDate:      form.admissionDate,
        ...(form.joiningDate    ? { joiningDate: form.joiningDate }       : {}),
        ...(form.campusId       ? { currentCampusId: form.campusId }      : {}),
      });

      await createEnrollment.mutateAsync({
        studentId: student.id,
        data: {
          academicYearId:  form.academicYearId,
          campusId:        form.campusId,
          classId:         form.classId,
          sectionId:       form.sectionId,
          enrollmentDate:  form.enrollmentDate,
          ...(form.rollNumber ? { rollNumber: form.rollNumber } : {}),
        },
      });

      await createGuardian.mutateAsync({
        studentId: student.id,
        data: {
          firstName:    form.guardianFirstName,
          lastName:     form.guardianLastName,
          phone:        form.guardianPhone,
          ...(form.guardianEmail       ? { email: form.guardianEmail }           : {}),
          ...(form.guardianOccupation  ? { occupation: form.guardianOccupation } : {}),
          relationship: form.guardianRelationship,
          isPrimary:    true,
          isEmergencyContact: form.guardianIsEmergency,
          canPickup:          form.guardianCanPickup,
          canReceiveNotifications: true,
        },
      });

      close();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create student.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40, backdropFilter: 'blur(2px)' }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
        width: '100%', maxWidth: 520,
        background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#14181c', margin: 0 }}>Add Student</h2>
            <p style={{ fontSize: 12.5, color: '#8a929b', margin: '2px 0 0' }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7480', borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>
          <StepIndicator current={step} />

          {step === 0 && <StepPersonal form={form} set={set} />}
          {step === 1 && <StepAdmission form={form} set={set} />}
          {step === 2 && <StepEnrollment form={form} set={set} />}
          {step === 3 && <StepGuardian form={form} set={set} setBool={setBool} />}

          {error && (
            <div style={{ marginTop: 16, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#b3261e' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0ee', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <button
            onClick={() => { setError(''); setStep(s => s - 1); }}
            disabled={step === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid #d8dde3', background: '#fff', fontSize: 13.5, fontWeight: 600, color: step === 0 ? '#c4c9cf' : '#14181c', cursor: step === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={15} /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#a0b5a8' : '#2e6644', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Add Student' : 'Next'}
            {!saving && step < STEPS.length - 1 && <ChevronRight size={15} />}
            {!saving && step === STEPS.length - 1 && <Check size={15} />}
          </button>
        </div>
      </div>
    </>
  );
}
