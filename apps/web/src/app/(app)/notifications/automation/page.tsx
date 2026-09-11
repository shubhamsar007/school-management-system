'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  useRules,
  useCreateRule,
  useUpdateRule,
  useToggleRule,
  useDeleteRule,
  useTemplates,
  type NotificationRule,
} from '@/lib/hooks/use-comms';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { group: 'Leave', value: 'LEAVE_APPROVED', label: 'Leave Approved' },
  { group: 'Leave', value: 'LEAVE_REJECTED', label: 'Leave Rejected' },
  { group: 'Leave', value: 'LEAVE_CANCELLED', label: 'Leave Cancelled' },
  { group: 'Attendance', value: 'STUDENT_ABSENT', label: 'Student Absent' },
  { group: 'Attendance', value: 'EMPLOYEE_ABSENT', label: 'Employee Absent' },
  { group: 'Attendance', value: 'LATE_ARRIVAL', label: 'Late Arrival' },
  { group: 'Substitution', value: 'SUBSTITUTE_ASSIGNED', label: 'Substitute Assigned' },
  { group: 'Substitution', value: 'SUBSTITUTE_DECLINED', label: 'Substitute Declined' },
  { group: 'Substitution', value: 'SUBSTITUTION_REQUESTED', label: 'Substitution Requested' },
  { group: 'Finance', value: 'FEE_DUE', label: 'Fee Due' },
  { group: 'Finance', value: 'FEE_PAID', label: 'Fee Paid' },
  { group: 'Finance', value: 'FEE_OVERDUE', label: 'Fee Overdue' },
  { group: 'Admissions', value: 'APPLICATION_SUBMITTED', label: 'Application Submitted' },
  { group: 'Admissions', value: 'APPLICATION_SHORTLISTED', label: 'Application Shortlisted' },
  { group: 'Admissions', value: 'APPLICATION_REJECTED', label: 'Application Rejected' },
  { group: 'Admissions', value: 'OFFER_ISSUED', label: 'Offer Issued' },
  { group: 'Examinations', value: 'EXAM_SCHEDULED', label: 'Exam Scheduled' },
  { group: 'Examinations', value: 'RESULTS_PUBLISHED', label: 'Results Published' },
  { group: 'PTM', value: 'PTM_SLOT_BOOKED', label: 'PTM Slot Booked' },
  { group: 'PTM', value: 'PTM_SLOT_CANCELLED', label: 'PTM Slot Cancelled' },
  { group: 'System', value: 'SYSTEM_ALERT', label: 'System Alert' },
];

const AUDIENCE_TYPES = [
  { value: 'EMPLOYEE',          label: 'Specific Employee (subject of event)', needsTarget: false },
  { value: 'ALL_EMPLOYEES',     label: 'All Active Employees',                 needsTarget: false },
  { value: 'STUDENT_GUARDIANS', label: "Student's Guardians (opt-in)",         needsTarget: true  },
  { value: 'DEPARTMENT',        label: 'Department',                           needsTarget: true  },
  { value: 'CLASS',             label: 'Class (all guardians)',                needsTarget: true  },
  { value: 'SECTION',           label: 'Section (all guardians)',              needsTarget: true  },
  { value: 'CAMPUS_EMPLOYEES',  label: 'Campus Employees',                     needsTarget: true  },
  { value: 'ROLE_MEMBERS',      label: 'Role Members',                         needsTarget: true  },
];

const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const CATEGORIES = [
  'ACADEMIC', 'ATTENDANCE', 'EXAMINATION', 'FINANCE',
  'ADMISSIONS', 'HR', 'SUBSTITUTION', 'ANNOUNCEMENT', 'PTM', 'SYSTEM', 'GENERAL',
];

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'bg-[#f0f2f5] text-[#6b7280]',
  NORMAL: 'bg-[#e8f4fd] text-[#1a6fa6]',
  HIGH: 'bg-[#fff3e8] text-[#b45309]',
  URGENT: 'bg-[#fde8e8] text-[#b91c1c]',
};

