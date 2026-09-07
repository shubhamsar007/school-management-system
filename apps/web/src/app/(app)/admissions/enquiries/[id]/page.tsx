'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, UserCircle, BookOpen, Calendar, Tag, MessageSquare } from 'lucide-react';
import { Badge, Button, Spinner, Select, Textarea, FormField } from '@/components/ui';
import { useEnquiry, useUpdateEnquiry } from '@/lib/hooks/use-admissions';

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
