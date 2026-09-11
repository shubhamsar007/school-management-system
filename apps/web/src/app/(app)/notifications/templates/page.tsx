'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, Dropdown, DataTable } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useActivateTemplate,
  useDeactivateTemplate,
  useDeleteTemplate,
  type NotificationTemplate,
} from '@/lib/hooks/use-comms';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_OPTIONS = [
  { label: 'All Channels', value: 'all' },
  { label: 'In-App', value: 'IN_APP' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'Push', value: 'PUSH' },
];

const LANGUAGE_OPTIONS = [
  { label: 'All Languages', value: 'all' },
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Telugu', value: 'te' },
];

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const FORM_CHANNEL_OPTIONS = [
  { label: 'In-App', value: 'IN_APP' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'Push', value: 'PUSH' },
];

const FORM_LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Hindi (हिंदी)', value: 'hi' },
  { label: 'Gujarati (ગુજરાતી)', value: 'gu' },
  { label: 'Marathi (मराठी)', value: 'mr' },
  { label: 'Tamil (தமிழ்)', value: 'ta' },
  { label: 'Telugu (తెలుగు)', value: 'te' },
];

const LANGUAGE_LABEL: Record<string, string> = {
  en: 'English', hi: 'Hindi', gu: 'Gujarati', mr: 'Marathi', ta: 'Tamil', te: 'Telugu',
};

// ─── Event Types ──────────────────────────────────────────────────────────────

interface EventTypeGroup {
  group: string;
  events: { label: string; value: string }[];
}

const EVENT_TYPE_GROUPS: EventTypeGroup[] = [
  {
    group: 'Attendance',
    events: [
      { label: 'Student Absent', value: 'STUDENT_ABSENT' },
      { label: 'Low Attendance', value: 'LOW_ATTENDANCE' },
      { label: 'Employee Absent', value: 'EMPLOYEE_ABSENT' },
      { label: 'Late Arrival', value: 'LATE_ARRIVAL' },
    ],
  },
  {
    group: 'Finance',
    events: [
      { label: 'Invoice Issued', value: 'FEE_INVOICE_ISSUED' },
      { label: 'Fee Due Soon', value: 'FEE_DUE_SOON' },
      { label: 'Fee Overdue', value: 'FEE_OVERDUE' },
      { label: 'Payment Received', value: 'PAYMENT_RECEIVED' },
    ],
  },
  {
    group: 'Examinations',
    events: [
      { label: 'Exam Scheduled', value: 'EXAM_SCHEDULED' },
      { label: 'Exam Reminder', value: 'EXAM_REMINDER' },
      { label: 'Result Published', value: 'RESULT_PUBLISHED' },
      { label: 'Report Card Ready', value: 'REPORT_CARD_READY' },
    ],
  },
  {
    group: 'Leave',
    events: [
      { label: 'Leave Submitted', value: 'LEAVE_SUBMITTED' },
      { label: 'Leave Approved', value: 'LEAVE_APPROVED' },
      { label: 'Leave Rejected', value: 'LEAVE_REJECTED' },
      { label: 'Leave Cancelled', value: 'LEAVE_CANCELLED' },
    ],
  },
  {
    group: 'Substitution',
    events: [
      { label: 'Substitute Assigned', value: 'SUBSTITUTE_ASSIGNED' },
      { label: 'Substitute Declined', value: 'SUBSTITUTE_DECLINED' },
      { label: 'Substitution Cancelled', value: 'SUBSTITUTION_CANCELLED' },
    ],
  },
  {
    group: 'Admissions',
    events: [
      { label: 'Application Submitted', value: 'APPLICATION_SUBMITTED' },
      { label: 'Document Required', value: 'DOCUMENT_REQUIRED' },
      { label: 'Interview Scheduled', value: 'INTERVIEW_SCHEDULED' },
      { label: 'Application Approved', value: 'APPLICATION_APPROVED' },
      { label: 'Application Rejected', value: 'APPLICATION_REJECTED' },
      { label: 'Offer Expiring', value: 'ADMISSION_OFFER_EXPIRING' },
    ],
  },
  {
    group: 'Communications',
    events: [
      { label: 'Announcement Published', value: 'ANNOUNCEMENT_PUBLISHED' },
      { label: 'PTM Scheduled', value: 'PTM_SCHEDULED' },
      { label: 'PTM Reminder', value: 'PTM_REMINDER' },
    ],
  },
  {
    group: 'Timetable',
    events: [
      { label: 'Timetable Published', value: 'TIMETABLE_PUBLISHED' },
      { label: 'Timetable Changed', value: 'TIMETABLE_CHANGED' },
    ],
  },
  {
    group: 'General',
    events: [{ label: 'Manual', value: 'MANUAL' }],
  },
];

