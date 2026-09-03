'use client';

import * as React from 'react';
import { Briefcase } from 'lucide-react';
import { useExperience } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined) {
  if (!iso) return 'Present';
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function durationLabel(start: string, end?: string) {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}m`;
  if (m === 0) return `${y}y`;
  return `${y}y ${m}m`;
}

// ─── Experience card ──────────────────────────────────────────────────────────

function ExpCard({ exp }: { exp: ReturnType<typeof useExperience>['data'] extends (infer T)[] | undefined ? T : never }) {
  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb] hover:border-[#c8d0d9] transition-colors"
      style={{ padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 40, height: 40, background: '#f0ede5' }}
        >
          <Briefcase size={18} style={{ color: '#8c7355' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#14181c' }}>{exp.designation}</p>
              <p style={{ fontSize: '13px', color: '#14181c', marginTop: 1 }}>{exp.organization}</p>
              {exp.department && (
                <p style={{ fontSize: '12px', color: '#8a929b', marginTop: 1 }}>{exp.department}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p style={{ fontSize: '12px', color: '#8a929b', whiteSpace: 'nowrap' }}>
                {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
              </p>
              <p style={{ fontSize: '11.5px', color: '#b0b6bc', marginTop: 2 }}>
                {durationLabel(exp.startDate, exp.endDate)}
              </p>
            </div>
          </div>

          {exp.responsibilities && (
            <p
              style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 10, lineHeight: 1.6 }}
              className="line-clamp-3"
            >
              {exp.responsibilities}
            </p>
          )}

          {exp.reasonForLeaving && !exp.endDate && (
            <p style={{ fontSize: '12px', color: '#8a929b', marginTop: 6 }}>
              Still employed
            </p>
          )}
          {exp.reasonForLeaving && exp.endDate && (
            <p style={{ fontSize: '12px', color: '#8a929b', marginTop: 6 }}>
              Left: {exp.reasonForLeaving}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function ExperienceTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useExperience(employeeId);
  const records = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start gap-3">
              <Skeleton width={40} height={40} className="rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton height={14} width={180} className="mb-2" />
                <Skeleton height={12} width={140} className="mb-1.5" />
                <Skeleton height={12} width={260} className="mb-1" />
                <Skeleton height={12} width={200} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<Briefcase size={24} />}
          title="No experience recorded"
          description="Add prior work experience to build this employee's professional history."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((exp) => (
        <ExpCard key={exp.id} exp={exp} />
      ))}
    </div>
  );
}
