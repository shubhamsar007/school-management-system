'use client';

import * as React from 'react';
import { GraduationCap } from 'lucide-react';
import { useEnrollments } from '@/lib/hooks/use-students';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function enrollmentBadge(status: string) {
  switch (status) {
    case 'ACTIVE':     return 'active';
    case 'GRADUATED':  return 'graduated';
    case 'PROMOTED':   return 'active';
    default:           return 'left' as const;
  }
}

export function EnrollmentTab({ studentId }: { studentId: string }) {
  const { data: enrollments, isLoading } = useEnrollments(studentId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: '1px solid #f0f2f4' }}>
            <Skeleton width={40} height={40} className="rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton height={13} width={180} className="mb-2" />
              <Skeleton height={11} width={120} />
            </div>
            <Skeleton height={20} width={60} className="rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb] p-12" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <EmptyState
          icon={<GraduationCap size={24} />}
          title="No enrollment history"
          description="This student hasn't been enrolled in any class yet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div
        className="flex items-center gap-6 rounded-xl px-5 py-3"
        style={{ background: '#dbe8dc', border: '1px solid #c5d8c8' }}
      >
        <div>
          <p style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#33604a' }}>Years enrolled</p>
          <p style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-fraunces)', color: '#2c322f', lineHeight: 1.2 }}>
            {enrollments.length}
          </p>
        </div>
        <div style={{ width: 1, height: 36, background: '#b5ccb8' }} />
        <div>
          <p style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#33604a' }}>Current class</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#2c322f' }}>
            {enrollments[0]?.class.name} – {enrollments[0]?.section.name}
          </p>
        </div>
        <div style={{ width: 1, height: 36, background: '#b5ccb8' }} />
        <div>
          <p style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#33604a' }}>Academic Year</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#2c322f' }}>
            {enrollments[0]?.academicYear.name}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="bg-white rounded-xl border border-[#e6e8eb] overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {/* Table header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: '1fr 140px 100px 100px 140px 100px',
            height: 40,
            background: '#fafbfc',
            borderBottom: '1px solid #e6e8eb',
            padding: '0 20px',
            alignItems: 'center',
          }}
        >
          {['Academic Year', 'Class', 'Section', 'Roll No.', 'Enrolled On', 'Status'].map((h) => (
            <p key={h} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a929b' }}>
              {h}
            </p>
          ))}
        </div>

        {enrollments.map((e, idx) => {
          const isCurrent = idx === 0;
          return (
            <div
              key={e.id}
              className="grid hover:bg-[#fafbfc] transition-colors"
              style={{
                gridTemplateColumns: '1fr 140px 100px 100px 140px 100px',
                minHeight: 54,
                padding: '0 20px',
                alignItems: 'center',
                borderBottom: idx < enrollments.length - 1 ? '1px solid #f0f2f4' : 'none',
                background: isCurrent ? '#f9fcfa' : undefined,
              }}
            >
              {/* Academic Year */}
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    background: isCurrent ? '#dbe8dc' : '#f5f6f7',
                    color: isCurrent ? '#33604a' : '#8a929b',
                  }}
                >
                  <GraduationCap size={15} />
                </div>
                <div>
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>
                    {e.academicYear.name}
                  </p>
                  {isCurrent && (
                    <p style={{ fontSize: '11px', color: '#33604a', fontWeight: 600 }}>Current year</p>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#14181c' }}>{e.class.name}</p>
              <p style={{ fontSize: '13px', color: '#14181c' }}>Section {e.section.name}</p>
              <p style={{ fontSize: '13px', color: '#6b7480' }}>{e.rollNumber ?? '—'}</p>
              <p style={{ fontSize: '13px', color: '#6b7480' }}>{formatDate(e.enrollmentDate)}</p>

              <Badge variant={enrollmentBadge(e.status) as any}>
                {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
