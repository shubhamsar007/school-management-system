'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal, Button, Select } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui';
import { useClassSubjects } from '@/lib/hooks/use-academics';
import { useTeachers } from '@/lib/hooks/use-teachers';
import { useRooms, useAddEntry, useUpdateEntry, useDeleteEntry, useMoveEntry, useTeacherAvailability } from '@/lib/hooks/use-timetable';
import type { TimetableFullEntry, TimetablePeriod } from '@/lib/hooks/use-timetable';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { label: 'Monday', value: '1' },
  { label: 'Tuesday', value: '2' },
  { label: 'Wednesday', value: '3' },
  { label: 'Thursday', value: '4' },
  { label: 'Friday', value: '5' },
  { label: 'Saturday', value: '6' },
  { label: 'Sunday', value: '7' },
];

function teacherName(t: TimetableFullEntry['teacher']): string {
  if (!t) return '';
  return `${t.person.firstName} ${t.person.lastName}`;
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

// ─── Section label ────────────────────────────────────────────────────────────

function SlotBadge({ dayLabel, period }: { dayLabel: string; period: TimetablePeriod }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ background: '#f0f6ff', border: '1px solid #dbe8f5' }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: '#2b5fa8' }}>{dayLabel}</span>
      <span style={{ fontSize: 11, color: '#6b7480' }}>
        {period.name} · {formatTime(period.startTime)} – {formatTime(period.endTime)}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EntryModalAddProps {
  mode: 'add';
  timetableId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  dayOfWeek: number;
  period: TimetablePeriod;
  open: boolean;
  onClose: () => void;
}

interface EntryModalEditProps {
  mode: 'edit';
  timetableId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  entry: TimetableFullEntry;
  periods: TimetablePeriod[];
  open: boolean;
  onClose: () => void;
}

type EntryModalProps = EntryModalAddProps | EntryModalEditProps;

// ─── Component ────────────────────────────────────────────────────────────────

