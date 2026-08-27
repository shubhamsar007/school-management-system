'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, Tabs, Card, CardHeader, CardTitle, DataTable } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface Role { id: string; name: string; description: string; users: number; permissions: number; status: string; }

const ROLES: Role[] = [
  { id: '1', name: 'Super Admin', description: 'Full system access', users: 2, permissions: 48, status: 'ACTIVE' },
  { id: '2', name: 'Administrator', description: 'School administration access', users: 5, permissions: 36, status: 'ACTIVE' },
  { id: '3', name: 'Teacher', description: 'Class and academic access', users: 72, permissions: 18, status: 'ACTIVE' },
  { id: '4', name: 'Finance Staff', description: 'Finance module access', users: 4, permissions: 12, status: 'ACTIVE' },
  { id: '5', name: 'HR Staff', description: 'HR and payroll access', users: 3, permissions: 15, status: 'ACTIVE' },
];

const PROFILE_FIELDS = [
  ['School Name', 'Maple Valley School'], ['Type', 'Private (CBSE)'], ['Board', 'CBSE'],
  ['Established', '1998'], ['Registration No', 'MH/EDU/2024/0042'], ['Academic Year', '2024–25'],
  ['Address', '14 Greenfield Lane, Andheri East, Mumbai – 400069'], ['Phone', '+91 22 4001 7890'],
  ['Email', 'admin@maplevalley.edu.in'], ['Website', 'www.maplevalley.edu.in'],
];

const CAMPUSES = [
  { name: 'North Campus', address: '14 Greenfield Lane, Mumbai', principal: 'Dr. Ramesh Iyer', students: 842, teachers: 58, status: 'ACTIVE' },
  { name: 'South Campus', address: '28 Marine Drive, Mumbai', principal: 'Mrs. Sunita Pillai', students: 406, teachers: 29, status: 'ACTIVE' },
];

const TABS = [{ id: 'profile', label: 'School Profile' }, { id: 'campuses', label: 'Campuses', count: 2 }, { id: 'roles', label: 'Roles & Permissions', count: 5 }];

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [editing, setEditing] = React.useState(false);

  const roleColumns: ColumnDef<Role>[] = [
    { id: 'name', header: 'ROLE NAME', width: '150px', cell: (r) => <span className="text-sm font-medium">{r.name}</span> },
    { id: 'description', header: 'DESCRIPTION', width: '1fr', accessor: 'description' },
    { id: 'users', header: 'USERS', width: '80px', align: 'center', accessor: (r) => r.users },
    {
      id: 'permissions', header: 'PERMISSIONS', width: '110px', align: 'center',
      cell: (r) => <span className="inline-flex h-6 min-w-[40px] items-center justify-center rounded-full bg-[#f2f4f6] px-2 text-xs font-semibold text-[#6b7480]">{r.permissions}</span>,
    },
    { id: 'status', header: 'STATUS', width: '90px', cell: (r) => <Badge variant={r.status === 'ACTIVE' ? 'active' : 'left'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '140px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>Edit</button><span className="text-[#d7dce1]">|</span><button>View Permissions</button></div> },
  ];

  return (
    <div>
      <PageHeader
        title="Organization Settings"
        subtitle="School profile, campuses, and configuration"
        actions={activeTab === 'campuses' ? <Button variant="primary">+ Add Campus</Button> : activeTab === 'roles' ? <Button variant="primary">+ Add Role</Button> : undefined}
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={(t) => { setActiveTab(t); setEditing(false); }} className="mb-4" />

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>School Profile</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {PROFILE_FIELDS.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a929b]">{label}</div>
                <div className="text-sm text-[#14181c]">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-[#eef0f2] pt-6">
            <Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit Profile'}</Button>
            <Button variant="primary" disabled={!editing}>Save Changes</Button>
          </div>
        </Card>
      )}

      {activeTab === 'campuses' && (
        <div className="grid grid-cols-2 gap-4">
          {CAMPUSES.map((campus) => (
            <Card key={campus.name}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#14181c]">{campus.name}</h3>
                  <p className="mt-0.5 text-xs text-[#6b7480]">{campus.address}</p>
                </div>
                <Badge variant="active">{campus.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[['Principal', campus.principal], ['Students', campus.students], ['Teachers', campus.teachers]].map(([label, value]) => (
                  <div key={String(label)}>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#8a929b]">{label}</div>
                    <div className="mt-0.5 text-sm font-medium text-[#14181c]">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2 border-t border-[#eef0f2] pt-4">
                <Button variant="secondary" size="sm">Edit</Button>
                <Button variant="ghost" size="sm">View Details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
          <DataTable columns={roleColumns} data={ROLES} />
        </div>
      )}
    </div>
  );
}
