'use client';

import * as React from 'react';
import { Button, Modal, Input, Select } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useOrganization,
  useCampuses,
} from '@/lib/hooks/use-academics';
import type { CalendarEvent, CalendarEventType } from '@/lib/types/academics';

// ─── Event type config ────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; bg: string; color: string; border: string }
> = {
  HOLIDAY:  { label: 'Holiday',  bg: '#fef3f2', color: '#b42318', border: '#fecdca' },
  EXAM:     { label: 'Exam',     bg: '#fef9ee', color: '#92400e', border: '#fcd34d' },
  EVENT:    { label: 'Event',    bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  MEETING:  { label: 'Meeting',  bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  OTHER:    { label: 'Other',    bg: '#f8f9fa', color: '#4b5563', border: '#e5e7eb' },
};

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_CONFIG).map(([value, { label }]) => ({
  label,
  value,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDateInput(iso: string) {
  return iso.substring(0, 10);
}

function isoToLocalDate(iso: string): Date {
  // Parse "YYYY-MM-DD..." without timezone shift
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

function eventSpansDay(event: CalendarEvent, day: Date): boolean {
  const start = isoToLocalDate(event.startDate);
  const end = isoToLocalDate(event.endDate);
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return d >= start && d <= end;
}

// ─── Event type badge ─────────────────────────────────────────────────────────

function EventTypeBadge({ type }: { type: CalendarEventType }) {
  const cfg = EVENT_TYPE_CONFIG[type];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 10,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Event pill (month view) ──────────────────────────────────────────────────

function EventPill({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const cfg = EVENT_TYPE_CONFIG[event.eventType];
  return (
    <button
      onClick={onClick}
      title={event.title}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '2px 5px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginBottom: 2,
      }}
    >
      {event.title}
    </button>
  );
}

// ─── View toggle ──────────────────────────────────────────────────────────────

type View = 'month' | 'list';

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        background: '#f2f4f6',
        borderRadius: 8,
        padding: 3,
        width: 'fit-content',
      }}
    >
      {(['month', 'list'] as View[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            padding: '5px 14px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: view === v ? 600 : 400,
            background: view === v ? '#fff' : 'transparent',
            color: view === v ? '#2c322f' : '#8a929b',
            boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {v === 'month' ? 'Month' : 'List'}
        </button>
      ))}
    </div>
  );
}

// ─── Month grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  month,
  year,
  events,
  onEventClick,
}: {
  month: number; // 0-indexed
  year: number;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
}) {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Day labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          marginBottom: 2,
        }}
      >
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              padding: '6px 4px',
              fontSize: 11,
              fontWeight: 700,
              color: '#8a929b',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          border: '1px solid #ecedf0',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  minHeight: 90,
                  background: '#fafafa',
                  borderRight: '1px solid #ecedf0',
                  borderBottom: '1px solid #ecedf0',
                }}
              />
            );
          }

          const cellDate = new Date(year, month, day);
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          const dayEvents = events.filter((e) => eventSpansDay(e, cellDate));
          const hasSchoolClosed = dayEvents.some((e) => e.isSchoolClosed);

          return (
            <div
              key={day}
              style={{
                minHeight: 90,
                padding: '6px 5px',
                borderRight: '1px solid #ecedf0',
                borderBottom: '1px solid #ecedf0',
                background: hasSchoolClosed
                  ? '#fff8f8'
                  : isToday
                    ? '#f4faf5'
                    : '#fff',
                verticalAlign: 'top',
              }}
            >
              {/* Day number */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : '#4a5260',
                    background: isToday ? '#5d7f6b' : 'transparent',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {day}
                </span>
              </div>

              {/* Event pills — show up to 2, then "+N more" */}
              {dayEvents.slice(0, 2).map((e) => (
                <EventPill key={e.id} event={e} onClick={() => onEventClick(e)} />
              ))}
              {dayEvents.length > 2 && (
                <span style={{ fontSize: 10, color: '#8a929b', paddingLeft: 4 }}>
                  +{dayEvents.length - 2} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  events,
  onEdit,
  onDelete,
}: {
  events: CalendarEvent[];
  onEdit: (e: CalendarEvent) => void;
  onDelete: (e: CalendarEvent) => void;
}) {
  // Group by month-year
  const groups = React.useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const d = isoToLocalDate(e.startDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return Array.from(m.entries()).map(([key, evts]) => {
      const [y, mo] = key.split('-').map(Number);
      return { label: `${MONTH_NAMES[mo! - 1]} ${y}`, events: evts };
    });
  }, [events]);

  if (groups.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 28 }}>📅</span>
        <p style={{ fontSize: 13, color: '#6b7480', margin: 0 }}>
          No events for this academic year yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {groups.map(({ label, events: grpEvents }) => (
        <div key={label}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#8a929b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            {label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {grpEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  border: '1px solid #e6e8eb',
                  borderRadius: 8,
                  background: '#fff',
                }}
              >
                {/* Date block */}
                <div
                  style={{
                    width: 48,
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#14181c',
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {isoToLocalDate(event.startDate).getDate()}
                  </p>
                  <p style={{ fontSize: 11, color: '#8a929b', margin: '2px 0 0' }}>
                    {MONTH_NAMES[isoToLocalDate(event.startDate).getMonth()]?.slice(0, 3)}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 40, background: '#ecedf0', flexShrink: 0 }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#14181c',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.title}
                    </span>
                    {event.isSchoolClosed && (
                      <span
                        style={{
                          fontSize: 10,
                          background: '#fef3f2',
                          color: '#b42318',
                          border: '1px solid #fecdca',
                          borderRadius: 8,
                          padding: '1px 6px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        School Closed
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <EventTypeBadge type={event.eventType} />
                    <span style={{ fontSize: 11, color: '#8a929b' }}>
                      {fmtDateShort(event.startDate)}
                      {event.startDate.substring(0, 10) !== event.endDate.substring(0, 10) &&
                        ` – ${fmtDateShort(event.endDate)}`}
                    </span>
                    {event.campus && (
                      <span style={{ fontSize: 11, color: '#8a929b' }}>
                        · {event.campus.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => onEdit(event)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #e6e8eb',
                      background: '#fff',
                      fontSize: 12,
                      color: '#4a5260',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(event)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #fecdca',
                      background: '#fff',
                      fontSize: 12,
                      color: '#b42318',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

interface EventFormState {
  title: string;
  eventType: string;
  startDate: string;
  endDate: string;
  isSchoolClosed: boolean;
  description: string;
  campusId: string;
}

const EMPTY_FORM: EventFormState = {
  title: '',
  eventType: 'HOLIDAY',
  startDate: '',
  endDate: '',
  isSchoolClosed: false,
  description: '',
  campusId: '',
};

interface EventErrors { title?: string; startDate?: string; endDate?: string }

function CalendarEventModal({
  open,
  onClose,
  yearId,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  yearId: string;
  editing: CalendarEvent | null;
}) {
  const [form, setForm] = React.useState<EventFormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<EventErrors>({});
  const toast = useToast();

  const { data: org } = useOrganization();
  const { data: campuses = [] } = useCampuses(org?.id);
  const create = useCreateCalendarEvent();
  const update = useUpdateCalendarEvent();

  React.useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          title: editing.title,
          eventType: editing.eventType,
          startDate: toDateInput(editing.startDate),
          endDate: toDateInput(editing.endDate),
          isSchoolClosed: editing.isSchoolClosed,
          description: editing.description ?? '',
          campusId: editing.campusId ?? '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, editing]);

  const setF =
    (field: keyof EventFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: EventErrors = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      errs.endDate = 'End date must be on or after start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload = {
      title: form.title.trim(),
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.endDate,
      isSchoolClosed: form.isSchoolClosed,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.campusId ? { campusId: form.campusId } : {}),
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, dto: payload });
        toast.success(`"${form.title}" updated.`);
      } else {
        await create.mutateAsync({ academicYearId: yearId, ...payload });
        toast.success(`"${form.title}" added to calendar.`);
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to save event.');
    }
  }

  const campusOptions = [
    { label: 'All campuses (org-wide)', value: '' },
    ...campuses.map((c) => ({ label: c.name, value: c.id })),
  ];

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Calendar Event' : 'Add Calendar Event'}
      description={editing ? 'Update the event details.' : 'Add a holiday, exam day, or event to the academic calendar.'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Event'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          value={form.title}
          onChange={setF('title')}
          placeholder="e.g. Diwali Holiday"
          {...(errors.title ? { error: errors.title } : {})}
        />

        <Select
          label="Event Type"
          value={form.eventType}
          onChange={setF('eventType')}
          options={EVENT_TYPE_OPTIONS}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            required
            type="date"
            value={form.startDate}
            onChange={setF('startDate')}
            {...(errors.startDate ? { error: errors.startDate } : {})}
          />
          <Input
            label="End Date"
            required
            type="date"
            value={form.endDate}
            onChange={setF('endDate')}
            {...(errors.endDate ? { error: errors.endDate } : {})}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isSchoolClosed}
            onChange={(e) => setForm((f) => ({ ...f, isSchoolClosed: e.target.checked }))}
            style={{ accentColor: '#5d7f6b', width: 15, height: 15 }}
          />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#14181c', margin: 0 }}>
              School closed
            </p>
            <p style={{ fontSize: 11, color: '#8a929b', margin: '2px 0 0' }}>
              Mark this as a no-school day (highlighted on the calendar)
            </p>
          </div>
        </label>

        <Select
          label="Campus"
          value={form.campusId}
          onChange={setF('campusId')}
          options={campusOptions}
          hint="Leave as 'All campuses' for org-wide events"
        />

        <Input
          label="Description"
          value={form.description}
          onChange={setF('description')}
          placeholder="Optional notes"
        />
      </div>
    </Modal>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteEventConfirm({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const remove = useDeleteCalendarEvent();

  if (!event) return null;

  async function handleConfirm() {
    if (!event) return;
    try {
      await remove.mutateAsync(event.id);
      toast.success(`"${event.title}" removed from calendar.`);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete event.');
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete Calendar Event"
      description={`Remove "${event.title}" (${fmtDateShort(event.startDate)}) from the calendar? This cannot be undone.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={remove.isPending}>
            {remove.isPending ? 'Deleting…' : 'Delete Event'}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function CalendarTab({ yearId }: { yearId: string }) {
  const [view, setView] = React.useState<View>('month');
  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CalendarEvent | null>(null);

  // Month navigation state (for month view)
  const now = new Date();
  const [navMonth, setNavMonth] = React.useState(now.getMonth()); // 0-indexed
  const [navYear, setNavYear] = React.useState(now.getFullYear());

  // Fetch all events for the year (list view) — month filter only for month view
  const { data: allEvents = [] } = useCalendarEvents(yearId || undefined);

  // Events for the currently displayed month
  const monthEvents = React.useMemo(
    () =>
      allEvents.filter((e) => {
        const start = isoToLocalDate(e.startDate);
        const end = isoToLocalDate(e.endDate);
        const mStart = new Date(navYear, navMonth, 1);
        const mEnd = new Date(navYear, navMonth + 1, 0);
        return start <= mEnd && end >= mStart;
      }),
    [allEvents, navMonth, navYear],
  );

  function prevMonth() {
    if (navMonth === 0) { setNavMonth(11); setNavYear((y) => y - 1); }
    else setNavMonth((m) => m - 1);
  }
  function nextMonth() {
    if (navMonth === 11) { setNavMonth(0); setNavYear((y) => y + 1); }
    else setNavMonth((m) => m + 1);
  }

  if (!yearId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 260,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 28 }}>📅</span>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#4a5260' }}>
          Select an Academic Year
        </p>
        <p style={{ fontSize: 13, color: '#8a929b' }}>
          Choose a year from the selector above to view the calendar.
        </p>
      </div>
    );
  }

  // Summary stats
  const holidays = allEvents.filter((e) => e.eventType === 'HOLIDAY').length;
  const exams = allEvents.filter((e) => e.eventType === 'EXAM').length;
  const closedDays = allEvents.filter((e) => e.isSchoolClosed).length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#14181c', margin: 0 }}>
              Academic Calendar
            </p>
            <p style={{ fontSize: 12, color: '#8a929b', margin: '2px 0 0' }}>
              {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} · {holidays} holiday{holidays !== 1 ? 's' : ''} · {exams} exam day{exams !== 1 ? 's' : ''} · {closedDays} closed day{closedDays !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ViewToggle view={view} onChange={setView} />
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            + Add Event
          </Button>
        </div>
      </div>

      {/* Month navigation (only in month view) */}
      {view === 'month' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <button
            onClick={prevMonth}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e6e8eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              color: '#4a5260',
            }}
          >
            ‹ Prev
          </button>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#14181c', margin: 0 }}>
            {MONTH_NAMES[navMonth]} {navYear}
          </p>
          <button
            onClick={nextMonth}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e6e8eb',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              color: '#4a5260',
            }}
          >
            Next ›
          </button>
        </div>
      )}

      {/* Legend (month view only) */}
      {view === 'month' && (
        <div
          style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}
        >
          {Object.entries(EVENT_TYPE_CONFIG).map(([type, cfg]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 11, color: '#6b7480' }}>{cfg.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: '#fff8f8',
                border: '1px solid #fecdca',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, color: '#6b7480' }}>School closed</span>
          </div>
        </div>
      )}

      {/* Content */}
      {view === 'month' ? (
        <MonthGrid
          month={navMonth}
          year={navYear}
          events={monthEvents}
          onEventClick={(e) => setEditTarget(e)}
        />
      ) : (
        <ListView
          events={allEvents}
          onEdit={(e) => setEditTarget(e)}
          onDelete={(e) => setDeleteTarget(e)}
        />
      )}

      {/* Modals */}
      <CalendarEventModal
        open={addOpen || editTarget !== null}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        yearId={yearId}
        editing={editTarget}
      />
      <DeleteEventConfirm
        event={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
