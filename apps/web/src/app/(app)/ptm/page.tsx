'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  Button, Badge, KpiCard, Pagination, DataTable, ConfirmDialog, Modal,
} from '@/components/ui';
import { Input, Select } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { KpiSkeleton } from '@/components/ui/skeleton';
import {
  usePtmSchedules,
  usePtmSchedule,
  useCreatePtmSchedule,
  usePublishPtmSchedule,
  usePtmTeacherSlots,
  useAddTeacherSlot,
  useDeleteTeacherSlot,
  usePtmBookings,
  useCancelPtmBooking,
  type PtmSchedule,
  type PtmTeacherSlot,
  type PtmBooking,
} from '@/lib/hooks/use-comms';
import { useOrganization, useCampuses, useAcademicYears } from '@/lib/hooks/use-academics';
import { useTeachers } from '@/lib/hooks/use-teachers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(t: string): string {
  const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

const STATUS_BADGE: Record<string, 'active' | 'pending' | 'default' | 'left'> = {
  PUBLISHED: 'active',
  DRAFT: 'pending',
  COMPLETED: 'default',
};

// ─── Create Schedule Modal ────────────────────────────────────────────────────

interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateScheduleModal({ open, onClose }: CreateScheduleModalProps) {
  const toast = useToast();
  const { data: org } = useOrganization();
  const { data: campuses = [] } = useCampuses(org?.id);
  const { data: academicYears = [] } = useAcademicYears(org?.id);
  const create = useCreatePtmSchedule();

  const [name, setName] = React.useState('');
  const [campusId, setCampusId] = React.useState('');
  const [academicYearId, setAcademicYearId] = React.useState('');
  const [date, setDate] = React.useState('');
  const [slotDuration, setSlotDuration] = React.useState('15');

  React.useEffect(() => {
    if (open) {
      setName('');
      setCampusId(campuses[0]?.id ?? '');
      setAcademicYearId(academicYears.find((y) => y.isCurrent)?.id ?? academicYears[0]?.id ?? '');
      setDate('');
      setSlotDuration('15');
    }
  }, [open, campuses, academicYears]);

  async function handleSubmit() {
    if (!name.trim() || !campusId || !academicYearId || !date) {
      toast.error('All fields are required.');
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        campusId,
        academicYearId,
        date,
        ...(slotDuration ? { slotDurationMinutes: parseInt(slotDuration, 10) } : {}),
      });
      toast.success('PTM schedule created.');
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to create schedule.');
    }
  }

  const campusOptions = campuses.map((c) => ({ label: c.name, value: c.id }));
  const yearOptions = academicYears.map((y) => ({ label: y.name, value: y.id }));
  const durationOptions = [
    { label: '10 minutes', value: '10' },
    { label: '15 minutes', value: '15' },
    { label: '20 minutes', value: '20' },
    { label: '30 minutes', value: '30' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create PTM Schedule"
      description="Set up a parent-teacher meeting event. Add teacher slots after creation."
      size="sm"
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create Schedule'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Event Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Term 1 PTM 2026" />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Campus" required value={campusId} onChange={(e) => setCampusId(e.target.value)} options={campusOptions} />
          <Select label="Academic Year" required value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} options={yearOptions} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select label="Slot Duration" value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} options={durationOptions} />
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Teacher Slot Modal ───────────────────────────────────────────────────

interface AddSlotModalProps {
  open: boolean;
  onClose: () => void;
  scheduleId: string;
}

