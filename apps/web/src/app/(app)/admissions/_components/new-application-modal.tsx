'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Modal, Button, Input, Select, FormField, Badge } from '@/components/ui';
import { useCreateApplication, useEnquiries, type Enquiry } from '@/lib/hooks/use-admissions';
import { useOrganization, useAcademicYears, useClasses } from '@/lib/hooks/use-academics';

interface NewApplicationModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-link to a specific enquiry (e.g. opened from enquiry detail) */
  prefillEnquiryId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateAppNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ADM-${year}-${rand}`;
}

const ENQ_STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  NEW: 'pending', CONTACTED: 'default', VISITED: 'active', APPLIED: 'active',
};

// ─── Step 1 — Application details ─────────────────────────────────────────────

interface Step1Props {
  appNumber: string;
  setAppNumber: (v: string) => void;
  enquirySearch: string;
  setEnquirySearch: (v: string) => void;
  selectedEnquiry: Enquiry | null;
  setSelectedEnquiry: (e: Enquiry | null) => void;
  enquiries: Enquiry[];
  enquiriesLoading: boolean;
  errors: Partial<Record<string, string>>;
}

function Step1({
  appNumber, setAppNumber, enquirySearch, setEnquirySearch,
  selectedEnquiry, setSelectedEnquiry, enquiries, enquiriesLoading, errors,
}: Step1Props) {
  const [showList, setShowList] = React.useState(false);

  const filtered = enquiries.filter((e) =>
    !enquirySearch ||
    e.studentName.toLowerCase().includes(enquirySearch.toLowerCase()) ||
    (e.parentName ?? '').toLowerCase().includes(enquirySearch.toLowerCase()) ||
    e.phone.includes(enquirySearch),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8a929b', textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid #f0f2f4' }}>
        Application Details
      </div>

      <FormField label="Application Number" required error={errors.applicationNumber}>
        <Input
          value={appNumber}
          onChange={(e) => setAppNumber(e.target.value)}
          placeholder="e.g. ADM-2026-10042"
        />
      </FormField>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8a929b', textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid #f0f2f4', marginTop: 4 }}>
        Link to Enquiry <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#8a929b' }}>— optional</span>
      </div>

      {selectedEnquiry ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: '#f3f7fc', border: '1px solid #c8daf5' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#14181c' }}>{selectedEnquiry.studentName}</div>
            <div style={{ fontSize: 11, color: '#6b7480' }}>{selectedEnquiry.parentName ?? ''} · {selectedEnquiry.phone}</div>
          </div>
          <Badge variant={ENQ_STATUS_VARIANT[selectedEnquiry.status] ?? 'default'}>{selectedEnquiry.status}</Badge>
          <button
            onClick={() => { setSelectedEnquiry(null); setEnquirySearch(''); }}
            style={{ fontSize: 11, color: '#b3261e', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8a929b', pointerEvents: 'none' }} />
            <input
              value={enquirySearch}
              onChange={(e) => { setEnquirySearch(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              placeholder="Search by name or phone…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 12px 8px 32px', fontSize: 13, borderRadius: 8,
                border: '1px solid #d7dce1', outline: 'none', color: '#14181c',
              }}
            />
          </div>
          {showList && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#fff', border: '1px solid #e6e8eb', borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto',
              marginTop: 4,
            }}>
              {enquiriesLoading ? (
                <div style={{ padding: '12px 14px', fontSize: 13, color: '#8a929b' }}>Loading…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 13, color: '#8a929b' }}>No enquiries found.</div>
              ) : (
                filtered.slice(0, 8).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setSelectedEnquiry(e); setEnquirySearch(''); setShowList(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f4f6f8',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#14181c' }}>{e.studentName}</div>
                      <div style={{ fontSize: 11, color: '#8a929b' }}>{e.parentName ?? ''} · {e.phone}</div>
                    </div>
                    <Badge variant={ENQ_STATUS_VARIANT[e.status] ?? 'default'}>{e.status}</Badge>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 2 — Class & year ────────────────────────────────────────────────────

interface Step2Props {
  academicYearId: string;
  setAcademicYearId: (v: string) => void;
  classId: string;
  setClassId: (v: string) => void;
  yearOptions: { label: string; value: string }[];
  classOptions: { label: string; value: string }[];
  errors: Partial<Record<string, string>>;
}

function Step2({ academicYearId, setAcademicYearId, classId, setClassId, yearOptions, classOptions, errors }: Step2Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8a929b', textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid #f0f2f4' }}>
        Academic Details
      </div>
      <FormField label="Academic Year" required error={errors.academicYearId}>
        <Select options={yearOptions} value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} />
      </FormField>
      <FormField label="Applying For Class" required error={errors.classId}>
        <Select options={classOptions} value={classId} onChange={(e) => setClassId(e.target.value)} />
      </FormField>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
      {['Application Details', 'Academic Details'].map((label, idx) => {
        const done = step > idx + 1;
        const active = step === idx + 1;
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: done || active ? '#3f6152' : '#e6e8eb',
                color: done || active ? '#fff' : '#8a929b',
              }}>
                {done ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#14181c' : '#8a929b' }}>
                {label}
              </span>
            </div>
            {idx < 1 && (
              <div style={{ flex: 1, height: 1, background: done ? '#3f6152' : '#e6e8eb', margin: '0 10px' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function NewApplicationModal({ open, onClose, prefillEnquiryId }: NewApplicationModalProps) {
  const [step, setStep] = React.useState(1);

  // Step 1
  const [appNumber, setAppNumber] = React.useState('');
  const [enquirySearch, setEnquirySearch] = React.useState('');
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<Enquiry | null>(null);

  // Step 2
  const [academicYearId, setAcademicYearId] = React.useState('');
  const [classId, setClassId] = React.useState('');

  const [errors, setErrors] = React.useState<Partial<Record<string, string>>>({});

  const { data: org } = useOrganization();
  const { data: academicYears } = useAcademicYears(org?.id);
  const { data: classes } = useClasses();
  const { data: enquiryData, isLoading: enquiriesLoading } = useEnquiries({ limit: 50 });
  const createApplication = useCreateApplication();

  // Prefill enquiry if provided
  React.useEffect(() => {
    if (open) {
      setAppNumber(generateAppNumber());
      setStep(1);
    }
  }, [open]);

  React.useEffect(() => {
    if (prefillEnquiryId && enquiryData?.data) {
      const found = enquiryData.data.find((e) => e.id === prefillEnquiryId);
      if (found) setSelectedEnquiry(found);
    }
  }, [prefillEnquiryId, enquiryData]);

  function handleClose() {
    setStep(1);
    setAppNumber('');
    setEnquirySearch('');
    setSelectedEnquiry(null);
    setAcademicYearId('');
    setClassId('');
    setErrors({});
    onClose();
  }

  function validateStep1(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (!appNumber.trim()) e.applicationNumber = 'Application number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (!academicYearId) e.academicYearId = 'Academic year is required';
    if (!classId) e.classId = 'Class is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    await createApplication.mutateAsync({
      applicationNumber: appNumber.trim(),
      academicYearId,
      classId,
      enquiryId: selectedEnquiry?.id,
    });
    handleClose();
  }

  const yearOptions = [
    { label: 'Select academic year', value: '' },
    ...(academicYears ?? []).map((y) => ({ label: y.name, value: y.id })),
  ];

  const classOptions = [
    { label: 'Select class', value: '' },
    ...(classes ?? []).map((c) => ({ label: c.name, value: c.id })),
  ];

  const enquiries = enquiryData?.data ?? [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Application"
      description="Create a new admission application."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={step === 1 ? handleClose : () => setStep(1)} disabled={createApplication.isPending}>
            {step === 1 ? 'Cancel' : '← Back'}
          </Button>
          {step === 1 ? (
            <Button variant="primary" onClick={handleNext}>Next →</Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={createApplication.isPending}>
              {createApplication.isPending ? 'Creating…' : 'Create Application'}
            </Button>
          )}
        </>
      }
    >
      <StepBar step={step} />

      {step === 1 ? (
        <Step1
          appNumber={appNumber}
          setAppNumber={setAppNumber}
          enquirySearch={enquirySearch}
          setEnquirySearch={setEnquirySearch}
          selectedEnquiry={selectedEnquiry}
          setSelectedEnquiry={setSelectedEnquiry}
          enquiries={enquiries}
          enquiriesLoading={enquiriesLoading}
          errors={errors}
        />
      ) : (
        <Step2
          academicYearId={academicYearId}
          setAcademicYearId={setAcademicYearId}
          classId={classId}
          setClassId={setClassId}
          yearOptions={yearOptions}
          classOptions={classOptions}
          errors={errors}
        />
      )}

      {createApplication.isError && (
        <div style={{ marginTop: 12, fontSize: 13, color: '#b3261e', background: '#fef7f7', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px' }}>
          Failed to create application. The application number may already be in use.
        </div>
      )}
    </Modal>
  );
}
