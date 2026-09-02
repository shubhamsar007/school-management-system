'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ChevronLeft, Pencil, MoreHorizontal,
  GraduationCap, Hash,
} from 'lucide-react';
import { useStudent, useGuardians } from '@/lib/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/ui/back-button';
import { OverviewTab }    from './_components/overview-tab';
import { PersonalTab }    from './_components/personal-tab';
import { ParentsTab }     from './_components/parents-tab';
import { EnrollmentTab }  from './_components/enrollment-tab';
import { PlaceholderTab } from './_components/placeholder-tab';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'personal'
  | 'parents'
  | 'enrollment'
  | 'documents'
  | 'health'
  | 'discipline'
  | 'activities'
  | 'communication'
  | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',       label: 'Overview' },
  { id: 'personal',       label: 'Personal' },
  { id: 'parents',        label: 'Parents & Guardians' },
  { id: 'enrollment',     label: 'Enrollment' },
  { id: 'documents',      label: 'Documents' },
  { id: 'health',         label: 'Health' },
  { id: 'discipline',     label: 'Discipline' },
  { id: 'activities',     label: 'Activities' },
  { id: 'communication',  label: 'Communication' },
  { id: 'history',        label: 'History' },
];

// ─── Status badge variant ─────────────────────────────────────────────────────

function statusVariant(s: string) {
  switch (s) {
    case 'ACTIVE':      return 'active'     as const;
    case 'GRADUATED':   return 'graduated'  as const;
    default:            return 'left'       as const;
  }
}

// ─── Large avatar ─────────────────────────────────────────────────────────────

function LargeAvatar({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  const first = words[0] ?? '';
  const last  = words.length > 1 ? (words[words.length - 1] ?? '') : '';
  const initials = (first.charAt(0) + last.charAt(0)).toUpperCase();

  const colors = [
    { bg: '#dbeafe', fg: '#1e40af' },
    { bg: '#dcfce7', fg: '#166534' },
    { bg: '#fef3c7', fg: '#92400e' },
    { bg: '#ede9fe', fg: '#5b21b6' },
    { bg: '#fce7f3', fg: '#9d174d' },
    { bg: '#e0f2fe', fg: '#0369a1' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % colors.length;
  const color = colors[Math.abs(hash) % colors.length]!;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold select-none flex-shrink-0"
      style={{ width: 64, height: 64, fontSize: 22, background: color.bg, color: color.fg }}
    >
      {initials}
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
          <Skeleton height={22} width={220} className="mb-2" />
          <Skeleton height={14} width={340} className="mb-3" />
          <Skeleton height={20} width={80} className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const params      = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id          = params?.id ?? null;

  const initialTab  = (searchParams?.get('tab') as TabId | null) ?? 'overview';
  const [activeTab, setActiveTab] = React.useState<TabId>(initialTab);
  const [moreOpen, setMoreOpen]   = React.useState(false);

  const { data: student, isLoading, isError } = useStudent(id);
  const { data: guardians = [] }              = useGuardians(id);

  // ── Error state ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#14181c' }}>Student not found</p>
        <p style={{ fontSize: '13px', color: '#8a929b', marginTop: 4 }}>
          The student you are looking for does not exist or was removed.
        </p>
        <BackButton label="Back to Students" className="mt-4" />
      </div>
    );
  }

  // ── Derived ──
  const currentEnrollment = student?.enrollments[0];
  const statusLabel = student
    ? student.studentStatus.charAt(0) + student.studentStatus.slice(1).toLowerCase()
    : '';

  return (
    <>
      {/* Back link */}
      <BackButton label="Students" className="mb-4" />

      {/* Profile header card */}
      {isLoading ? (
        <ProfileHeaderSkeleton />
      ) : student ? (
        <div
          className="bg-white rounded-xl border border-[#e6e8eb] mb-5"
          style={{ padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: avatar + name + meta */}
            <div className="flex items-start gap-4">
              <LargeAvatar name={student.name} />
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
                  {student.name}
                </h1>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="flex items-center gap-1.5" style={{ fontSize: '13px', color: '#6b7480' }}>
                    <Hash size={12} className="text-[#b0b6bc]" />
                    {student.admissionNumber}
                  </span>

                  {currentEnrollment && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: '13px', color: '#6b7480' }}>
                      <GraduationCap size={12} className="text-[#b0b6bc]" />
                      {currentEnrollment.class.name} · {currentEnrollment.section.name}
                      {currentEnrollment.rollNumber && (
                        <span style={{ color: '#b0b6bc' }}>· Roll {currentEnrollment.rollNumber}</span>
                      )}
                    </span>
                  )}

                  {currentEnrollment && (
                    <span style={{ fontSize: '13px', color: '#b0b6bc' }}>
                      {currentEnrollment.academicYear.name}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <div className="mt-3">
                  <Badge variant={statusVariant(student.studentStatus)}>
                    {statusLabel}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="secondary" className="gap-1.5">
                <Pencil size={13} />
                Edit Student
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
                        'Enroll in Class',
                        'Add Guardian',
                        'Generate ID Card',
                        'Change Status',
                        'Transfer Student',
                        'Deactivate',
                      ].map((action) => (
                        <button
                          key={action}
                          className="block w-full px-4 py-2 text-left hover:bg-[#fafbfc] transition-colors"
                          style={{
                            fontSize: '13px',
                            color: action === 'Deactivate' ? '#b3261e' : '#14181c',
                          }}
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
      ) : student ? (
        <>
          {activeTab === 'overview'      && <OverviewTab student={student} guardians={guardians} />}
          {activeTab === 'personal'      && <PersonalTab student={student} />}
          {activeTab === 'parents'       && <ParentsTab studentId={student.id} />}
          {activeTab === 'enrollment'    && <EnrollmentTab studentId={student.id} />}
          {activeTab === 'documents'     && <PlaceholderTab title="Documents" description="Upload and manage student documents — ID proof, certificates, transfer records — in a future release." />}
          {activeTab === 'health'        && <PlaceholderTab title="Health Records" description="Student health information, allergies, medical conditions, and emergency contacts will be managed here." />}
          {activeTab === 'discipline'    && <PlaceholderTab title="Discipline" description="Incident reports, warnings, suspensions, and behaviour tracking will be available in a future release." />}
          {activeTab === 'activities'    && <PlaceholderTab title="Activities & Achievements" description="Co-curricular activities, sports, clubs, and achievements will be tracked here." />}
          {activeTab === 'communication' && <PlaceholderTab title="Communication" description="Messages, announcements, and parent-teacher communication threads will appear here." />}
          {activeTab === 'history'       && <PlaceholderTab title="Audit History" description="A complete audit trail of changes made to this student's profile will be available here." />}
        </>
      ) : null}
    </>
  );
}
