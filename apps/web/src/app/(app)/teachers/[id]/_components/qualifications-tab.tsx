'use client';

import * as React from 'react';
import { GraduationCap, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQualifications } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function verificationVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'VERIFIED':  return 'active';
    case 'REJECTED':  return 'left';
    default:          return 'pending';
  }
}

function VerificationIcon({ status }: { status: string }) {
  if (status === 'VERIFIED')  return <CheckCircle size={14} style={{ color: '#33604a' }} />;
  if (status === 'REJECTED')  return <XCircle size={14} style={{ color: '#b3261e' }} />;
  return <Clock size={14} style={{ color: '#8a929b' }} />;
}

// ─── Qualification card ───────────────────────────────────────────────────────

function QualCard({ q }: { q: ReturnType<typeof useQualifications>['data'] extends (infer T)[] | undefined ? T : never }) {
  const years = q.endYear ? `${q.startYear} – ${q.endYear}` : `${q.startYear} – Present`;
  const result = [q.percentage != null ? `${q.percentage}%` : null, q.grade].filter(Boolean).join(' / ');

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb] hover:border-[#c8d0d9] transition-colors"
      style={{ padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, background: '#eef3fb' }}
          >
            <GraduationCap size={18} style={{ color: '#2b5fa8' }} />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#14181c' }}>{q.degree}</p>
            {q.specialization && (
              <p style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 1 }}>{q.specialization}</p>
            )}
            <p style={{ fontSize: '13px', color: '#14181c', marginTop: 4 }}>{q.institution}</p>
            {q.university && q.university !== q.institution && (
              <p style={{ fontSize: '12px', color: '#8a929b' }}>{q.university}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <VerificationIcon status={q.verificationStatus} />
            <Badge variant={verificationVariant(q.verificationStatus)}>
              {q.verificationStatus.charAt(0) + q.verificationStatus.slice(1).toLowerCase()}
            </Badge>
          </div>
          <span style={{ fontSize: '12px', color: '#8a929b' }}>{years}</span>
        </div>
      </div>

      {result && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f0f2f4' }}>
          <span style={{ fontSize: '12px', color: '#8a929b' }}>Result: </span>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#14181c' }}>{result}</span>
        </div>
      )}
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function QualificationsTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useQualifications(employeeId);
  const qualifications = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start gap-3">
              <Skeleton width={40} height={40} className="rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton height={14} width={160} className="mb-2" />
                <Skeleton height={12} width={220} className="mb-1.5" />
                <Skeleton height={12} width={140} />
              </div>
              <div className="text-right">
                <Skeleton height={20} width={70} className="rounded-full mb-2" />
                <Skeleton height={11} width={80} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (qualifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<GraduationCap size={24} />}
          title="No qualifications recorded"
          description="Add academic qualifications to build this employee's education profile."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {qualifications.map((q) => (
        <QualCard key={q.id} q={q} />
      ))}
    </div>
  );
}