// Flat list for display + lookup
const ALL_EVENTS = EVENT_TYPE_GROUPS.flatMap((g) => g.events);
function eventLabel(value: string) {
  return ALL_EVENTS.find((e) => e.value === value)?.label ?? value.replace(/_/g, ' ');
}

// ─── Variables ────────────────────────────────────────────────────────────────

const EVENT_VARIABLES: Record<string, string[]> = {
  STUDENT_ABSENT:         ['studentName', 'parentName', 'className', 'sectionName', 'date', 'teacherName', 'schoolName'],
  LOW_ATTENDANCE:         ['studentName', 'parentName', 'className', 'attendancePercent', 'schoolName'],
  EMPLOYEE_ABSENT:        ['employeeName', 'date', 'department'],
  LATE_ARRIVAL:           ['employeeName', 'date', 'arrivalTime'],
  FEE_INVOICE_ISSUED:     ['studentName', 'parentName', 'invoiceNumber', 'amount', 'dueDate', 'schoolName'],
  FEE_DUE_SOON:           ['studentName', 'parentName', 'invoiceNumber', 'amount', 'dueDate', 'daysLeft', 'schoolName'],
  FEE_OVERDUE:            ['studentName', 'parentName', 'invoiceNumber', 'amount', 'dueDate', 'daysOverdue', 'schoolName'],
  PAYMENT_RECEIVED:       ['studentName', 'parentName', 'invoiceNumber', 'amount', 'paymentDate', 'receiptNumber', 'schoolName'],
  EXAM_SCHEDULED:         ['studentName', 'examName', 'date', 'subject', 'className', 'venue', 'schoolName'],
  EXAM_REMINDER:          ['studentName', 'examName', 'date', 'subject', 'hoursLeft', 'schoolName'],
  RESULT_PUBLISHED:       ['studentName', 'parentName', 'examName', 'grade', 'percentage', 'schoolName'],
  REPORT_CARD_READY:      ['studentName', 'parentName', 'examName', 'schoolName'],
  LEAVE_SUBMITTED:        ['employeeName', 'leaveType', 'startDate', 'endDate', 'days', 'reason'],
  LEAVE_APPROVED:         ['employeeName', 'leaveType', 'startDate', 'endDate', 'days', 'approvedBy'],
  LEAVE_REJECTED:         ['employeeName', 'leaveType', 'startDate', 'endDate', 'reason'],
  LEAVE_CANCELLED:        ['employeeName', 'leaveType', 'startDate', 'endDate'],
  SUBSTITUTE_ASSIGNED:    ['teacherName', 'subjectName', 'className', 'date', 'period', 'originalTeacher'],
  SUBSTITUTE_DECLINED:    ['teacherName', 'subjectName', 'className', 'date'],
  SUBSTITUTION_CANCELLED: ['teacherName', 'subjectName', 'className', 'date'],
  APPLICATION_SUBMITTED:  ['applicantName', 'applicationNumber', 'grade', 'schoolName'],
  DOCUMENT_REQUIRED:      ['applicantName', 'applicationNumber', 'documentName', 'deadline'],
  INTERVIEW_SCHEDULED:    ['applicantName', 'parentName', 'date', 'time', 'venue', 'schoolName'],
  APPLICATION_APPROVED:   ['applicantName', 'parentName', 'grade', 'schoolName', 'enrollmentDeadline'],
  APPLICATION_REJECTED:   ['applicantName', 'parentName', 'grade', 'schoolName'],
  ADMISSION_OFFER_EXPIRING: ['applicantName', 'parentName', 'expiryDate', 'daysLeft'],
  ANNOUNCEMENT_PUBLISHED: ['title', 'content', 'date', 'schoolName'],
  PTM_SCHEDULED:          ['parentName', 'teacherName', 'studentName', 'date', 'time', 'venue'],
  PTM_REMINDER:           ['parentName', 'teacherName', 'studentName', 'date', 'time', 'hoursLeft'],
  TIMETABLE_PUBLISHED:    ['className', 'sectionName', 'effectiveDate', 'schoolName'],
  TIMETABLE_CHANGED:      ['className', 'sectionName', 'changeDescription', 'effectiveDate'],
  MANUAL:                 ['recipientName', 'schoolName'],
};

