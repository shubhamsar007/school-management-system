'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  useTeacherAvailability,
  useSetTeacherAvailability,
  useUnavailabilityOverrides,
  useCreateUnavailabilityOverride,
  useDeleteUnavailabilityOverride,
} from '@/lib/substitution-api';
import type { AvailabilitySlot, UnavailabilityOverride } from '@/lib/substitution-api';
import { Search, CheckCircle2, XCircle, CalendarX, Plus, Trash2 } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: 'Monday',    short: 'Mon' },
  { value: 2, label: 'Tuesday',   short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday',  short: 'Thu' },
  { value: 5, label: 'Friday',    short: 'Fri' },
  { value: 6, label: 'Saturday',  short: 'Sat' },
  { value: 7, label: 'Sunday',    short: 'Sun' },
];

function defaultSlots(): AvailabilitySlot[] {
  return DAYS.map((d) => ({
    dayOfWeek: d.value,
    isAvailable: d.value <= 5, // Mon–Fri available by default
    note: null,
  }));
}

// ─── Day row ──────────────────────────────────────────────────────────────────

function DayRow({
  day,
  slot,
  onChange,
}: {
  day: { value: number; label: string; short: string };
  slot: AvailabilitySlot;
  onChange: (updated: AvailabilitySlot) => void;
}) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3 border-b border-[#f3f4f6] last:border-0"
      style={{ background: slot.isAvailable ? 'white' : '#fafbfc' }}
    >
      {/* Day label */}
      <div className="w-28 flex-shrink-0">
        <span className="text-sm font-medium text-[#14181c]">{day.label}</span>
      </div>

      {/* Toggle */}
      <button
        role="switch"
        aria-checked={slot.isAvailable}
        onClick={() => onChange({ ...slot, isAvailable: !slot.isAvailable })}
        className="relative inline-flex items-center rounded-full transition-colors flex-shrink-0"
        style={{ width: 36, height: 20, background: slot.isAvailable ? '#2b5fa8' : '#d1d5db' }}
      >
        <span
          className="inline-block rounded-full bg-white transition-transform"
          style={{ width: 16, height: 16, transform: slot.isAvailable ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </button>

      {/* Status icon + label */}
      <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
        {slot.isAvailable ? (
          <>
            <CheckCircle2 size={14} color="#146b41" />
            <span className="text-xs font-medium text-[#146b41]">Available</span>
          </>
        ) : (
          <>
            <XCircle size={14} color="#8a929b" />
            <span className="text-xs font-medium text-[#8a929b]">Unavailable</span>
          </>
        )}
      </div>

      {/* Note */}
      <input
        type="text"
        value={slot.note ?? ''}
        onChange={(e) => onChange({ ...slot, note: e.target.value || null })}
        placeholder={slot.isAvailable ? 'Optional note…' : 'Reason for unavailability…'}
        className="flex-1 rounded-lg border border-[#e6e8eb] px-3 py-1.5 text-sm outline-none focus:border-[#2b5fa8] bg-white"
      />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, success, onDismiss }: { message: string; success: boolean; onDismiss: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-5 right-5 z-50 rounded-xl shadow-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
      style={{
        background: success ? '#f0fdf4' : '#fef2f2',
        border: `1.5px solid ${success ? '#bbf7d0' : '#fecaca'}`,
        color: success ? '#146b41' : '#b3261e',
      }}
    >
      {message}
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const [employeeId, setEmployeeId] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [slots, setSlots] = React.useState<AvailabilitySlot[]>(defaultSlots());
  const [toast, setToast] = React.useState<{ message: string; success: boolean } | null>(null);
  const [dirty, setDirty] = React.useState(false);

  const { data, isLoading, isError } = useTeacherAvailability(employeeId, !!employeeId);
  const setAvailability = useSetTeacherAvailability();
  const { data: overrides } = useUnavailabilityOverrides(employeeId, !!employeeId);
  const createOverride = useCreateUnavailabilityOverride();
  const deleteOverride = useDeleteUnavailabilityOverride();

  const [showOverrideForm, setShowOverrideForm] = React.useState(false);
  const [ovrStart, setOvrStart]   = React.useState('');
  const [ovrEnd, setOvrEnd]       = React.useState('');
  const [ovrReason, setOvrReason] = React.useState('');
  const [ovrError, setOvrError]   = React.useState('');

  const handleAddOverride = () => {
    if (!ovrStart || !ovrEnd) { setOvrError('Start and end date are required.'); return; }
    if (ovrStart > ovrEnd) { setOvrError('Start must be before end.'); return; }
    setOvrError('');
    createOverride.mutate(
      { employeeId, startDate: ovrStart, endDate: ovrEnd, reason: ovrReason || undefined },
      {
        onSuccess: () => {
          setShowOverrideForm(false);
          setOvrStart(''); setOvrEnd(''); setOvrReason('');
        },
        onError: (e: Error) => setOvrError(e.message),
      },
    );
  };

  // Seed slots when availability loads
  React.useEffect(() => {
    if (data) {
      // Merge API slots with defaults (API may return partial days)
      const merged = defaultSlots().map((def) => {
        const found = data.slots.find((s) => s.dayOfWeek === def.dayOfWeek);
        return found ?? def;
      });
      setSlots(merged);
      setDirty(false);
    }
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setEmployeeId(trimmed);
      setSlots(defaultSlots());
      setDirty(false);
    }
  };

  const handleSlotChange = (updated: AvailabilitySlot) => {
    setSlots((prev) => prev.map((s) => (s.dayOfWeek === updated.dayOfWeek ? updated : s)));
    setDirty(true);
  };

  const handleSave = () => {
    setAvailability.mutate(
      { employeeId, slots },
      {
        onSuccess: () => {
          setDirty(false);
          setToast({ message: 'Availability saved.', success: true });
        },
        onError: (e: Error) => {
          setToast({ message: e.message || 'Failed to save.', success: false });
        },
      },
    );
  };

  const handleSetAll = (available: boolean) => {
    setSlots((prev) => prev.map((s) => ({ ...s, isAvailable: available })));
    setDirty(true);
  };

  return (
    <div>
      <PageHeader
        title="Teacher Availability"
        subtitle="View and edit weekly availability for any teacher"
        actions={
          employeeId && (
            <button
              onClick={handleSave}
              disabled={!dirty || setAvailability.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: '#2b5fa8' }}
            >
              {setAvailability.isPending ? 'Saving…' : 'Save Availability'}
            </button>
          )
        }
      />

      {/* Employee search */}
      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm p-5 mb-4">
        <p className="text-sm font-semibold text-[#14181c] mb-3">Look up a teacher</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a929b]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter employee ID…"
              className="w-full rounded-lg border border-[#e6e8eb] pl-8 pr-3 py-2 text-sm outline-none focus:border-[#2b5fa8]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2b5fa8]"
          >
            Load
          </button>
        </form>
        {employeeId && (
          <p className="text-xs text-[#6b7480] mt-2">
            Showing availability for employee <span className="font-mono font-semibold text-[#14181c]">{employeeId}</span>
          </p>
        )}
      </div>

      {/* Availability grid */}
      {employeeId && (
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e6e8eb] flex items-center justify-between" style={{ background: '#fafbfc' }}>
            <div>
              <p className="text-sm font-semibold text-[#14181c]">Weekly Availability</p>
              <p className="text-xs text-[#6b7480] mt-0.5">Toggle each day and optionally add a note.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSetAll(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#e6e8eb] text-[#146b41] hover:bg-[#f0fdf4]"
              >
                All available
              </button>
              <button
                onClick={() => handleSetAll(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#e6e8eb] text-[#b3261e] hover:bg-[#fef2f2]"
              >
                All unavailable
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading availability…</div>
          ) : isError ? (
            <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">
              No existing record — showing defaults. Edit and save to create one.
            </div>
          ) : null}

          {/* Always show the grid so user can edit even when no record exists */}
          {!isLoading && (
            <div>
              {DAYS.map((day) => {
                const slot = slots.find((s) => s.dayOfWeek === day.value) ?? {
                  dayOfWeek: day.value,
                  isAvailable: day.value <= 5,
                  note: null,
                };
                return (
                  <DayRow
                    key={day.value}
                    day={day}
                    slot={slot}
                    onChange={handleSlotChange}
                  />
                );
              })}
            </div>
          )}

          {/* Summary bar */}
          {!isLoading && (
            <div className="px-5 py-3 border-t border-[#e6e8eb] bg-[#fafbfc] flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} color="#146b41" />
                <span className="text-xs text-[#4a5260]">
                  <span className="font-semibold">{slots.filter((s) => s.isAvailable).length}</span> days available
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle size={13} color="#8a929b" />
                <span className="text-xs text-[#4a5260]">
                  <span className="font-semibold">{slots.filter((s) => !s.isAvailable).length}</span> days unavailable
                </span>
              </div>
              {dirty && (
                <span className="text-xs text-[#8a5a00] font-medium ml-auto">Unsaved changes</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Date-range unavailability overrides */}
      {employeeId && (
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden mt-4">
          <div className="px-5 py-4 border-b border-[#e6e8eb] flex items-center justify-between" style={{ background: '#fafbfc' }}>
            <div>
              <p className="text-sm font-semibold text-[#14181c]">Date-range Overrides</p>
              <p className="text-xs text-[#6b7480] mt-0.5">Block specific date ranges (e.g. conferences, extended leave)</p>
            </div>
            <button
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e6e8eb] text-[#2b5fa8] hover:bg-[#eff6ff]"
            >
              <Plus size={12} />
              Add Override
            </button>
          </div>

          {showOverrideForm && (
            <div className="px-5 py-4 border-b border-[#e6e8eb] bg-[#eff6ff]">
              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#6b7480]">From</label>
                  <input type="date" value={ovrStart} onChange={(e) => setOvrStart(e.target.value)}
                    className="rounded-lg border border-[#e6e8eb] px-3 py-1.5 text-sm outline-none focus:border-[#2b5fa8] bg-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-[#6b7480]">To</label>
                  <input type="date" value={ovrEnd} onChange={(e) => setOvrEnd(e.target.value)}
                    className="rounded-lg border border-[#e6e8eb] px-3 py-1.5 text-sm outline-none focus:border-[#2b5fa8] bg-white" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-[#6b7480]">Reason (optional)</label>
                  <input type="text" value={ovrReason} onChange={(e) => setOvrReason(e.target.value)}
                    placeholder="e.g. Conference, Training…"
                    className="w-full rounded-lg border border-[#e6e8eb] px-3 py-1.5 text-sm outline-none focus:border-[#2b5fa8] bg-white" />
                </div>
                <button
                  onClick={handleAddOverride}
                  disabled={createOverride.isPending}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#2b5fa8] disabled:opacity-50 flex-shrink-0"
                >
                  {createOverride.isPending ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setShowOverrideForm(false)} className="p-1.5 rounded-lg hover:bg-[#dbeafe] text-[#6b7480]">
                  <XCircle size={16} />
                </button>
              </div>
              {ovrError && <p className="text-xs text-[#b3261e] mt-2">{ovrError}</p>}
            </div>
          )}

          {!overrides || overrides.length === 0 ? (
            <div className="flex items-center justify-center py-10 gap-2 text-sm text-[#8a929b]">
              <CalendarX size={18} color="#d1d5db" />
              No overrides set.
            </div>
          ) : (
            <div>
              {(overrides as UnavailabilityOverride[]).map((ov) => {
                const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                return (
                  <div key={ov.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#f3f4f6] last:border-0">
                    <CalendarX size={14} color="#f59e0b" className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#14181c]">{fmt(ov.startDate)} — {fmt(ov.endDate)}</p>
                      {ov.reason && <p className="text-xs text-[#6b7480]">{ov.reason}</p>}
                    </div>
                    <button
                      onClick={() => deleteOverride.mutate({ id: ov.id, employeeId })}
                      disabled={deleteOverride.isPending}
                      className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#6b7480] hover:text-[#b3261e]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!employeeId && (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Search size={32} color="#d1d5db" />
          <p className="text-sm text-[#8a929b]">Enter an employee ID above to view their availability.</p>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          success={toast.success}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