const CHANNEL_COLOR: Record<string, string> = {
  IN_APP: 'bg-[#e8f4fd] text-[#1a6fa6]',
  EMAIL: 'bg-[#e8fdf0] text-[#166534]',
  SMS: 'bg-[#f3e8ff] text-[#6b21a8]',
  WHATSAPP: 'bg-[#e8fdf0] text-[#15803d]',
  PUSH: 'bg-[#fff3e8] text-[#c2410c]',
};

// ─── Rule Form Modal ──────────────────────────────────────────────────────────

interface RuleModalProps {
  rule: NotificationRule | undefined;
  onClose: () => void;
}

function RuleModal({ rule, onClose }: RuleModalProps) {
  const isEdit = !!rule;
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const { data: templates = [] } = useTemplates({ status: 'ACTIVE' });

  const [form, setForm] = React.useState({
    name: rule?.name ?? '',
    description: rule?.description ?? '',
    eventType: rule?.eventType ?? '',
    templateId: rule?.templateId ?? '',
    audienceType: rule?.audienceType ?? 'EMPLOYEE',
    audienceTarget: rule?.audienceTarget ?? '',
    channels: rule?.channels ?? ['IN_APP'],
    priority: rule?.priority ?? 'NORMAL',
    category: rule?.category ?? 'GENERAL',
    isActive: rule?.isActive ?? true,
    escalateAfterMinutes: rule?.escalateAfterMinutes ? String(rule.escalateAfterMinutes) : '',
    escalateToType: rule?.escalateToType ?? '',
    escalateChannels: rule?.escalateChannels ?? [],
  });

  const [error, setError] = React.useState('');

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter((c) => c !== ch)
        : [...f.channels, ch],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.eventType) { setError('Event type is required'); return; }
    if (form.channels.length === 0) { setError('Select at least one channel'); return; }

    try {
      const escalateAfterMinutes = form.escalateAfterMinutes ? parseInt(form.escalateAfterMinutes, 10) : undefined;
      const payload = {
        name: form.name,
        description: form.description || null,
        eventType: form.eventType,
        templateId: form.templateId || null,
        audienceType: form.audienceType,
        audienceTarget: form.audienceTarget || null,
        channels: form.channels,
        priority: form.priority,
        category: form.category,
        isActive: form.isActive,
        ...(escalateAfterMinutes ? { escalateAfterMinutes } : {}),
        ...(form.escalateToType ? { escalateToType: form.escalateToType } : {}),
        ...(form.escalateChannels.length > 0 ? { escalateChannels: form.escalateChannels } : {}),
      };

      if (isEdit) {
        await updateRule.mutateAsync({ id: rule!.id, data: payload });
      } else {
        await createRule.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError('Failed to save rule. Please try again.');
    }
  }

  const busy = createRule.isPending || updateRule.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e8eb]">
          <h2 className="text-sm font-semibold text-[#1a1d23]">
            {isEdit ? 'Edit Automation Rule' : 'New Automation Rule'}
          </h2>
          <button onClick={onClose} className="text-[#8a929b] hover:text-[#1a1d23]">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4 overflow-y-auto">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4a5260]">Rule Name *</label>
            <input
              className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
              placeholder="e.g. Leave Approved — Notify Employee"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4a5260]">Description</label>
            <input
              className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Event Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4a5260]">Trigger Event *</label>
            <select
              className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
              value={form.eventType}
              onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
            >
              <option value="">Select event…</option>
              {Array.from(new Set(EVENT_TYPES.map((e) => e.group))).map((group) => (
                <optgroup key={group} label={group}>
                  {EVENT_TYPES.filter((e) => e.group === group).map((et) => (
                    <option key={et.value} value={et.value}>{et.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Audience */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4a5260]">Audience *</label>
            <select
              className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
              value={form.audienceType}
              onChange={(e) => setForm((f) => ({ ...f, audienceType: e.target.value, audienceTarget: '' }))}
            >
              {AUDIENCE_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Audience Target */}
          {AUDIENCE_TYPES.find((a) => a.value === form.audienceType)?.needsTarget && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#4a5260]">
                Target ID <span className="text-[#6b7280]">(department / class / section / campus / role UUID)</span>
              </label>
              <input
                className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
                placeholder="e.g. 3f8a9c12-..."
                value={form.audienceTarget}
                onChange={(e) => setForm((f) => ({ ...f, audienceTarget: e.target.value }))}
              />
            </div>
          )}

          {/* Channels */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[#4a5260]">Delivery Channels *</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.channels.includes(ch)
                      ? 'bg-[#1a1d23] text-white border-[#1a1d23]'
                      : 'bg-white text-[#4a5260] border-[#e6e8eb] hover:border-[#1a1d23]'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#4a5260]">Priority</label>
              <select
                className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#4a5260]">Category</label>
              <select
                className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Template (optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#4a5260]">Template (optional)</label>
            <select
              className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
              value={form.templateId}
              onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
            >
              <option value="">No template (auto-generated message)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.channel} · {t.language})
                </option>
              ))}
            </select>
          </div>

          {/* Escalation */}
          <div className="flex flex-col gap-3 border border-[#e6e8eb] rounded-lg p-4 bg-[#fafaf8]">
            <label className="text-xs font-semibold text-[#4a5260] uppercase tracking-wide">Escalation (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6b7280]">Escalate if unread after (minutes)</label>
                <input
                  type="number"
                  min={1}
                  className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none"
                  placeholder="e.g. 30"
                  value={form.escalateAfterMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, escalateAfterMinutes: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6b7280]">Escalate To (audience type)</label>
                <select
                  className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none"
                  value={form.escalateToType}
                  onChange={(e) => setForm((f) => ({ ...f, escalateToType: e.target.value }))}
                >
                  <option value="">— none —</option>
                  {AUDIENCE_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6b7280] block mb-1">Escalation Channels</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        escalateChannels: f.escalateChannels.includes(ch)
                          ? f.escalateChannels.filter((c) => c !== ch)
                          : [...f.escalateChannels, ch],
                      }))
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.escalateChannels.includes(ch)
                        ? 'bg-[#1a1d23] text-white border-[#1a1d23]'
                        : 'bg-white text-[#4a5260] border-[#e6e8eb] hover:border-[#1a1d23]'
                    }`}
                  >{ch}</button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e6e8eb]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#4a5260] hover:text-[#1a1d23]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={busy}
            className="px-4 py-2 bg-[#1a1d23] text-white text-sm rounded-lg hover:bg-[#2a2d33] disabled:opacity-50"
          >
            {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteDialog({
  rule,
  onClose,
}: {
  rule: NotificationRule;
  onClose: () => void;
}) {
  const deleteRule = useDeleteRule();

  async function handleDelete() {
    await deleteRule.mutateAsync(rule.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#1a1d23]">Delete Rule</h2>
        <p className="text-sm text-[#4a5260]">
          Are you sure you want to delete <span className="font-medium">"{rule.name}"</span>?
          This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#4a5260] hover:text-[#1a1d23]">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteRule.isPending}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleteRule.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { data: rules = [], isLoading, isError } = useRules();
  const toggleRule = useToggleRule();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editRule, setEditRule] = React.useState<NotificationRule | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<NotificationRule | null>(null);
  const [filterEvent, setFilterEvent] = React.useState('');
  const [filterActive, setFilterActive] = React.useState('');

  const activeCount = rules.filter((r) => r.isActive).length;
  const inactiveCount = rules.filter((r) => !r.isActive).length;

  const filtered = rules.filter((r) => {
    if (filterEvent && r.eventType !== filterEvent) return false;
    if (filterActive === 'active' && !r.isActive) return false;
    if (filterActive === 'inactive' && r.isActive) return false;
    return true;
  });

  const eventLabel = (et: string) =>
    EVENT_TYPES.find((e) => e.value === et)?.label ?? et;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Automation"
        subtitle="Event triggers that fire notifications automatically"
        actions={
          <button
            onClick={() => { setEditRule(null); setModalOpen(true); }}
            className="px-4 py-2 bg-[#1a1d23] text-white text-sm rounded-lg hover:bg-[#2a2d33]"
          >
            + New Rule
          </button>
        }
      />

      {/* Summary chips */}
      <div className="flex gap-3">
        {[
          { label: 'Total Rules', value: rules.length, color: 'bg-[#f0f2f5] text-[#4a5260]' },
          { label: 'Active', value: activeCount, color: 'bg-[#e8fdf0] text-[#166534]' },
          { label: 'Inactive', value: inactiveCount, color: 'bg-[#f0f2f5] text-[#6b7280]' },
        ].map((c) => (
          <div key={c.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${c.color}`}>
            <span>{c.label}:</span>
            <span className="font-semibold">{c.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#4a5260] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
        >
          <option value="">All Events</option>
          {Array.from(new Set(EVENT_TYPES.map((e) => e.group))).map((group) => (
            <optgroup key={group} label={group}>
              {EVENT_TYPES.filter((e) => e.group === group).map((et) => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#4a5260] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-sm text-[#8a929b]">
            Loading rules…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-24 text-sm text-red-600">
            Failed to load rules.
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div style={{ fontSize: 32 }}>⚡</div>
            <p className="text-sm font-semibold text-[#4a5260]">
              {rules.length === 0 ? 'No automation rules yet' : 'No rules match your filters'}
            </p>
            {rules.length === 0 && (
              <p className="text-xs text-[#8a929b] text-center max-w-sm">
                Rules automatically send notifications when events fire in Leave, Attendance,
                Substitution, and other modules.
              </p>
            )}
            {rules.length === 0 && (
              <button
                onClick={() => { setEditRule(null); setModalOpen(true); }}
                className="px-4 py-2 bg-[#1a1d23] text-white text-sm rounded-lg hover:bg-[#2a2d33] mt-2"
              >
                Create First Rule
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e6e8eb] bg-[#f9fafb]">
                {['Rule', 'Event', 'Audience', 'Channels', 'Priority', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {filtered.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#1a1d23]">{rule.name}</p>
                    {rule.description && (
                      <p className="text-xs text-[#8a929b] mt-0.5 max-w-xs truncate">{rule.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-[#f0f2f5] text-[#4a5260] px-2 py-1 rounded">
                      {eventLabel(rule.eventType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[#4a5260]">
                      {AUDIENCE_TYPES.find((a) => a.value === rule.audienceType)?.label ?? rule.audienceType}
                    </span>
                    {rule.audienceTarget && (
                      <p className="text-[10px] text-[#8a929b] font-mono mt-0.5">{rule.audienceTarget.slice(0, 12)}…</p>
                    )}
                    {rule.escalateAfterMinutes && (
                      <p className="text-[10px] text-amber-600 mt-0.5">⬆ escalate {rule.escalateAfterMinutes}m</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rule.channels.map((ch) => (
                        <span key={ch} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CHANNEL_COLOR[ch] ?? 'bg-[#f0f2f5] text-[#4a5260]'}`}>
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[rule.priority] ?? ''}`}>
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRule.mutate(rule.id)}
                      disabled={toggleRule.isPending}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${rule.isActive ? 'bg-[#1a1d23]' : 'bg-[#d1d5db]'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${rule.isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditRule(rule); setModalOpen(true); }}
                        className="text-xs text-[#4a5260] hover:text-[#1a1d23] px-2 py-1 rounded hover:bg-[#f0f2f5]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(rule)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <RuleModal
          rule={editRule ?? undefined}
          onClose={() => { setModalOpen(false); setEditRule(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          rule={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