export function EntryModal(props: EntryModalProps) {
  const { open, onClose, timetableId, campusId, classId, sectionId, academicYearId } = props;
  const isEdit = props.mode === 'edit';
  const entry = isEdit ? props.entry : null;

  const toast = useToast();
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const moveEntry = useMoveEntry();

  const [subjectId, setSubjectId] = React.useState('');
  const [teacherId, setTeacherId] = React.useState('');
  const [roomId, setRoomId] = React.useState('');
  const [moveDayOfWeek, setMoveDayOfWeek] = React.useState('');
  const [movePeriodId, setMovePeriodId] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const { data: classSubjects = [] } = useClassSubjects(classId, academicYearId);
  const { data: teachersResp } = useTeachers({ limit: 200, status: 'ACTIVE' });
  const { data: rooms = [] } = useRooms(campusId);
  const { data: teacherAvailability } = useTeacherAvailability(teacherId || null);

  // Compute the day of week for the current entry
  const entryDayOfWeek = isEdit ? entry?.dayOfWeek : (props as EntryModalAddProps).dayOfWeek;
  const selectedTeacherAvail = teacherAvailability?.find((d) => d.dayOfWeek === entryDayOfWeek);
  const teacherUnavailable = !!teacherId && selectedTeacherAvail !== undefined && !selectedTeacherAvail.isAvailable;

  const subjectOptions = [
    { label: '— No subject —', value: '' },
    ...classSubjects
      .filter((cs) => !!cs.subject)
      .map((cs) => ({ label: cs.subject!.name, value: cs.subject!.id })),
  ];

  const teacherOptions = [
    { label: '— No teacher —', value: '' },
    ...(teachersResp?.data ?? []).map((t) => ({
      label: `${t.person.firstName} ${t.person.lastName}`,
      value: t.id,
    })),
  ];

  const roomOptions = [
    { label: '— No room —', value: '' },
    ...rooms
      .filter((r) => r.status === 'ACTIVE')
      .map((r) => ({
        label: `${r.name}${r.capacity ? ` (cap. ${r.capacity})` : ''}${r.building ? ` · ${r.building.name}` : ''}`,
        value: r.id,
      })),
  ];

  const periodOptions = isEdit
    ? [
        { label: '— Keep current —', value: '' },
        ...(props.periods ?? [])
          .filter((p) => p.periodType === 'CLASS')
          .map((p) => ({
            label: `${p.name} · ${formatTime(p.startTime)}`,
            value: p.id,
          })),
      ]
    : [];

  // Reset form on open
  React.useEffect(() => {
    if (open) {
      setSubjectId(entry?.subjectId ?? '');
      setTeacherId(entry?.teacherId ?? '');
      setRoomId(entry?.roomId ?? '');
      setMoveDayOfWeek('');
      setMovePeriodId('');
      setShowDeleteConfirm(false);
    }
  }, [open, entry]);

  const dayLabel =
    DAY_OPTIONS.find((d) => d.value === String(isEdit ? entry?.dayOfWeek : props.dayOfWeek))?.label ?? '';

  const currentPeriod = isEdit ? entry?.period : props.period;

  async function handleSave() {
    try {
      if (isEdit && entry) {
        // Handle move first if slot changed
        const targetDay = moveDayOfWeek ? parseInt(moveDayOfWeek, 10) : null;
        const targetPeriodId = movePeriodId || null;
        const needsMove =
          (targetDay !== null && targetDay !== entry.dayOfWeek) ||
          (targetPeriodId !== null && targetPeriodId !== entry.period.id);

        if (needsMove) {
          await moveEntry.mutateAsync({
            timetableId,
            entryId: entry.id,
            dayOfWeek: targetDay ?? entry.dayOfWeek,
            periodId: targetPeriodId ?? entry.period.id,
          });
        }

        await updateEntry.mutateAsync({
          timetableId,
          entryId: entry.id,
          subjectId: subjectId || null,
          teacherId: teacherId || null,
          roomId: roomId || null,
        });

        toast.success('Entry updated.');
      } else {
        await addEntry.mutateAsync({
          timetableId,
          dayOfWeek: (props as EntryModalAddProps).dayOfWeek,
          periodId: (props as EntryModalAddProps).period.id,
          classId,
          sectionId,
          ...(subjectId ? { subjectId } : {}),
          ...(teacherId ? { teacherId } : {}),
          ...(roomId ? { roomId } : {}),
        });
        toast.success('Entry added.');
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to save entry.');
    }
  }

  async function handleDelete() {
    if (!entry) return;
    try {
      await deleteEntry.mutateAsync({ timetableId, entryId: entry.id });
      toast.success('Entry removed.');
      setShowDeleteConfirm(false);
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete entry.');
    }
  }

  const isPending =
    addEntry.isPending ||
    updateEntry.isPending ||
    moveEntry.isPending ||
    deleteEntry.isPending;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit Entry' : 'Add Entry'}
        description={isEdit ? 'Change assignment or move this entry to a different slot.' : 'Assign a subject, teacher, and room to this slot.'}
        size="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            {isEdit && (
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
              >
                <Trash2 size={14} className="mr-1.5" />
                Remove
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Entry'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Current slot */}
          {currentPeriod && (
            <SlotBadge dayLabel={isEdit ? (DAY_OPTIONS.find((d) => d.value === String(entry?.dayOfWeek))?.label ?? '') : dayLabel} period={currentPeriod} />
          )}

          {/* Assignment */}
          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjectOptions}
          />
          <Select
            label="Teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            options={teacherOptions}
          />
          {teacherUnavailable && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
            >
              <span style={{ fontSize: 11, color: '#c2410c' }}>⚠</span>
              <span style={{ fontSize: 11, color: '#c2410c', fontWeight: 500 }}>
                This teacher has marked themselves as unavailable on{' '}
                {DAY_OPTIONS.find((d) => d.value === String(entryDayOfWeek))?.label ?? 'this day'}.
                {selectedTeacherAvail?.note ? ` Note: ${selectedTeacherAvail.note}` : ''}
              </span>
            </div>
          )}
          <Select
            label="Room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            options={roomOptions}
          />

          {/* Move to different slot (edit only) */}
          {isEdit && (
            <div
              className="rounded-lg p-3 flex flex-col gap-3"
              style={{ background: '#fafbfc', border: '1px solid #e6e8eb' }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Move to different slot
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Day"
                  value={moveDayOfWeek}
                  onChange={(e) => setMoveDayOfWeek(e.target.value)}
                  options={[{ label: '— Keep current —', value: '' }, ...DAY_OPTIONS]}
                />
                <Select
                  label="Period"
                  value={movePeriodId}
                  onChange={(e) => setMovePeriodId(e.target.value)}
                  options={periodOptions}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Remove Entry"
        description="Remove this subject from the timetable slot? This cannot be undone."
        confirmLabel="Remove"
        variant="danger"
        loading={deleteEntry.isPending}
      />
    </>
  );
}
