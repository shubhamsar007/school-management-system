'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, UserCircle, BookOpen, Calendar, Tag, MessageSquare, PhoneCall, Mail as MailIcon, MapPin, MessageCircle, CheckCircle, Trash2, Plus } from 'lucide-react';
import { Badge, Button, Spinner, Select, Textarea, FormField } from '@/components/ui';
import {
  useEnquiry, useUpdateEnquiry,
  useFollowUps, useCreateFollowUp, useUpdateFollowUp, useDeleteFollowUp,
  type FollowUp,
} from '@/lib/hooks/use-admissions';

// ─── Maps ─────────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  NEW: 'pending', CONTACTED: 'default', VISITED: 'active',
  APPLIED: 'active', CONVERTED: 'graduated', DROPPED: 'left',
};

const STATUS_LABEL: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', VISITED: 'Visited',
  APPLIED: 'Applied', CONVERTED: 'Converted', DROPPED: 'Dropped',
};

const APP_STATUS_VARIANT: Record<string, 'active' | 'pending' | 'default' | 'graduated' | 'left'> = {
  DRAFT: 'default', SUBMITTED: 'pending', UNDER_REVIEW: 'active',
  APPROVED: 'graduated', REJECTED: 'left',
};

const STATUS_OPTIONS = [
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Visited', value: 'VISITED' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Dropped', value: 'DROPPED' },
];

const METHOD_OPTIONS = [
  { label: 'Call', value: 'CALL' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'Visit', value: 'VISIT' },
  { label: 'Message', value: 'MESSAGE' },
];

const OUTCOME_OPTIONS = [
  { label: 'Select outcome', value: '' },
  { label: 'Reached', value: 'REACHED' },
  { label: 'No Answer', value: 'NO_ANSWER' },
  { label: 'Scheduled Visit', value: 'SCHEDULED_VISIT' },
  { label: 'Left Message', value: 'LEFT_MESSAGE' },
  { label: 'Converted', value: 'CONVERTED' },
];

const METHOD_ICON: Record<string, React.ElementType> = {
  CALL: PhoneCall,
  EMAIL: MailIcon,
  VISIT: MapPin,
  MESSAGE: MessageCircle,
};

const METHOD_COLOR: Record<string, string> = {
  CALL: '#2b5fa8',
  EMAIL: '#146b41',
  VISIT: '#8a5a00',
  MESSAGE: '#6b4fa8',
};

// ─── Enquiry field row ────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f0f2f4] last:border-0">
      <div className="flex-shrink-0 mt-0.5" style={{ color: '#8a929b' }}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 13.5, color: '#14181c' }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Follow-up row ────────────────────────────────────────────────────────────

