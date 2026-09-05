'use client';

import * as React from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  useCreateBuilding,
  useUpdateBuilding,
  type TimetableBuilding,
} from '@/lib/hooks/use-timetable';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

interface FormState {
  name: string;
  code: string;
  description: string;
  status: string;
}

interface Errors {
  name?: string;
  code?: string;
}

const EMPTY: FormState = { name: '', code: '', description: '', status: 'ACTIVE' };

interface BuildingModalProps {
  open: boolean;
  onClose: () => void;
  campusId: string;
  building?: TimetableBuilding;
}

export function BuildingModal({ open, onClose, campusId, building }: BuildingModalProps) {
  const isEdit = !!building;
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const toast = useToast();
  const create = useCreateBuilding();
  const update = useUpdateBuilding();

  React.useEffect(() => {
    if (open) {
      if (building) {
        setForm({
          name: building.name,
          code: building.code,
          description: building.description ?? '',
          status: building.status,
        });
      } else {
        setForm(EMPTY);
      }
      setErrors({});
    }
  }, [open, building]);

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Building name is required';
    if (!form.code.trim()) errs.code = 'Building code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      if (isEdit && building) {
        await update.mutateAsync({
          id: building.id,
          campusId,
          dto: {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            ...(form.description.trim() ? { description: form.description.trim() } : {}),
            status: form.status,
          },
        });
        toast.success(`Building "${form.name}" updated.`);
      } else {
        await create.mutateAsync({
          campusId,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
          status: form.status,
        });
        toast.success(`Building "${form.name}" created.`);
      }
      onClose();
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? `Failed to ${isEdit ? 'update' : 'create'} building.`);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Building' : 'Add Building'}
      description={isEdit ? 'Update building details.' : 'Add a new building on this campus.'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save Changes' : 'Create Building'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Building Name"
          required
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Block A"
          {...(errors.name ? { error: errors.name } : {})}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Building Code"
            required
            value={form.code}
            onChange={set('code')}
            placeholder="e.g. BLK-A"
            hint="Auto-uppercased"
            {...(errors.code ? { error: errors.code } : {})}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={set('status')}
            options={STATUS_OPTIONS}
          />
        </div>
        <Input
          label="Description"
          value={form.description}
          onChange={set('description')}
          placeholder="Optional notes about this building"
        />
      </div>
    </Modal>
  );
}
