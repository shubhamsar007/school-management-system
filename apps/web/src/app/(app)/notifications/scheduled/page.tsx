'use client';

import * as React from 'react';
import { NotificationSubNav } from '../_components/notification-sub-nav';
import {
  useNotifSchedules,
  useCreateNotifSchedule,
  useUpdateNotifSchedule,
  useToggleNotifSchedule,
  useDeleteNotifSchedule,
  type NotificationSchedule,
} from '@/lib/hooks/use-comms';
import { Clock, Plus, Edit2, Trash2, Play, Pause, RefreshCw } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECURRENCE_OPTIONS = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const;
const AUDIENCE_TYPES = [
  'EMPLOYEE', 'ALL_EMPLOYEES', 'STUDENT_GUARDIANS',
  'DEPARTMENT', 'CLASS', 'SECTION', 'CAMPUS_EMPLOYEES', 'ROLE_MEMBERS',
] as const;
const CHANNELS = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'] as const;
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const CATEGORIES = ['ACADEMIC', 'ATTENDANCE', 'EXAMINATION', 'FINANCE', 'ADMISSIONS', 'HR', 'SUBSTITUTION', 'ANNOUNCEMENT', 'PTM', 'SYSTEM', 'GENERAL'] as const;

function recurrenceBadge(r: string) {
  const map: Record<string, { bg: string; color: string }> = {
    ONCE:    { bg: '#f0f0f0', color: '#555' },
    DAILY:   { bg: '#e0f0ff', color: '#1565c0' },
    WEEKLY:  { bg: '#e8f5e9', color: '#2e7d32' },
    MONTHLY: { bg: '#fff3e0', color: '#e65100' },
  };
  const s = map[r] ?? { bg: '#f0f0f0', color: '#555' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
      background: s.bg, color: s.color, textTransform: 'uppercase' as const,
    }}>{r}</span>
  );
}

function formatNext(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return 'Overdue';
  if (diff < 60_000) return 'In <1 min';
  if (diff < 3600_000) return `In ${Math.round(diff / 60_000)}m`;
  if (diff < 86_400_000) return `In ${Math.round(diff / 3600_000)}h`;
  return d.toLocaleDateString();
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  recurrence: string;
  scheduledAt: string;
  title: string;
  message: string;
  audienceType: string;
  audienceTarget: string;
  channels: string[];
  priority: string;
  category: string;
}

const BLANK: FormState = {
  name: '', description: '', recurrence: 'ONCE', scheduledAt: '',
  title: '', message: '', audienceType: 'ALL_EMPLOYEES', audienceTarget: '',
  channels: ['IN_APP'], priority: 'NORMAL', category: 'GENERAL',
};