function AddSlotModal({ open, onClose, scheduleId }: AddSlotModalProps) {
  const toast = useToast();
  const { data: teachersResp } = useTeachers({ limit: 200, status: 'ACTIVE' });
  const addSlot = useAddTeacherSlot();

  const [teacherId, setTeacherId] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');

  React.useEffect(() => {
    if (open) { setTeacherId(''); setStartTime(''); setEndTime(''); }
  }, [open]);

  const teacherOptions = (teachersResp?.data ?? []).map((t) => ({
    label: `${t.person.firstName} ${t.person.lastName}`,
    value: t.id,
  }));

  async function handleSubmit() {
    if (!teacherId || !startTime || !endTime) { toast.error('All fields are required.'); return; }
    try {
      await addSlot.mutateAsync({ scheduleId, teacherId, startTime, endTime });
      toast.success('Teacher slot added.');
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to add slot.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Teacher Slot"
      description="Define when a teacher is available for parent meetings."
      size="sm"
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={addSlot.isPending}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={addSlot.isPending}>
            {addSlot.isPending ? 'Adding…' : 'Add Slot'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Teacher"
          required
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          options={[{ label: '— Select teacher —', value: '' }, ...teacherOptions]}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="End Time" required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

// ─── Schedule detail panel ────────────────────────────────────────────────────

interface ScheduleDetailProps {
  scheduleId: string;
  onBack: () => void;
}

function ScheduleDetail({ scheduleId, onBack }: ScheduleDetailProps) {
  const toast = useToast();
  const [addSlotOpen, setAddSlotOpen] = React.useState(false);
  const [deleteSlotTarget, setDeleteSlotTarget] = React.useState<PtmTeacherSlot | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] = React.useState<PtmBooking | null>(null);
  const [detailTab, setDetailTab] = React.useState<'slots' | 'bookings'>('slots');

  const { data: schedule } = usePtmSchedule(scheduleId);
  const { data: slots = [], isLoading: slotsLoading } = usePtmTeacherSlots(scheduleId);
  const { data: bookings = [], isLoading: bookingsLoading } = usePtmBookings(scheduleId);
  const publishMutation = usePublishPtmSchedule();
  const deleteSlot = useDeleteTeacherSlot();
  const cancelBooking = useCancelPtmBooking();
  const { data: teachersResp } = useTeachers({ limit: 200, status: 'ACTIVE' });

  const teacherNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teachersResp?.data ?? []) {
      map.set(t.id, `${t.person.firstName} ${t.person.lastName}`);
    }
    return map;
  }, [teachersResp]);

  async function handlePublish() {
    try {
      await publishMutation.mutateAsync(scheduleId);
      toast.success('PTM schedule published — parents can now book slots.');
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to publish.');
    }
  }

  async function handleDeleteSlot() {
    if (!deleteSlotTarget) return;
    try {
      await deleteSlot.mutateAsync({ scheduleId, slotId: deleteSlotTarget.id });
      toast.success('Slot removed.');
      setDeleteSlotTarget(null);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to remove slot.');
    }
  }

  async function handleCancelBooking() {
    if (!cancelBookingTarget) return;
    try {
      await cancelBooking.mutateAsync({ scheduleId, bookingId: cancelBookingTarget.id });
      toast.success('Booking cancelled.');
      setCancelBookingTarget(null);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to cancel booking.');
    }
  }

  const slotColumns: ColumnDef<PtmTeacherSlot>[] = [
    {
      id: 'teacher',
      header: 'TEACHER',
      cell: (r) => <span className="text-sm">{teacherNameMap.get(r.teacherId) ?? r.teacherId}</span>,
    },
    { id: 'start', header: 'START', width: '100px', accessor: (r) => formatTime(r.startTime) },
    { id: 'end', header: 'END', width: '100px', accessor: (r) => formatTime(r.endTime) },
    {
      id: 'avail',
      header: 'AVAILABLE',
      width: '100px',
      cell: (r) => <Badge variant={r.isAvailable ? 'active' : 'default'}>{r.isAvailable ? 'Yes' : 'No'}</Badge>,
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '80px',
      align: 'right',
      cell: (r) => schedule?.status === 'DRAFT' ? (
        <button className="text-xs font-medium text-[#b3261e]" onClick={() => setDeleteSlotTarget(r)}>Remove</button>
      ) : null,
    },
  ];

  const bookingColumns: ColumnDef<PtmBooking>[] = [
    {
      id: 'teacher',
      header: 'TEACHER',
      cell: (r) => <span className="text-sm">{teacherNameMap.get(r.teacherId) ?? r.teacherId}</span>,
    },
    { id: 'slot', header: 'SLOT', width: '160px', accessor: (r) => `${formatTime(r.slotStart)} – ${formatTime(r.slotEnd)}` },
    { id: 'student', header: 'STUDENT ID', width: '120px', accessor: 'studentId' },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => <Badge variant={r.status === 'BOOKED' ? 'active' : 'default'}>{r.status}</Badge>,
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '80px',
      align: 'right',
      cell: (r) => r.status === 'BOOKED' ? (
        <button className="text-xs font-medium text-[#b3261e]" onClick={() => setCancelBookingTarget(r)}>Cancel</button>
      ) : null,
    },
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          style={{ fontSize: 12, color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          ← Back to schedules
        </button>
        {schedule && (
          <>
            <span style={{ color: '#d7dce1' }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#14181c' }}>{schedule.name}</span>
            <Badge variant={STATUS_BADGE[schedule.status] ?? 'default'}>{schedule.status}</Badge>
            <span style={{ fontSize: 12, color: '#8a929b' }}>{formatDate(schedule.date)}</span>
            <div className="flex-1" />
            {schedule.status === 'DRAFT' && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setAddSlotOpen(true)}>
                  + Add Teacher Slot
                </Button>
                <Button variant="primary" size="sm" onClick={handlePublish} disabled={publishMutation.isPending}>
                  {publishMutation.isPending ? 'Publishing…' : 'Publish Schedule'}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4" style={{ borderBottom: '1px solid #eef0f2', paddingBottom: 0 }}>
        {(['slots', 'bookings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDetailTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: detailTab === tab ? 700 : 400,
              color: detailTab === tab ? '#14181c' : '#8a929b',
              background: 'none',
              border: 'none',
              borderBottom: detailTab === tab ? '2px solid #2b5fa8' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'slots' ? `Teacher Slots (${slots.length})` : `Bookings (${bookings.length})`}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {detailTab === 'slots' && (
          slotsLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading slots…</div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm font-medium text-[#4a5260]">No teacher slots</p>
              <p className="text-xs text-[#8a929b]">Add teacher availability windows before publishing.</p>
              {schedule?.status === 'DRAFT' && (
                <Button variant="primary" size="sm" onClick={() => setAddSlotOpen(true)}>+ Add Teacher Slot</Button>
              )}
            </div>
          ) : (
            <DataTable columns={slotColumns} data={slots} />
          )
        )}

        {detailTab === 'bookings' && (
          bookingsLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm font-medium text-[#4a5260]">No bookings yet</p>
              <p className="text-xs text-[#8a929b]">
                {schedule?.status === 'DRAFT'
                  ? 'Publish this schedule so parents can book meeting slots.'
                  : 'Parents can book slots from their portal.'}
              </p>
            </div>
          ) : (
            <DataTable columns={bookingColumns} data={bookings} />
          )
        )}
      </div>

      <AddSlotModal open={addSlotOpen} onClose={() => setAddSlotOpen(false)} scheduleId={scheduleId} />

      <ConfirmDialog
        open={!!deleteSlotTarget}
        onClose={() => setDeleteSlotTarget(null)}
        onConfirm={handleDeleteSlot}
        title="Remove Teacher Slot"
        description="Remove this teacher's availability window? Any bookings within it must be handled separately."
        confirmLabel="Remove"
        variant="danger"
        loading={deleteSlot.isPending}
      />
      <ConfirmDialog
        open={!!cancelBookingTarget}
        onClose={() => setCancelBookingTarget(null)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        description="Cancel this parent-teacher meeting booking? The parent will need to rebook."
        confirmLabel="Cancel Booking"
        variant="danger"
        loading={cancelBooking.isPending}
      />
    </>
  );
}

// ─── Schedule list ────────────────────────────────────────────────────────────

function ScheduleList({ onSelect }: { onSelect: (id: string) => void }) {
  const toast = useToast();
  const { data: org } = useOrganization();
  const { data: campuses = [] } = useCampuses(org?.id);
  const [campusId, setCampusId] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 15;

  React.useEffect(() => {
    if (campuses.length > 0 && !campusId) setCampusId(campuses[0]!.id);
  }, [campuses, campusId]);

  const { data: schedules = [], isLoading } = usePtmSchedules(campusId ? { campusId } : undefined);
  const publishMutation = usePublishPtmSchedule();

  const paginated = schedules.slice((page - 1) * pageSize, page * pageSize);
  const total = schedules.length;
  const published = schedules.filter((s) => s.status === 'PUBLISHED').length;
  const upcoming = schedules.filter((s) => new Date(s.date) >= new Date()).length;

  const SELECT_STYLE: React.CSSProperties = {
    height: 30, padding: '0 28px 0 10px', fontSize: '12px', fontWeight: 500,
    color: '#2c322f', background: '#fff', border: '1px solid #e0ddd5',
    borderRadius: 7, appearance: 'none', cursor: 'pointer', outline: 'none', minWidth: 160,
  };

  const columns: ColumnDef<PtmSchedule>[] = [
    {
      id: 'name',
      header: 'EVENT NAME',
      cell: (r) => (
        <button
          onClick={() => onSelect(r.id)}
          style={{ fontSize: 13, fontWeight: 600, color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          {r.name}
        </button>
      ),
    },
    { id: 'date', header: 'DATE', width: '130px', accessor: (r) => formatDate(r.date) },
    {
      id: 'duration',
      header: 'SLOT',
      width: '90px',
      accessor: (r) => `${r.slotDurationMinutes} min`,
    },
    {
      id: 'slots',
      header: 'TEACHER SLOTS',
      width: '120px',
      align: 'center',
      accessor: (r) => String(r._count?.teacherSlots ?? 0),
    },
    {
      id: 'bookings',
      header: 'BOOKINGS',
      width: '100px',
      align: 'center',
      accessor: (r) => String(r._count?.bookings ?? 0),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => <Badge variant={STATUS_BADGE[r.status] ?? 'default'}>{r.status}</Badge>,
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '130px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium">
          <button className="text-[#2b5fa8]" onClick={() => onSelect(r.id)}>View</button>
          {r.status === 'DRAFT' && (
            <>
              <span className="text-[#d7dce1]">|</span>
              <button
                className="text-[#16a34a]"
                onClick={async () => {
                  try {
                    await publishMutation.mutateAsync(r.id);
                    toast.success('Schedule published.');
                  } catch (e: unknown) {
                    toast.error((e as { message?: string })?.message ?? 'Failed to publish.');
                  }
                }}
              >
                Publish
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard title="TOTAL EVENTS" value={String(total)} subtitle="all time" variant="sage" />
            <KpiCard title="PUBLISHED" value={String(published)} subtitle="bookable" variant="blue" />
            <KpiCard title="UPCOMING" value={String(upcoming)} subtitle="this term" variant="clay" />
            <KpiCard title="DRAFTS" value={String(total - published)} subtitle="not yet published" variant="heather" />
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eef0f2] p-3.5" style={{ background: '#fafbfc' }}>
          <div style={{ position: 'relative' }}>
            <select value={campusId} onChange={(e) => setCampusId(e.target.value)} style={SELECT_STYLE}>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
          </div>
          <div className="flex-1" />
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>+ New PTM Event</Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">Loading schedules…</div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">No PTM events</p>
            <p className="text-xs text-[#8a929b]">Create your first parent-teacher meeting schedule.</p>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>+ New PTM Event</Button>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={paginated} />
            <div className="border-t border-[#eef0f2] p-3">
              <Pagination page={page} pageSize={pageSize} total={schedules.length} onPageChange={setPage} onPageSizeChange={() => {}} />
            </div>
          </>
        )}
      </div>

      <CreateScheduleModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PtmPage() {
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title="Parent-Teacher Meetings"
        subtitle="Schedule PTM events, manage teacher slots, and track bookings"
      />

      {selectedScheduleId ? (
        <ScheduleDetail
          scheduleId={selectedScheduleId}
          onBack={() => setSelectedScheduleId(null)}
        />
      ) : (
        <ScheduleList onSelect={setSelectedScheduleId} />
      )}
    </div>
  );
}
