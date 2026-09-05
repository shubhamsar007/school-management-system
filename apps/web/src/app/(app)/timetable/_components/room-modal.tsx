'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  useCreateRoom,
  useUpdateRoom,
  useBuildings,
  type TimetableRoom,
} from '@/lib/hooks/use-timetable';

// ─── Options ──────────────────────────────────────────────────────────────────

const ROOM_TYPE_OPTIONS = [
  { label: 'Classroom', value: 'CLASSROOM' },
  { label: 'Lab', value: 'LAB' },
  { label: 'Library', value: 'LIBRARY' },
  { label: 'Auditorium', value: 'AUDITORIUM' },
  { label: 'Staff Room', value: 'STAFF_ROOM' },
  { label: 'Office', value: 'OFFICE' },
  { label: 'Store', value: 'STORE' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  code: string;
  roomType: string;
  buildingId: string;
  capacity: string;
  status: string;
}

interface Errors {
  name?: string;
  code?: string;
  roomType?: string;
  capacity?: string;
}

const EMPTY: FormState = {
  name: '',
  code: '',
  roomType: 'CLASSROOM',
  buildingId: '',
  capacity: '',
  status: 'ACTIVE',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface RoomModalProps {
  open: boolean;
  onClose: () => void;
  campusId: string;
  room?: TimetableRoom;
}

export function RoomModal({ open, onClose, campusId, room }: RoomModalProps) {
  const isEdit = !!room;
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const create = useCreateRoom();
  const update = useUpdateRoom();
  const { data: buildings = [] } = useBuildings(campusId);

  const buildingOptions = [
    { label: 'No building', value: '' },
    ...buildings.map((b) => ({ label: b.name, value: b.id })),
  ];

  React.useEffect(() => {
    if (open) {
      if (room) {
        setForm({
          name: room.name,
          code: room.code,
          roomType: room.roomType,
          buildingId: room.buildingId ?? '',
          capacity: room.capacity != null ? String(room.capacity) : '',
          status: room.status,
        });
      } else {
        setForm(EMPTY);
      }
      setErrors({});
    }
  }, [open, room]);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Room name is required';
    if (!form.code.trim()) errs.code = 'Room code is required';
    if (!form.roomType) errs.roomType = 'Room type is required';
    if (form.capacity && (isNaN(Number(form.capacity)) || Number(form.capacity) < 1))
      errs.capacity = 'Capacity must be a positive number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const capacityNum = form.capacity ? parseInt(form.capacity, 10) : undefined;
    try {
      if (isEdit && room) {
        await update.mutateAsync({
          id: room.id,
          campusId,
          dto: {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            roomType: form.roomType,
            buildingId: form.buildingId || null,
            capacity: capacityNum ?? null,
            status: form.status,
          },
        });
        toast.success(`Room "${form.name}" updated.`);
      } else {
        await create.mutateAsync({
          campusId,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          roomType: form.roomType,
          ...(form.buildingId ? { buildingId: form.buildingId } : {}),
          ...(capacityNum != null ? { capacity: capacityNum } : {}),
          status: form.status,
        });
        toast.success(`Room "${form.name}" created.`);
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? `Failed to ${isEdit ? 'update' : 'create'} room.`);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Room' : 'Add Room'}
      description={isEdit ? 'Update room details.' : 'Add a new room or space on this campus.'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Room'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Room Name"
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Room 101"
            {...(errors.name ? { error: errors.name } : {})}
          />
          <Input
            label="Room Code"
            required
            value={form.code}
            onChange={set('code')}
            placeholder="e.g. R101"
            hint="Auto-uppercased"
            {...(errors.code ? { error: errors.code } : {})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Room Type"
            required
            value={form.roomType}
            onChange={set('roomType')}
            options={ROOM_TYPE_OPTIONS}
            {...(errors.roomType ? { error: errors.roomType } : {})}
          />
          <Select
            label="Building"
            value={form.buildingId}
            onChange={set('buildingId')}
            options={buildingOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Capacity"
            type="number"
            min={1}
            value={form.capacity}
            onChange={set('capacity')}
            placeholder="e.g. 40"
            hint="Max students (optional)"
            {...(errors.capacity ? { error: errors.capacity } : {})}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>
    </Modal>
  );
}
