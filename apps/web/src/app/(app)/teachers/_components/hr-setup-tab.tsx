'use client';

import * as React from 'react';
import { ReferenceDataPanel } from '@/components/shared/reference-data-panel';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  useEmployeeDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
  useEmployeeTypesList,
  useCreateEmployeeType,
  useUpdateEmployeeType,
  useDeleteEmployeeType,
} from '@/lib/hooks/use-teachers';

// ─── Field configs ────────────────────────────────────────────────────────────

const DEPARTMENT_FIELDS = [
  { key: 'name', label: 'Department Name', required: true, type: 'text' as const, maxLength: 100 },
  { key: 'code', label: 'Code', required: true, type: 'text' as const, maxLength: 50 },
  { key: 'description', label: 'Description', type: 'text' as const, maxLength: 255 },
];

const DESIGNATION_FIELDS = [
  { key: 'name', label: 'Designation Name', required: true, type: 'text' as const, maxLength: 100 },
  { key: 'code', label: 'Code', required: true, type: 'text' as const, maxLength: 50 },
  { key: 'description', label: 'Description', type: 'text' as const, maxLength: 255 },
];

const EMPLOYEE_TYPE_FIELDS = [
  { key: 'name', label: 'Type Name', required: true, type: 'text' as const, maxLength: 100 },
  { key: 'code', label: 'Code', required: true, type: 'text' as const, maxLength: 50 },
  {
    key: 'category',
    label: 'Category',
    required: true,
    type: 'select' as const,
    options: [
      { label: 'Teaching', value: 'TEACHING' },
      { label: 'Non-Teaching', value: 'NON_TEACHING' },
      { label: 'Support', value: 'SUPPORT' },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  TEACHING: 'Teaching',
  NON_TEACHING: 'Non-Teaching',
  SUPPORT: 'Support',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HrSetupTab() {
  const toast = useToast();

  // ── Departments ─────────────────────────────────────────────
  const { data: departments = [], isLoading: deptLoading } = useEmployeeDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  async function handleAddDept(data: Record<string, string>) {
    try {
      await createDept.mutateAsync(data as unknown as Parameters<typeof createDept.mutateAsync>[0]);
      toast.success('Department created successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create department';
      toast.error(msg);
      throw err;
    }
  }

  async function handleEditDept(id: string, data: Record<string, string>) {
    try {
      await updateDept.mutateAsync({ id, data });
      toast.success('Department updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update department';
      toast.error(msg);
      throw err;
    }
  }

  async function handleDeleteDept(id: string) {
    try {
      await deleteDept.mutateAsync(id);
      toast.success('Department deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete department';
      toast.error(msg);
      throw err;
    }
  }

  // ── Designations ────────────────────────────────────────────
  const { data: designations = [], isLoading: desigLoading } = useDesignations();
  const createDesig = useCreateDesignation();
  const updateDesig = useUpdateDesignation();
  const deleteDesig = useDeleteDesignation();

  async function handleAddDesig(data: Record<string, string>) {
    try {
      await createDesig.mutateAsync(data as unknown as Parameters<typeof createDesig.mutateAsync>[0]);
      toast.success('Designation created successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create designation';
      toast.error(msg);
      throw err;
    }
  }

  async function handleEditDesig(id: string, data: Record<string, string>) {
    try {
      await updateDesig.mutateAsync({ id, data });
      toast.success('Designation updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update designation';
      toast.error(msg);
      throw err;
    }
  }

  async function handleDeleteDesig(id: string) {
    try {
      await deleteDesig.mutateAsync(id);
      toast.success('Designation deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete designation';
      toast.error(msg);
      throw err;
    }
  }

  // ── Employee Types ──────────────────────────────────────────
  const { data: employeeTypes = [], isLoading: etLoading } = useEmployeeTypesList();
  const createEt = useCreateEmployeeType();
  const updateEt = useUpdateEmployeeType();
  const deleteEt = useDeleteEmployeeType();

  async function handleAddEt(data: Record<string, string>) {
    try {
      await createEt.mutateAsync(data as unknown as Parameters<typeof createEt.mutateAsync>[0]);
      toast.success('Employee type created successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create employee type';
      toast.error(msg);
      throw err;
    }
  }

  async function handleEditEt(id: string, data: Record<string, string>) {
    try {
      await updateEt.mutateAsync({ id, data });
      toast.success('Employee type updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update employee type';
      toast.error(msg);
      throw err;
    }
  }

  async function handleDeleteEt(id: string) {
    try {
      await deleteEt.mutateAsync(id);
      toast.success('Employee type deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete employee type';
      toast.error(msg);
      throw err;
    }
  }

  // ── Departments — enrich with status for ReferenceItem ──────
  const deptItems = departments.map((d) => ({
    ...d,
    status: (d as { status?: string }).status ?? 'ACTIVE',
  }));

  return (
    <div>
      {/* Departments */}
      <ReferenceDataPanel
        title="Departments"
        items={deptItems}
        isLoading={deptLoading}
        fields={DEPARTMENT_FIELDS}
        onAdd={handleAddDept}
        onEdit={handleEditDept}
        onDelete={handleDeleteDept}
      />

      {/* Designations */}
      <div style={{ marginTop: 32 }}>
        <ReferenceDataPanel
          title="Designations"
          items={designations}
          isLoading={desigLoading}
          fields={DESIGNATION_FIELDS}
          onAdd={handleAddDesig}
          onEdit={handleEditDesig}
          onDelete={handleDeleteDesig}
        />
      </div>

      {/* Employee Types */}
      <div style={{ marginTop: 32 }}>
        <ReferenceDataPanel
          title="Employee Types"
          items={employeeTypes}
          isLoading={etLoading}
          fields={EMPLOYEE_TYPE_FIELDS}
          onAdd={handleAddEt}
          onEdit={handleEditEt}
          onDelete={handleDeleteEt}
          extraColumns={[
            {
              header: 'Category',
              render: (item) => (
                <Badge variant="default">
                  {CATEGORY_LABELS[item.category as string] ?? String(item.category)}
                </Badge>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
