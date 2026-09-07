'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, FileText, CheckCircle, XCircle, Clock,
  AlertCircle, ShieldCheck, ShieldX, Trash2,
} from 'lucide-react';
import { Badge, Button, Spinner, Textarea, FormField, Modal } from '@/components/ui';
import {
  useApplication, useApplicationDocuments,
  useReviewApplication, useApproveApplication,
  useRejectApplication, useSubmitApplication,
  useVerifyDocument, useRejectDocument, useRemoveDocument,
  type Application, type ApplicationDocument,
} from '@/lib/hooks/use-admissions';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  DRAFT: 'default', SUBMITTED: 'pending', UNDER_REVIEW: 'active',
  APPROVED: 'graduated', REJECTED: 'left',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved', REJECTED: 'Rejected',
};

const WORKFLOW_STEPS = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];

// ─── Completeness ─────────────────────────────────────────────────────────────

interface Check {
  label: string;
  done: boolean;
}

function computeCompleteness(application: Application, documents: ApplicationDocument[]): { score: number; checks: Check[] } {
  const checks: Check[] = [
    { label: 'Application submitted', done: application.status !== 'DRAFT' },
    { label: 'Enquiry linked', done: !!application.enquiry },
    { label: 'Class assigned', done: !!application.classId },
    { label: 'Academic year set', done: !!application.academicYearId },
    { label: 'Documents attached', done: documents.length > 0 },
    {
      label: 'Documents verified',
      done: documents.length > 0 && documents.every((d) => d.verificationStatus === 'VERIFIED'),
    },
  ];
  const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  return { score, checks };
}

// ─── Workflow progress bar ────────────────────────────────────────────────────

function WorkflowProgress({ status }: { status: string }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(status);
  const isRejected = status === 'REJECTED';

  return (
    <div className="flex items-center">
      {WORKFLOW_STEPS.map((step, idx) => {
        const done = !isRejected && currentIdx > idx;
        const active = currentIdx === idx;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 90 }}>
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  background: isRejected && active ? '#b3261e' : done || active ? '#146b41' : '#e6e8eb',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                }}
              >
                {done ? <CheckCircle size={14} /> : isRejected && active ? <XCircle size={14} /> : idx + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center',
                color: done || active ? '#14181c' : '#8a929b',
              }}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#146b41' : '#e6e8eb', marginTop: -14 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Document row (with verify / reject actions) ──────────────────────────────

