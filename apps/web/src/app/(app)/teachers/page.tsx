'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layouts/page-header';
import { useTeacherStats } from '@/lib/hooks/use-teachers';
import { OverviewTab } from './_components/overview-tab';
import { DirectoryTab } from './_components/directory-tab';
import { DepartmentsTab } from './_components/departments-tab';

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'overview' | 'directory' | 'departments';

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'directory',   label: 'Directory' },
  { id: 'departments', label: 'Departments' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>('overview');

  const { data: stats } = useTeacherStats();

  const tabs = TABS.map((t) =>
    t.id === 'directory' && stats?.total
      ? { ...t, count: stats.total }
      : t,
  );

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Teachers & Staff"
        subtitle={
          stats
            ? `${stats.total.toLocaleString()} employees · ${stats.active.toLocaleString()} active`
            : 'Loading…'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary">Export</Button>
            <Button variant="primary">+ Add Employee</Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-5">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />
      </div>

      {/* Tab content */}
      {activeTab === 'overview'    && <OverviewTab />}
      {activeTab === 'directory'   && <DirectoryTab />}
      {activeTab === 'departments' && <DepartmentsTab />}
    </>
  );
}
