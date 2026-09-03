'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Users, Eye } from 'lucide-react';
import { useEmployeeDepartments, useTeachers } from '@/lib/hooks/use-teachers';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { EmployeeDepartment } from '@/lib/hooks/use-teachers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':      return 'active';
    case 'PROBATION':
    case 'ON_LEAVE':    return 'pending';
    case 'EXITED':
    case 'ARCHIVED':    return 'left';
    default:            return 'default';
  }
}

// ─── Department card ──────────────────────────────────────────────────────────

function DepartmentCard({ dept, onClick }: { dept: EmployeeDepartment; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-xl border border-[#e6e8eb] hover:border-[#2b5fa8] hover:shadow-md transition-all group"
      style={{ padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#eef3fb' }}
            >
              <Users size={13} style={{ color: '#2b5fa8' }} />
            </div>
            <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }} className="truncate">
              {dept.name}
            </p>
          </div>
          {dept.code && (
            <p style={{ fontSize: '11px', color: '#8a929b', fontFamily: 'monospace', marginLeft: 36 }}>
              {dept.code}
            </p>
          )}
        </div>
        <ChevronRight size={15} style={{ color: '#8a929b', flexShrink: 0, marginTop: 2 }} className="group-hover:text-[#2b5fa8] transition-colors" />
      </div>
      <div style={{ marginTop: 12, marginLeft: 36 }}>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#14181c', lineHeight: 1 }}>
          {dept.employeeCount}
        </p>
        <p style={{ fontSize: '11.5px', color: '#8a929b', marginTop: 2 }}>
          {dept.employeeCount === 1 ? 'employee' : 'employees'}
        </p>
      </div>
    </button>
  );
}

// ─── Department employees list ────────────────────────────────────────────────

function DepartmentEmployees({ dept, onBack }: { dept: EmployeeDepartment; onBack: () => void }) {
  const { data, isLoading } = useTeachers({ departmentId: dept.id, limit: 100 });
  const employees = data?.data ?? [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          style={{ fontSize: '13px', color: '#8a929b' }}
          className="hover:text-[#14181c] transition-colors"
        >
          Departments
        </button>
        <ChevronRight size={13} style={{ color: '#c4c9cf' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>{dept.name}</span>
        <span style={{ fontSize: '12px', color: '#8a929b' }}>· {dept.employeeCount} employees</span>
      </div>

      <div
        className="bg-white rounded-xl border border-[#e6e8eb]"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>{dept.name}</p>
          {dept.description && (
            <p style={{ fontSize: '12px', color: '#8a929b', marginTop: 2 }}>{dept.description}</p>
          )}
        </div>

        {/* Employee rows */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3" style={{ padding: '12px 20px', borderBottom: '1px solid #f5f6f7' }}>
              <Skeleton width={36} height={36} className="rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton height={12} width={140} className="mb-1.5" />
                <Skeleton height={10} width={90} />
              </div>
              <Skeleton height={20} width={60} className="rounded-full" />
            </div>
          ))
        ) : employees.length === 0 ? (
          <div style={{ padding: '40px 24px' }}>
            <EmptyState icon={<Users size={24} />} title="No employees in this department" description="Employees can be assigned via their profile." />
          </div>
        ) : (
          employees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center gap-3 hover:bg-[#fafbfc] transition-colors"
              style={{ padding: '12px 20px', borderBottom: '1px solid #f5f6f7' }}
            >
              <Avatar name={emp.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }} className="truncate">
                  {emp.name}
                </p>
                <p style={{ fontSize: '11.5px', color: '#8a929b' }}>
                  {emp.designation?.name ?? emp.employeeNumber}
                  {emp.employmentType ? ` · ${emp.employmentType.replace('_', '-').toLowerCase()}` : ''}
                </p>
              </div>
              <Badge variant={statusVariant(emp.employmentStatus)}>
                {emp.employmentStatus.charAt(0) + emp.employmentStatus.slice(1).toLowerCase().replace('_', ' ')}
              </Badge>
              <Link href={`/teachers/${emp.id}`}>
                <Button variant="ghost" size="sm" className="gap-1 text-[#2b5fa8]">
                  <Eye size={12} /> View
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Departments tab ──────────────────────────────────────────────────────────

export function DepartmentsTab() {
  const { data: departments, isLoading } = useEmployeeDepartments();
  const [selected, setSelected] = React.useState<EmployeeDepartment | null>(null);

  if (selected) {
    return <DepartmentEmployees dept={selected} onBack={() => setSelected(null)} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Skeleton height={12} width={100} className="mb-3" />
            <Skeleton height={28} width={40} className="mb-1" />
            <Skeleton height={10} width={60} />
          </div>
        ))}
      </div>
    );
  }

  if (!departments || departments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb] p-10" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <EmptyState
          icon={<Users size={24} />}
          title="No departments found"
          description="Create departments in the Organisation settings to group your staff."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {departments.map((dept) => (
        <DepartmentCard key={dept.id} dept={dept} onClick={() => setSelected(dept)} />
      ))}
    </div>
  );
}