function DocumentRow({
  doc,
  applicationId,
  canAct,
}: {
  doc: ApplicationDocument;
  applicationId: string;
  canAct: boolean;
}) {
  const verifyDoc = useVerifyDocument();
  const rejectDoc = useRejectDocument();
  const removeDoc = useRemoveDocument();

  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [remarks, setRemarks] = React.useState('');

  const isPending = verifyDoc.isPending || rejectDoc.isPending || removeDoc.isPending;

  const statusIcon = doc.verificationStatus === 'VERIFIED'
    ? <CheckCircle size={13} style={{ color: '#146b41' }} />
    : doc.verificationStatus === 'REJECTED'
      ? <XCircle size={13} style={{ color: '#b3261e' }} />
      : <Clock size={13} style={{ color: '#8a5a00' }} />;

  const statusColor = doc.verificationStatus === 'VERIFIED' ? '#146b41'
    : doc.verificationStatus === 'REJECTED' ? '#b3261e' : '#8a5a00';

  return (
    <>
      <div
        className="flex items-center gap-3 py-3 border-b border-[#f0f2f4] last:border-0"
        style={{ minHeight: 52 }}
      >
        <FileText size={15} style={{ color: '#8a929b', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#14181c' }}>
            {doc.documentType.replace(/_/g, ' ')}
          </div>
          {doc.remarks && (
            <div style={{ fontSize: 11, color: '#8a929b', marginTop: 2 }}>{doc.remarks}</div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: statusColor }}>
          {statusIcon}
          <span style={{ fontSize: 11, fontWeight: 600 }}>{doc.verificationStatus}</span>
        </div>

        {/* Actions */}
        {canAct && doc.verificationStatus !== 'VERIFIED' && (
          <button
            onClick={() => verifyDoc.mutate({ applicationId, docId: doc.id, data: {} })}
            disabled={isPending}
            title="Verify document"
            className="flex items-center gap-1 text-xs font-semibold rounded px-2 py-1 transition-colors"
            style={{ color: '#146b41', background: '#edf7ef', border: '1px solid #c3e6cb', cursor: isPending ? 'not-allowed' : 'pointer' }}
          >
            <ShieldCheck size={12} />
            Verify
          </button>
        )}
        {canAct && doc.verificationStatus !== 'REJECTED' && (
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isPending}
            title="Reject document"
            className="flex items-center gap-1 text-xs font-semibold rounded px-2 py-1 transition-colors"
            style={{ color: '#b3261e', background: '#fef7f7', border: '1px solid #f5c6c6', cursor: isPending ? 'not-allowed' : 'pointer' }}
          >
            <ShieldX size={12} />
            Reject
          </button>
        )}
        {canAct && (
          <button
            onClick={() => removeDoc.mutate({ applicationId, docId: doc.id })}
            disabled={isPending}
            title="Remove document"
            style={{ color: '#8a929b', background: 'none', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', padding: 4 }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <Modal
        open={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRemarks(''); }}
        title="Reject Document"
        description={`Mark "${doc.documentType.replace(/_/g, ' ')}" as rejected.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowRejectModal(false); setRemarks(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={rejectDoc.isPending}
              onClick={async () => {
                await rejectDoc.mutateAsync({ applicationId, docId: doc.id, data: { remarks: remarks.trim() || undefined } });
                setShowRejectModal(false);
                setRemarks('');
              }}
            >
              {rejectDoc.isPending ? 'Rejecting…' : 'Reject Document'}
            </Button>
          </>
        }
      >
        <FormField label="Reason / Remarks (optional)">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="e.g. Document is blurry, please re-upload." />
        </FormField>
      </Modal>
    </>
  );
}

// ─── Completeness panel ───────────────────────────────────────────────────────

function CompletenessPanel({ score, checks }: { score: number; checks: Check[] }) {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
      <div style={{ fontSize: 12, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Application Check
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: '#6b7480' }}>Completeness</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: score === 100 ? '#146b41' : score >= 60 ? '#8a5a00' : '#b3261e' }}>
            {score}%
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: '#e6e8eb', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${score}%`,
            background: score === 100 ? '#146b41' : score >= 60 ? '#d4a017' : '#b3261e',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {c.done
              ? <CheckCircle size={13} style={{ color: '#146b41', flexShrink: 0 }} />
              : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #d7dce1', flexShrink: 0 }} />
            }
            <span style={{ fontSize: 12, color: c.done ? '#14181c' : '#8a929b' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'documents';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: application, isLoading, isError } = useApplication(id);
  const { data: documents = [] } = useApplicationDocuments(id ?? null);

  const submitApp = useSubmitApplication();
  const reviewApp = useReviewApplication();
  const approveApp = useApproveApplication();
  const rejectApp = useRejectApplication();

  const [activeTab, setActiveTab] = React.useState<TabId>('overview');
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  if (isError || !application) {
    return (
      <div className="p-8 text-center text-[#6b7480]">
        Application not found.{' '}
        <button className="text-[#2b5fa8] underline" onClick={() => router.back()}>Go back</button>
      </div>
    );
  }

  const applicantName = application.enquiry?.studentName ?? application.applicationNumber;
  const canAct = ['SUBMITTED', 'UNDER_REVIEW'].includes(application.status);
  const { score, checks } = computeCompleteness(application, documents);

  const verifiedCount = documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const rejectedCount = documents.filter((d) => d.verificationStatus === 'REJECTED').length;

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents', count: documents.length },
  ];

  async function handleReject() {
    await rejectApp.mutateAsync({ id: application!.id, data: { rejectionReason: rejectionReason.trim() || undefined } });
    setShowRejectDialog(false);
    setRejectionReason('');
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push('/admissions')}
        className="flex items-center gap-1.5 text-sm text-[#6b7480] hover:text-[#14181c] mb-5 transition-colors"
      >
        <ArrowLeft size={15} />
        Admissions Pipeline
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#14181c', margin: 0 }}>{applicantName}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={STATUS_VARIANT[application.status] ?? 'default'}>
              {STATUS_LABEL[application.status] ?? application.status}
            </Badge>
            <span style={{ fontSize: 12, color: '#8a929b' }}>
              {application.applicationNumber} · {application.class?.name ?? '—'} · {application.academicYear?.name ?? '—'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {application.status === 'DRAFT' && (
            <Button variant="primary" onClick={() => submitApp.mutate(application.id)} disabled={submitApp.isPending}>
              {submitApp.isPending ? 'Submitting…' : 'Submit Application'}
            </Button>
          )}
          {application.status === 'SUBMITTED' && (
            <Button variant="primary" onClick={() => reviewApp.mutate(application.id)} disabled={reviewApp.isPending}>
              {reviewApp.isPending ? 'Updating…' : 'Start Review'}
            </Button>
          )}
          {canAct && (
            <>
              <Button
                variant="primary"
                onClick={() => approveApp.mutate(application.id)}
                disabled={approveApp.isPending}
                style={{ background: '#146b41', borderColor: '#146b41' }}
              >
                {approveApp.isPending ? 'Approving…' : 'Approve'}
              </Button>
              <Button variant="secondary" onClick={() => setShowRejectDialog(true)}>
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Workflow progress */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm mb-5">
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Application Progress
        </div>
        <WorkflowProgress status={application.status} />
        {application.status === 'REJECTED' && application.rejectionReason && (
          <div className="mt-4 flex items-start gap-2 rounded-lg p-3" style={{ background: '#fef7f7', border: '1px solid #f5c6c6' }}>
            <AlertCircle size={14} style={{ color: '#b3261e', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b3261e', marginBottom: 2 }}>Rejection Reason</div>
              <div style={{ fontSize: 13, color: '#14181c' }}>{application.rejectionReason}</div>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-3 gap-5">
        {/* Left — tabbed content */}
        <div className="col-span-2">
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e6e8eb', marginBottom: 0 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '9px 16px', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
                  color: activeTab === t.id ? '#14181c' : '#6b7480',
                  borderBottom: activeTab === t.id ? '2px solid #3f6152' : '2px solid transparent',
                  marginBottom: -2, background: 'none', border: 'none',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'color 0.15s',
                }}
              >
                {t.label}
                {t.count !== undefined && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                    padding: '0 5px', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: activeTab === t.id ? '#3f6152' : '#e6e8eb',
                    color: activeTab === t.id ? '#fff' : '#6b7480',
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <div className="rounded-b-xl rounded-tr-xl border border-t-0 border-[#e6e8eb] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { label: 'Applicant Name', value: applicantName },
                  { label: 'Parent / Guardian', value: application.enquiry?.parentName ?? '—' },
                  { label: 'Phone', value: application.enquiry?.phone ?? '—' },
                  { label: 'Application No.', value: application.applicationNumber },
                  { label: 'Class Applying For', value: application.class?.name ?? '—' },
                  { label: 'Academic Year', value: application.academicYear?.name ?? '—' },
                  {
                    label: 'Created',
                    value: new Date(application.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                  },
                  {
                    label: 'Submitted',
                    value: application.submittedAt
                      ? new Date(application.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                      : 'Not yet submitted',
                  },
                  ...(application.approvedAt ? [{
                    label: 'Approved',
                    value: new Date(application.approvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                  }] : []),
                  ...(application.rejectedAt ? [{
                    label: 'Rejected',
                    value: new Date(application.rejectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                  }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 13.5, color: '#14181c' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Documents tab ── */}
          {activeTab === 'documents' && (
            <div className="rounded-b-xl rounded-tr-xl border border-t-0 border-[#e6e8eb] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {documents.length > 0 && (
                    <>
                      <Badge variant="graduated">{verifiedCount} verified</Badge>
                      {rejectedCount > 0 && <Badge variant="left">{rejectedCount} rejected</Badge>}
                      {documents.length - verifiedCount - rejectedCount > 0 && (
                        <Badge variant="pending">{documents.length - verifiedCount - rejectedCount} pending</Badge>
                      )}
                    </>
                  )}
                </div>
              </div>

              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <FileText size={28} style={{ color: '#d7dce1', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, color: '#8a929b' }}>No documents attached to this application yet.</div>
                </div>
              ) : (
                documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    applicationId={application.id}
                    canAct={canAct || application.status === 'DRAFT'}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Completeness */}
          <CompletenessPanel score={score} checks={checks} />

          {/* Source enquiry */}
          {application.enquiry && (
            <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Source Enquiry
              </div>
              <div
                className="rounded-lg border border-[#f0f2f4] p-3 cursor-pointer hover:bg-[#f9fafb] transition-colors"
                onClick={() => router.push(`/admissions/enquiries/${application.enquiry!.id}`)}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: '#14181c' }}>{application.enquiry.studentName}</div>
                <div style={{ fontSize: 12, color: '#8a929b' }}>{application.enquiry.phone}</div>
                <div style={{ fontSize: 11, color: '#2b5fa8', fontWeight: 600, marginTop: 6 }}>View enquiry →</div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Timeline
            </div>
            {[
              { label: 'Created', date: application.createdAt },
              { label: 'Submitted', date: application.submittedAt },
              { label: 'Approved', date: application.approvedAt },
              { label: 'Rejected', date: application.rejectedAt },
            ]
              .filter((t) => !!t.date)
              .map(({ label, date }) => (
                <div key={label} className="flex items-start gap-2.5 mb-3 last:mb-0">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3f6152', flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
        description={`Reject the application for ${applicantName}? This cannot be undone.`}
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
          <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain the reason…" rows={3} />
        </FormField>
      </Modal>
    </div>
  );
}
