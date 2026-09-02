'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Users, LayoutGrid } from 'lucide-react';
import { useClasses, useSections, type AcademicClass, type Section } from '@/lib/hooks/use-academics';
import { useStudents } from '@/lib/hooks/use-students';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Class card ───────────────────────────────────────────────────────────────

function ClassCard({ cls, onClick }: { cls: AcademicClass; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-[#e6e8eb] hover:border-[#c9dce7] hover:shadow-sm transition-all group"
      style={{ padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 36, height: 36, background: '#dfeaf1', color: '#4e6a7d' }}
          >
            <LayoutGrid size={16} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>{cls.name}</p>
            <p style={{ fontSize: '12px', color: '#8a929b' }}>Code: {cls.code}</p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-[#c4c9cf] group-hover:text-[#4e6a7d] transition-colors"
        />
      </div>
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ section, onClick }: { section: Section; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-[#e6e8eb] hover:border-[#c5d8c8] hover:shadow-sm transition-all group"
      style={{ padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0 font-bold"
            style={{ width: 36, height: 36, background: '#dbe8dc', color: '#33604a', fontSize: '15px' }}
          >
            {section.name}
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#14181c' }}>Section {section.name}</p>
            {section.capacity && (
              <p style={{ fontSize: '12px', color: '#8a929b' }}>Capacity: {section.capacity}</p>
            )}
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-[#c4c9cf] group-hover:text-[#33604a] transition-colors"
        />
      </div>
    </button>
  );
}

// ─── Section student list ─────────────────────────────────────────────────────

function SectionStudents({
  classId,
  sectionId,
  className: clsName,
  sectionName,
}: {
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
}) {
  const { data, isLoading } = useStudents({ classId, sectionId, limit: 50 });
  const students = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3" style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4' }}>
            <Skeleton width={36} height={36} className="rounded-full flex-shrink-0" />
            <div className="flex-1"><Skeleton height={12} width={140} className="mb-1.5" /><Skeleton height={10} width={80} /></div>
            <Skeleton height={20} width={40} className="rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '48px 24px' }}>
        <EmptyState
          icon={<Users size={24} />}
          title="No students in this section"
          description={`${clsName} - Section ${sectionName} has no enrolled students yet.`}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e6e8eb] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Table header */}
      <div
        className="grid items-center border-b border-[#e6e8eb]"
        style={{
          gridTemplateColumns: '44px 1fr 100px 80px 80px 100px',
          height: 40,
          background: '#fafbfc',
          padding: '0 12px',
        }}
      >
        {['', 'STUDENT', 'ROLL NO.', 'GENDER', 'STATUS', 'ACTIONS'].map((h) => (
          <p
            key={h}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#8a929b',
              padding: '0 4px',
            }}
          >
            {h}
          </p>
        ))}
      </div>

      {students.map((s, idx) => {
        const enrollment = s.enrollments.find((e) => e.sectionId === sectionId);
        return (
          <div
            key={s.id}
            className="grid items-center hover:bg-[#fafbfc] transition-colors"
            style={{
              gridTemplateColumns: '44px 1fr 100px 80px 80px 100px',
              height: 54,
              padding: '0 12px',
              borderBottom: idx < students.length - 1 ? '1px solid #f0f2f4' : 'none',
            }}
          >
            {/* Row number */}
            <p style={{ fontSize: '12px', color: '#c4c9cf', padding: '0 4px', fontWeight: 600 }}>
              {idx + 1}
            </p>

            {/* Student */}
            <Link href={`/students/${s.id}`} className="flex items-center gap-2.5 px-1 outline-none group">
              <Avatar name={s.name} size="sm" />
              <div>
                <p className="group-hover:underline" style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>{s.name}</p>
                <p style={{ fontSize: '11.5px', color: '#8a929b' }}>{s.admissionNumber}</p>
              </div>
            </Link>

            {/* Roll No */}
            <p style={{ fontSize: '13px', color: '#6b7480', padding: '0 4px' }}>
              {enrollment?.rollNumber ?? '—'}
            </p>

            {/* Gender */}
            <p style={{ fontSize: '13px', color: '#6b7480', padding: '0 4px' }}>
              {s.person.gender
                ? s.person.gender.charAt(0) + s.person.gender.slice(1).toLowerCase()
                : '—'}
            </p>

            {/* Status */}
            <div className="px-1">
              <Badge variant={s.studentStatus === 'ACTIVE' ? 'active' : 'left'}>
                {s.studentStatus.charAt(0) + s.studentStatus.slice(1).toLowerCase()}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 px-1">
              <Link href={`/students/${s.id}`}>
                <Button variant="ghost" size="sm" className="text-[#2b5fa8] text-[12px] h-7 px-2">
                  View
                </Button>
              </Link>
            </div>
          </div>
        );
      })}

      <div
        style={{ padding: '10px 20px', borderTop: '1px solid #f0f2f4', background: '#fafbfc' }}
      >
        <p style={{ fontSize: '12px', color: '#8a929b' }}>
          {students.length} student{students.length !== 1 ? 's' : ''} in {clsName} – Section {sectionName}
        </p>
      </div>
    </div>
  );
}

// ─── Classes tab ──────────────────────────────────────────────────────────────

export function ClassesTab() {
  const { data: classes, isLoading: loadingClasses } = useClasses();
  const [selectedClass, setSelectedClass] = React.useState<AcademicClass | null>(null);
  const [selectedSection, setSelectedSection] = React.useState<Section | null>(null);

  const { data: sections, isLoading: loadingSections } = useSections(selectedClass?.id ?? null);

  function selectClass(cls: AcademicClass) {
    setSelectedClass(cls);
    setSelectedSection(null);
  }

  function goBack() {
    if (selectedSection) {
      setSelectedSection(null);
    } else {
      setSelectedClass(null);
    }
  }

  // ── Breadcrumb ──
  const breadcrumb = (
    <div className="flex items-center gap-1.5 mb-5" style={{ fontSize: '13px' }}>
      <button
        onClick={() => { setSelectedClass(null); setSelectedSection(null); }}
        style={{ color: selectedClass ? '#2b5fa8' : '#14181c', fontWeight: selectedClass ? 400 : 600 }}
        className="hover:underline"
      >
        Classes
      </button>
      {selectedClass && (
        <>
          <ChevronRight size={14} className="text-[#c4c9cf]" />
          <button
            onClick={() => setSelectedSection(null)}
            style={{ color: selectedSection ? '#2b5fa8' : '#14181c', fontWeight: selectedSection ? 400 : 600 }}
            className="hover:underline"
          >
            {selectedClass.name}
          </button>
        </>
      )}
      {selectedSection && (
        <>
          <ChevronRight size={14} className="text-[#c4c9cf]" />
          <span style={{ fontWeight: 600, color: '#14181c' }}>Section {selectedSection.name}</span>
        </>
      )}
    </div>
  );

  // ── Level 1: Class list ──
  if (!selectedClass) {
    if (loadingClasses) {
      return (
        <div>
          {breadcrumb}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] p-[18px]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3">
                  <Skeleton width={36} height={36} className="rounded-lg" />
                  <div><Skeleton height={13} width={80} className="mb-1.5" /><Skeleton height={10} width={60} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!classes || classes.length === 0) {
      return (
        <div>
          {breadcrumb}
          <div className="bg-white rounded-xl border border-[#e6e8eb] p-12" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <EmptyState
              icon={<LayoutGrid size={24} />}
              title="No classes configured"
              description="Add classes in the Academics module first."
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        {breadcrumb}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} onClick={() => selectClass(cls)} />
          ))}
        </div>
      </div>
    );
  }

  // ── Level 2: Section list ──
  if (!selectedSection) {
    return (
      <div>
        {breadcrumb}
        <div className="mb-4">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[#6b7480]" onClick={goBack}>
            <ChevronLeft size={14} />
            Back to Classes
          </Button>
        </div>

        {loadingSections ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] p-[18px]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3">
                  <Skeleton width={36} height={36} className="rounded-lg" />
                  <div><Skeleton height={13} width={80} className="mb-1.5" /><Skeleton height={10} width={60} /></div>
                </div>
              </div>
            ))}
          </div>
        ) : !sections || sections.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e6e8eb] p-12" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <EmptyState
              icon={<Users size={24} />}
              title="No sections in this class"
              description={`${selectedClass.name} has no sections configured yet.`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((sec) => (
              <SectionCard key={sec.id} section={sec} onClick={() => setSelectedSection(sec)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Level 3: Student list ──
  return (
    <div>
      {breadcrumb}
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-[#6b7480]" onClick={goBack}>
          <ChevronLeft size={14} />
          Back to {selectedClass.name}
        </Button>
      </div>
      <SectionStudents
        classId={selectedClass.id}
        sectionId={selectedSection.id}
        className={selectedClass.name}
        sectionName={selectedSection.name}
      />
    </div>
  );
}
