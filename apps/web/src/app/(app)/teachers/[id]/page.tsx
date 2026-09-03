'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Pencil, MoreHorizontal, Building2, Briefcase } from 'lucide-react';
import { useTeacher } from '@/lib/hooks/use-teachers';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/ui/back-button';
import { OverviewTab }       from './_components/overview-tab';
import { PersonalTab }       from './_components/personal-tab';
import { EmploymentTab }     from './_components/employment-tab';
import { QualificationsTab } from './_components/qualifications-tab';
import { ExperienceTab }     from './_components/experience-tab';
import { AssignmentsTab }    from './_components/assignments-tab';
import { PlaceholderTab }    from './_components/placeholder-tab';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'personal'
  | 'employment'
  | 'qualifications'
  | 'experience'
  | 'assignments'
  | 'timetable'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'documents'
  | 'performance'
  | 'training'
  | 'assets'
  | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',       label: 'Overview' },
  { id: 'personal',       label: 'Personal' },
  { id: 'employment',     label: 'Employment' },
  { id: 'qualifications', label: 'Qualifications' },
  { id: 'experience',     label: 'Experience' },
  { id: 'assignments',    label: 'Assignments' },
  { id: 'timetable',      label: 'Timetable' },
  { id: 'attendance',     label: 'Attendance' },
  { id: 'leave',          label: 'Leave' },
  { id: 'payroll',        label: 'Payroll' },
  { id: 'documents',      label: 'Documents' },
  { id: 'performance',    label: 'Performance' },
  { id: 'training',       label: 'Training' },
  { id: 'assets',         label: 'Assets' },
  { id: 'history',        label: 'History' },
];

// ─── Status badge variant ─────────────────────────────────────────────────────

function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACTIVE':
    case 'CONFIRMED':   return 'active';
    case 'PROBATION':
    case 'ONBOARDING':
    case 'ON_LEAVE':    return 'pending';
    case 'EXITED':
    case 'ARCHIVED':    return 'left';
    default:            return 'default';
  }
}

// ─── Large avatar ─────────────────────────────────────────────────────────────

function LargeAvatar({ name }: { name: string }) {
  const words    = name.trim().split(/\s+/);
  const initials = (words[0]?.charAt(0) ?? '') + (words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? '') : '');
  const colors   = [
    { bg: '#dbeafe', fg: '#1e40af' }, { bg: '#dcfce7', fg: '#166534' },
    { bg: '#fef3c7', fg: '#92400e' }, { bg: '#ede9fe', fg: '#5b21b6' },
    { bg: '#fce7f3', fg: '#9d174d' }, { bg: '#e0f2fe', fg: '#0369a1' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % colors.length;
  const color = colors[Math.abs(hash) % colors.length]!;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold select-none flex-shrink-0"
      style={{ width: 64, height: 64, fontSize: 22, background: color.bg, color: color.fg }}
    >
      {initials.toUpperCase()}
    </span>
  );
}

// ─── Profile header skeleton ──────────────────────────────────────────────────