function ScheduleModal({
  open, schedule, onClose,
}: {
  open: boolean;
  schedule: NotificationSchedule | undefined;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<FormState>(BLANK);
  const [saving, setSaving] = React.useState(false);

  const createMutation = useCreateNotifSchedule();
  const updateMutation = useUpdateNotifSchedule();

  React.useEffect(() => {
    if (!open) return;
    if (schedule) {
      setForm({
        name: schedule.name,
        description: schedule.description ?? '',
        recurrence: schedule.recurrence,
        scheduledAt: schedule.scheduledAt ? schedule.scheduledAt.slice(0, 16) : '',
        title: schedule.title,
        message: schedule.message,
        audienceType: schedule.audienceType,
        audienceTarget: schedule.audienceTarget ?? '',
        channels: schedule.channels,
        priority: schedule.priority,
        category: schedule.category,
      });
    } else {
      setForm(BLANK);
    }
    setSaving(false);
  }, [open, schedule]);

  if (!open) return null;

  const isEditing = !!schedule;
  const needsTarget = ['EMPLOYEE', 'DEPARTMENT', 'CLASS', 'SECTION', 'CAMPUS_EMPLOYEES', 'ROLE_MEMBERS', 'STUDENT_GUARDIANS'].includes(form.audienceType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = {
        name: form.name,
        ...(form.description ? { description: form.description } : {}),
        recurrence: form.recurrence,
        ...(form.scheduledAt ? { scheduledAt: new Date(form.scheduledAt).toISOString() } : {}),
        title: form.title,
        message: form.message,
        audienceType: form.audienceType,
        ...(form.audienceTarget ? { audienceTarget: form.audienceTarget } : {}),
        channels: form.channels,
        priority: form.priority,
        category: form.category,
      };
      if (isEditing) {
        await updateMutation.mutateAsync({ id: schedule.id, ...dto });
      } else {
        await createMutation.mutateAsync(dto);
      }
      onClose();
    } catch {
      setSaving(false);
    }
  }

  function toggleChannel(ch: string) {
    setForm((f) =>
      f.channels.includes(ch)
        ? { ...f, channels: f.channels.filter((c) => c !== ch) }
        : { ...f, channels: [...f.channels, ch] },
    );
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 7,
    border: '1px solid #dde0d9', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600,
        maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>
          {isEditing ? 'Edit Schedule' : 'New Scheduled Message'}
        </h2>

        <form onSubmit={(e) => { void handleSubmit(e); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Name *</label>
              <input style={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Description</label>
              <input style={field} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Recurrence *</label>
                <select style={field} value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
                  {RECURRENCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
                  {form.recurrence === 'ONCE' ? 'Send At *' : 'First Run At'}
                </label>
                <input type="datetime-local" style={field} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Notification Title *</label>
              <input style={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={255} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Message *</label>
              <textarea
                style={{ ...field, minHeight: 72, resize: 'vertical' }}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Audience *</label>
                <select style={field} value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value, audienceTarget: '' })}>
                  {AUDIENCE_TYPES.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {needsTarget && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
                    Target ID {form.audienceType !== 'ALL_EMPLOYEES' ? '*' : ''}
                  </label>
                  <input
                    style={field}
                    placeholder="e.g. dept-uuid, class-uuid"
                    value={form.audienceTarget}
                    onChange={(e) => setForm({ ...form, audienceTarget: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Channels *</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CHANNELS.map((ch) => {
                  const active = form.channels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: active ? '#2c7a51' : '#f4f1e9', color: active ? '#fff' : '#555',
                        border: active ? '1.5px solid #2c7a51' : '1.5px solid #dde0d9',
                      }}
                    >{ch}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Priority</label>
                <select style={field} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Category</label>
                <select style={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid #dde0d9',
                background: '#fff', fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
              <button type="submit" disabled={saving || form.channels.length === 0} style={{
                padding: '8px 22px', borderRadius: 8, border: 'none',
                background: '#2c7a51', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete dialog ─────────────────────────────────────────────────────────────

function DeleteDialog({ schedule, onClose }: { schedule: NotificationSchedule; onClose: () => void }) {
  const deleteMutation = useDeleteNotifSchedule();

  async function handleDelete() {
    await deleteMutation.mutateAsync(schedule.id);
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400, width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Delete Schedule?</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#555' }}>
          <strong>{schedule.name}</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '7px 18px', borderRadius: 7, border: '1px solid #dde0d9',
            background: '#fff', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button onClick={() => void handleDelete()} disabled={deleteMutation.isPending} style={{
            padding: '7px 18px', borderRadius: 7, border: 'none',
            background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScheduledPage() {
  const [recurrenceFilter, setRecurrenceFilter] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<NotificationSchedule | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = React.useState<NotificationSchedule | null>(null);

  const filters = {
    ...(recurrenceFilter ? { recurrence: recurrenceFilter } : {}),
    ...(activeFilter === 'active' ? { isActive: true } : activeFilter === 'inactive' ? { isActive: false } : {}),
  };

  const { data: schedules = [], isLoading, error, refetch } = useNotifSchedules(filters);
  const toggleMutation = useToggleNotifSchedule();

  const stats = React.useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter((s) => s.isActive).length;
    const once = schedules.filter((s) => s.recurrence === 'ONCE').length;
    const recurring = schedules.filter((s) => s.recurrence !== 'ONCE').length;
    return { total, active, once, recurring };
  }, [schedules]);

  function openCreate() { setEditTarget(undefined); setModalOpen(true); }
  function openEdit(s: NotificationSchedule) { setEditTarget(s); setModalOpen(true); }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <NotificationSubNav />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Scheduled Messages</h1>
            <p style={{ margin: '4px 0 0', color: '#6d746e', fontSize: 13 }}>
              One-time and recurring notification schedules
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => void refetch()} style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #dde0d9',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={openCreate} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#2c7a51', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
            }}>
              <Plus size={14} /> New Schedule
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total', value: stats.total, color: '#2c322f' },
            { label: 'Active', value: stats.active, color: '#2c7a51' },
            { label: 'One-time', value: stats.once, color: '#1565c0' },
            { label: 'Recurring', value: stats.recurring, color: '#e65100' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#fff', borderRadius: 10, padding: '14px 18px',
              border: '1px solid #eaede7',
            }}>
              <div style={{ fontSize: 11, color: '#6d746e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <select
            value={recurrenceFilter}
            onChange={(e) => setRecurrenceFilter(e.target.value)}
            style={{
              padding: '7px 12px', borderRadius: 7, border: '1px solid #dde0d9',
              fontSize: 13, background: '#fff', cursor: 'pointer',
            }}
          >
            <option value="">All recurrences</option>
            {RECURRENCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          {(['all', 'active', 'inactive'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveFilter(v)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: 'none',
                background: activeFilter === v ? '#2c322f' : '#f4f1e9',
                color: activeFilter === v ? '#fff' : '#555',
              }}
            >{v.charAt(0).toUpperCase() + v.slice(1)}</button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6d746e' }}>Loading schedules…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#c0392b' }}>Failed to load schedules</div>
        ) : schedules.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12,
            border: '1px dashed #dde0d9', color: '#6d746e',
          }}>
            <Clock size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No schedules yet</div>
            <div style={{ fontSize: 13 }}>Create your first scheduled notification to get started.</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eaede7', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9f8f4' }}>
                  {['Name', 'Recurrence', 'Audience', 'Channels', 'Next Run', 'Runs', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6d746e', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #eaede7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f0f0ee' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#6d746e', marginTop: 2 }}>{s.title}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>{recurrenceBadge(s.recurrence)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12 }}>
                      <div>{s.audienceType.replace(/_/g, ' ')}</div>
                      {s.audienceTarget && <div style={{ color: '#6d746e', fontSize: 11, marginTop: 2 }}>{s.audienceTarget.slice(0, 12)}…</div>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {s.channels.map((ch) => (
                          <span key={ch} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f0f4ef', color: '#2c7a51' }}>{ch}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: s.nextRunAt && new Date(s.nextRunAt) < new Date() ? '#c0392b' : '#2c322f' }}>
                      {formatNext(s.nextRunAt)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{s.runCount}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => toggleMutation.mutate(s.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                          borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          background: s.isActive ? '#e8f5e9' : '#f5f5f5',
                          color: s.isActive ? '#2e7d32' : '#555',
                        }}
                      >
                        {s.isActive ? <><Play size={10} /> Active</> : <><Pause size={10} /> Paused</>}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => openEdit(s)}
                          title="Edit"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d746e', padding: 4 }}
                        ><Edit2 size={14} /></button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', padding: 4 }}
                        ><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ScheduleModal
        open={modalOpen}
        schedule={editTarget}
        onClose={() => setModalOpen(false)}
      />

      {deleteTarget && (
        <DeleteDialog schedule={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