const SAMPLE_VALUES: Record<string, string> = {
  studentName: 'Rahul Sharma', parentName: 'Mr. Rajesh Sharma',
  className: 'Class 8', sectionName: 'Section A', date: '10 Sep 2026',
  teacherName: 'Mrs. Priya Patel', schoolName: 'Maple Valley School',
  attendancePercent: '68%', employeeName: 'Amit Verma', department: 'Science',
  arrivalTime: '09:42 AM', invoiceNumber: 'INV-2026-00142',
  amount: '₹20,000', dueDate: '15 Sep 2026', daysLeft: '5',
  daysOverdue: '7', paymentDate: '10 Sep 2026', receiptNumber: 'RCP-00089',
  examName: 'Unit Test 2', subject: 'Mathematics', venue: 'Room 201',
  hoursLeft: '12', grade: 'A', percentage: '87%',
  leaveType: 'Casual Leave', startDate: '12 Sep 2026', endDate: '13 Sep 2026',
  days: '2', reason: 'Personal', approvedBy: 'Principal Sharma',
  subjectName: 'Physics', period: 'Period 3', originalTeacher: 'Mr. Kamal Das',
  applicantName: 'Aryan Mehta', applicationNumber: 'APP-2026-00312',
  documentName: 'Birth Certificate', deadline: '15 Sep 2026',
  time: '10:30 AM', enrollmentDeadline: '20 Sep 2026',
  expiryDate: '17 Sep 2026', title: 'School Sports Day',
  content: 'Annual Sports Day is scheduled for 20 Sep 2026.',
  changeDescription: 'Period 4 and 5 swapped on Monday',
  effectiveDate: '11 Sep 2026', recipientName: 'John Doe',
};

function renderPreview(body: string, subject?: string): { subject: string; body: string } {
  function substitute(text: string) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => SAMPLE_VALUES[key] ?? `{{${key}}}`);
  }
  return { subject: substitute(subject ?? ''), body: substitute(body) };
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface TemplateForm {
  name: string;
  description: string;
  eventType: string;
  channel: string;
  language: string;
  subject: string;
  body: string;
}

const emptyForm = (): TemplateForm => ({
  name: '', description: '', eventType: 'STUDENT_ABSENT',
  channel: 'IN_APP', language: 'en', subject: '', body: '',
});

// ─── Template Modal ───────────────────────────────────────────────────────────

function TemplateModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial?: NotificationTemplate;
  onClose: () => void;
  onSave: (form: TemplateForm) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = React.useState<TemplateForm>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          eventType: initial.eventType,
          channel: initial.channel,
          language: initial.language,
          subject: initial.subject ?? '',
          body: initial.body,
        }
      : emptyForm(),
  );
  const [tab, setTab] = React.useState<'form' | 'preview'>('form');
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  function set(key: keyof TemplateForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function insertVariable(varName: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? form.body.length;
    const end = el.selectionEnd ?? form.body.length;
    const snippet = `{{${varName}}}`;
    const next = form.body.slice(0, start) + snippet + form.body.slice(end);
    set('body', next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + snippet.length;
      el.selectionEnd = start + snippet.length;
    });
  }

  const variables = EVENT_VARIABLES[form.eventType] ?? [];
  const preview = renderPreview(form.body, form.subject);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(20,24,28,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ padding: '18px 24px 0', borderBottom: '1px solid #eef0f2', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#14181c' }}>
              {initial ? 'Edit Template' : 'New Template'}
            </div>
            <button
              onClick={onClose}
              style={{ color: '#9ca3af', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {(['form', 'preview'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '7px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
                  color: tab === t ? '#3f6152' : '#6d746e',
                  borderBottom: tab === t ? '2px solid #3f6152' : '2px solid transparent',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t === 'form' ? 'Template' : 'Preview'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {tab === 'form' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name + Description */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MField label="Template Name *">
                  <input style={inp} placeholder="e.g. Student Absent — SMS" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </MField>
                <MField label="Description">
                  <input style={inp} placeholder="Brief description (optional)" value={form.description} onChange={(e) => set('description', e.target.value)} />
                </MField>
              </div>

              {/* Event + Channel + Language */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>
                <MField label="Event Type *">
                  <select style={inp} value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
                    {EVENT_TYPE_GROUPS.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.events.map((ev) => (
                          <option key={ev.value} value={ev.value}>{ev.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </MField>
                <MField label="Channel *">
                  <select style={inp} value={form.channel} onChange={(e) => set('channel', e.target.value)}>
                    {FORM_CHANNEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </MField>
                <MField label="Language *">
                  <select style={inp} value={form.language} onChange={(e) => set('language', e.target.value)}>
                    {FORM_LANGUAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </MField>
              </div>

              {/* Subject (email only) */}
              {form.channel === 'EMAIL' && (
                <MField label="Subject Line *">
                  <input style={inp} placeholder="e.g. Attendance Alert — {{studentName}}" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
                </MField>
              )}

              {/* Variable chips */}
              {variables.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Available variables — click to insert
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {variables.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        style={{
                          fontSize: 11, fontWeight: 500, padding: '3px 9px',
                          borderRadius: 6, border: '1px solid #e0e7ff',
                          background: '#eef2ff', color: '#3730a3',
                          cursor: 'pointer', fontFamily: 'monospace',
                        }}
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <MField label="Message Body *">
                <textarea
                  ref={bodyRef}
                  style={{ ...inp, height: 160, resize: 'vertical', fontFamily: 'monospace', fontSize: 12.5 }}
                  placeholder={`Dear {{parentName}},\n{{studentName}} was marked absent on {{date}}.\n\nRegards,\n{{schoolName}}`}
                  value={form.body}
                  onChange={(e) => set('body', e.target.value)}
                />
              </MField>

              {/* Char count hint for SMS */}
              {(form.channel === 'SMS' || form.channel === 'WHATSAPP') && (
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: -8 }}>
                  {form.body.length} chars · SMS limit ~160 chars per segment
                </div>
              )}
            </div>
          ) : (
            /* Preview tab */
            <div>
              <div style={{
                background: '#fafafa', borderRadius: 12, border: '1px solid #e5e7eb',
                padding: 20, marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Preview — sample values substituted
                </div>
                {form.channel === 'EMAIL' && preview.subject && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>SUBJECT</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{preview.subject}</div>
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>BODY</div>
                <div style={{
                  fontSize: 13.5, color: '#1f2937', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {preview.body || <span style={{ color: '#d1d5db' }}>Write your message body to see the preview.</span>}
                </div>
              </div>

              {/* Meta info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Event', value: eventLabel(form.eventType) },
                  { label: 'Channel', value: form.channel.replace('_', ' ') },
                  { label: 'Language', value: LANGUAGE_LABEL[form.language] ?? form.language },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #eef0f2',
          display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          {tab === 'form' && (
            <Button variant="ghost" onClick={() => setTab('preview')}>
              Preview →
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => void onSave(form)}
            disabled={saving || !form.name.trim() || !form.body.trim()}
          >
            {saving ? 'Saving…' : initial ? 'Update Template' : 'Save Template'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', borderRadius: 8, border: '1px solid #e5e7eb',
  padding: '8px 10px', fontSize: 13, color: '#14181c',
  background: '#fafafa', outline: 'none', boxSizing: 'border-box',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const toast = useToast();
  const [channelFilter, setChannelFilter] = React.useState('all');
  const [languageFilter, setLanguageFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showCreate, setShowCreate] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<NotificationTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<NotificationTemplate | null>(null);

  const apiFilters: Record<string, string> = {};
  if (channelFilter !== 'all') apiFilters.channel = channelFilter;
  if (languageFilter !== 'all') apiFilters.language = languageFilter;
  if (statusFilter !== 'all') apiFilters.status = statusFilter;

  const { data: templates = [], isLoading, isError } = useTemplates(
    Object.keys(apiFilters).length ? apiFilters : undefined,
  );
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const activateTemplate = useActivateTemplate();
  const deactivateTemplate = useDeactivateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const active = templates.filter((t) => t.status === 'ACTIVE').length;
  const inactive = templates.filter((t) => t.status === 'INACTIVE').length;

  async function handleCreate(form: TemplateForm) {
    try {
      await createTemplate.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        eventType: form.eventType,
        channel: form.channel,
        language: form.language,
        subject: form.subject.trim() || undefined,
        body: form.body.trim(),
      });
      toast.success('Template created.');
      setShowCreate(false);
    } catch {
      toast.error('Failed to create template.');
    }
  }

  async function handleUpdate(form: TemplateForm) {
    if (!editTarget) return;
    try {
      await updateTemplate.mutateAsync({
        id: editTarget.id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        eventType: form.eventType,
        channel: form.channel,
        language: form.language,
        subject: form.subject.trim() || undefined,
        body: form.body.trim(),
      });
      toast.success('Template updated.');
      setEditTarget(null);
    } catch {
      toast.error('Failed to update template.');
    }
  }

  async function handleToggleStatus(t: NotificationTemplate) {
    try {
      if (t.status === 'ACTIVE') {
        await deactivateTemplate.mutateAsync(t.id);
        toast.success('Template deactivated.');
      } else {
        await activateTemplate.mutateAsync(t.id);
        toast.success('Template activated.');
      }
    } catch {
      toast.error('Failed to update status.');
    }
  }

  async function handleDelete(t: NotificationTemplate) {
    try {
      await deleteTemplate.mutateAsync(t.id);
      toast.success('Template deleted.');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Deactivate')) {
        toast.error('Deactivate the template before deleting it.');
      } else {
        toast.error('Failed to delete template.');
      }
      setDeleteTarget(null);
    }
  }

  const columns: ColumnDef<NotificationTemplate>[] = [
    {
      id: 'name',
      header: 'NAME',
      width: 'minmax(180px, 1.6fr)',
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: '#14181c' }}>{r.name}</div>
          {r.description && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{r.description}</div>
          )}
        </div>
      ),
    },
    {
      id: 'event',
      header: 'EVENT',
      width: '180px',
      cell: (r) => (
        <span style={{
          fontSize: 11, fontWeight: 500, color: '#374151',
          background: '#f3f4f6', borderRadius: 6, padding: '2px 7px',
        }}>
          {eventLabel(r.eventType)}
        </span>
      ),
    },
    {
      id: 'channel',
      header: 'CHANNEL',
      width: '90px',
      cell: (r) => <Badge variant="default">{r.channel.replace('_', ' ')}</Badge>,
    },
    {
      id: 'language',
      header: 'LANGUAGE',
      width: '90px',
      cell: (r) => (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {LANGUAGE_LABEL[r.language] ?? r.language}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '80px',
      cell: (r) => (
        <Badge variant={r.status === 'ACTIVE' ? 'active' : 'default'}>
          {r.status}
        </Badge>
      ),
    },
    {
      id: 'updated',
      header: 'UPDATED',
      width: '110px',
      cell: (r) => (
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {new Date(r.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: '160px',
      align: 'right',
      cell: (r) => (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            style={{ fontSize: 12, color: '#2b5fa8', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setEditTarget(r); }}
          >
            Edit
          </button>
          <button
            style={{ fontSize: 12, color: r.status === 'ACTIVE' ? '#d97706' : '#059669', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); void handleToggleStatus(r); }}
          >
            {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Reusable message templates for every event type"
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + New Template
          </Button>
        }
      />

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: templates.length, color: '#6b7280', bg: '#f3f4f6' },
          { label: 'Active', value: active, color: '#059669', bg: '#d1fae5' },
          { label: 'Inactive', value: inactive, color: '#d97706', bg: '#fef3c7' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: bg, borderRadius: 8, padding: '5px 12px',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {/* Filter bar */}
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <Dropdown label="Channel" value={channelFilter} options={CHANNEL_OPTIONS} onChange={setChannelFilter} />
          <Dropdown label="Language" value={languageFilter} options={LANGUAGE_OPTIONS} onChange={setLanguageFilter} />
          <Dropdown label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Loading templates…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">Failed to load templates</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">No templates yet</p>
            <p className="text-xs text-[#8a929b]">Create your first template to get started.</p>
            <div style={{ marginTop: 8 }}>
              <Button variant="primary" onClick={() => setShowCreate(true)}>+ New Template</Button>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={templates}
            onRowClick={(r) => setEditTarget(r)}
          />
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <TemplateModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
          saving={createTemplate.isPending}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <TemplateModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdate}
          saving={updateTemplate.isPending}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(20,24,28,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
              padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#14181c', marginBottom: 8 }}>
              Delete template?
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.5 }}>
              <strong>{deleteTarget.name}</strong> will be permanently deleted.
              {deleteTarget.status === 'ACTIVE' && (
                <span style={{ color: '#dc2626' }}> You must deactivate it first.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => void handleDelete(deleteTarget)}
                disabled={deleteTarget.status === 'ACTIVE' || deleteTemplate.isPending}
              >
                {deleteTemplate.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