function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e6e8eb] mb-5" style={{ padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="flex items-start gap-4">
        <Skeleton width={64} height={64} className="rounded-full flex-shrink-0" />
        <div className="flex-1">
          <Skeleton height={22} width={200} className="mb-2" />
          <Skeleton height={14} width={320} className="mb-3" />
          <Skeleton height={20} width={80} className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherProfilePage() {
  const params       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id           = params?.id ?? null;

  const initialTab   = (searchParams?.get('tab') as TabId | null) ?? 'overview';
  const [activeTab, setActiveTab] = React.useState<TabId>(initialTab);
  const [moreOpen, setMoreOpen]   = React.useState(false);

  const { data: employee, isLoading, isError } = useTeacher(id);

  // ── Error state ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#14181c' }}>Employee not found</p>
        <p style={{ fontSize: '13px', color: '#8a929b', marginTop: 4 }}>
          This employee does not exist or has been removed.
        </p>
        <BackButton label="Back to Teachers" className="mt-4" />
      </div>
    );
  }

  const statusLabel = employee
    ? employee.employmentStatus.charAt(0) + employee.employmentStatus.slice(1).toLowerCase().replace('_', ' ')
    : '';

  return (
    <>
      {/* Back link */}
      <BackButton label="Teachers & Staff" className="mb-4" />

      {/* Profile header */}
      {isLoading ? (
        <ProfileHeaderSkeleton />
      ) : employee ? (
        <div
          className="bg-white rounded-xl border border-[#e6e8eb] mb-5"
          style={{ padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: avatar + name + meta */}
            <div className="flex items-start gap-4">
              <LargeAvatar name={employee.name} />
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-fraunces)',
                    fontSize: '22px',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#2c322f',
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  {employee.name}
                </h1>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#6b7480' }}>
                    {employee.employeeNumber}
                  </span>

                  {employee.designation && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: '13px', color: '#6b7480' }}>
                      <Briefcase size={12} className="text-[#b0b6bc]" />
                      {employee.designation.name}
                    </span>
                  )}

                  {employee.department && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: '13px', color: '#6b7480' }}>
                      <Building2 size={12} className="text-[#b0b6bc]" />
                      {employee.department.name}
                    </span>
                  )}

                  {employee.employeeType && (
                    <span style={{ fontSize: '13px', color: '#b0b6bc' }}>
                      {employee.employeeType.category === 'TEACHING' ? 'Teaching' : 'Non-Teaching'}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <div className="mt-3">
                  <Badge variant={statusVariant(employee.employmentStatus)}>
                    {statusLabel}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="secondary" className="gap-1.5">
                <Pencil size={13} />
                Edit Employee
              </Button>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMoreOpen((o) => !o)}
                  className="border border-[#e6e8eb]"
                >
                  <MoreHorizontal size={16} />
                </Button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                    <div
                      className="absolute right-0 top-9 z-20 rounded-xl border border-[#e6e8eb] bg-white py-1"
                      style={{ minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    >
                      {[
                        'Add Assignment',
                        'Record Lifecycle Event',
                        'Generate ID Card',
                        'Change Status',
                        'Transfer Employee',
                        'Deactivate',
                      ].map((action) => (
                        <button
                          key={action}
                          className="block w-full px-4 py-2 text-left hover:bg-[#fafbfc] transition-colors"
                          style={{ fontSize: '13px', color: action === 'Deactivate' ? '#b3261e' : '#14181c' }}
                          onClick={() => setMoreOpen(false)}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mb-5 overflow-x-auto">
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />
      </div>

      {/* Tab content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <Skeleton height={14} width={140} className="mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j}><Skeleton height={10} width={80} className="mb-1.5" /><Skeleton height={14} width={120} /></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : employee ? (
        <>
          {activeTab === 'overview'       && <OverviewTab employee={employee} />}
          {activeTab === 'personal'       && <PersonalTab employee={employee} />}
          {activeTab === 'employment'     && <EmploymentTab employee={employee} />}
          {activeTab === 'qualifications' && <QualificationsTab employeeId={employee.id} />}
          {activeTab === 'experience'     && <ExperienceTab employeeId={employee.id} />}
          {activeTab === 'assignments'    && <AssignmentsTab employee={employee} />}
          {activeTab === 'timetable'      && <PlaceholderTab title="Timetable" description="This teacher's class schedule is managed by the Timetable module and will appear here." />}
          {activeTab === 'attendance'     && <PlaceholderTab title="Attendance" description="Employee attendance records are managed by the Attendance module and will appear here." />}
          {activeTab === 'leave'          && <PlaceholderTab title="Leave" description="Leave requests, balances, and approvals are managed by the Leave module." />}
          {activeTab === 'payroll'        && <PlaceholderTab title="Payroll" description="Salary structures, payslips, and payroll history are managed by the Payroll module." />}
          {activeTab === 'documents'      && <PlaceholderTab title="Documents" description="Upload and manage employee documents — ID proof, certificates, contracts — in an upcoming release." />}
          {activeTab === 'performance'    && <PlaceholderTab title="Performance" description="Performance reviews, goals, and appraisal history will be available here." />}
          {activeTab === 'training'       && <PlaceholderTab title="Training" description="Training records, certifications, and professional development will be tracked here." />}
          {activeTab === 'assets'         && <PlaceholderTab title="Assets" description="Assigned assets — laptops, ID cards, keys — will be tracked here." />}
          {activeTab === 'history'        && <PlaceholderTab title="Audit History" description="A complete audit trail of changes made to this employee's profile will appear here." />}
        </>
      ) : null}
    </>
  );
}