function FollowUpRow({
  followUp,
  enquiryId,
}: {
  followUp: FollowUp;
  enquiryId: string;
}) {
  const updateFollowUp = useUpdateFollowUp();
  const deleteFollowUp = useDeleteFollowUp();

  const [showCompleteForm, setShowCompleteForm] = React.useState(false);
  const [outcome, setOutcome] = React.useState('');

  const MethodIcon = METHOD_ICON[followUp.method] ?? PhoneCall;
  const methodColor = METHOD_COLOR[followUp.method] ?? '#2b5fa8';

  const scheduledDate = new Date(followUp.scheduledAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const scheduledTime = new Date(followUp.scheduledAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  async function handleMarkComplete() {
    await updateFollowUp.mutateAsync({
      enquiryId,
      id: followUp.id,
      data: {
        completedAt: new Date().toISOString(),
        outcome: outcome || undefined,
      },
    });
    setShowCompleteForm(false);
    setOutcome('');
  }

  return (
    <div style={{ border: '1px solid #e6e8eb', borderRadius: 10, padding: '12px 14px', marginBottom: 8, background: followUp.completedAt ? '#f9fafb' : '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Method pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${methodColor}14`, border: `1px solid ${methodColor}30`, borderRadius: 20, padding: '3px 9px', flexShrink: 0 }}>
          <MethodIcon size={11} style={{ color: methodColor }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: methodColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {followUp.method}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#14181c' }}>
              {scheduledDate} at {scheduledTime}
            </span>
            {followUp.completedAt ? (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#146b41', background: '#edf7ef', border: '1px solid #c3e6cb', borderRadius: 20, padding: '2px 8px' }}>
                Completed
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#8a5a00', background: '#fff8e6', border: '1px solid #f5d98a', borderRadius: 20, padding: '2px 8px' }}>
                Pending
              </span>
            )}
            {followUp.outcome && (
              <span style={{ fontSize: 10, color: '#6b7480', background: '#f0f2f4', borderRadius: 20, padding: '2px 8px' }}>
                {followUp.outcome.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {followUp.notes && (
            <div style={{ fontSize: 12, color: '#6b7480', marginTop: 4, lineHeight: 1.5 }}>{followUp.notes}</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!followUp.completedAt && (
            <button
              onClick={() => setShowCompleteForm(!showCompleteForm)}
              style={{ fontSize: 11, fontWeight: 600, color: '#146b41', background: '#edf7ef', border: '1px solid #c3e6cb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <CheckCircle size={11} />
              Mark Complete
            </button>
          )}
          <button
            onClick={() => deleteFollowUp.mutate({ enquiryId, id: followUp.id })}
            disabled={deleteFollowUp.isPending}
            style={{ color: '#8a929b', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            title="Delete follow-up"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {showCompleteForm && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f2f4' }}>
          <FormField label="Outcome">
            <Select
              options={OUTCOME_OPTIONS}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onClick={handleMarkComplete} disabled={updateFollowUp.isPending}>
              {updateFollowUp.isPending ? 'Saving…' : 'Confirm Complete'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowCompleteForm(false); setOutcome(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Follow-ups panel ─────────────────────────────────────────────────────────

function FollowUpsPanel({ enquiryId }: { enquiryId: string }) {
  const { data: followUps = [], isLoading } = useFollowUps(enquiryId);
  const createFollowUp = useCreateFollowUp();

  const [showForm, setShowForm] = React.useState(false);
  const [method, setMethod] = React.useState('CALL');
  const [scheduledAt, setScheduledAt] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [formError, setFormError] = React.useState('');

  async function handleCreate() {
    if (!scheduledAt) { setFormError('Please select a date and time.'); return; }
    setFormError('');
    await createFollowUp.mutateAsync({
      enquiryId,
      data: { scheduledAt: new Date(scheduledAt).toISOString(), method, notes: notes.trim() || undefined },
    });
    setShowForm(false);
    setMethod('CALL');
    setScheduledAt('');
    setNotes('');
  }

  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', margin: 0 }}>
          Follow-ups
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 12, fontWeight: 600, color: '#2b5fa8', background: '#eef3fb', border: '1px solid #b8d0f5', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={12} />
          Schedule Follow-up
        </button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <div style={{ background: '#f9fafb', border: '1px solid #e6e8eb', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            New Follow-up
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <FormField label="Method">
              <Select
                options={METHOD_OPTIONS}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              />
            </FormField>
            <FormField label="Scheduled Date & Time" required>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d7dce1', borderRadius: 7, fontSize: 13, color: '#14181c', background: '#fff', outline: 'none' }}
              />
            </FormField>
          </div>
          <FormField label="Notes (optional)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add any notes about this follow-up…"
            />
          </FormField>
          {formError && (
            <div style={{ fontSize: 12, color: '#b3261e', marginTop: 6 }}>{formError}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Button variant="primary" onClick={handleCreate} disabled={createFollowUp.isPending}>
              {createFollowUp.isPending ? 'Scheduling…' : 'Schedule'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setFormError(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}><Spinner /></div>
      ) : followUps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a929b', fontSize: 13 }}>
          No follow-ups scheduled yet.
        </div>
      ) : (
        followUps.map((fu) => (
          <FollowUpRow key={fu.id} followUp={fu} enquiryId={enquiryId} />
        ))
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: enquiry, isLoading, isError } = useEnquiry(id);
  const updateEnquiry = useUpdateEnquiry();

  const [editingStatus, setEditingStatus] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState('');
  const [editingNotes, setEditingNotes] = React.useState(false);
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (enquiry) {
      setNewStatus(enquiry.status);
      setNotes(enquiry.notes ?? '');
    }
  }, [enquiry]);

  async function handleStatusSave() {
    if (!enquiry || newStatus === enquiry.status) { setEditingStatus(false); return; }
    await updateEnquiry.mutateAsync({ id: enquiry.id, data: { status: newStatus } });
    setEditingStatus(false);
  }

  async function handleNotesSave() {
    if (!enquiry) return;
    await updateEnquiry.mutateAsync({ id: enquiry.id, data: { notes: notes.trim() || undefined } });
    setEditingNotes(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (isError || !enquiry) {
    return (
      <div className="p-8 text-center text-[#6b7480]">
        Enquiry not found.{' '}
        <button className="text-[#2b5fa8] underline" onClick={() => router.back()}>Go back</button>
      </div>
    );
  }

  const createdDate = new Date(enquiry.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

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
            {enquiry.studentName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={STATUS_VARIANT[enquiry.status] ?? 'default'}>
              {STATUS_LABEL[enquiry.status] ?? enquiry.status}
            </Badge>
            <span style={{ fontSize: 12, color: '#8a929b' }}>Enquiry since {createdDate}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditingStatus(true)}>
            Update Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Details */}
        <div className="col-span-2 flex flex-col gap-5">
          {/* Contact card */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', marginBottom: 4 }}>
              Contact Information
            </h2>
            <InfoRow icon={UserCircle} label="Parent / Guardian" value={enquiry.parentName ?? '—'} />
            <InfoRow icon={Phone} label="Phone" value={enquiry.phone} />
            <InfoRow icon={Mail} label="Email" value={enquiry.email ?? '—'} />
          </div>

          {/* Admission interest card */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', marginBottom: 4 }}>
              Admission Interest
            </h2>
            <InfoRow icon={BookOpen} label="Class Interested In" value={enquiry.classInterested?.name ?? '—'} />
            <InfoRow icon={Calendar} label="Enquiry Date" value={createdDate} />
            <InfoRow icon={Tag} label="Source" value={enquiry.source.replace(/_/g, ' ')} />
            <InfoRow
              icon={UserCircle}
              label="Applications Linked"
              value={String(enquiry.applications?.length ?? 0)}
            />
          </div>

          {/* Linked applications */}
          {(enquiry.applications?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', marginBottom: 12 }}>
                Linked Applications
              </h2>
              <div className="flex flex-col gap-2">
                {enquiry.applications!.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-lg border border-[#f0f2f4] p-3 hover:bg-[#f9fafb] transition-colors cursor-pointer"
                    onClick={() => router.push(`/admissions/applications/${app.id}`)}
                  >
                    <div>
                      <span className="font-mono text-xs text-[#6b7480]">{app.applicationNumber}</span>
                      {app.submittedAt && (
                        <span className="text-xs text-[#8a929b] ml-2">
                          Submitted {new Date(app.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <Badge variant={APP_STATUS_VARIANT[app.status] ?? 'default'}>
                      {app.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups */}
          <FollowUpsPanel enquiryId={enquiry.id} />
        </div>

        {/* Right: Actions + Notes */}
        <div className="flex flex-col gap-5">
          {/* Status update */}
          {editingStatus && (
            <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c', marginBottom: 12 }}>
                Update Status
              </h2>
              <FormField label="New Status">
                <Select
                  options={STATUS_OPTIONS}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                />
              </FormField>
              <div className="flex gap-2 mt-3">
                <Button variant="primary" onClick={handleStatusSave} disabled={updateEnquiry.isPending}>
                  {updateEnquiry.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="secondary" onClick={() => setEditingStatus(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-xl border border-[#e6e8eb] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#14181c' }}>
                <MessageSquare size={14} className="inline mr-1.5" style={{ color: '#8a929b' }} />
                Notes
              </h2>
              {!editingNotes && (
                <button
                  className="text-xs text-[#2b5fa8] font-medium"
                  onClick={() => setEditingNotes(true)}
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this enquiry…"
                />
                <div className="flex gap-2 mt-3">
                  <Button variant="primary" onClick={handleNotesSave} disabled={updateEnquiry.isPending}>
                    {updateEnquiry.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingNotes(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: enquiry.notes ? '#14181c' : '#8a929b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {enquiry.notes || 'No notes yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
