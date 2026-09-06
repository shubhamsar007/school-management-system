'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Tabs } from '@/components/ui';
import { AcademicContextBar } from './_components/academic-context-bar';
import { OverviewTab } from './_components/overview-tab';
import { ClassesTab } from './_components/classes/classes-tab';
import { SubjectsTab } from './_components/subjects/subjects-tab';
import { AcademicYearsTab } from './_components/academic-years/academic-years-tab';
import { CurriculumTab } from './_components/curriculum/curriculum-tab';
import { AssignmentsTab } from './_components/assignments/assignments-tab';
import { CalendarTab } from './_components/calendar/calendar-tab';
import { PromotionTab } from './_components/promotion/promotion-tab';
import { useAcademicYears, useOrganization } from '@/lib/hooks/use-academics';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',        label: 'Overview'           },
  { id: 'classes',         label: 'Classes'            },
  { id: 'subjects',        label: 'Subjects'           },
  { id: 'curriculum',      label: 'Curriculum'         },
  { id: 'assignments',     label: 'Assignments'        },
  { id: 'academic-years',  label: 'Academic Years'     },
  { id: 'calendar',        label: 'Calendar'           },
  { id: 'promotion',       label: 'Promotion'          },
];

// ─── Coming soon placeholder ──────────────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 260,
        color: '#8a929b',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 32 }}>🚧</span>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#4a5260' }}>{label}</p>
      <p style={{ fontSize: 13 }}>This section is coming in a future phase.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [yearId, setYearId] = React.useState('');
  const [campusId, setCampusId] = React.useState('');

  // Auto-select the current academic year on load
  const { data: org } = useOrganization();
  const { data: years } = useAcademicYears(org?.id);
  React.useEffect(() => {
    if (years && !yearId) {
      const current = years.find((y) => y.isCurrent);
      if (current) setYearId(current.id);
    }
  }, [years, yearId]);

  return (
    <div>
      <PageHeader
        title="Academics"
        subtitle="Academic structure, subjects, and curriculum"
      />

      {/* Year + Campus selector */}
      <AcademicContextBar
        yearId={yearId}
        campusId={campusId}
        onYearChange={setYearId}
        onCampusChange={setCampusId}
      />

      {/* Tab navigation */}
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(id) => { setActiveTab(id); }}
        className="mb-5"
      />

      {/* Tab content */}
      {activeTab === 'overview'       && <OverviewTab yearId={yearId} />}
      {activeTab === 'classes'        && <ClassesTab />}
      {activeTab === 'subjects'       && <SubjectsTab />}
      {activeTab === 'curriculum'     && <CurriculumTab yearId={yearId} />}
      {activeTab === 'assignments'    && <AssignmentsTab yearId={yearId} />}
      {activeTab === 'academic-years' && <AcademicYearsTab />}
      {activeTab === 'calendar'       && <CalendarTab yearId={yearId} />}
      {activeTab === 'promotion'      && <PromotionTab yearId={yearId} />}
    </div>
  );
}
