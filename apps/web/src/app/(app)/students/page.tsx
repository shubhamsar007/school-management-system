'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';
import { PageHeader } from '@/components/layouts/page-header';
import { useStudentStats } from '@/lib/hooks/use-students';
import { OverviewTab } from './_components/overview-tab';
import { ClassesTab } from './_components/classes-tab';
import { AllStudentsTab } from './_components/all-students-tab';
import { EnrollStudentModal } from './_components/enroll-student-modal';

// ─── Academic year selector ───────────────────────────────────────────────────
// TODO: Connect to GET /v1/organizations/:id/academic-years once auth is wired up.

const YEAR_OPTIONS: DropdownOption[] = [
  { label: '2026–27', value: '2026-27' },
  { label: '2025–26', value: '2025-26' },
  { label: '2024–25', value: '2024-25' },
];

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'overview' | 'classes' | 'all-students';

const TABS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'classes',       label: 'Classes' },
  { id: 'all-students',  label: 'All Students' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [activeTab, setActiveTab]   = React.useState<TabId>('overview');
  const [academicYear, setAcademicYear] = React.useState('2026-27');
  const [modalOpen, setModalOpen] = React.useState(false);

  const { data: stats } = useStudentStats();

  // Keep tab count badge up-to-date
  const tabs = TABS.map((t) =>
    t.id === 'all-students' && stats?.total
      ? { ...t, count: stats.total }
      : t,
  );

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Students"
        subtitle={
          stats
            ? `${stats.total.toLocaleString()} enrolled · ${stats.active.toLocaleString()} active`
            : 'Loading…'
        }
        actions={
          <div className="flex items-center gap-2">
            <Dropdown
              label="Academic Year"
              value={academicYear}
              options={YEAR_OPTIONS}
              onChange={setAcademicYear}
            />
            <Button variant="secondary">Import</Button>
            <Button variant="secondary">Export</Button>
            <Button variant="primary" onClick={() => setModalOpen(true)}>+ Enroll Student</Button>
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
      {activeTab === 'overview'     && <OverviewTab />}
      {activeTab === 'classes'      && <ClassesTab />}
      {activeTab === 'all-students' && <AllStudentsTab />}

      <EnrollStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
