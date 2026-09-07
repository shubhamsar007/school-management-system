'use client';

import * as React from 'react';
import { Modal, Button, Input, Select, Textarea, FormField } from '@/components/ui';
import { useCreateEnquiry } from '@/lib/hooks/use-admissions';
import { useOrganization, useAcademicYears, useClasses, useCampuses } from '@/lib/hooks/use-academics';

interface AddEnquiryModalProps {
  open: boolean;
  onClose: () => void;
}

const SOURCE_OPTIONS = [
  { label: 'Walk-in', value: 'WALK_IN' },
  { label: 'Phone', value: 'PHONE' },
  { label: 'Website', value: 'WEBSITE' },
  { label: 'Referral', value: 'REFERRAL' },
  { label: 'Social Media', value: 'SOCIAL_MEDIA' },
  { label: 'Advertisement', value: 'ADVERTISEMENT' },
  { label: 'Other', value: 'OTHER' },
];

interface FormState {
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  source: string;
  academicYearId: string;
  campusId: string;
  classInterestedId: string;
  notes: string;
}

const INITIAL: FormState = {
  studentName: '',
  parentName: '',
  phone: '',
  email: '',
  source: '',
  academicYearId: '',
  campusId: '',
  classInterestedId: '',
  notes: '',
};

export function AddEnquiryModal({ open, onClose }: AddEnquiryModalProps) {
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const { data: org } = useOrganization();
  const { data: academicYears } = useAcademicYears(org?.id);
  const { data: campuses } = useCampuses(org?.id);
  const { data: classes } = useClasses();
  const createEnquiry = useCreateEnquiry();

  const set = (field: keyof FormState) => (val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.studentName.trim()) e.studentName = 'Student name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.source) e.source = 'Source is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleClose() {
    setForm(INITIAL);
    setErrors({});
    onClose();
  }

  async function handleSubmit() {
    if (!validate()) return;

    await createEnquiry.mutateAsync({
      studentName: form.studentName.trim(),
      parentName: form.parentName.trim() || undefined,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      source: form.source,
      academicYearId: form.academicYearId || undefined,
      campusId: form.campusId || undefined,
      classInterestedId: form.classInterestedId || undefined,
      notes: form.notes.trim() || undefined,
    });

    handleClose();
  }

  const yearOptions = [
    { label: 'Select academic year', value: '' },
    ...(academicYears ?? []).map((y) => ({ label: y.name, value: y.id })),
  ];

  const campusOptions = [
    { label: 'Select campus', value: '' },
    ...(campuses ?? []).map((c) => ({ label: c.name, value: c.id })),
  ];

  const classOptions = [
    { label: 'Select class', value: '' },
    ...(classes ?? []).map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Admission Enquiry"
      description="Capture a new enquiry from a prospective applicant."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createEnquiry.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createEnquiry.isPending}>
            {createEnquiry.isPending ? 'Saving…' : 'Save Enquiry'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Applicant section */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8a929b', textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid #f0f2f4' }}>
          Applicant
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Student Name" required error={errors.studentName}>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={form.studentName}
              onChange={(e) => set('studentName')(e.target.value)}
            />
          </FormField>
          <FormField label="Parent / Guardian Name" error={errors.parentName}>
            <Input
              placeholder="e.g. Rajesh Sharma"
              value={form.parentName}
              onChange={(e) => set('parentName')(e.target.value)}
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Phone" required error={errors.phone}>
            <Input
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
            />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <Input
              type="email"
              placeholder="parent@email.com"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
            />
          </FormField>
        </div>

        {/* Admission details section */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8a929b', textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid #f0f2f4', marginTop: 4 }}>
          Admission Details
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Source" required error={errors.source}>
            <Select
              options={[{ label: 'Select source', value: '' }, ...SOURCE_OPTIONS]}
              value={form.source}
              onChange={(e) => set('source')(e.target.value)}
            />
          </FormField>
          <FormField label="Class Interested In">
            <Select
              options={classOptions}
              value={form.classInterestedId}
              onChange={(e) => set('classInterestedId')(e.target.value)}
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Academic Year">
            <Select
              options={yearOptions}
              value={form.academicYearId}
              onChange={(e) => set('academicYearId')(e.target.value)}
            />
          </FormField>
          <FormField label="Campus">
            <Select
              options={campusOptions}
              value={form.campusId}
              onChange={(e) => set('campusId')(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <Textarea
            placeholder="Any additional information…"
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
            rows={3}
          />
        </FormField>

        {createEnquiry.isError && (
          <div style={{ fontSize: 13, color: '#b3261e', background: '#fef7f7', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px' }}>
            Failed to save enquiry. Please try again.
          </div>
        )}
      </div>
    </Modal>
  );
}
