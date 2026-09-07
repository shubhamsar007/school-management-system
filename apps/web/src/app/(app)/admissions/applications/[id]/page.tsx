'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge, Button, Spinner, Textarea, FormField, Modal } from '@/components/ui';
import {
  useApplication, useReviewApplication, useApproveApplication,
  useRejectApplication, useSubmitApplication,
  type Application, type ApplicationDocument,
} from '@/lib/hooks/use-admissions';

// ─── Maps ─────────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  DRAFT: 'default', SUBMITTED: 'pending', UNDER_REVIEW: 'active',
  APPROVED: 'graduated', REJECTED: 'left',
};

const DOC_STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  PENDING: 'pending', VERIFIED: 'graduated', REJECTED: 'left',
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const WORKFLOW_STEPS = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];

function WorkflowProgress({ status }: { status: string }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(status);
  const isRejected = status === 'REJECTED';

  return (
    <div className="flex items-center gap-0">
      {WORKFLOW_STEPS.map((step, idx) => {
        const done = currentIdx > idx;
        const active = currentIdx === idx;
        const label = step.replace(/_/g, ' ');
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 80 }}>
              <div
                className="flex items-center justify-center rounded-full text-white"
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  background: isRejected && idx === currentIdx
                    ? '#b3261e'
                    : done || active
                      ? '#146b41'
                      : '#d7dce1',
                  fontSize: 12, fontWeight: 700,
                }}
              >
                {done ? <CheckCircle size={14} /> : active && isRejected ? <XCircle size={14} /> : idx + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: done || active ? '#14181c' : '#8a929b', textAlign: 'center', letterSpacing: '0.04em' }}>
                {label}
              </span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div
                style={{
                  flex: 1, height: 2, background: done ? '#146b41' : '#e6e8eb',
                  marginTop: -14,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Document row ─────────────────────────────────────────────────────────────

function DocumentRow({ doc }: { doc: ApplicationDocument }) {
  const Icon =
    doc.verificationStatus === 'VERIFIED'
      ? CheckCircle
      : doc.verificationStatus === 'REJECTED'
        ? XCircle
        : Clock;

  const color =
    doc.verificationStatus === 'VERIFIED'
      ? '#146b41'
      : doc.verificationStatus === 'REJECTED'
        ? '#b3261e'
        : '#8a5a00';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#f0f2f4] last:border-0">
      <FileText size={15} style={{ color: '#8a929b', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 500, color: '#14181c' }}>
          {doc.documentType.replace(/_/g, ' ')}
        </div>
        {doc.remarks && (
          <div style={{ fontSize: 11, color: '#8a929b', marginTop: 1 }}>{doc.remarks}</div>
        )}
      </div>
      <div className="flex items-center gap-1.5" style={{ color, flexShrink: 0 }}>
        <Icon size={13} />
        <span style={{ fontSize: 11, fontWeight: 600 }}>{doc.verificationStatus}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: application, isLoading, isError } = useApplication(id);

  const submitApp = useSubmitApplication();
  const reviewApp = useReviewApplication();
  const approveApp = useApproveApplication();
  const rejectApp = useRejectApplication();

  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="p-8 text-center text-[#6b7480]">
        Application not found.{' '}
        <button className="text-[#2b5fa8] underline" onClick={() => router.back()}>
          Go back
        </button>
      </div>
    );
  }

  const applicantName = application.enquiry?.studentName ?? application.applicationNumber;
  const createdDate = new Date(application.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const documents: ApplicationDocument[] = application.documents ?? [];

  async function handleReject() {
    await rejectApp.mutateAsync({ id: application!.id, data: { rejectionReason: rejectionReason.trim() || undefined } });
    setShowRejectDialog(false);
    setRejectionReason('');
  }

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => router.push('/admissions')}
        className="flex items-center gap-1.5 text-sm text-[#6b7480] hover:text-[#14181c] mb-5 transition-colors"
      >
        <ArrowLeft size={15} />
        Admissions Pipeline
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#14181c', margin: 0 }}>
            {applicantName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={STATUS_VARIANT[application.status] ?? 'default'}>
              {application.status.replace(/_/g, ' ')}
            </Badge>
            <span style={{ fontSize: 12, color: '#8a929b' }}>
              {application.applicationNumber} · {application.class?.name ?? '—'} · {application.academicYear?.name ?? '—'}
            </span>
          </div>
        </div>

        {/* Action buttons by status */}
        <div className="flex gap-2">
          {application.status === 'DRAFT' && (
            <Button
              variant="primary"
              onClick={() => submitApp.mutate(application.id)}
              disabled={submitApp.isPending}
            >
              {submitApp.isPending ? 'Submitting…' : 'Submit Application'}
            </Button>
          )}
          {application.status === 'SUBMITTED' && (
            <Button
              variant="primary"
              onClick={() => reviewApp.mutate(application.id)}
              disabled={reviewApp.isPending}
            >
              {reviewApp.isPending ? 'Updating…' : 'Start Review'}
            </Button>
          )}
          {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
            <>
              <Button
                variant="primary"
                onClick={() => approveApp.mutate(application.id)}
                disabled={approveApp.isPending}
                style={{ background: '#146b41' }}
              >
                {approveApp.isPending ? 'Approving…' : 'Approve'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRejectDialog(true)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Workflow progress */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm mb-5">
        <h2 style={{ fontSize: 12, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Application Progress
        </h2>
        <WorkflowProgress status={application.status} />
        {application.status === 'REJECTED' && application.rejectionReason && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#fef7f7] border border-[#f5c6c6] p-3">
            <AlertCircle size={14} style={{ color: '#b3261e', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b3261e', marginBottom: 2 }}>
                Rejection Reason
              </div>
              <div style={{ fontSize: 13, color: '#14181c' }}>{application.rejectionReason}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Application details + documents */}
        <div className="col-span-2 flex flex-col gap-5">
          {/* Applicant info */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', marginBottom: 12 }}>
              Applicant Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Applicant Name', value: applicantName },
                { label: 'Parent / Guardian', value: application.enquiry?.parentName ?? '—' },
                { label: 'Phone', value: application.enquiry?.phone ?? '—' },
                { label: 'Application No', value: application.applicationNumber },
                { label: 'Class Applying For', value: application.class?.name ?? '—' },
                { label: 'Academic Year', value: application.academicYear?.name ?? '—' },
                { label: 'Application Date', value: createdDate },
                {
                  label: 'Submitted On',
                  value: application.submittedAt
                    ? new Date(application.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                    : 'Not submitted',
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#14181c' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c' }}>
                Documents
              </h2>
              <Badge variant={
                documents.every((d) => d.verificationStatus === 'VERIFIED')
                  ? 'graduated'
                  : documents.some((d) => d.verificationStatus === 'REJECTED')
                    ? 'left'
                    : 'pending'
              }>
                {documents.filter((d) => d.verificationStatus === 'VERIFIED').length} / {documents.length} verified
              </Badge>
            </div>
            {documents.length === 0 ? (
              <p style={{ fontSize: 13, color: '#8a929b' }}>No documents attached yet.</p>
            ) : (
              documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
            )}
          </div>
        </div>

        {/* Right: linked enquiry */}
        <div className="flex flex-col gap-5">
          {application.enquiry && (
            <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', marginBottom: 12 }}>
                Source Enquiry
              </h2>
              <div
                className="rounded-lg border border-[#f0f2f4] p-3 cursor-pointer hover:bg-[#f9fafb] transition-colors"
                onClick={() => router.push(`/admissions/enquiries/${application.enquiry!.id}`)}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: '#14181c' }}>
                  {application.enquiry.studentName}
                </div>
                <div style={{ fontSize: 12, color: '#8a929b' }}>{application.enquiry.phone}</div>
                <div className="mt-1.5 text-xs text-[#2b5fa8] font-medium">View enquiry →</div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', marginBottom: 12 }}>
              Timeline
            </h2>
            {[
              { label: 'Created', date: application.createdAt },
              { label: 'Submitted', date: application.submittedAt },
              { label: 'Approved', date: application.approvedAt },
              { label: 'Rejected', date: application.rejectedAt },
            ]
              .filter((t) => t.date)
              .map(({ label, date }) => (
                <div key={label} className="flex items-start gap-2 mb-3 last:mb-0">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3f6152', flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 12, color: '#14181c' }}>
                      {new Date(date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Reject dialog */}
      <Modal
        open={showRejectDialog}
        onClose={() => { setShowRejectDialog(false); setRejectionReason(''); }}
        title="Reject Application"
        description={`Reject the application for ${applicantName}? This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowRejectDialog(false); setRejectionReason(''); }} disabled={rejectApp.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={rejectApp.isPending}>
              {rejectApp.isPending ? 'Rejecting…' : 'Reject Application'}
            </Button>
          </>
        }
      >
        <FormField label="Rejection Reason (optional)">
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain the reason for rejection…"
            rows={3}
          />
        </FormField>
      </Modal>
    </div>
  );
}
